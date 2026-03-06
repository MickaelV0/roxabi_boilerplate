import { createFileRoute } from '@tanstack/react-router'
import { z } from 'zod'

const AVATAR_VARIANTS = [
  'quantum',
  'constellation',
  'rpg-canvas',
  'tamagotchi',
  'silhouette',
  'blob',
  'pokemon',
] as const
const AVATAR_SIZES = [48, 64, 72, 80, 100] as const
const AVATAR_POSITIONS = ['bottom-right', 'bottom-left', 'top-right', 'top-left'] as const

const searchSchema = z.object({
  mode: z.enum(['story', 'mmorpg']).optional().default('story'),
  avatar: z.enum(AVATAR_VARIANTS).optional().default('quantum'),
  avatarSize: z.coerce
    .number()
    .refine((n) => (AVATAR_SIZES as readonly number[]).includes(n))
    .optional()
    .default(72),
  avatarPos: z.enum(AVATAR_POSITIONS).optional().default('bottom-right'),
})

export const Route = createFileRoute('/talks/lyra-story')({
  validateSearch: searchSchema,
})

export { AVATAR_VARIANTS, AVATAR_SIZES, AVATAR_POSITIONS }
export type AvatarPosition = (typeof AVATAR_POSITIONS)[number]
