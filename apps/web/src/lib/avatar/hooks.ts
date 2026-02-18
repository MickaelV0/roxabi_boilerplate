import type { AvatarStyle } from '@repo/types'
import { useEffect, useState } from 'react'
import { STYLE_IMPORTS } from './constants'
import type { StyleSchema } from './types'

export function useStyleSchema(style: AvatarStyle) {
  const [schema, setSchema] = useState<StyleSchema | null>(null)

  useEffect(() => {
    let cancelled = false

    async function load() {
      try {
        const mod = await STYLE_IMPORTS[style]()
        if (!cancelled && mod.schema?.properties) {
          setSchema(mod.schema as StyleSchema)
        }
      } catch {
        if (!cancelled) setSchema(null)
      }
    }

    setSchema(null)
    load()
    return () => {
      cancelled = true
    }
  }, [style])

  return schema
}

export function useAvatarPreview(
  style: AvatarStyle,
  seed: string,
  options: Record<string, unknown>
) {
  const [svgUri, setSvgUri] = useState<string>('')

  useEffect(() => {
    let cancelled = false

    async function generate() {
      try {
        const { createAvatar } = await import('@dicebear/core')
        const styleModule = await STYLE_IMPORTS[style]()
        // DiceBear style modules export namespace objects that don't structurally match
        // the Style<Options> interface expected by createAvatar. The cast is unavoidable
        // until DiceBear provides compatible type exports.
        const avatar = createAvatar(styleModule as never, { seed, ...options })
        const svg = avatar.toString()
        if (!cancelled) {
          setSvgUri(`data:image/svg+xml;utf8,${encodeURIComponent(svg)}`)
        }
      } catch {
        if (!cancelled) setSvgUri('')
      }
    }

    generate()
    return () => {
      cancelled = true
    }
  }, [style, seed, options])

  return svgUri
}
