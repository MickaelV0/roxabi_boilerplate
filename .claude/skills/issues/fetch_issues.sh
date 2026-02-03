#!/usr/bin/env bash
# Fetch open GitHub issues from project with Status, Size, Priority, and dependencies.
# Optimized: Single GraphQL query (no N+1 for dependencies).
#
# Usage: ./fetch_issues.sh [--priority|--size] [--json] [--title-length=N]
# API calls: 1 (single GraphQL query)

set -euo pipefail

PROJECT_ID="${PROJECT_ID:-PVT_kwHODEqYK84BOId3}"
REPO="${GITHUB_REPO:-MickaelV0/roxabi_boilerplate}"

SORT_BY="priority"
JSON_OUTPUT=false
TITLE_LENGTH=55

while [[ $# -gt 0 ]]; do
    case $1 in
        --priority) SORT_BY="priority"; shift ;;
        --size) SORT_BY="size"; shift ;;
        --json) JSON_OUTPUT=true; shift ;;
        --title-length=*) TITLE_LENGTH="${1#*=}"; shift ;;
        *) shift ;;
    esac
done

# Single GraphQL query: project items + dependencies (trackedInIssues/trackedIssues)
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
              subIssues(first: 20) { nodes { number state title } }
              parent { number state }
              trackedInIssues(first: 20) { nodes { number state } }
              trackedIssues(first: 20) { nodes { number state } }
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

