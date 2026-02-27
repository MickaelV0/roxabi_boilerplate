import { describe, expect, it } from 'vitest'
import { EmailModule } from './email.module.js'
import { EMAIL_PROVIDER } from './email.provider.js'
import { ResendEmailProvider } from './resend.provider.js'

describe('EmailModule', () => {
  const providers: unknown[] = Reflect.getMetadata('providers', EmailModule) ?? []
  const exports_: unknown[] = Reflect.getMetadata('exports', EmailModule) ?? []

  it('should provide EMAIL_PROVIDER with ResendEmailProvider', () => {
    // Assert
    const emailProvider = providers.find(
      (p: unknown) =>
        typeof p === 'object' &&
        p !== null &&
        'provide' in p &&
        (p as { provide: unknown }).provide === EMAIL_PROVIDER
    )
    expect(emailProvider).toBeDefined()
    expect((emailProvider as { useClass: unknown }).useClass).toBe(ResendEmailProvider)
  })

  it('should export EMAIL_PROVIDER token', () => {
    // Assert
    expect(exports_).toContain(EMAIL_PROVIDER)
  })
})
