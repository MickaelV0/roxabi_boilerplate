export type PhaseColor = {
  color: string
  bgColor: string
  borderColor: string
  dotColor: string
}

export const PHASE_COLORS = [
  {
    color: 'text-emerald-500',
    bgColor: 'bg-emerald-500/5',
    borderColor: 'border-emerald-500/40',
    dotColor: 'bg-emerald-500',
  },
  {
    color: 'text-blue-500',
    bgColor: 'bg-blue-500/5',
    borderColor: 'border-blue-500/40',
    dotColor: 'bg-blue-500',
  },
  {
    color: 'text-violet-500',
    bgColor: 'bg-violet-500/5',
    borderColor: 'border-violet-500/40',
    dotColor: 'bg-violet-500',
  },
  {
    color: 'text-amber-500',
    bgColor: 'bg-amber-500/5',
    borderColor: 'border-amber-500/40',
    dotColor: 'bg-amber-500',
  },
  {
    color: 'text-rose-500',
    bgColor: 'bg-rose-500/5',
    borderColor: 'border-rose-500/40',
    dotColor: 'bg-rose-500',
  },
] as const satisfies ReadonlyArray<PhaseColor>
