// TODO: implement — render functions for branded email templates
// Each function returns { html, text, subject } for use in emailProvider.send()

export type EmailRenderResult = {
  html: string
  text: string
  subject: string
}

export function renderVerificationEmail(_url: string, _locale: string): EmailRenderResult {
  // TODO: implement — render branded verification email template
  throw new Error('Not implemented')
}

export function renderResetEmail(_url: string, _locale: string): EmailRenderResult {
  // TODO: implement — render branded password reset email template
  throw new Error('Not implemented')
}

export function renderMagicLinkEmail(_url: string, _locale: string): EmailRenderResult {
  // TODO: implement — render branded magic link sign-in email template
  throw new Error('Not implemented')
}
