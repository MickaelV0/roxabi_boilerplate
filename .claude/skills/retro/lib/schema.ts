/**
 * Database schema DDL and FTS5 triggers for the retro session intelligence database.
 *
 * Tables: sessions, findings, findings_fts (FTS5), finding_embeddings (vec0), processing_log
 */

// DDL statements from spec

export const SCHEMA_SQL = `
CREATE TABLE IF NOT EXISTS sessions (
  id TEXT PRIMARY KEY,
  project_path TEXT,
  git_branch TEXT,
  first_prompt TEXT,
  summary TEXT,
  message_count INTEGER,
  created_at DATETIME,
  modified_at DATETIME,
  duration_minutes REAL,
  processed_at DATETIME,
  analyzed_at DATETIME
);

CREATE TABLE IF NOT EXISTS findings (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  session_id TEXT REFERENCES sessions(id),
  type TEXT CHECK(type IN ('praise', 'blocker', 'suggestion', 'nitpick')),
  content TEXT NOT NULL,
  context TEXT,
  severity TEXT CHECK(severity IN ('low', 'medium', 'high')),
  tags TEXT,
  session_timestamp DATETIME
);

CREATE VIRTUAL TABLE IF NOT EXISTS findings_fts USING fts5(
  content, context, type,
  content=findings,
  content_rowid=id
);

CREATE VIRTUAL TABLE IF NOT EXISTS finding_embeddings USING vec0(
  finding_id INTEGER,
  embedding FLOAT[384]
);

CREATE TABLE IF NOT EXISTS processing_log (
  session_id TEXT NOT NULL,
  phase TEXT NOT NULL CHECK(phase IN ('parse', 'analyze')),
  processed_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  status TEXT NOT NULL CHECK(status IN ('success', 'error', 'skipped')),
  error_message TEXT,
  PRIMARY KEY (session_id, phase)
);
`

// FTS5 sync triggers
export const TRIGGERS_SQL = `
CREATE TRIGGER IF NOT EXISTS findings_ai AFTER INSERT ON findings BEGIN
  INSERT INTO findings_fts(rowid, content, context, type) VALUES (new.id, new.content, new.context, new.type);
END;

CREATE TRIGGER IF NOT EXISTS findings_ad AFTER DELETE ON findings BEGIN
  INSERT INTO findings_fts(findings_fts, rowid, content, context, type) VALUES ('delete', old.id, old.content, old.context, old.type);
END;

CREATE TRIGGER IF NOT EXISTS findings_au AFTER UPDATE ON findings BEGIN
  INSERT INTO findings_fts(findings_fts, rowid, content, context, type) VALUES ('delete', old.id, old.content, old.context, old.type);
  INSERT INTO findings_fts(rowid, content, context, type) VALUES (new.id, new.content, new.context, new.type);
END;
`

/** TypeScript types for database rows */

export interface SessionRow {
  id: string
  project_path: string | null
  git_branch: string | null
  first_prompt: string | null
  summary: string | null
  message_count: number | null
  created_at: string | null
  modified_at: string | null
  duration_minutes: number | null
  processed_at: string | null
  analyzed_at: string | null
}

export interface FindingRow {
  id: number
  session_id: string
  type: 'praise' | 'blocker' | 'suggestion' | 'nitpick'
  content: string
  context: string | null
  severity: 'low' | 'medium' | 'high'
  tags: string | null // JSON array of strings
  session_timestamp: string | null
}

export interface ProcessingLogRow {
  session_id: string
  phase: 'parse' | 'analyze'
  processed_at: string
  status: 'success' | 'error' | 'skipped'
  error_message: string | null
}

/**
 * Split regular SQL (no triggers) into individual statements on `;` boundaries.
 */
function splitSimpleStatements(sql: string): string[] {
  return sql
    .split(';')
    .map((s) => s.trim())
    .filter(Boolean)
    .map((s) => `${s};`)
}

/**
 * Split trigger SQL into individual CREATE TRIGGER statements.
 *
 * Triggers contain `;` inside BEGIN...END blocks, so we split on the
 * `END;` boundary and re-append it to each block.
 */
function splitTriggerStatements(sql: string): string[] {
  return sql
    .split(/\bEND\s*;/i)
    .map((s) => s.trim())
    .filter(Boolean)
    .map((s) => `${s}\nEND;`)
}

/**
 * Apply the full schema to the database.
 * Uses bun:sqlite Database.run() for DDL execution.
 *
 * SCHEMA_SQL contains regular statements split on `;`.
 * TRIGGERS_SQL contains CREATE TRIGGER blocks split on `END;`.
 */
export function applySchema(db: import('bun:sqlite').Database): void {
  for (const statement of splitSimpleStatements(SCHEMA_SQL)) {
    db.run(statement)
  }
  for (const statement of splitTriggerStatements(TRIGGERS_SQL)) {
    db.run(statement)
  }
}
