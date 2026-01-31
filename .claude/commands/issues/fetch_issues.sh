#!/usr/bin/env bash
# Fetch open GitHub issues from project with labels, size, priority, and dependencies.
# Usage: ./fetch_issues.sh [--size|--priority] [--json]

set -euo pipefail

PROJECT_ID="PVT_kwHODEqYK84BN8ge"

SORT_BY="size"
JSON_OUTPUT=false

while [[ $# -gt 0 ]]; do
    case $1 in
        --priority) SORT_BY="priority"; shift ;;
        --size) SORT_BY="size"; shift ;;
        --json) JSON_OUTPUT=true; shift ;;
        *) shift ;;
    esac
done

# GraphQL query with labels and dependencies
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
              labels(first: 5) {
                nodes { name }
              }
              trackedInIssues(first: 10) {
                nodes { number state }
              }
              trackedIssues(first: 10) {
                nodes { number state }
              }
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

# Fetch data
DATA=$(gh api graphql -f query="$QUERY" -f projectId="$PROJECT_ID")

# Process with jq
if $JSON_OUTPUT; then
    echo "$DATA" | jq '
        .data.node.items.nodes
        | map(select(.content.state == "OPEN"))
        | map({
            number: .content.number,
            title: .content.title,
            labels: [.content.labels.nodes[].name],
            size: ([.fieldValues.nodes[] | select(.field.name == "Size") | .name] | first // "-"),
            priority: ([.fieldValues.nodes[] | select(.field.name == "Priority") | .name] | first // "-"),
            blocked_by: [.content.trackedInIssues.nodes[] | select(.state == "OPEN") | .number],
            blocks: [.content.trackedIssues.nodes[] | select(.state == "OPEN") | .number]
        })
    '
else
    echo "$DATA" | jq -r --arg sort "$SORT_BY" '
        def size_order: {"XS": 1, "S": 2, "M": 3, "L": 4, "XL": 5, "-": 99};
        def priority_order: {"High": 1, "Medium": 2, "Low": 3, "-": 99};
        def priority_short: {"High": "H", "Medium": "M", "Low": "L"};

        .data.node.items.nodes
        | map(select(.content.state == "OPEN"))
        | map({
            number: .content.number,
            title: .content.title,
            status: ([.fieldValues.nodes[] | select(.field.name == "Status") | .name] | first // "-"),
            size: ([.fieldValues.nodes[] | select(.field.name == "Size") | .name] | first // "-"),
            priority: ([.fieldValues.nodes[] | select(.field.name == "Priority") | .name] | first // "-"),
            blocked_by: ([.content.trackedInIssues.nodes[] | select(.state == "OPEN") | "#\(.number)"] | join(", ")),
            blocks: ([.content.trackedIssues.nodes[] | select(.state == "OPEN") | "#\(.number)"] | join(", "))
        })
        | sort_by(
            if $sort == "priority" then
                .priority | priority_order[.] // 99
            else
                .size | size_order[.] // 99
            end
        )
        | "**Open Issues - Roxabi Boilerplate**\n",
          "| # | Title | Status | Size | Priority | Deps |",
          "|---|-------|--------|------|----------|------|",
          (.[] |
            (if .blocked_by != "" then "⛔" + .blocked_by elif .blocks != "" then "🔓" + .blocks else "-" end) as $deps |
            "| #\(.number) | \(.title | if length > 40 then .[:37] + "..." else . end) | \(.status) | \(.size) | \(.priority | priority_short[.] // .) | \($deps) |"
          ),
          "",
          "*Total: \(length) issue(s)*"
    '
fi
