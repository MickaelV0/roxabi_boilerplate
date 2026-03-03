import { describe, expect, it } from 'vitest'
import { EmailModule } from './email.module.js'
import { EMAIL_PROVIDER } from './email.provider.js'

// Note: DI compile-time smoke tests (Test.createTestingModule) are not feasible here because
// Vitest uses esbuild which does not emit TypeScript decorator parameter type metadata
// (design:paramtypes). The metadata assertions below verify provider registration and export
// wiring, which is the declarative part of the module. DI resolution is covered by provider
// unit tests (email.provider.test.ts, nodemailer.provider.test.ts).

describe('EmailModule', () => {
  const providers: unknown[] = Reflect.getMetadata('providers', EmailModule) ?? []
  const exports_: unknown[] = Reflect.getMetadata('exports', EmailModule) ?? []

  it('should provide EMAIL_PROVIDER via useFactory', () => {
    // Assert — provider registration uses useFactory (env-based provider selection)
    const emailProvider = providers.find(
      (p: unknown) =>
        typeof p === 'object' &&
        p !== null &&
        'provide' in p &&
        (p as { provide: unknown }).provide === EMAIL_PROVIDER
    )
    expect(emailProvider).toBeDefined()
    expect(typeof (emailProvider as { useFactory: unknown }).useFactory).toBe('function')
  })

  it('should export EMAIL_PROVIDER token', () => {
    // Assert
    expect(exports_).toContain(EMAIL_PROVIDER)
  })
})
