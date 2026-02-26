---
argument-hint: [--spec <number> | --issue <number>]
description: DEPRECATED — use /dev instead. Triggers: "scaffold from spec" | "implement feature" | "execute spec" | "build from spec".
allowed-tools: Skill
---

# Scaffold (Deprecated)

> **Deprecated.** `/scaffold` has been replaced by atomic step skills. Use `/dev #N` instead.
>
> `/dev` resumes automatically from wherever you left off and delegates to `/plan` then `/implement` in sequence.

## Argument Mapping

| Old command | New command |
|-------------|-------------|
| `/scaffold --spec N` | `/dev #N --from plan` |
| `/scaffold --issue N` | `/dev #N --from plan` |

## Action

Inform the user: "⚠ /scaffold is deprecated. Use /dev #N instead."

Invoke `/dev` with the mapped arguments:

```
skill: "dev"
args: "#<N> --from plan"
```

$ARGUMENTS
