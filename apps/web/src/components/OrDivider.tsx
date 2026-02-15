import { m } from '@/paraglide/messages'

type OrDividerProps = {
  label?: string
}

export function OrDivider({ label = m.auth_or() }: OrDividerProps) {
  return (
    <div className="relative">
      <div className="absolute inset-0 flex items-center">
        <span className="w-full border-t" />
      </div>
      <div className="relative flex justify-center text-xs uppercase">
        <span className="bg-card px-2 text-muted-foreground">{label}</span>
      </div>
    </div>
  )
}
