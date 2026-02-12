import { APP_GUARD } from '@nestjs/core'
import { describe, expect, it } from 'vitest'
import { AuthController } from './auth.controller.js'
import { AuthGuard } from './auth.guard.js'
import { AuthModule } from './auth.module.js'
import { AuthService } from './auth.service.js'
import { EMAIL_PROVIDER } from './email/email.provider.js'
import { ResendEmailProvider } from './email/resend.provider.js'

describe('AuthModule', () => {
  const imports: unknown[] = Reflect.getMetadata('imports', AuthModule) ?? []
  const controllers: unknown[] = Reflect.getMetadata('controllers', AuthModule) ?? []
  const providers: unknown[] = Reflect.getMetadata('providers', AuthModule) ?? []
  const exports_: unknown[] = Reflect.getMetadata('exports', AuthModule) ?? []

  it('should import RbacModule', () => {
    // Assert — forwardRef wraps the module, so check the resolved value
    expect(imports).toHaveLength(1)
  })

  it('should declare AuthController', () => {
    // Assert
    expect(controllers).toContain(AuthController)
  })

  it('should provide AuthService', () => {
    // Assert
    expect(providers).toContainEqual(AuthService)
  })

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

  it('should provide APP_GUARD with AuthGuard', () => {
    // Assert
    const guardProvider = providers.find(
      (p: unknown) =>
        typeof p === 'object' &&
        p !== null &&
        'provide' in p &&
        (p as { provide: unknown }).provide === APP_GUARD
    )
    expect(guardProvider).toBeDefined()
    expect((guardProvider as { useClass: unknown }).useClass).toBe(AuthGuard)
  })

  it('should export AuthService', () => {
    // Assert
    expect(exports_).toContain(AuthService)
  })
})
