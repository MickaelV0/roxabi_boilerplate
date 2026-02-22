// TODO: implement — locale resolver
// Resolves locale string to translation object, falls back to 'en'

import { en } from './en'
import { fr } from './fr'

export type { EmailTemplateStrings, Translations } from './types'

import type { Translations } from './types'

const SUPPORTED_LOCALES: Record<string, Translations> = { en, fr }

export function getTranslations(locale: string): Translations {
  const baseLocale = locale.split('-')[0]?.toLowerCase() ?? 'en'
  return SUPPORTED_LOCALES[baseLocale] ?? en
}
