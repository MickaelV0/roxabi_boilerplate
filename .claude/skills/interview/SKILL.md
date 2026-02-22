---
argument-hint: [topic | --promote <path>]
description: Structured interview → brainstorm | analysis | spec (with promotion). Triggers: "create a spec" | "interview" | "brainstorm" | "write analysis" | "promote to spec".
allowed-tools: AskUserQuestion, Write, Read, Edit, Glob
---

# Interview

Conduct a structured interview with the user to produce one of three document types: **Brainstorm**, **Analysis**, or **Spec**. Supports promoting an existing document to the next level.

## Instructions

### Step 0 — Check for `--promote` Flag

If the user passes `--promote <path>`:

1. Read the document at the given path.
2. Determine its current type from frontmatter first, then content structure as fallback:
   - **Primary check:** If it has `type: brainstorm` in frontmatter, treat it as a **Brainstorm** and promote to **Analysis**.
   - **Fallback:** If no `type` frontmatter but lives in `analyses/` with a "Trigger" / "Ideas" structure, treat it as a **Brainstorm**.
   - If it lives in `analyses/` with "Questions Explored" / "Analysis" / "Conclusions" structure, treat it as an **Analysis** and promote to **Spec**.
   - If it is already a Spec, inform the user: "This document is already a spec. Nothing to promote."
3. Skip to **Step 2** (interview), but limit questions to the gaps between the current document and the next level's template. Pre-fill what you already know from the source document.
4. When generating the promoted document, add a link back to the source:
   - In the new document's Context section, add: `**Promoted from:** [source title](relative-path-to-source)`

If no `--promote` flag, continue to Step 1.

### Step 1 — Existing Document Awareness

Before asking the document type, scan for related documents:

```
analyses/   — existing analyses
specs/      — existing specs
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
| **Brainstorm** | Explore ideas, divergent thinking, early-stage exploration | `analyses/{slug}.mdx` |
| **Analysis** | Structured investigation of a topic or problem | `analyses/{slug}.mdx` |
| **Spec** | Technical specification for implementation | `specs/{issue}-{slug}.mdx` |

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

> **Shape Up terminology:** A *shape* is a mutually exclusive architecture approach — each has a name, trade-offs, and rough scope. A *breadboard* maps a shape into connected affordance tables (UI elements → code handlers → data stores). *Slices* break a shape into demo-able vertical increments. These concepts are explored during the interview and formalized in the output templates below.

**Analysis-specific depth (multi-shape exploration):**

When the interview is for an **Analysis** document, Phase 3 should also explore:

- **Architecture shapes:** "What are 2-3 mutually exclusive approaches to solving this?" For each shape, capture: name, description, trade-offs, and rough scope.
- **Constraint alignment:** "Which constraints or requirements would eliminate any of these approaches?"

**Spec-specific depth (ambiguity detection):**

When the interview is for a **Spec** document (or promoting to spec), Phase 3 should also probe for ambiguity using the **9-category taxonomy**:

| Category | Example probe |
|----------|--------------|
| Functional Scope | "What exactly happens when X?" |
| Domain & Data Model | "What entities are involved? What are the relationships?" |
| UX | "What does the user see/do at each step?" |
| Non-Functional | "What are the performance/scale/reliability requirements?" |
| Integrations | "What external systems does this touch?" |
| Edge Cases | "What happens when X fails or is missing?" |
| Constraints | "What technical/time/budget limits apply?" |
| Terminology | "Are there terms that could mean different things to different people?" |
| Completion Signals | "How do we know this is done? What does success look like?" |

For each ambiguity detected, rank by **Impact x Uncertainty** (High/Medium/Low for each). High-Impact + High-Uncertainty items become interview follow-up questions. Ambiguity that impacts implementation can be marked inline as `[NEEDS CLARIFICATION: description]` (max 3-5 per spec). These must be resolved before scaffold execution.

> **Example:** During a Spec interview about user notifications, the probe "What external systems does this touch?" (Integrations) reveals uncertainty about whether to use SendGrid or Resend for email. Scored as High-Impact (core feature) x High-Uncertainty (no prior evaluation) → becomes a follow-up question: "Which email provider should we evaluate?" If unresolved after interview, mark as `[NEEDS CLARIFICATION: email provider selection — SendGrid vs Resend]` in the spec.

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
- For **Spec** documents, prefix the filename with the GitHub issue number: `specs/{issue}-{slug}.mdx`
- For **Analysis** and **Brainstorm** documents: `analyses/{slug}.mdx` (prefix with issue number if one exists, e.g., `analyses/{issue}-{slug}.mdx`).
- Brainstorm documents add `type: brainstorm` to their frontmatter.
- Escape `<` as `&lt;` in MDX content to avoid JSX parsing errors.

---

## Document Templates

### Brainstorm

Output path: `analyses/{slug}.mdx`

```mdx
---
title: "Brainstorm: {Title}"
description: {One-line description of what is being explored}
type: brainstorm
---

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

