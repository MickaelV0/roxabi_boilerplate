/**
 * Hybrid search combining BM25 (FTS5) and vector search (sqlite-vec).
 *
 * Uses Reciprocal Rank Fusion (RRF) with k=60 to fuse results.
 * Weights: vector=0.7, BM25=0.3
 */

import type { Database } from 'bun:sqlite'
import type { FindingRow } from './schema'

const VECTOR_WEIGHT = 0.7
const BM25_WEIGHT = 0.3
const RRF_K = 60
const MAX_RESULTS = 20

/** Search result with fused score */
export interface SearchResult {
  finding: FindingRow
  score: number
  vectorRank: number | null
  bm25Rank: number | null
}

/**
 * Safely run BM25 search, returning empty results on failure.
 */
function safeBm25Search(
  db: Database,
  queryText: string,
  limit: number,
  typeFilter?: string
): { findingId: number; rank: number }[] {
  try {
    return bm25Search(db, queryText, limit, typeFilter)
  } catch {
    // FTS query failed — proceed with vector-only results
    return []
  }
}

/**
 * Build a rank map from vector and BM25 result arrays.
 * Maps findingId to its rank in each result set (1-indexed).
 * Missing ranks are set to POSITIVE_INFINITY.
 */
function buildRankMap(
  vectorResults: { findingId: number }[],
  bm25Results: { findingId: number }[]
): Map<number, { vectorRank: number; bm25Rank: number }> {
  const rankMap = new Map<number, { vectorRank: number; bm25Rank: number }>()

  for (let i = 0; i < vectorResults.length; i++) {
    rankMap.set(vectorResults[i].findingId, {
      vectorRank: i + 1,
      bm25Rank: Number.POSITIVE_INFINITY,
    })
  }

  for (let i = 0; i < bm25Results.length; i++) {
    const id = bm25Results[i].findingId
    const existing = rankMap.get(id)
    if (existing) {
      existing.bm25Rank = i + 1
    } else {
      rankMap.set(id, { vectorRank: Number.POSITIVE_INFINITY, bm25Rank: i + 1 })
    }
  }

  return rankMap
}

/**
 * Compute RRF scores from a rank map and return sorted entries.
 */
function computeRrfScores(
  rankMap: Map<number, { vectorRank: number; bm25Rank: number }>
): { findingId: number; score: number; vectorRank: number; bm25Rank: number }[] {
  const scored: { findingId: number; score: number; vectorRank: number; bm25Rank: number }[] = []
  for (const [findingId, ranks] of rankMap) {
    const score =
      VECTOR_WEIGHT * (1 / (RRF_K + ranks.vectorRank)) +
      BM25_WEIGHT * (1 / (RRF_K + ranks.bm25Rank))
    scored.push({ findingId, score, vectorRank: ranks.vectorRank, bm25Rank: ranks.bm25Rank })
  }
  scored.sort((a, b) => b.score - a.score)
  return scored
}

/**
 * Perform hybrid search: vector + BM25 with RRF fusion.
 *
 * @param db - Database connection
 * @param queryEmbedding - Embedding vector for the search query
 * @param queryText - Raw query text for BM25 search
 * @param typeFilter - Optional finding type filter
 * @returns Ranked search results
 */
export function hybridSearch(
  db: Database,
  queryEmbedding: Float32Array,
  queryText: string,
  typeFilter?: 'praise' | 'blocker' | 'suggestion' | 'nitpick'
): SearchResult[] {
  const vectorResults = vectorSearch(db, queryEmbedding, 100, typeFilter)
  const bm25Results = safeBm25Search(db, queryText, 100, typeFilter)

  const rankMap = buildRankMap(vectorResults, bm25Results)
  const scored = computeRrfScores(rankMap)
  const topScored = scored.slice(0, MAX_RESULTS)

  const results: SearchResult[] = []

  if (topScored.length === 0) return results

  const ids = topScored.map((e) => e.findingId)
  const placeholders = ids.map(() => '?').join(',')
  const findings = db
    .prepare(`SELECT * FROM findings WHERE id IN (${placeholders})`)
    .all(...ids) as FindingRow[]
  const findingMap = new Map(findings.map((f) => [f.id, f]))

  for (const entry of topScored) {
    const finding = findingMap.get(entry.findingId)
    if (finding) {
      results.push({
        finding,
        score: entry.score,
        vectorRank: Number.isFinite(entry.vectorRank) ? entry.vectorRank : null,
        bm25Rank: Number.isFinite(entry.bm25Rank) ? entry.bm25Rank : null,
      })
    }
  }

  return results
}

/**
 * Run vector-only search using sqlite-vec.
 */
export function vectorSearch(
  db: Database,
  queryEmbedding: Float32Array,
  limit: number,
  typeFilter?: string
): { findingId: number; distance: number }[] {
  const queryBytes = new Uint8Array(queryEmbedding.buffer)

  if (typeFilter) {
    const stmt = db.prepare(`
      SELECT fe.finding_id, fe.distance
      FROM finding_embeddings fe
      JOIN findings f ON f.id = fe.finding_id
      WHERE fe.embedding MATCH ? AND f.type = ?
      ORDER BY fe.distance
      LIMIT ?
    `)
    const rows = stmt.all(queryBytes, typeFilter, limit) as {
      finding_id: number
      distance: number
    }[]
    return rows.map((r) => ({ findingId: r.finding_id, distance: r.distance }))
  }

  const stmt = db.prepare(`
    SELECT finding_id, distance
    FROM finding_embeddings
    WHERE embedding MATCH ?
    ORDER BY distance
    LIMIT ?
  `)
  const rows = stmt.all(queryBytes, limit) as {
    finding_id: number
    distance: number
  }[]
  return rows.map((r) => ({ findingId: r.finding_id, distance: r.distance }))
}

/**
 * Escape FTS5 special characters by wrapping terms containing them in double quotes.
 */
function escapeFts5Query(text: string): string {
  const specialChars = /[*()":^{}[\]~!&|+\-\\]/
  return text
    .split(/\s+/)
    .filter((term) => term.length > 0)
    .map((term) => (specialChars.test(term) ? `"${term.replace(/"/g, '""')}"` : term))
    .join(' ')
}

/**
 * Run BM25 search using FTS5.
 */
export function bm25Search(
  db: Database,
  queryText: string,
  limit: number,
  typeFilter?: string
): { findingId: number; rank: number }[] {
  const escapedQuery = escapeFts5Query(queryText)
  if (escapedQuery.length === 0) {
    return []
  }

  if (typeFilter) {
    const stmt = db.prepare(`
      SELECT rowid, rank
      FROM findings_fts
      WHERE findings_fts MATCH ? AND type = ?
      ORDER BY rank
      LIMIT ?
    `)
    const rows = stmt.all(escapedQuery, typeFilter, limit) as {
      rowid: number
      rank: number
    }[]
    return rows.map((r) => ({ findingId: r.rowid, rank: r.rank }))
  }

  const stmt = db.prepare(`
    SELECT rowid, rank
    FROM findings_fts
    WHERE findings_fts MATCH ?
    ORDER BY rank
    LIMIT ?
  `)
  const rows = stmt.all(escapedQuery, limit) as {
    rowid: number
    rank: number
  }[]
  return rows.map((r) => ({ findingId: r.rowid, rank: r.rank }))
}

export { VECTOR_WEIGHT, BM25_WEIGHT, RRF_K, MAX_RESULTS }
