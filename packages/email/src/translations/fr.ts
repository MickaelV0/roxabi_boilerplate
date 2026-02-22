// TODO: implement — French translations for all email templates
// Mirrors en.ts structure with French text

import type { Translations } from './types'

export const fr: Translations = {
  verification: {
    subject: 'Vérifiez votre adresse e-mail',
    heading: 'Vérifiez votre adresse e-mail',
    body: 'Cliquez sur le bouton ci-dessous pour vérifier votre adresse e-mail.',
    cta: 'Vérifier l\u2019e-mail',
    expiry: 'Ce lien expire dans 24 heures.',
    footer:
      'Si vous n\u2019avez pas créé de compte, vous pouvez ignorer cet e-mail en toute sécurité.',
  },
  reset: {
    subject: 'Réinitialisez votre mot de passe',
    heading: 'Réinitialisez votre mot de passe',
    body: 'Cliquez sur le bouton ci-dessous pour réinitialiser votre mot de passe.',
    cta: 'Réinitialiser le mot de passe',
    expiry: 'Ce lien expire dans 1 heure.',
    footer:
      'Si vous n\u2019avez pas demandé de réinitialisation de mot de passe, vous pouvez ignorer cet e-mail.',
  },
  magicLink: {
    subject: 'Connectez-vous à Roxabi',
    heading: 'Connectez-vous à Roxabi',
    body: 'Cliquez sur le bouton ci-dessous pour vous connecter à votre compte.',
    cta: 'Se connecter',
    expiry: 'Ce lien expire dans 5 minutes.',
    footer:
      'Si vous n\u2019avez pas demandé ce lien, vous pouvez ignorer cet e-mail en toute sécurité.',
  },
}
