import { AnimatedSection, Badge, cn } from '@repo/ui'
import { Minimize2 } from 'lucide-react'
import { useState } from 'react'
import { CompressionDemo } from '@/components/presentation/dev-process/CompressionDemo'
import { m } from '@/paraglide/messages'

type SymbolEntry = {
  symbol: string
  label: () => string
}

function useSymbols(): ReadonlyArray<SymbolEntry> {
  return [
    { symbol: '\u2200', label: m.talk_dp_compress_symbol_all },
    { symbol: '\u2203', label: m.talk_dp_compress_symbol_exists },
    { symbol: '\u2208', label: m.talk_dp_compress_symbol_member },
    { symbol: '\u2227', label: m.talk_dp_compress_symbol_and },
    { symbol: '\u2228', label: m.talk_dp_compress_symbol_or },
    { symbol: '\u00AC', label: m.talk_dp_compress_symbol_not },
    { symbol: '\u2192', label: m.talk_dp_compress_symbol_then },
    { symbol: '\u27FA', label: m.talk_dp_compress_symbol_iff },
  ]
}

const SIMPLE_BEFORE = `## Step 1 — Parse Input

First, look at the arguments. If an issue number is provided (like #42), fetch the GitHub issue using the gh CLI tool to get the title and body.

If the issue does not exist, stop execution and inform the user that the issue was not found.

If free text is provided instead of an issue number, search for matching issues using the gh issue list command with the search parameter.

If a matching issue is found, ask the user if they want to use it. If not, create a new issue or proceed without one.`

const SIMPLE_AFTER = `## S0 — Parse

#N \u21D2 \`gh issue view N --json title,body\`
\u00AC\u2203 issue \u21D2 halt

Free text \u21D2 \`gh issue list --search "{text}"\`
\u2203 match \u21D2 AskUserQuestion: Use #{N} | Create | Skip`

const COMPLEX_BEFORE = `## Phase 3 — Confidence-Gated Auto-Apply

This phase runs before the one-by-one walkthrough. The auto-applied markers will reflect the outcomes.

First, check if the auto-apply queue is empty. If it is, skip directly to Phase 4.

For every finding in the auto-apply queue that was only flagged by a single agent, we need to spawn a fresh verifier agent from a different domain. If the verifier confirms the finding with confidence above the threshold, it stays in the queue and we mark it as verified by two agents. If the verifier rejects it or lowers confidence below threshold, move it to the one-by-one queue instead.

If there are more than 5 findings in the queue, ask the user whether to auto-apply all of them or review each one individually via the walkthrough.

Then apply each finding sequentially. If a finding succeeds, mark it as applied. If it fails because of a test failure, lint error, timeout, or crash, restore the stash, demote that finding plus all remaining findings to the walkthrough queue, add a note about the failure, and stop the serial apply. Prior successful fixes are not rolled back.

Finally, display a summary of what was applied and what was demoted before continuing to Phase 4.`

const COMPLEX_AFTER = `## P3 — Auto-Apply (C \u2265 T)

Q_auto = \u2205 \u21D2 skip \u2192 P4

\u2200 f \u2208 Q_auto \u2227 |A(f)| = 1:
  spawn verifier(\u00ACsrc(f))
  C(f) \u2265 T \u21D2 stays, |A(f)| := 2
  C(f) < T \u2228 rejects \u21D2 Q_1b1

|Q_auto| > 5 \u21D2 AskUserQuestion:
  Auto-apply all | Review via 1b1

\u2200 f \u2208 Q_auto (sequential):
  \u2713 \u21D2 [applied]
  \u2717 (test|lint|timeout|crash) \u21D2
    stash restore \u2192 f + remaining \u2192 Q_1b1
    \u00AChalt prior fixes

Summary \u2192 P4`

type ExampleKey = 'simple' | 'complex'

const EXAMPLES: Record<
  ExampleKey,
  {
    before: string
    after: string
    stats: { linesBefore: number; linesAfter: number; tokenReduction: string }
  }
> = {
  simple: {
    before: SIMPLE_BEFORE,
    after: SIMPLE_AFTER,
    stats: { linesBefore: 15, linesAfter: 6, tokenReduction: '62' },
  },
  complex: {
    before: COMPLEX_BEFORE,
    after: COMPLEX_AFTER,
    stats: { linesBefore: 30, linesAfter: 14, tokenReduction: '68' },
  },
}

export function CompressorSection() {
  const symbols = useSymbols()
  const [active, setActive] = useState<ExampleKey>('simple')
  const example = EXAMPLES[active]

  return (
    <div className="relative mx-auto max-w-6xl w-full">
      {/* Background glow */}
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute left-1/4 top-1/3 h-[400px] w-[400px] -translate-x-1/2 rounded-full bg-violet-500/5 blur-[100px] dark:bg-violet-500/10" />
      </div>

      {/* Title */}
      <AnimatedSection>
        <div className="flex items-center gap-3 mb-4">
          <div className="rounded-lg bg-primary/10 p-2">
            <Minimize2 className="h-5 w-5 text-primary" />
          </div>
          <h2 className="text-4xl font-bold tracking-tight lg:text-5xl">
            {m.talk_dp_compress_title()}
          </h2>
        </div>
        <p className="mt-4 text-lg text-muted-foreground">{m.talk_dp_compress_subtitle()}</p>
      </AnimatedSection>

      {/* Symbol legend */}
      <AnimatedSection className="mt-10">
        <div className="flex flex-wrap items-center justify-center gap-2">
          {symbols.map((entry) => (
            <Badge key={entry.symbol} variant="secondary" className="gap-1.5 px-3 py-1.5 text-sm">
              <span className="font-mono font-bold">{entry.symbol}</span>
              <span className="text-muted-foreground">{entry.label()}</span>
            </Badge>
          ))}
        </div>
      </AnimatedSection>

      {/* Example toggle + Compression demo */}
      <AnimatedSection className="mt-10">
        <div className="mb-4 flex items-center justify-center gap-1 rounded-lg bg-muted p-1 max-w-xs mx-auto">
          <button
            type="button"
            className={cn(
              'flex-1 rounded-md px-3 py-1.5 text-sm font-medium transition-colors',
              active === 'simple'
                ? 'bg-background text-foreground shadow-sm'
                : 'text-muted-foreground hover:text-foreground'
            )}
            onClick={() => setActive('simple')}
          >
            {m.talk_dp_compress_simple()}
          </button>
          <button
            type="button"
            className={cn(
              'flex-1 rounded-md px-3 py-1.5 text-sm font-medium transition-colors',
              active === 'complex'
                ? 'bg-background text-foreground shadow-sm'
                : 'text-muted-foreground hover:text-foreground'
            )}
            onClick={() => setActive('complex')}
          >
            {m.talk_dp_compress_complex()}
          </button>
        </div>

        <CompressionDemo
          beforeContent={example.before}
          afterContent={example.after}
          stats={example.stats}
        />
      </AnimatedSection>

      {/* Annotation */}
      <AnimatedSection className="mt-8">
        <p className="text-center text-sm text-muted-foreground italic">
          {m.talk_dp_compress_annotation()}
        </p>
      </AnimatedSection>
    </div>
  )
}
