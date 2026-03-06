import { cn } from '@repo/ui'
import { colorMap, productSections, type SectionId } from './productConfig'

type SectionChromeProps = {
  sectionId: SectionId
}

export function SectionChrome({ sectionId }: SectionChromeProps) {
  const section = productSections[sectionId]
  if (!section) return null

  const colors = colorMap[section.color]

  return (
    <div className="absolute top-4 left-4 z-10 hidden md:flex items-center gap-3">
      <span className={cn('font-mono text-[8px] tracking-widest uppercase', colors.text)}>
        {section.phase}
      </span>
      {section.day !== '—' && (
        <span className="font-mono text-[7px] text-amber-400/50">{section.day}</span>
      )}
    </div>
  )
}
