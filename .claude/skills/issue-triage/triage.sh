#!/usr/bin/env bash
# Issue triage CLI — thin router that delegates to command modules.
# Usage:
#   ./triage.sh [list] [--json]
#   ./triage.sh set <number> [--size S] [--priority P] [--status S] [--parent N] [--add-child N] ...
#   ./triage.sh create --title "Title" [--body "Body"] [--label "l1,l2"] [--size S] [--parent N] ...

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

# shellcheck source=lib.sh
source "$SCRIPT_DIR/lib.sh"
# shellcheck source=list.sh
source "$SCRIPT_DIR/list.sh"
# shellcheck source=set.sh
source "$SCRIPT_DIR/set.sh"
# shellcheck source=create.sh
source "$SCRIPT_DIR/create.sh"

case "${1:-list}" in
    list)   shift 2>/dev/null || true; list_issues "$@" ;;
    set)    shift; set_issue "$@" ;;
    create) shift; create_issue "$@" ;;
    *)      echo "Usage: $0 [list|set|create] ..." ;;
esac
