import type { AvatarStyle } from '@repo/types'

// Primary options are the main visual features; everything else is advanced
export const PRIMARY_KEYS = new Set([
  'eyes',
  'eyebrows',
  'mouth',
  'hair',
  'nose',
  'head',
  'base',
  'features',
  'beard',
  'skinColor',
  'hairColor',
  'eyesColor',
  'mouthColor',
  'backgroundColor',
])

export const STYLE_IMPORTS = {
  lorelei: () => import('@dicebear/lorelei'),
  bottts: () => import('@dicebear/bottts'),
  'pixel-art': () => import('@dicebear/pixel-art'),
  thumbs: () => import('@dicebear/thumbs'),
  avataaars: () => import('@dicebear/avataaars'),
  adventurer: () => import('@dicebear/adventurer'),
  'toon-head': () => import('@dicebear/toon-head'),
} as const

export const AVATAR_STYLE_LABELS: Record<AvatarStyle, string> = {
  lorelei: 'Lorelei',
  bottts: 'Bottts',
  'pixel-art': 'Pixel Art',
  thumbs: 'Thumbs',
  avataaars: 'Avataaars',
  adventurer: 'Adventurer',
  'toon-head': 'Toon Head',
}
