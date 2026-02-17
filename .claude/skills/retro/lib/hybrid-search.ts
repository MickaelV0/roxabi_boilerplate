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
 * Perform hybrid search: vector + BM25 with RRF fusion.
 *
 * @param db - Database connection
 * @param queryEmbedding - Embedding vector for the search query
 * @param queryText - Raw query text for BM25 search
 * @param typeFilter - Optional finding type filter
 * @returns Ranked search results
 */
export function hybridSearch(
  _db: Database,
  _queryEmbedding: Float32Array,
  _queryText: string,
  _typeFilter?: 'praise' | 'blocker' | 'suggestion' | 'nitpick'
): SearchResult[] {
  // TODO: implement
  // 1. Run vector search against finding_embeddings
  // 2. Run BM25 search against findings_fts
  // 3. Apply type filter to both result sets if provided
  // 4. Compute RRF scores: score = VECTOR_WEIGHT * (1/(RRF_K + vRank)) + BM25_WEIGHT * (1/(RRF_K + bRank))
  // 5. Fuse and sort by score descending
  // 6. Return top MAX_RESULTS
  throw new Error('Not implemented')
}

/**
 * Run vector-only search using sqlite-vec.
 */
export function vectorSearch(
  _db: Database,
  _queryEmbedding: Float32Array,
  _limit: number,
  _typeFilter?: string
): { findingId: number; distance: number }[] {
  // TODO: implement
  throw new Error('Not implemented')
}

/**
 * Run BM25 search using FTS5.
 */
export function bm25Search(
  _db: Database,
  _queryText: string,
  _limit: number,
  _typeFilter?: string
): { findingId: number; rank: number }[] {
  // TODO: implement
  throw new Error('Not implemented')
}

export { VECTOR_WEIGHT, BM25_WEIGHT, RRF_K, MAX_RESULTS }
