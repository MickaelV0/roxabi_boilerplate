#!/usr/bin/env bash
# Fetch open GitHub issues from project with Status, Size, Priority, and dependencies.
# Usage: ./fetch_issues.sh [--size|--priority] [--json] [--title-length=N]

set -euo pipefail

PROJECT_ID="${PROJECT_ID:-PVT_kwHODEqYK84BOId3}"
REPO="${GITHUB_REPO:-MickaelV0/roxabi_boilerplate}"
OWNER="${REPO%/*}"
REPO_NAME="${REPO#*/}"

SORT_BY="size"
JSON_OUTPUT=false
TITLE_LENGTH=60

while [[ $# -gt 0 ]]; do
    case $1 in
        --priority) SORT_BY="priority"; shift ;;
        --size) SORT_BY="size"; shift ;;
        --json) JSON_OUTPUT=true; shift ;;
        --title-length=*) TITLE_LENGTH="${1#*=}"; shift ;;
        *) shift ;;
    esac
done

# Get issues from project via GraphQL
QUERY='
query($projectId: ID!) {
  node(id: $projectId) {
    ... on ProjectV2 {
      items(first: 100) {
        nodes {
          content {
            ... on Issue {
              number
              title
              state
            }
          }
          fieldValues(first: 10) {
            nodes {
              ... on ProjectV2ItemFieldSingleSelectValue {
                name
                field { ... on ProjectV2SingleSelectField { name } }
              }
            }
          }
        }
      }
    }
  }
}
'

PROJECT_DATA=$(gh api graphql -f query="$QUERY" -f projectId="$PROJECT_ID")

# Extract open issue numbers
OPEN_ISSUES=$(echo "$PROJECT_DATA" | jq -r '
    .data.node.items.nodes[]
    | select(.content.state == "OPEN")
    | .content.number
')

# Fetch dependencies for each issue via GraphQL (trackedInIssues = blocked by, trackedIssues = blocks)
# Also fetch state of each dependency to show if it's open or closed
DEPS_DATA="{}"
for issue_num in $OPEN_ISSUES; do
    deps=$(gh api graphql -f query='
        query($owner: String!, $repo: String!, $num: Int!) {
          repository(owner: $owner, name: $repo) {
            issue(number: $num) {
              trackedInIssues(first: 10) { nodes { number state } }
              trackedIssues(first: 10) { nodes { number state } }
            }
          }
        }
    ' -f owner="$OWNER" -f repo="$REPO_NAME" -F num="$issue_num" 2>/dev/null || echo '{"data":{"repository":{"issue":{"trackedInIssues":{"nodes":[]},"trackedIssues":{"nodes":[]}}}}}')

    # trackedIssues = issues this one tracks (depends on) = blocked_by
    # trackedInIssues = issues tracking this one (depend on this) = blocking
    # Include state for each dependency: {number, state}
    blocked_by=$(echo "$deps" | jq '[.data.repository.issue.trackedIssues.nodes[] | {number, state}]')
    blocking=$(echo "$deps" | jq '[.data.repository.issue.trackedInIssues.nodes[] | {number, state}]')

    DEPS_DATA=$(echo "$DEPS_DATA" | jq --arg num "$issue_num" --argjson bb "$blocked_by" --argjson bl "$blocking" \
        '. + {($num): {blocked_by: $bb, blocking: $bl}}')
done

# Combine and format output
if $JSON_OUTPUT; then
    echo "$PROJECT_DATA" | jq --argjson deps "$DEPS_DATA" '
        .data.node.items.nodes
        | map(select(.content.state == "OPEN"))
        | map({
            number: .content.number,
            title: .content.title,
            status: ([.fieldValues.nodes[] | select(.field.name == "Status") | .name] | first // "-"),
            size: ([.fieldValues.nodes[] | select(.field.name == "Size") | .name] | first // "-"),
            priority: ([.fieldValues.nodes[] | select(.field.name == "Priority") | .name] | first // "-"),
            blocked_by: ($deps[.content.number | tostring].blocked_by // []),
            blocked_by_open: ([$deps[.content.number | tostring].blocked_by // [] | .[] | select(.state == "OPEN") | .number]),
            blocked_by_closed: ([$deps[.content.number | tostring].blocked_by // [] | .[] | select(.state == "CLOSED") | .number]),
            blocks: ($deps[.content.number | tostring].blocking // [])
        })
    '
else
    echo "$PROJECT_DATA" | jq -r --arg sort "$SORT_BY" --argjson deps "$DEPS_DATA" --argjson titleLen "$TITLE_LENGTH" '
        def size_order: {"XS": 1, "S": 2, "M": 3, "L": 4, "XL": 5, "-": 99};
        def priority_order: {"P0 - Urgent": 0, "P1 - High": 1, "P2 - Medium": 2, "P3 - Low": 3, "-": 99};
        def priority_short: {"P0 - Urgent": "P0", "P1 - High": "P1", "P2 - Medium": "P2", "P3 - Low": "P3"};

        def format_deps:
            ($deps[.number | tostring].blocked_by // []) as $bb |
            ($deps[.number | tostring].blocking // []) as $bl |
            # Format blocked_by: ⛔#X for open, ✅#X for closed
            ($bb | map(if .state == "OPEN" then "⛔#\(.number)" else "✅#\(.number)" end)) as $bb_fmt |
            # Format blocking: 🔓#X
            ($bl | map("🔓#\(.number)")) as $bl_fmt |
            if ($bb | length) > 0 then ($bb_fmt | join(","))
            elif ($bl | length) > 0 then ($bl_fmt | join(","))
            else "-" end;

        def format_row:
            "| #\(.number) | \(.title | if length > $titleLen then .[: $titleLen - 3] + "..." else . end) | \(.status) | \(.size) | \(.priority | priority_short[.] // .) | \(format_deps) |";

        def table_header:
            "| # | Title | Status | Size | Pri | Deps |",
            "|---|-------|--------|------|-----|------|";

        .data.node.items.nodes
        | map(select(.content.state == "OPEN"))
        | map({
            number: .content.number,
            title: .content.title,
            status: ([.fieldValues.nodes[] | select(.field.name == "Status") | .name] | first // "-"),
            size: ([.fieldValues.nodes[] | select(.field.name == "Size") | .name] | first // "-"),
            priority: ([.fieldValues.nodes[] | select(.field.name == "Priority") | .name] | first // "-")
        })
        | group_by(.priority | priority_order[.] // 99)
        | map(sort_by(if $sort == "priority" then .priority | priority_order[.] // 99 else .size | size_order[.] // 99 end))
        | {
            urgent: (map(select(.[0].priority == "P0 - Urgent" or .[0].priority == "P1 - High")) | add // []),
            medium: (map(select(.[0].priority == "P2 - Medium")) | add // []),
            low: (map(select(.[0].priority == "P3 - Low" or .[0].priority == "-")) | add // [])
          }
        | (if (.urgent | length) > 0 then
            "## 🔴 Urgent & High Priority (P0-P1)",
            "",
            table_header,
            (.urgent[] | format_row),
            ""
          else empty end),
          (if (.medium | length) > 0 then
            "## 🟡 Medium Priority (P2)",
            "",
            table_header,
            (.medium[] | format_row),
            ""
          else empty end),
          (if (.low | length) > 0 then
            "## 🟢 Low Priority (P3)",
            "",
            table_header,
            (.low[] | format_row),
            ""
          else empty end),
          "*\((.urgent + .medium + .low) | length) issue(s)*"
    '
fi
