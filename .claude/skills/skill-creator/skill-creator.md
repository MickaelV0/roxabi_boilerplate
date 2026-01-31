# Skill: Create New Skill

Create a new Claude Code skill with the standard structure.

## Usage

```
/skill-creator {name} {description}
```

## Process

1. Create skill directory: `.claude/skills/{name}/`
2. Create main skill file: `{name}.md`
3. Add to skill registry if applicable

## Skill Template

```markdown
# Skill: {Name}

{Description}

## Usage

\`\`\`
/{name} [arguments]
\`\`\`

## Process

1. Step one
2. Step two
3. Step three

## Example

\`\`\`
/{name} example-argument
\`\`\`
```

## Directory Structure

```
.claude/skills/{name}/
├── {name}.md          # Main skill file
├── README.md          # Optional documentation
└── templates/         # Optional templates
```
