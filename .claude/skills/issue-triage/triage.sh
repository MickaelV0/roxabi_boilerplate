#!/usr/bin/env bash
# Triage GitHub issues by setting Size, Priority, Status, and dependencies.
# Usage:
#   ./triage.sh [list] [--json]
#   ./triage.sh set <number> --size <XS|S|M|L|XL> --priority <High|Medium|Low> --status <Status>
#   ./triage.sh set <number> --blocked-by <N>[,<N>...] --blocks <N>[,<N>...]

set -euo pipefail

GITHUB_REPO="${GITHUB_REPO:-MickaelV0/roxabi_boilerplate}"
PROJECT_ID="${PROJECT_ID:-PVT_kwHODEqYK84BOId3}"
STATUS_FIELD_ID="${STATUS_FIELD_ID:-PVTSSF_lAHODEqYK84BOId3zg87HNM}"
SIZE_FIELD_ID="${SIZE_FIELD_ID:-PVTSSF_lAHODEqYK84BOId3zg87HYo}"
PRIORITY_FIELD_ID="${PRIORITY_FIELD_ID:-PVTSSF_lAHODEqYK84BOId3zg87HYs}"

declare -A STATUS_OPTIONS=(["BACKLOG"]="df6ee93b" ["ANALYSIS"]="bec91bb0" ["SPECS"]="ad9a9195" ["IN PROGRESS"]="331d27a4" ["INPROGRESS"]="331d27a4" ["IN_PROGRESS"]="331d27a4" ["REVIEW"]="ee30a001" ["DONE"]="bfdc35bd")
declare -A SIZE_OPTIONS=(["XS"]="dfcde6df" ["S"]="4390f522" ["M"]="e2c52fb1" ["L"]="f8ea3803" ["XL"]="228a917d")
declare -A PRIORITY_OPTIONS=(["URGENT"]="ed739db3" ["HIGH"]="742ac87b" ["MEDIUM"]="723e7784" ["LOW"]="796f973f")

