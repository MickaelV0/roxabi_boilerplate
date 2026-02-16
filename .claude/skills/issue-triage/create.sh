#!/usr/bin/env bash
# Create a new GitHub issue with optional project fields, parent, children, and dependencies.

create_issue() {
    local title="" body="" labels="" size="" priority="" status="" parent="" blocked_by="" blocks="" add_child=""
    while [[ $# -gt 0 ]]; do
        case $1 in
            --title) title="$2"; shift 2 ;;
            --body) body="$2"; shift 2 ;;
            --label) labels="$2"; shift 2 ;;
            --size) size="${2^^}"; shift 2 ;;
            --priority) priority="${2^^}"; shift 2 ;;
            --status) status="${2^^}"; shift 2 ;;
            --parent) parent="$2"; shift 2 ;;
            --blocked-by) blocked_by="$2"; shift 2 ;;
            --blocks) blocks="$2"; shift 2 ;;
            --add-child) add_child="$2"; shift 2 ;;
            *) echo "Error: Unknown option '$1'" >&2; exit 1 ;;
        esac
    done

    [[ -z "$title" ]] && { echo "Error: --title is required" >&2; exit 1; }

    # Build gh issue create command
    local create_args=("--title" "$title")
    [[ -n "$body" ]] && create_args+=("--body" "$body")
    if [[ -n "$labels" ]]; then
        IFS=',' read -ra LABEL_ARRAY <<< "$labels"
        for lbl in "${LABEL_ARRAY[@]}"; do
            create_args+=("--label" "${lbl## }")
        done
    fi

    # Create the issue
    local issue_url
    issue_url=$(gh issue create "${create_args[@]}" --json url --jq '.url' 2>/dev/null) || \
    issue_url=$(gh issue create "${create_args[@]}")
    local issue_number
    issue_number=$(echo "$issue_url" | grep -oE '[0-9]+$')
    echo "Created #$issue_number: $title"

    # Add to project board (non-fatal — parent/child and dependencies must still run)
    local node_id item_id=""
    node_id=$(get_node_id "$issue_number")
    if item_id=$(add_to_project "$node_id" 2>&1); then
        echo "Added #$issue_number to project"
    else
        echo "Warning: Failed to add #$issue_number to project board — skipping project field updates" >&2
        item_id=""
    fi

    # Set project fields (require a valid item_id from add_to_project)
    if [[ -n "$item_id" ]]; then
        if [[ -n "$status" ]]; then
            [[ -z "${STATUS_OPTIONS[$status]:-}" ]] && { echo "Error: Invalid status" >&2; exit 1; }
            update_field "$item_id" "$STATUS_FIELD_ID" "${STATUS_OPTIONS[$status]}"
            echo "Status=$status #$issue_number"
        fi
        if [[ -n "$size" ]]; then
            [[ -z "${SIZE_OPTIONS[$size]:-}" ]] && { echo "Error: Invalid size" >&2; exit 1; }
            update_field "$item_id" "$SIZE_FIELD_ID" "${SIZE_OPTIONS[$size]}"
            echo "Size=$size #$issue_number"
        fi
        if [[ -n "$priority" ]]; then
            [[ -z "${PRIORITY_OPTIONS[$priority]:-}" ]] && { echo "Error: Invalid priority" >&2; exit 1; }
            update_field "$item_id" "$PRIORITY_FIELD_ID" "${PRIORITY_OPTIONS[$priority]}"
            echo "Priority=$priority #$issue_number"
        fi
    else
        if [[ -n "$status" || -n "$size" || -n "$priority" ]]; then
            echo "Warning: Skipped project field updates (status/size/priority) — issue not on project board" >&2
        fi
    fi

    # Set parent (make this issue a child of --parent)
    if [[ -n "$parent" ]]; then
        parent="${parent#\#}"
        local parent_node_id
        parent_node_id=$(get_node_id "$parent")
        add_sub_issue "$parent_node_id" "$node_id"
        echo "Parent=#$parent #$issue_number"
    fi

    # Add children
    if [[ -n "$add_child" ]]; then
        IFS=',' read -ra CHILDREN <<< "$add_child"
        for child in "${CHILDREN[@]}"; do
            child="${child// /}"
            child="${child#\#}"
            local child_node_id
            child_node_id=$(get_node_id "$child")
            add_sub_issue "$node_id" "$child_node_id"
            echo "Child=#$child #$issue_number"
        done
    fi

    # Set dependencies
    if [[ -n "$blocked_by" ]]; then
        IFS=',' read -ra DEPS <<< "$blocked_by"
        for dep in "${DEPS[@]}"; do
            dep="${dep// /}"
            dep="${dep#\#}"
            local blocking_node_id
            blocking_node_id=$(get_node_id "$dep")
            add_blocked_by "$node_id" "$blocking_node_id"
            echo "BlockedBy=#$dep #$issue_number"
        done
    fi
    if [[ -n "$blocks" ]]; then
        IFS=',' read -ra DEPS <<< "$blocks"
        for dep in "${DEPS[@]}"; do
            dep="${dep// /}"
            dep="${dep#\#}"
            local blocked_node_id
            blocked_node_id=$(get_node_id "$dep")
            add_blocked_by "$blocked_node_id" "$node_id"
            echo "Blocks=#$dep #$issue_number"
        done
    fi
}
