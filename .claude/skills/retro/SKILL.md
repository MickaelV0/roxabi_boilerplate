---
argument-hint: [--setup | --parse | --analyze [--limit N] | --recap [--period weekly|monthly] | --search "query" [--type blocker] | --reanalyze <session-id|all>]
description: This skill should be used when the user wants to analyze Claude Code session transcripts, extract findings, search session intelligence, view retro dashboards, or run trend analysis. Triggers include "retro", "session intelligence", "analyze sessions", "search findings", "recap", "session recap", "trend report", "what patterns", "what blockers", and "retro setup".
allowed-tools: Bash, Read, Grep, Glob, AskUserQuestion
---

# Retro — Session Intelligence

Analyze Claude Code session transcripts to extract, search, and trend actionable findings (blockers, praise, suggestions, nitpicks). Three-phase pipeline: parse transcripts, extract findings via AI, then query/search/recap without AI cost.

## Usage

```
/retro                                    Show dashboard summary
/retro --setup                            First-time initialization
/retro --parse                            Import session transcripts
/retro --analyze [--limit N]              AI-powered finding extraction
/retro --recap [--period weekly|monthly]  Trend report (no AI cost)
/retro --search "query" [--type TYPE]     Hybrid semantic search
/retro --reanalyze <session-id|all>       Re-analyze specific sessions
```

## Prerequisites

- **Bun** runtime (scripts use `bun:sqlite` and Bun-native APIs)
- **sqlite-vec** extension (installed as devDependency, loaded automatically)
- **Embedding model**: `all-MiniLM-L6-v2` (384 dimensions, auto-downloaded on setup)

## Configuration

The analyze phase supports multiple AI providers. Configure via `.claude/skills/retro/retro.config.yaml` (gitignored, user-specific).

**Quick start:** Copy the example config and edit:

```bash
cp .claude/skills/retro/retro.config.yaml.example .claude/skills/retro/retro.config.yaml
```

**Supported providers:**

| Provider | Config value | Requirements |
|----------|-------------|--------------|
| Claude CLI (default) | `claude-cli` | `claude` binary on PATH |
| OpenRouter | `openrouter` | `OPENROUTER_API_KEY` env var |

**Example config (`.claude/skills/retro/retro.config.yaml`):**

```yaml
provider: openrouter
model: anthropic/claude-sonnet-4-20250514
api_key_env: OPENROUTER_API_KEY
concurrency: 3
```

**Config fields:**

| Field | Default | Description |
|-------|---------|-------------|
| `provider` | `claude-cli` | AI provider for finding extraction |
| `model` | `anthropic/claude-sonnet-4-20250514` | Model ID (OpenRouter format) |
| `api_key_env` | `OPENROUTER_API_KEY` | Environment variable holding the API key |
| `concurrency` | `3` | Number of sessions to analyze in parallel (1-10) |

If no config file exists, the skill falls back to `claude-cli` (fully backward compatible).

## Instructions

### Parse Arguments

Extract the subcommand from `$ARGUMENTS`. Map to the corresponding action:

| Argument | Action |
|----------|--------|
| `--setup` | Run setup script |
| `--parse` | Run parse script |
| `--analyze` | Run analyze script (pass `--limit N` if present) |
| `--recap` | Run recap script (pass `--period weekly\|monthly` if present) |
| `--search` | Run search script (pass query string and `--type` if present) |
| `--reanalyze` | Run analyze script with `--reanalyze <target>` |
| _(none)_ | Show dashboard |

### Pre-flight Check

Before any subcommand except `--setup`, verify the database exists:

```bash
if [[ ! -f ".claude/skills/retro/data/retro.db" ]]; then
  echo "No retro database found. Run '/retro --setup' first."
  # Stop execution
fi
```

### Setup (`--setup`)

Run the initialization script to create the database, load sqlite-vec, download the embedding model, and verify with a test embedding:

```bash
bun run .claude/skills/retro/scripts/setup.ts
```

On success, prompt the user to run `--parse` next.

### Parse (`--parse`)

Import session transcripts from the Claude Code sessions directory into the database. Idempotent — re-running skips already-imported sessions:

```bash
bun run .claude/skills/retro/scripts/parse-sessions.ts
```

The sessions directory defaults to `~/.claude/projects/-home-mickael-projects-roxabi-boilerplate`. Override with `RETRO_SESSIONS_DIR` environment variable.

### Analyze (`--analyze`)

