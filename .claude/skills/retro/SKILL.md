---
argument-hint: [--setup | --parse | --analyze [--limit N] | --recap [--period weekly|monthly] | --search "query" [--type blocker] | --reanalyze <session-id|all>]
description: This skill should be used when the user wants to analyze Claude Code session transcripts, extract findings, search session intelligence, view retro dashboards, or run trend analysis. Triggers include "retro", "session intelligence", "analyze sessions", "search findings", and "recap".
allowed-tools: Bash, Read, Grep, Glob, AskUserQuestion
---

# Retro — Session Intelligence

Analyze Claude Code session transcripts to extract, search, and trend actionable findings (blockers, praise, suggestions, nitpicks).

## Usage

```
/retro                                    → Dashboard summary
/retro --setup                            → First-time initialization
/retro --parse                            → Import session transcripts
/retro --analyze [--limit N]              → AI-powered finding extraction
/retro --recap [--period weekly|monthly]  → Trend report
/retro --search "query" [--type TYPE]     → Hybrid semantic search
/retro --reanalyze <session-id|all>       → Re-analyze sessions
```

## Instructions

<!-- TODO: implement routing logic for each subcommand -->

### Parse Arguments

Extract the subcommand from `$ARGUMENTS`:

```
--setup     → Run setup script
--parse     → Run parse script
--analyze   → Run analyze script (with optional --limit N)
--recap     → Run recap script (with optional --period)
--search    → Run search script (with query and optional --type)
--reanalyze → Run reanalyze flow
(none)      → Show dashboard
```

### Route to Script

Each subcommand maps to a script in `.claude/skills/retro/scripts/`:

```bash
RETRO_DIR=".claude/skills/retro"

# Check database exists (except for --setup)
if [[ "$SUBCOMMAND" != "--setup" ]]; then
  if [[ ! -f "$RETRO_DIR/data/retro.db" ]]; then
    echo "No retro database found. Run \`/retro --setup\` to get started."
    exit 0
  fi
fi
```

### Dashboard (default)

When no arguments are provided, query the database and display:

1. Total sessions parsed / total available
2. Total findings by type (praise, blocker, suggestion, nitpick)
3. Top 5 recurring blockers
4. Recent improvements (last 7 days)

If no sessions analyzed, prompt user to run `--parse` then `--analyze`.

### Setup (`--setup`)

```bash
bun run "$RETRO_DIR/scripts/setup.ts"
```

1. Check bun:sqlite availability
2. Load sqlite-vec extension
3. Download all-MiniLM-L6-v2 embedding model
4. Create database with full schema
5. Verify with test embedding + vector insert

### Parse (`--parse`)

```bash
bun run "$RETRO_DIR/scripts/parse-sessions.ts"
```

### Analyze (`--analyze`)

```bash
bun run "$RETRO_DIR/scripts/analyze-findings.ts" $LIMIT_ARG
```

### Recap (`--recap`)

```bash
bun run "$RETRO_DIR/scripts/recap.ts" $PERIOD_ARG
```

### Search (`--search`)

```bash
bun run "$RETRO_DIR/scripts/search.ts" "$QUERY" $TYPE_ARG
```

### Reanalyze (`--reanalyze`)

```bash
bun run "$RETRO_DIR/scripts/analyze-findings.ts" --reanalyze "$SESSION_ID"
```
