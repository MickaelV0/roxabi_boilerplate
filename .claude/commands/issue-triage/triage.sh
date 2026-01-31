#!/usr/bin/env bash
# Triage GitHub issues by setting Size and Priority fields.
# Usage:
#   ./triage.sh [list] [--json]         # List issues needing triage
#   ./triage.sh set <number> --size <XS|S|M|L|XL> --priority <High|Medium|Low>

set -euo pipefail

# Project and field IDs
PROJECT_ID="PVT_kwHODEqYK84BN8ge"
SIZE_FIELD_ID="PVTSSF_lAHODEqYK84BN8gezg8zGqE"
PRIORITY_FIELD_ID="PVTSSF_lAHODEqYK84BN8gezg8zGrc"

# Option IDs
declare -A SIZE_OPTIONS=(
    ["XS"]="41fb9722"
    ["S"]="860e8a45"
    ["M"]="ee739a66"
    ["L"]="5e1a7465"
    ["XL"]="5f5a7f1e"
)

declare -A PRIORITY_OPTIONS=(
    ["HIGH"]="2479587d"
    ["MEDIUM"]="00335b8a"
    ["LOW"]="fe61d3e9"
)

LIST_QUERY='
query($projectId: ID!) {
  node(id: $projectId) {
    ... on ProjectV2 {
      items(first: 100) {
        nodes {
          id
          content {
            ... on Issue {
              number
              title
              body
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

list_issues() {
    local json_output=false
    [[ "${1:-}" == "--json" ]] && json_output=true

    DATA=$(gh api graphql -f query="$LIST_QUERY" -f projectId="$PROJECT_ID")

    if $json_output; then
        echo "$DATA" | jq '
            .data.node.items.nodes
            | map(select(.content.state == "OPEN"))
            | map(
                ([.fieldValues.nodes[] | select(.field.name == "Size") | .name] | first) as $size |
                ([.fieldValues.nodes[] | select(.field.name == "Priority") | .name] | first) as $priority |
                select($size == null or $priority == null) |
                {
                    item_id: .id,
                    number: .content.number,
                    title: .content.title,
                    body: (.content.body // "")[:500],
                    current_size: $size,
                    current_priority: $priority,
                    needs_size: ($size == null),
                    needs_priority: ($priority == null)
                }
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
                {
                    number: .content.number,
                    title: .content.title,
                    size: ($size // "-"),
                    priority: ($priority // "-")
                }
            )
            | if length == 0 then
                "All issues are triaged."
            else
                "**Issues to triage**\n",
                "| # | Title | Size | Priority |",
                "|---|-------|------|----------|",
                (.[] | "| #\(.number) | \(.title | if length > 45 then .[:42] + "..." else . end) | \(.size) | \(.priority) |"),
                "",
                "*Total: \(length) issue(s) to triage*\n",
                "```bash",
                "# Assign Size and Priority:",
                ".claude/commands/issue-triage/triage.sh set <num> --size <XS|S|M|L|XL> --priority <High|Medium|Low>",
                "```"
            end
        '
    fi
}

get_item_id() {
    local issue_number=$1
    gh api graphql -f query="$LIST_QUERY" -f projectId="$PROJECT_ID" | \
        jq -r --argjson num "$issue_number" '
            .data.node.items.nodes[]
            | select(.content.number == $num)
            | .id
        '
}

update_field() {
    local item_id=$1
    local field_id=$2
    local option_id=$3

    gh api graphql -f query='
        mutation($projectId: ID!, $itemId: ID!, $fieldId: ID!, $optionId: String!) {
          updateProjectV2ItemFieldValue(input: {
            projectId: $projectId
            itemId: $itemId
            fieldId: $fieldId
            value: { singleSelectOptionId: $optionId }
          }) {
            projectV2Item { id }
          }
        }
    ' -f projectId="$PROJECT_ID" -f itemId="$item_id" -f fieldId="$field_id" -f optionId="$option_id" > /dev/null
}

set_issue() {
    local issue_number=""
    local size=""
    local priority=""

    while [[ $# -gt 0 ]]; do
        case $1 in
            --size) size="${2^^}"; shift 2 ;;
            --priority) priority="${2^^}"; shift 2 ;;
            *) issue_number="$1"; shift ;;
        esac
    done

    if [[ -z "$issue_number" ]]; then
        echo "Error: Issue number required" >&2
        exit 1
    fi

    if [[ -z "$size" && -z "$priority" ]]; then
        echo "Error: Specify --size and/or --priority" >&2
        exit 1
    fi

    item_id=$(get_item_id "$issue_number")
    if [[ -z "$item_id" ]]; then
        echo "Error: Issue #$issue_number not found in project" >&2
        exit 1
    fi

    if [[ -n "$size" ]]; then
        option_id="${SIZE_OPTIONS[$size]:-}"
        if [[ -z "$option_id" ]]; then
            echo "Error: Invalid size '$size'. Valid: ${!SIZE_OPTIONS[*]}" >&2
            exit 1
        fi
        update_field "$item_id" "$SIZE_FIELD_ID" "$option_id"
        echo "Set Size=$size for #$issue_number"
    fi

    if [[ -n "$priority" ]]; then
        option_id="${PRIORITY_OPTIONS[$priority]:-}"
        if [[ -z "$option_id" ]]; then
            echo "Error: Invalid priority '$priority'. Valid: High, Medium, Low" >&2
            exit 1
        fi
        update_field "$item_id" "$PRIORITY_FIELD_ID" "$option_id"
        echo "Set Priority=$priority for #$issue_number"
    fi
}

# Main
case "${1:-list}" in
    list) shift 2>/dev/null || true; list_issues "$@" ;;
    set) shift; set_issue "$@" ;;
    *) echo "Usage: $0 [list|set] ..."; exit 1 ;;
esac
