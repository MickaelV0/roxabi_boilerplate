---
argument-hint: [file path | agent name | skill name]
description: Compress agent/skill definitions using math/logic notation. Triggers: "compress" | "compress skill" | "compress agent" | "shorten this" | "make it formal".
allowed-tools: Read, Write, Edit, Glob, Grep, AskUserQuestion
---

# Compress

Formal notation rewrite → reduce tokens, preserve semantics.

```
/compress review    → .claude/skills/review/SKILL.md
/compress fixer     → .claude/agents/fixer.md
/compress file.md   → direct path
```

## Symbols

`∀` all ("for each", "every") | `∃`/`∄` exists ("if X exists", "if no X") | `∈`/`∉` member ("belongs to", "is one of") | `∧`/`∨` and/or | `¬` not ("never", "do not", "without") | `→` then ("if X then Y", "when X") | `⟺` iff ("exactly when") | `∅` empty ("no results") | `∩`/`∪` intersect/union ("overlap", "combined") | `⊂` subset ("part of") | `∥` parallel ("concurrently") | `|X|` count ("number of") | `:=`/`←` assign ("becomes", "is set to") | `{ }` scoped block ("process", "procedure", "workflow") | `;` sequence within block ("then", "next step") | `()` params ("with", "using", "given") | `↦` maps to ("produces", "yields", "transforms into")

## Phases

**1 — Resolve:** Parse `$ARGUMENTS`: `*.md` → direct | agent name → `.claude/agents/<name>.md` | skill name → `.claude/skills/<name>/SKILL.md` | ∅ → AskUserQuestion. file ∃ → read. ∄ → halt.

**2 — Analyze:** Read target. Identify: repeated nouns (≥3×) | verbose conditionals | iteration prose | magic numbers | redundant examples | filler. L_before := line count (excl. frontmatter).

**3 — Transform (R1–R10):**
- **R1** Definitions: concept ≥ 3× → Greek letter variable in `Let:` block (after title). Convention: lowercase Greek (α, β, γ, δ, σ, ρ, τ, φ, ψ, ω…) — mnemonic when possible (e.g. α = analysis, σ = spec). Template:
  ```
  Let:
    φ := set of all findings
    γ(f) ∈ [0,100] ∩ ℤ  — confidence
    τ := 80               — threshold
  ```
- **R2** Predicates: multi-bullet conditions → `pred(x) ⟺ A ∧ B ∧ C`
- **R3** Quantifiers: "for each" → `∀ x ∈ Y:` | "if any" → `∃ x:` | "exists" → `X ∃ →`
- **R4** Implications: "if X then Y" → `X → Y`
- **R5** Terse imperative: multi-sentence → single line + symbols
- **R6** Tables + lists: keep structure, compress text, ¬drop items
- **R7** Prune examples: keep only when notation ambiguous
- **R8** Constants: literal ≥ 2× → named constant
- **R9** Process encapsulation: multi-step procedure/workflow → `O_name { step₁; step₂; … } → output`. Named operator wraps sequential steps in scoped block. E.g. "First analyze the code, then identify issues, then rank by severity, finally recommend fixes" → `O_review { Analyze(code); φ ← Identify(issues); Rank(φ, severity) → Reco_fixes }`
- **R10** Parameterized patterns: repeated pattern with varying inputs → functional form `F(x, y)`. E.g. "validate the input against the schema" + "validate the output against the schema" → `Validate(target, σ)` where target ∈ {input, output}

**¬compress:** frontmatter | code blocks | `$ARGUMENTS` | file paths | tool names | safety rules | table structure

**4 — Present:** Show `L_before → L_after (N%)` + substitutions. AskUserQuestion: "Yes" / "Preview" / "Adjust". Preview → show, re-ask. Adjust → apply, re-present.

**5 — Write:** Write file. Verify: frontmatter ∧ `$ARGUMENTS` ∧ safety rules ∧ ¬semantic loss. Report L + %.

## Edge Cases

| Scenario | Behavior |
|----------|----------|
| Already formal | "already compressed", tweaks only |
| L < 30 | Warn, proceed if confirmed |
| Agent (¬skill) | Preserve agent frontmatter |
| No repeated concepts | Skip R1, apply R2–R10 |
| User rejects | Halt |
| Mixed prose + code | Prose only |

## Safety

1. ¬semantic loss — every condition, rule, edge case survives
2. ¬modify frontmatter
3. ¬delete safety rules
4. ¬auto-write — preview first
5. Preserve `$ARGUMENTS` for skills
6. ¬drop items from enumerations — compress wording only

$ARGUMENTS
