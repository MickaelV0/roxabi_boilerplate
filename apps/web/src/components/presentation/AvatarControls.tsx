import { cn } from '@repo/ui'
import {
  AVATAR_POSITIONS,
  AVATAR_SIZES,
  AVATAR_VARIANTS,
  type AvatarPosition,
  type AvatarVariant,
} from '@/components/presentation/lyra-story/lyra.constants'

export const POSITION_CLASSES: Record<AvatarPosition, string> = {
  'bottom-right': 'bottom-6 right-16',
  'bottom-left': 'bottom-6 left-6',
  'top-right': 'top-20 right-16',
  'top-left': 'top-20 left-6',
}

export const VARIANT_LABELS: Record<AvatarVariant, string> = {
  quantum: 'Q',
  constellation: 'C',
  'rpg-canvas': 'RPG',
  tamagotchi: 'T',
  silhouette: 'S',
  blob: 'B',
  pokemon: 'P',
}

export const KEYBOARD_HINTS = [
  { key: 'V', label: 'variant' },
  { key: '[', label: 'smaller' },
  { key: ']', label: 'larger' },
  { key: 'P', label: 'position' },
] as const

export function ChipButton({
  active,
  onClick,
  title,
  'aria-label': ariaLabel,
  children,
}: {
  active: boolean
  onClick: () => void
  title?: string
  'aria-label'?: string
  children: React.ReactNode
}) {
  return (
    <button
      type="button"
      title={title}
      aria-label={ariaLabel}
      onClick={onClick}
      className={cn(
        'text-[9px] font-mono px-1 py-0.5 rounded transition-colors',
        active ? 'text-white bg-white/20' : 'text-white/40 hover:text-white/80'
      )}
    >
      {children}
    </button>
  )
}

export { AVATAR_VARIANTS, AVATAR_SIZES, AVATAR_POSITIONS, type AvatarVariant, type AvatarPosition }