Send unanalyzed session transcripts to the configured AI provider for finding extraction. By default uses `claude -p --output-format json`; set `provider: openrouter` in the config file to use the OpenRouter API instead. See [Configuration](#configuration) above. Each finding has a type (praise/blocker/suggestion/nitpick), severity, content, context, and tags. Embeddings are generated locally via Transformers.js.

```bash
# Analyze all unanalyzed sessions
bun run .claude/skills/retro/scripts/analyze-findings.ts

# Analyze with a limit
bun run .claude/skills/retro/scripts/analyze-findings.ts --limit 10
```

This is the only phase with AI cost (one Claude CLI call per session, ~2 min timeout each).

### Recap (`--recap`)

Generate a trend report from the database. Zero AI cost — pure SQL queries:

```bash
# Monthly recap (default, last 30 days)
bun run .claude/skills/retro/scripts/recap.ts

# Weekly recap (last 7 days)
bun run .claude/skills/retro/scripts/recap.ts --period weekly
```

The report includes: finding summary by type, top blockers by tag, recent praise, regression detection (tags that disappeared then reappeared), top suggestions, and process evolution (first-half vs second-half comparison).

### Search (`--search`)

Hybrid semantic search combining vector similarity (0.7 weight) and BM25 full-text search (0.3 weight) using Reciprocal Rank Fusion (k=60). Returns top 20 results:

```bash
# Search all findings
bun run .claude/skills/retro/scripts/search.ts "authentication"

# Filter by type
bun run .claude/skills/retro/scripts/search.ts "auth" --type blocker
```

Valid `--type` values: `praise`, `blocker`, `suggestion`, `nitpick`.

### Reanalyze (`--reanalyze`)

Clear findings for a specific session (or all sessions) and re-run analysis:

```bash
# Re-analyze a single session
bun run .claude/skills/retro/scripts/analyze-findings.ts --reanalyze <session-id>

# Re-analyze all (requires y/N confirmation)
bun run .claude/skills/retro/scripts/analyze-findings.ts --reanalyze all
```

Session IDs must be alphanumeric with hyphens and underscores only.

### Dashboard (default — no arguments)

When no arguments are provided, query the database directly and display a summary. Read `lib/db.ts` and use the `getDatabase()` function, then run these queries:

1. **Session stats**: `SELECT COUNT(*) FROM sessions` and `SELECT COUNT(*) FROM sessions WHERE analyzed_at IS NOT NULL`
2. **Findings by type**: `SELECT type, COUNT(*) as count FROM findings GROUP BY type`
3. **Top 5 blockers**: `SELECT j.value as tag, COUNT(*) as count FROM findings f, json_each(f.tags) j WHERE f.type = 'blocker' GROUP BY j.value ORDER BY count DESC LIMIT 5`
4. **Recent praise (7 days)**: `SELECT content, tags FROM findings WHERE type = 'praise' AND session_timestamp >= datetime('now', '-7 days') ORDER BY session_timestamp DESC LIMIT 5`

Format as a readable summary. If no sessions are analyzed yet, prompt: "No findings yet. Run `/retro --parse` then `/retro --analyze` to get started."

## Data Model

| Table | Purpose |
|-------|---------|
| `sessions` | Parsed session metadata (id, branch, first prompt, timestamps) |
| `findings` | Extracted findings (type, content, context, severity, tags) |
| `findings_fts` | FTS5 virtual table for BM25 full-text search |
| `finding_embeddings` | vec0 virtual table for 384-dim vector similarity search |
| `processing_log` | Audit trail for parse/analyze phases |

Database location: `.claude/skills/retro/data/retro.db` (gitignored).

## Error Handling

- **Missing database**: Prompt user to run `--setup`
- **Missing sessions directory**: Scripts log a warning and return empty results
- **Provider timeout**: 2-minute timeout per session; failures logged to `processing_log` and skipped
- **Missing API key**: Clear error when `provider: openrouter` but the env var from `api_key_env` is not set
- **Malformed JSONL**: Individual lines are skipped, session still processes
- **Embedding failure**: Finding is stored without embedding; search still works via BM25

## Scripts Reference

All scripts are in `.claude/skills/retro/scripts/`:

| Script | Phase | AI Cost |
|--------|-------|---------|
| `setup.ts` | 0 — Initialize | None (model download only) |
| `parse-sessions.ts` | 1 — Import | None |
| `analyze-findings.ts` | 2 — Extract | 1 Claude call per session |
| `recap.ts` | 3 — Report | None |
| `search.ts` | 3 — Query | None (local embeddings) |

Library code in `.claude/skills/retro/lib/`: `db.ts` (database), `schema.ts` (DDL), `parser.ts` (JSONL parsing), `embedder.ts` (Transformers.js), `hybrid-search.ts` (RRF fusion), `redactor.ts` (secret scrubbing).
