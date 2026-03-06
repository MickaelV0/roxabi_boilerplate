export const AVATAR_VARIANTS = [
  'quantum',
  'constellation',
  'rpg-canvas',
  'tamagotchi',
  'silhouette',
  'blob',
  'pokemon',
] as const

export const AVATAR_POSITIONS = ['bottom-right', 'bottom-left', 'top-right', 'top-left'] as const

export const AVATAR_SIZES = [48, 80, 200, 400] as const

export type LyraVariant = (typeof AVATAR_VARIANTS)[number]
export type AvatarVariant = LyraVariant // alias for consistency with lyra-product/lyra-dev naming
export type AvatarPosition = (typeof AVATAR_POSITIONS)[number]
