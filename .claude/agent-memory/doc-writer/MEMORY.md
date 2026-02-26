# Doc Writer Memory

## Skill SKILL.md Notation Conventions

See `patterns.md` for full detail on compressed notation used in `.claude/skills/*/SKILL.md` files.

Key points:
- Use `Let:` block for variable definitions at top
- Use `∃`, `¬`, `⇒`, `∀`, `∧`, `∨`, `∅` for logical operators
- End every SKILL.md with `$ARGUMENTS` on last line
- YAML frontmatter: `name`, `argument-hint`, `description`, `allowed-tools`
- Steps numbered as `## Step N — Name`
- AskUserQuestion options in **bold**
