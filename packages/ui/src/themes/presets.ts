/**
 * Official shadcn/ui theme presets.
 *
 * Contains all 21 themes (4 base + 17 color) with pre-computed CSS variables
 * sourced from the shadcn registry. Color presets are partial and merged onto
 * the Zinc base to produce a complete variable set.
 *
 * @see https://ui.shadcn.com/themes
 */

import { BASE_PRESETS } from './presets-base'
import { COLOR_PRESETS } from './presets-color'
import type { ShadcnPreset } from './presets-types'

export { BASE_PRESETS } from './presets-base'
export { COLOR_PRESETS } from './presets-color'
export {
  getComposedConfig,
  getComposedDerivedTheme,
  getPresetConfig,
  getPresetDerivedTheme,
} from './presets-helpers'
export type { ShadcnPreset } from './presets-types'
export { ZINC_BASE } from './presets-types'

export const ALL_PRESETS: ShadcnPreset[] = [...BASE_PRESETS, ...COLOR_PRESETS]