if $JSON_OUTPUT; then
    echo "$PROJECT_DATA" | jq '
        .data.node.items.nodes
        | map(select(.content.state == "OPEN"))
        | map({
            number: .content.number,
            title: .content.title,
            status: ([.fieldValues.nodes[] | select(.field.name == "Status") | .name] | first // "-"),
            size: ([.fieldValues.nodes[] | select(.field.name == "Size") | .name] | first // "-"),
            priority: ([.fieldValues.nodes[] | select(.field.name == "Priority") | .name] | first // "-"),
            blocked_by: [.content.trackedIssues.nodes[] | {number, state}],
            blocked_by_open: [.content.trackedIssues.nodes[] | select(.state == "OPEN") | .number],
            blocked_by_closed: [.content.trackedIssues.nodes[] | select(.state == "CLOSED") | .number],
            blocks: [.content.trackedInIssues.nodes[] | {number, state}],
            sub_issues: (.content.subIssues.nodes // []),
            parent_issue: .content.parent
        })
    '
else
    echo "$PROJECT_DATA" | jq -r --arg sort "$SORT_BY" --argjson titleLen "$TITLE_LENGTH" '
        def size_order: {"XS": 1, "S": 2, "M": 3, "L": 4, "XL": 5, "-": 99};
        def priority_order: {"P0 - Urgent": 0, "P1 - High": 1, "P2 - Medium": 2, "P3 - Low": 3, "-": 99};
        def priority_short: {"P0 - Urgent": "P0", "P1 - High": "P1", "P2 - Medium": "P2", "P3 - Low": "P3"};

        def pad($s; $w): ($s + (" " * 100))[:$w];

        # Block status: ⛔ blocked, 🔓 blocking others, ✅ ready
        def block_status:
            ([.content.trackedIssues.nodes[] | select(.state == "OPEN")] | length) as $blocked_count |
            ([.content.trackedInIssues.nodes[]] | length) as $blocking_count |
            if $blocked_count > 0 then "⛔"
            elif $blocking_count > 0 then "🔓"
            else "✅" end;

        def format_deps:
            (.content.trackedIssues.nodes // []) as $bb |
            (.content.trackedInIssues.nodes // []) as $bl |
            ($bb | map(if .state == "OPEN" then "⛔#\(.number)" else "✅#\(.number)" end)) as $bb_fmt |
            ($bl | map("🔓#\(.number)")) as $bl_fmt |
            ([$bb_fmt[], $bl_fmt[]]) as $all |
            if ($all | length) > 0 then ($all | join(" ")) else "-" end;

        # Child title length
        def childTitleLen: ($titleLen - 12) | if . < 20 then 20 else . end;

        def format_row($byNum):
            . as $item |
            ([.fieldValues.nodes[] | select(.field.name == "Status") | .name] | first // "-") as $status |
            ([.fieldValues.nodes[] | select(.field.name == "Size") | .name] | first // "-") as $size |
            ([.fieldValues.nodes[] | select(.field.name == "Priority") | .name] | first // "-") as $priority |
            .content.number as $num |
            (.content.title | if length > $titleLen then .[:$titleLen - 3] + "..." else . end) as $title |
            (.content.subIssues.nodes // []) as $subs |

            # Parent row (with indent)
            "  \(pad("#\($num)"; 5))│ \(pad($title; $titleLen + 2))│ \(pad($status; 11))│ \(pad($size; 5))│ \(pad($priority | priority_short[.] // .; 4))│ \(block_status) │ \(format_deps)",

            # Children rows (cyan colored, with their own stats)
            if ($subs | length) > 0 then
                ($subs | length) as $subCount |
                $subs | to_entries[] |
                (if .key == ($subCount - 1) then "└ " else "├ " end) as $prefix |
                .value as $sub |
                ($byNum[$sub.number | tostring]) as $child |
                if $child then
                    ($child | block_status) as $cBlock |
                    ([$child.fieldValues.nodes[] | select(.field.name == "Status") | .name] | first // "-") as $cStatus |
                    ([$child.fieldValues.nodes[] | select(.field.name == "Size") | .name] | first // "-") as $cSize |
                    (([$child.fieldValues.nodes[] | select(.field.name == "Priority") | .name] | first // "-") | priority_short[.] // .) as $cPri |
                    # Calculate prefix length: "   " + "├ " + "#NN " = 3 + 2 + 1 + digits + 1 = 7 + digits
                    (($sub.number | tostring | length) + 7) as $prefixLen |
                    # Child title width = parent content width (1 space + titleLen + 2) - prefix length
                    (($titleLen + 3) - $prefixLen) as $cTitleWidth |
                    ($child.content.title | if length > ($cTitleWidth - 4) then .[:$cTitleWidth - 4] + "... " else . end) as $cTitle |
                    ($child | format_deps) as $cDeps |
                    "       │   \($prefix)#\($sub.number) \(pad($cTitle; $cTitleWidth))│ \(pad($cStatus; 11))│ \(pad($cSize; 5))│ \(pad($cPri; 4))│ \($cBlock) │ \($cDeps)"
                else
                    "       │   \($prefix)#\($sub.number) \($sub.title // "?")"
                end
            else empty end;

        .data.node.items.nodes
        | map(select(.content.state == "OPEN")) as $all |

        ($all | map({key: (.content.number | tostring), value: .}) | from_entries) as $byNum |

        # Only show root issues (no parent), children are shown inline
        [$all[] | select(.content.parent == null)]
        | sort_by([
            (priority_order[([.fieldValues.nodes[] | select(.field.name == "Priority") | .name] | first // "-")] // 99),
            (size_order[([.fieldValues.nodes[] | select(.field.name == "Size") | .name] | first // "-")] // 99)
        ]) as $roots |

        # Short name for chain display
        def short_name:
            gsub("^(feat|chore|docs|fix|refactor)\\(.*?\\):\\s*"; "") |
            gsub("^Feature:\\s*"; "") |
            gsub("^LATER:\\s*"; "") |
            gsub("\\s*\\(.*?\\)$"; "") |
            if length > 20 then .[:17] + "..." else . end;

        # Build dependency chains visualization - simplified
        def build_chains($all; $byNum):
            # Map number -> {title, blocks: [numbers]}
            ($all | map({
                key: (.content.number | tostring),
                value: {
                    num: .content.number,
                    title: .content.title,
                    blocks: [.content.trackedInIssues.nodes[] | select(.state == "OPEN") | .number] | sort
                }
            }) | from_entries) as $graph |

            # Issues that block others
            [$graph | to_entries[] | select(.value.blocks | length > 0) | .value.num] | sort as $blockers |

            # Format each blocker with its targets
            [
                $blockers[] |
                . as $num |
                ($graph[$num | tostring]) as $node |
                ($node.blocks | length) as $count |
                if $count == 1 then
                    # Single target: simple arrow
                    ($node.blocks[0]) as $t |
                    "  #\($num) \($node.title | short_name) ──► #\($t) \($graph[$t | tostring].title | short_name)"
                else
                    # Multiple targets: first on same line, rest as branches
                    ($node.blocks[0]) as $first |
                    "  #\($num) \($node.title | short_name) ──► #\($first) \($graph[$first | tostring].title | short_name)",
                    ($node.blocks[1:][] |
                        . as $t |
                        "                               └──► #\($t) \($graph[$t | tostring].title | short_name)"
                    )
                end
            ];

        # Header
        "● \($roots | length) issues",
        "",
        # Table header
        "  \(pad("#"; 5))│ \(pad("Title"; $titleLen + 2))│ \(pad("Status"; 11))│ \(pad("Size"; 5))│ \(pad("Pri"; 4))│ ⚡ │ Deps",
        # Table rows
        ($roots[] | format_row($byNum)),
        "",
        # Legend
        "  ⛔=blocked  🔓=blocking  ✅=ready",
        "",
        # Dependency chains
        (build_chains($all; $byNum) as $chains | if ($chains | length) > 0 then "  Chaînes:", ($chains[]) else empty end)
    '
fi
