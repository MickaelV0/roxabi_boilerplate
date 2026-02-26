import { AnimatedSection, Badge } from '@repo/ui'
import { Minimize2 } from 'lucide-react'
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

const BEFORE_CONTENT = `## Step 1 — Parse Input

First, look at the arguments. If an issue number
is provided (like #42), fetch the GitHub issue
using the gh CLI tool to get the title and body.

If the issue does not exist, stop execution and
inform the user that the issue was not found.

If free text is provided instead of an issue
number, search for matching issues using the
gh issue list command with the search parameter.

If a matching issue is found, ask the user if
they want to use it. If not, create a new issue
or proceed without one.`

const AFTER_CONTENT = `## S0 — Parse

#N \u21D2 \`gh issue view N --json title,body\`
\u00AC\u2203 issue \u21D2 halt

Free text \u21D2 \`gh issue list --search "{text}"\`
\u2203 match \u21D2 AskUserQuestion: Use #{N} | Create | Skip`

export function CompressorSection() {
  const symbols = useSymbols()

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

      {/* Compression demo */}
      <AnimatedSection className="mt-10">
        <CompressionDemo
          beforeContent={BEFORE_CONTENT}
          afterContent={AFTER_CONTENT}
          stats={{
            linesBefore: 15,
            linesAfter: 6,
            tokenReduction: '62',
          }}
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
