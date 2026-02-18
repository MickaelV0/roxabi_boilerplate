import type { AvatarStyle } from '@repo/types'
import { AVATAR_STYLES } from '@repo/types'
import type { SchemaProperty } from './types'

export function isColorProperty(prop: SchemaProperty): boolean {
  return (
    prop.type === 'array' &&
    prop.items?.type === 'string' &&
    typeof prop.items.pattern === 'string' &&
    prop.items.pattern.includes('a-fA-F0-9')
  )
}

export function isEnumProperty(prop: SchemaProperty): boolean {
  return prop.type === 'array' && prop.items?.type === 'string' && Array.isArray(prop.items.enum)
}

export function isProbabilityProperty(prop: SchemaProperty): boolean {
  return prop.type === 'integer' && prop.minimum === 0 && prop.maximum === 100
}

export function formatOptionLabel(key: string): string {
  return key
    .replace(/([A-Z])/g, ' $1')
    .replace(/^./, (c) => c.toUpperCase())
    .trim()
}

export function isAvatarStyle(v: string): v is AvatarStyle {
  return (AVATAR_STYLES as readonly string[]).includes(v)
}
