---
argument-hint: [topic or instructions]
description: In-depth interview to create a spec or detailed analysis
allowed-tools: AskUserQuestion, Write, Read, Glob
---

# Interview

Conduct an in-depth interview with the user to create a detailed document (spec or analysis).

## Instructions

1. **Start by asking the document type** via AskUserQuestion:
   - **Spec**: Technical specification for a project/feature to implement
   - **Analysis**: In-depth analysis of a topic, concept, or problem

2. **Conduct in-depth interview** with AskUserQuestion:
   - Ask NON-obvious and probing questions
   - Cover all aspects: technical, UX, constraints, trade-offs, edge cases
   - Continue asking questions until you have a complete picture
   - Group 2-4 questions per call for efficiency
   - Don't ask questions with obvious answers

3. **Questions by type**:

   For a **Spec**:
   - Goal and problem being solved
   - Target users and use cases
   - Expected behavior (happy path + edge cases)
   - Technical constraints and dependencies
   - Integration points with existing systems
   - Acceptable trade-offs
   - Success criteria

   For an **Analysis**:
   - Context and why this topic
   - What you already know vs what you want to explore
   - Specific questions to resolve
   - Constraints or biases to consider
   - Desired output format
   - Planned next steps

4. **Generate the document** once the interview is complete:
   - Spec: `docs/spec/{slug}.md`
   - Analysis: `knowledge/analyses/{slug}.md`
   - Use a slug based on the topic (kebab-case)

## Document Format

### For a Spec

```markdown
# {Title}

## Context
{Why this project/feature}

## Goal
{What it should accomplish}

## Users & Use Cases
{Who and how}

## Expected Behavior
### Happy path
{Main flow}

### Edge cases
{Edge cases and behavior}

## Constraints
- {Technical constraints}
- {Time/resource constraints}

## Non-goals
{What is explicitly out of scope}

## Technical Decisions
{Choices to make and trade-offs}

## Success Criteria
- [ ] {Measurable criterion}

## Open Questions
{Points to clarify later}
```

### For an Analysis

```markdown
# {Title}

## Context
{Why this analysis}

## Questions Explored
{Main questions}

## Analysis
{Body of the analysis}

## Conclusions
{Key points}

## Next Steps
- {Action to take}
```

$ARGUMENTS
