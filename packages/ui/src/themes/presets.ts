/**
 * Official shadcn/ui theme presets.
 *
 * Contains all 21 themes (4 base + 17 color) with pre-computed CSS variables
 * sourced from the shadcn registry. Color presets are partial and merged onto
 * the Zinc base to produce a complete variable set.
 *
 * @see https://ui.shadcn.com/themes
 */

import { BASE_PRESETS } from './presetsBase'
import { COLOR_PRESETS } from './presetsColor'
import type { ShadcnPreset } from './presetsTypes'

export { BASE_PRESETS } from './presetsBase'
export { COLOR_PRESETS } from './presetsColor'
export {
  getComposedConfig,
  getComposedDerivedTheme,
  getPresetConfig,
  getPresetDerivedTheme,
} from './presetsHelpers'
export type { ShadcnPreset } from './presetsTypes'
export { ZINC_BASE } from './presetsTypes'

export const ALL_PRESETS: ShadcnPreset[] = [...BASE_PRESETS, ...COLOR_PRESETS]
