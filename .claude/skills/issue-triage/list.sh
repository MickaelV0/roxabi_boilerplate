#!/usr/bin/env bash
# List untriaged issues (missing Size or Priority).

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
