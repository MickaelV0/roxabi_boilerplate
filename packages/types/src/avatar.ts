export const DICEBEAR_CDN_BASE = 'https://api.dicebear.com/9.x'

export const AVATAR_STYLES = [
  'lorelei',
  'bottts',
  'pixel-art',
  'thumbs',
  'avataaars',
  'adventurer',
  'toon-head',
] as const

export type AvatarStyle = (typeof AVATAR_STYLES)[number]
