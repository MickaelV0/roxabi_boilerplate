---
name: bootstrap
argument-hint: '["idea" | --issue <N> | --spec <N>]'
description: DEPRECATED — alias for /dev. Triggers: "bootstrap" | "plan feature" | "start feature" | "I have an idea" | "spec from issue".
allowed-tools: Bash, AskUserQuestion, Read, Write, Edit, Glob, Grep, Task
---

# Bootstrap (Deprecated)

> **Deprecated.** `/bootstrap` has been replaced by the atomic `/dev` orchestrator.
> Use `/dev #N` or `/dev "idea"` instead.

## Redirect

Map old args to `/dev` and invoke:

| Old command | Equivalent |
|-------------|-----------|
| `/bootstrap "idea"` | `skill: "dev", args: "idea"` |
| `/bootstrap --issue N` | `skill: "dev", args: "#N"` |
| `/bootstrap --spec N` | `skill: "dev", args: "#N --from spec"` |

Inform the user: "⚠ /bootstrap is deprecated. Use /dev #N instead."

Then invoke `/dev` with the mapped arguments.

$ARGUMENTS
