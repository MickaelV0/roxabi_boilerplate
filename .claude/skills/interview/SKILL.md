---
argument-hint: [topic | --promote <path>]
description: Structured interview to create a brainstorm, analysis, or spec — with promotion between levels.
allowed-tools: AskUserQuestion, Write, Read, Glob
---

# Interview

Conduct a structured interview with the user to produce one of three document types: **Brainstorm**, **Analysis**, or **Spec**. Supports promoting an existing document to the next level.

## Instructions

### Step 0 — Check for `--promote` Flag

If the user passes `--promote <path>`:

1. Read the document at the given path.
2. Determine its current type from content and frontmatter:
   - If it has `type: brainstorm` in frontmatter or lives in `docs/analyses/` with a "Trigger" / "Ideas" structure, treat it as a **Brainstorm** and promote to **Analysis**.
   - If it lives in `docs/analyses/` with "Questions Explored" / "Analysis" / "Conclusions" structure, treat it as an **Analysis** and promote to **Spec**.
   - If it is already a Spec, inform the user: "This document is already a spec. Nothing to promote."
3. Skip to **Step 2** (interview), but limit questions to the gaps between the current document and the next level's template. Pre-fill what you already know from the source document.
4. When generating the promoted document, add a link back to the source:
   - In the new document's Context section, add: `**Promoted from:** [source title](relative-path-to-source)`

If no `--promote` flag, continue to Step 1.

### Step 1 — Existing Document Awareness

Before asking the document type, scan for related documents:

```
docs/analyses/   — existing analyses
docs/specs/      — existing specs
```

Use **Glob** to search for files matching the topic (by issue number, keywords, or slug). Also check if the user's arguments mention a GitHub issue number.

**If related documents are found**, use AskUserQuestion to ask:

> "I found existing documents related to this topic:
> - {list of documents with paths}
>
> How would you like to proceed?"

Options:
- **Build on existing** — Use the existing document as context and extend it
- **Promote to next level** — Promote an analysis to spec (or brainstorm to analysis)
- **Start fresh** — Ignore existing documents and begin a new interview

If no related documents are found, proceed directly to asking the document type.

### Step 2 — Determine Document Type

Use **AskUserQuestion** to ask the user which document type to create:

| Type | Purpose | Output Path |
|------|---------|-------------|
| **Brainstorm** | Explore ideas, divergent thinking, early-stage exploration | `docs/analyses/{slug}.mdx` |
| **Analysis** | Structured investigation of a topic or problem | `docs/analyses/{slug}.mdx` |
| **Spec** | Technical specification for implementation | `docs/specs/{issue}-{slug}.mdx` |

If promoting, this step is already determined — skip it.

### Step 3 — Structured Interview

Conduct the interview using **AskUserQuestion**. Follow the four-phase framework below. Group 2-4 questions per call for efficiency. **Skip questions whose answers are obvious from context, arguments, or an existing source document.**

#### Phase 1 — Context (1-2 questions)

- What triggered this? What is the problem or opportunity?
- What exists today? What has been tried?

#### Phase 2 — Scope (2-3 questions)

- Who are the users? What are their workflows?
- What is explicitly out of scope?
- What are the constraints (technical, time, dependencies)?

#### Phase 3 — Depth (2-4 questions, adapt to topic)

- What are the edge cases and failure modes?
- What are the trade-offs being considered?
- How does this integrate with existing systems?
- What does success look like?

**Adapt depth by document type:**

- **Brainstorm**: Focus on Phase 1 and divergent exploration. Ask "What else?" and "What if?" questions. Depth can be lighter.
- **Analysis**: Cover Phases 1-3 thoroughly. Probe for structure and conclusions.
- **Spec**: Cover all four phases. Be rigorous about edge cases, constraints, and success criteria.

#### Phase 4 — Validation (1 question, always last)

Present a structured summary of your understanding and ask for corrections before generating:

> "Here is my understanding before I generate the document:
> - **Type**: {type}
> - **Title**: {proposed title}
> - **Key points**: {bulleted summary}
>
> Anything to correct or add?"

### Step 4 — Generate the Document

Write the document using the appropriate template below. Follow these rules:

- Use `.mdx` extension with YAML frontmatter (`title`, `description`).
- Use kebab-case slugs.
- For **Spec** documents, prefix the filename with the GitHub issue number: `docs/specs/{issue}-{slug}.mdx`
- For **Analysis** and **Brainstorm** documents: `docs/analyses/{slug}.mdx` (prefix with issue number if one exists, e.g., `docs/analyses/{issue}-{slug}.mdx`).
- Brainstorm documents add `type: brainstorm` to their frontmatter.
- Escape `<` as `&lt;` in MDX content to avoid JSX parsing errors.
- After writing, remind the user to add the filename (without extension) to the corresponding `meta.json` in `docs/analyses/` or `docs/specs/`.

---

## Document Templates

### Brainstorm

Output path: `docs/analyses/{slug}.mdx`

```mdx
---
title: "Brainstorm: {Title}"
description: {One-line description of what is being explored}
type: brainstorm
---

# Brainstorm: {Title}

## Trigger

{What started this exploration — the problem, opportunity, or question}

## Ideas

- **{Idea 1}**: {Description}
  - Upside: {What makes this attractive}
  - Downside: {Risks or drawbacks}

- **{Idea 2}**: {Description}
  - Upside: {What makes this attractive}
  - Downside: {Risks or drawbacks}

- **{Idea 3}**: {Description}
  - Upside: {What makes this attractive}
  - Downside: {Risks or drawbacks}

## What's next?

{Free-form text: which ideas to pursue, what needs more research, suggested next steps — analysis, prototype, spec, etc.}
```

### Analysis

Output path: `docs/analyses/{slug}.mdx`

```mdx
---
title: "{Title}"
description: {One-line description of the analysis}
---

# {Title}

## Context

{Why this analysis exists — background, motivation, triggering event}

## Questions Explored

{The specific questions this analysis seeks to answer}

## Analysis

{Body of the analysis — findings, comparisons, data, reasoning}

## Conclusions

{Key takeaways and decisions reached}

## Next Steps

- {Concrete action to take}
- {Further investigation if needed}
- {Link to spec if one should be created}
```

### Spec

Output path: `docs/specs/{issue}-{slug}.mdx`

```mdx
---
title: "{Title}"
description: {One-line description of the feature or project}
---

# #{issue} — {Title}

## Context

{Why this feature/project exists — background, dependencies, what it unblocks}

## Goal

{What this should accomplish — the desired outcome}

## Users & Use Cases

{Who uses this and how — roles, workflows, scenarios}

## Expected Behavior

### Happy path

{Main flow — step by step}

### Edge cases

{Edge cases and how they should be handled}

## Constraints

- {Technical constraints}
- {Time or resource constraints}
- {Dependencies on other systems or issues}

## Non-goals

{What is explicitly out of scope for this spec}

## Technical Decisions

{Key architectural choices, trade-offs, and rationale}

## Success Criteria

- [ ] {Measurable criterion}
- [ ] {Measurable criterion}

## Open Questions

{Unresolved points to clarify before or during implementation}
```

$ARGUMENTS
