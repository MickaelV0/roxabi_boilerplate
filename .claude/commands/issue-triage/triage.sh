#!/usr/bin/env bash
# Triage GitHub issues by setting Size and Priority fields.
# Usage:
#   ./triage.sh [list] [--json]
#   ./triage.sh set <number> --size <XS|S|M|L|XL> --priority <High|Medium|Low>

set -euo pipefail

PROJECT_ID="${PROJECT_ID:-PVT_kwHODEqYK84BN8ge}"
SIZE_FIELD_ID="${SIZE_FIELD_ID:-PVTSSF_lAHODEqYK84BN8gezg8zGqE}"
PRIORITY_FIELD_ID="${PRIORITY_FIELD_ID:-PVTSSF_lAHODEqYK84BN8gezg8zGrc}"

declare -A SIZE_OPTIONS=(["XS"]="41fb9722" ["S"]="860e8a45" ["M"]="ee739a66" ["L"]="5e1a7465" ["XL"]="5f5a7f1e")
declare -A PRIORITY_OPTIONS=(["HIGH"]="2479587d" ["MEDIUM"]="00335b8a" ["LOW"]="fe61d3e9")

QUERY='
query($projectId: ID!) {
  node(id: $projectId) {
    ... on ProjectV2 {
      items(first: 100) {
        nodes {
          id
          content {
            ... on Issue { number title body state }
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

list_issues() {
    local json_output=false
    [[ "${1:-}" == "--json" ]] && json_output=true

    DATA=$(gh api graphql -f query="$QUERY" -f projectId="$PROJECT_ID")

    if $json_output; then
        echo "$DATA" | jq '
            .data.node.items.nodes
            | map(select(.content.state == "OPEN"))
            | map(
                ([.fieldValues.nodes[] | select(.field.name == "Size") | .name] | first) as $size |
                ([.fieldValues.nodes[] | select(.field.name == "Priority") | .name] | first) as $priority |
                select($size == null or $priority == null) |
                {item_id: .id, number: .content.number, title: .content.title, size: $size, priority: $priority}
            )
        '
    else
        echo "$DATA" | jq -r '
            .data.node.items.nodes
            | map(select(.content.state == "OPEN"))
            | map(
                ([.fieldValues.nodes[] | select(.field.name == "Size") | .name] | first) as $size |
                ([.fieldValues.nodes[] | select(.field.name == "Priority") | .name] | first) as $priority |
                select($size == null or $priority == null) |
                {number: .content.number, title: .content.title, size: ($size // "-"), priority: ($priority // "-")}
            )
            | if length == 0 then "All issues triaged."
            else
                "| # | Title | Size | Pri |",
                "|---|-------|------|-----|",
                (.[] | "| #\(.number) | \(.title | if length > 45 then .[:42] + "..." else . end) | \(.size) | \(.priority) |"),
                "", "*\(length) to triage*"
            end
        '
    fi
}

get_item_id() {
    gh api graphql -f query="$QUERY" -f projectId="$PROJECT_ID" | \
        jq -r --argjson num "$1" '.data.node.items.nodes[] | select(.content.number == $num) | .id'
}

update_field() {
    gh api graphql -f query='
        mutation($projectId: ID!, $itemId: ID!, $fieldId: ID!, $optionId: String!) {
          updateProjectV2ItemFieldValue(input: {projectId: $projectId, itemId: $itemId, fieldId: $fieldId, value: {singleSelectOptionId: $optionId}}) {
            projectV2Item { id }
          }
        }
    ' -f projectId="$PROJECT_ID" -f itemId="$1" -f fieldId="$2" -f optionId="$3" > /dev/null
}

set_issue() {
    local issue_number="" size="" priority=""
    while [[ $# -gt 0 ]]; do
        case $1 in
            --size) size="${2^^}"; shift 2 ;;
            --priority) priority="${2^^}"; shift 2 ;;
            *) issue_number="$1"; shift ;;
        esac
    done

    [[ -z "$issue_number" ]] && { echo "Error: Issue number required" >&2; exit 1; }
    [[ -z "$size" && -z "$priority" ]] && { echo "Error: Specify --size and/or --priority" >&2; exit 1; }

    item_id=$(get_item_id "$issue_number")
    [[ -z "$item_id" ]] && { echo "Error: Issue #$issue_number not found" >&2; exit 1; }

    if [[ -n "$size" ]]; then
        [[ -z "${SIZE_OPTIONS[$size]:-}" ]] && { echo "Error: Invalid size. Valid: ${!SIZE_OPTIONS[*]}" >&2; exit 1; }
        update_field "$item_id" "$SIZE_FIELD_ID" "${SIZE_OPTIONS[$size]}"
        echo "Size=$size #$issue_number"
    fi
    if [[ -n "$priority" ]]; then
        [[ -z "${PRIORITY_OPTIONS[$priority]:-}" ]] && { echo "Error: Invalid priority. Valid: High, Medium, Low" >&2; exit 1; }
        update_field "$item_id" "$PRIORITY_FIELD_ID" "${PRIORITY_OPTIONS[$priority]}"
        echo "Priority=$priority #$issue_number"
    fi
}

case "${1:-list}" in
    list) shift 2>/dev/null || true; list_issues "$@" ;;
    set) shift; set_issue "$@" ;;
    *) echo "Usage: $0 [list|set] ..." ;;
esac
