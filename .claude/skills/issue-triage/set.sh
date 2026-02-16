#!/usr/bin/env bash
# Update an existing issue: project fields, dependencies, and parent/child relations.

set_issue() {
    local issue_number="" size="" priority="" status="" blocked_by="" blocks="" rm_blocked_by="" rm_blocks=""
    local parent="" add_child="" rm_parent=false rm_child=""
    while [[ $# -gt 0 ]]; do
        case $1 in
            --size) size="${2^^}"; shift 2 ;;
            --priority) priority="${2^^}"; shift 2 ;;
            --status) status="${2^^}"; shift 2 ;;
            --blocked-by) blocked_by="$2"; shift 2 ;;
            --blocks) blocks="$2"; shift 2 ;;
            --rm-blocked-by) rm_blocked_by="$2"; shift 2 ;;
            --rm-blocks) rm_blocks="$2"; shift 2 ;;
            --parent) parent="$2"; shift 2 ;;
            --add-child) add_child="$2"; shift 2 ;;
            --rm-parent) rm_parent=true; shift ;;
            --rm-child) rm_child="$2"; shift 2 ;;
            *) issue_number="$1"; shift ;;
        esac
    done

    [[ -z "$issue_number" ]] && { echo "Error: Issue number required" >&2; exit 1; }
    [[ -z "$size" && -z "$priority" && -z "$status" && -z "$blocked_by" && -z "$blocks" && -z "$rm_blocked_by" && -z "$rm_blocks" && -z "$parent" && -z "$add_child" && "$rm_parent" == false && -z "$rm_child" ]] && { echo "Error: Specify --size, --priority, --status, --blocked-by, --blocks, --rm-blocked-by, --rm-blocks, --parent, --add-child, --rm-parent, and/or --rm-child" >&2; exit 1; }

    # Project field updates need item_id (non-fatal — dependency and parent/child ops must still run)
    if [[ -n "$size" || -n "$priority" || -n "$status" ]]; then
        local item_id=""
        if item_id=$(get_item_id "$issue_number" 2>&1) && [[ -n "$item_id" ]]; then
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
        else
            echo "Warning: Issue #$issue_number not found in project — skipping project field updates (status/size/priority)" >&2
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

    # Parent/child relationship management
    if [[ -n "$parent" ]]; then
        parent="${parent#\#}"
        local issue_node_id parent_node_id
        issue_node_id=$(get_node_id "$issue_number")
        parent_node_id=$(get_node_id "$parent")
        add_sub_issue "$parent_node_id" "$issue_node_id"
        echo "Parent=#$parent #$issue_number"
    fi

    if [[ -n "$add_child" ]]; then
        local issue_node_id
        issue_node_id=$(get_node_id "$issue_number")
        IFS=',' read -ra CHILDREN <<< "$add_child"
        for child in "${CHILDREN[@]}"; do
            child="${child// /}"
            child="${child#\#}"
            local child_node_id
            child_node_id=$(get_node_id "$child")
            add_sub_issue "$issue_node_id" "$child_node_id"
            echo "Child=#$child #$issue_number"
        done
    fi

    if [[ "$rm_parent" == true ]]; then
        local owner repo
        owner="${GITHUB_REPO%%/*}"
        repo="${GITHUB_REPO##*/}"
        local parent_num
        parent_num=$(gh api graphql \
            -f query='query($owner: String!, $repo: String!, $number: Int!) {
                repository(owner: $owner, name: $repo) { issue(number: $number) { parent { number } } }
            }' \
            -f owner="$owner" -f repo="$repo" -F number="$issue_number" \
            --jq '.data.repository.issue.parent.number // empty')
        if [[ -n "$parent_num" ]]; then
            local issue_node_id parent_node_id
            issue_node_id=$(get_node_id "$issue_number")
            parent_node_id=$(get_node_id "$parent_num")
            remove_sub_issue "$parent_node_id" "$issue_node_id"
            echo "RemovedParent=#$parent_num #$issue_number"
        else
            echo "No parent found for #$issue_number"
        fi
    fi

    if [[ -n "$rm_child" ]]; then
        local issue_node_id
        issue_node_id=$(get_node_id "$issue_number")
        IFS=',' read -ra CHILDREN <<< "$rm_child"
        for child in "${CHILDREN[@]}"; do
            child="${child// /}"
            child="${child#\#}"
            local child_node_id
            child_node_id=$(get_node_id "$child")
            remove_sub_issue "$issue_node_id" "$child_node_id"
            echo "RemovedChild=#$child #$issue_number"
        done
    fi
}