QUERY='
query($projectId: ID!, $cursor: String) {
  node(id: $projectId) {
    ... on ProjectV2 {
      items(first: 100, after: $cursor) {
        pageInfo { hasNextPage endCursor }
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

# Fetch all project items with pagination
fetch_all_items() {
    local cursor=""
    local all_items="[]"
    while true; do
        local result
        if [[ -z "$cursor" ]]; then
            result=$(gh api graphql -F query="$QUERY" -f projectId="$PROJECT_ID")
        else
            result=$(gh api graphql -F query="$QUERY" -f projectId="$PROJECT_ID" -f cursor="$cursor")
        fi
        local page_items
        page_items=$(echo "$result" | jq '.data.node.items.nodes')
        all_items=$(echo "$all_items $page_items" | jq -s '.[0] + .[1]')
        local has_next
        has_next=$(echo "$result" | jq -r '.data.node.items.pageInfo.hasNextPage')
        if [[ "$has_next" != "true" ]]; then
            break
        fi
        cursor=$(echo "$result" | jq -r '.data.node.items.pageInfo.endCursor')
    done
    echo "$all_items"
}

list_issues() {
    local json_output=false
    [[ "${1:-}" == "--json" ]] && json_output=true

    ALL_ITEMS=$(fetch_all_items)

    if $json_output; then
        echo "$ALL_ITEMS" | jq '
            map(select(.content.state == "OPEN"))
            | map(
                ([.fieldValues.nodes[] | select(.field.name == "Size") | .name] | first) as $size |
                ([.fieldValues.nodes[] | select(.field.name == "Priority") | .name] | first) as $priority |
                select($size == null or $priority == null) |
                {item_id: .id, number: .content.number, title: .content.title, size: $size, priority: $priority}
            )
        '
    else
        echo "$ALL_ITEMS" | jq -r '
            map(select(.content.state == "OPEN"))
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
    local owner repo
    owner="${GITHUB_REPO%%/*}"
    repo="${GITHUB_REPO##*/}"
    gh api graphql \
        -f query='query($owner: String!, $repo: String!, $number: Int!) {
            repository(owner: $owner, name: $repo) {
                issue(number: $number) {
                    projectItems(first: 10) {
                        nodes { id project { id } }
                    }
                }
            }
        }' \
        -f owner="$owner" -f repo="$repo" -F number="$1" \
        | jq -r --arg pid "$PROJECT_ID" '.data.repository.issue.projectItems.nodes[] | select(.project.id == $pid) | .id'
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

get_node_id() {
    gh api "repos/$GITHUB_REPO/issues/$1" --jq '.node_id'
}

add_blocked_by() {
    local issue_id="$1" blocking_id="$2"
    gh api graphql \
        -f query='mutation($issueId: ID!, $blockingId: ID!) { addBlockedBy(input: { issueId: $issueId, blockingIssueId: $blockingId }) { issue { number } blockingIssue { number } } }' \
        -f issueId="$issue_id" -f blockingId="$blocking_id" > /dev/null
}

remove_blocked_by() {
    local issue_id="$1" blocking_id="$2"
    gh api graphql \
        -f query='mutation($issueId: ID!, $blockingId: ID!) { removeBlockedBy(input: { issueId: $issueId, blockingIssueId: $blockingId }) { issue { number } blockingIssue { number } } }' \
        -f issueId="$issue_id" -f blockingId="$blocking_id" > /dev/null
}

set_issue() {
    local issue_number="" size="" priority="" status="" blocked_by="" blocks="" rm_blocked_by="" rm_blocks=""
    while [[ $# -gt 0 ]]; do
        case $1 in
            --size) size="${2^^}"; shift 2 ;;
            --priority) priority="${2^^}"; shift 2 ;;
            --status) status="${2^^}"; shift 2 ;;
            --blocked-by) blocked_by="$2"; shift 2 ;;
            --blocks) blocks="$2"; shift 2 ;;
            --rm-blocked-by) rm_blocked_by="$2"; shift 2 ;;
            --rm-blocks) rm_blocks="$2"; shift 2 ;;
            *) issue_number="$1"; shift ;;
        esac
    done

    [[ -z "$issue_number" ]] && { echo "Error: Issue number required" >&2; exit 1; }
    [[ -z "$size" && -z "$priority" && -z "$status" && -z "$blocked_by" && -z "$blocks" && -z "$rm_blocked_by" && -z "$rm_blocks" ]] && { echo "Error: Specify --size, --priority, --status, --blocked-by, --blocks, --rm-blocked-by, and/or --rm-blocks" >&2; exit 1; }

    # Project field updates need item_id
    if [[ -n "$size" || -n "$priority" || -n "$status" ]]; then
        item_id=$(get_item_id "$issue_number")
        [[ -z "$item_id" ]] && { echo "Error: Issue #$issue_number not found in project" >&2; exit 1; }

        if [[ -n "$status" ]]; then
            [[ -z "${STATUS_OPTIONS[$status]:-}" ]] && { echo "Error: Invalid status. Valid: Backlog, Analysis, Specs, \"In Progress\", Review, Done" >&2; exit 1; }
            update_field "$item_id" "$STATUS_FIELD_ID" "${STATUS_OPTIONS[$status]}"
            echo "Status=$status #$issue_number"
        fi
        if [[ -n "$size" ]]; then
            [[ -z "${SIZE_OPTIONS[$size]:-}" ]] && { echo "Error: Invalid size. Valid: ${!SIZE_OPTIONS[*]}" >&2; exit 1; }
            update_field "$item_id" "$SIZE_FIELD_ID" "${SIZE_OPTIONS[$size]}"
            echo "Size=$size #$issue_number"
        fi
        if [[ -n "$priority" ]]; then
            [[ -z "${PRIORITY_OPTIONS[$priority]:-}" ]] && { echo "Error: Invalid priority. Valid: Urgent, High, Medium, Low" >&2; exit 1; }
            update_field "$item_id" "$PRIORITY_FIELD_ID" "${PRIORITY_OPTIONS[$priority]}"
            echo "Priority=$priority #$issue_number"
        fi
    fi

    # Dependency updates use node IDs directly
    if [[ -n "$blocked_by" ]]; then
        local issue_node_id
        issue_node_id=$(get_node_id "$issue_number")
        IFS=',' read -ra DEPS <<< "$blocked_by"
        for dep in "${DEPS[@]}"; do
            dep="${dep// /}"
            dep="${dep#\#}"
            local blocking_node_id
            blocking_node_id=$(get_node_id "$dep")
            add_blocked_by "$issue_node_id" "$blocking_node_id"
            echo "BlockedBy=#$dep #$issue_number"
        done
    fi

    if [[ -n "$blocks" ]]; then
        local blocking_node_id
        blocking_node_id=$(get_node_id "$issue_number")
        IFS=',' read -ra DEPS <<< "$blocks"
        for dep in "${DEPS[@]}"; do
            dep="${dep// /}"
            dep="${dep#\#}"
            local blocked_node_id
            blocked_node_id=$(get_node_id "$dep")
            add_blocked_by "$blocked_node_id" "$blocking_node_id"
            echo "Blocks=#$dep #$issue_number"
        done
    fi

    if [[ -n "$rm_blocked_by" ]]; then
        local issue_node_id
        issue_node_id=$(get_node_id "$issue_number")
        IFS=',' read -ra DEPS <<< "$rm_blocked_by"
        for dep in "${DEPS[@]}"; do
            dep="${dep// /}"
            dep="${dep#\#}"
            local blocking_node_id
            blocking_node_id=$(get_node_id "$dep")
            remove_blocked_by "$issue_node_id" "$blocking_node_id"
            echo "RemovedBlockedBy=#$dep #$issue_number"
        done
    fi

    if [[ -n "$rm_blocks" ]]; then
        local blocking_node_id
        blocking_node_id=$(get_node_id "$issue_number")
        IFS=',' read -ra DEPS <<< "$rm_blocks"
        for dep in "${DEPS[@]}"; do
            dep="${dep// /}"
            dep="${dep#\#}"
            local blocked_node_id
            blocked_node_id=$(get_node_id "$dep")
            remove_blocked_by "$blocked_node_id" "$blocking_node_id"
            echo "RemovedBlocks=#$dep #$issue_number"
        done
    fi
}

case "${1:-list}" in
    list) shift 2>/dev/null || true; list_issues "$@" ;;
    set) shift; set_issue "$@" ;;
    *) echo "Usage: $0 [list|set] ..." ;;
esac
