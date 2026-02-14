#!/usr/bin/env bash
# Shared config, constants, and GitHub API helpers for issue-triage.

GITHUB_REPO="${GITHUB_REPO:-MickaelV0/roxabi_boilerplate}"
PROJECT_ID="${PROJECT_ID:-PVT_kwHODEqYK84BOId3}"
STATUS_FIELD_ID="${STATUS_FIELD_ID:-PVTSSF_lAHODEqYK84BOId3zg87HNM}"
SIZE_FIELD_ID="${SIZE_FIELD_ID:-PVTSSF_lAHODEqYK84BOId3zg87HYo}"
PRIORITY_FIELD_ID="${PRIORITY_FIELD_ID:-PVTSSF_lAHODEqYK84BOId3zg87HYs}"

declare -A STATUS_OPTIONS=(["BACKLOG"]="df6ee93b" ["ANALYSIS"]="bec91bb0" ["SPECS"]="ad9a9195" ["IN PROGRESS"]="331d27a4" ["INPROGRESS"]="331d27a4" ["IN_PROGRESS"]="331d27a4" ["REVIEW"]="ee30a001" ["DONE"]="bfdc35bd")
declare -A SIZE_OPTIONS=(["XS"]="dfcde6df" ["S"]="4390f522" ["M"]="e2c52fb1" ["L"]="f8ea3803" ["XL"]="228a917d")
declare -A PRIORITY_OPTIONS=(["URGENT"]="ed739db3" ["HIGH"]="742ac87b" ["MEDIUM"]="723e7784" ["LOW"]="796f973f")

LIST_QUERY='
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

# ── Fetch helpers ──

fetch_all_items() {
    local cursor=""
    local all_items="[]"
    while true; do
        local result
        if [[ -z "$cursor" ]]; then
            result=$(gh api graphql -F query="$LIST_QUERY" -f projectId="$PROJECT_ID")
        else
            result=$(gh api graphql -F query="$LIST_QUERY" -f projectId="$PROJECT_ID" -f cursor="$cursor")
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

# ── Node / item ID helpers ──

get_node_id() {
    gh api "repos/$GITHUB_REPO/issues/$1" --jq '.node_id'
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

# ── Project field mutation ──

update_field() {
    gh api graphql -f query='
        mutation($projectId: ID!, $itemId: ID!, $fieldId: ID!, $optionId: String!) {
          updateProjectV2ItemFieldValue(input: {projectId: $projectId, itemId: $itemId, fieldId: $fieldId, value: {singleSelectOptionId: $optionId}}) {
            projectV2Item { id }
          }
        }
    ' -f projectId="$PROJECT_ID" -f itemId="$1" -f fieldId="$2" -f optionId="$3" > /dev/null
}

add_to_project() {
    local node_id="$1"
    gh api graphql \
        -f query='mutation($projectId: ID!, $contentId: ID!) { addProjectV2Item(input: { projectId: $projectId, contentId: $contentId }) { item { id } } }' \
        -f projectId="$PROJECT_ID" -f contentId="$node_id" --jq '.data.addProjectV2Item.item.id'
}

# ── Dependency mutations ──

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

# ── Sub-issue mutations ──

add_sub_issue() {
    local parent_id="$1" child_id="$2"
    gh api graphql \
        -f query='mutation($parentId: ID!, $childId: ID!) { addSubIssue(input: { issueId: $parentId, subIssueId: $childId }) { issue { number } subIssue { number } } }' \
        -f parentId="$parent_id" -f childId="$child_id" > /dev/null
}

remove_sub_issue() {
    local parent_id="$1" child_id="$2"
    gh api graphql \
        -f query='mutation($parentId: ID!, $childId: ID!) { removeSubIssue(input: { issueId: $parentId, subIssueId: $childId }) { issue { number } subIssue { number } } }' \
        -f parentId="$parent_id" -f childId="$child_id" > /dev/null
}