Output path: `analyses/{slug}.mdx`

```mdx
---
title: "{Title}"
description: {One-line description of the analysis}
---

## Context

{Why this analysis exists — background, motivation, triggering event}

## Questions Explored

{The specific questions this analysis seeks to answer}

## Analysis

{Body of the analysis — findings, comparisons, data, reasoning}

## Shapes

{2-3 mutually exclusive architecture approaches. Skip for Tier S.}

### Shape 1: {Name}

- **Description:** {What this approach does}
- **Trade-offs:** {Pros and cons}
- **Rough scope:** {Estimated effort and files touched}

### Shape 2: {Name}

- **Description:** {What this approach does}
- **Trade-offs:** {Pros and cons}
- **Rough scope:** {Estimated effort and files touched}

## Fit Check

{Binary validation matrix — ✅ meets requirement, ❌ does not. No partial marks — ambiguity belongs in `[NEEDS CLARIFICATION]` markers or Breadboard unknowns, not here.}

| Requirement | Shape 1 | Shape 2 | Shape 3 |
|-------------|---------|---------|---------|
| {Req 1}     | ✅      | ❌      | ✅      |
| {Req 2}     | ✅      | ✅      | ❌      |

**Selected shape:** {Name} — {One-line rationale}

## Conclusions

{Key takeaways and decisions reached}

## Next Steps

- {Concrete action to take}
- {Further investigation if needed}
- {Link to spec if one should be created}
```

### Spec

Output path: `specs/{issue}-{slug}.mdx`

```mdx
---
title: "{Title}"
description: {One-line description of the feature or project}
---

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

## Breadboard

{Map the selected shape into connected affordance tables. Skip for Tier S.}

### UI Affordances

| ID | Element | Location | Trigger |
|----|---------|----------|---------|
| U1 | {Button, form, display...} | {Page/component} | {User action} |

### Code Affordances

| ID | Handler | Wiring | Logic |
|----|---------|--------|-------|
| N1 | {Function/endpoint} | U1 → N1 → S1 | {What it does} |

### Data Stores

| ID | Store | Type | Accessed by |
|----|-------|------|-------------|
| S1 | {Table, cache, API...} | {Persistent/transient/external} | N1, N2 |

{Unknowns: Mark any uncertain wiring with ⚠️ — these trigger investigation spikes at Gate 1.5.}

## Slices

{Break the selected shape into demo-able vertical increments. Each slice is a working subset. Skip for Tier S.}

| Slice | Description | Affordances | Demo |
|-------|-------------|-------------|------|
| V1 | {Minimal working version} | U1, N1, S1 | {What can be demonstrated} |
| V2 | {Next increment} | U2, N2, S1 | {What can be demonstrated} |

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

> **Inline ambiguity markers:** `[NEEDS CLARIFICATION: description]` markers indicate unresolved ambiguity (max 3-5 per spec). These must be resolved before `/scaffold` execution.

## Open Questions

{Unresolved points to clarify before or during implementation}
```

$ARGUMENTS
