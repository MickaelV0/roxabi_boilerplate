import { Logger } from '@nestjs/common'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { EmailSendException } from './emailSend.exception.js'
import { ResendEmailProvider } from './resend.provider.js'

const mockSend = vi.fn().mockResolvedValue({ id: 'mock-id' })

vi.mock('resend', () => ({
  Resend: class MockResend {
    constructor(public apiKey: string) {}
    emails = { send: mockSend }
  },
}))

function createMockConfig(values: Record<string, string | undefined>) {
  return {
    get: vi.fn((key: string, defaultValue?: string) => values[key] ?? defaultValue),
  }
}

describe('ResendEmailProvider', () => {
  beforeEach(() => {
    mockSend.mockClear()
  })

  describe('constructor', () => {
    it('should log warning to console when no RESEND_API_KEY is set in development', () => {
      // Arrange
      const warnSpy = vi.spyOn(Logger.prototype, 'warn').mockImplementation(() => {})

      // Act
      const config = createMockConfig({ NODE_ENV: 'development' })
      new ResendEmailProvider(config as never)

      // Assert
      expect(warnSpy).toHaveBeenCalledWith(
        'RESEND_API_KEY not set — emails will be logged to console'
      )

      warnSpy.mockRestore()
    })

    it('should log error when no RESEND_API_KEY is set in production', () => {
      // Arrange
      const errorSpy = vi.spyOn(Logger.prototype, 'error').mockImplementation(() => {})

      // Act
      const config = createMockConfig({ NODE_ENV: 'production' })
      new ResendEmailProvider(config as never)

      // Assert
      expect(errorSpy).toHaveBeenCalledWith(
        'RESEND_API_KEY is not set in production — emails will not be sent'
      )

      errorSpy.mockRestore()
    })

    it('should use EMAIL_FROM from config', () => {
      // Arrange
      const config = createMockConfig({
        RESEND_API_KEY: 're_test_123',
        EMAIL_FROM: 'support@roxabi.com',
      })

      // Act
      new ResendEmailProvider(config as never)

      // Assert
      expect(config.get).toHaveBeenCalledWith('EMAIL_FROM', 'noreply@yourdomain.com')
    })

    it('should fallback to default EMAIL_FROM when not configured', () => {
      // Arrange
      const warnSpy = vi.spyOn(Logger.prototype, 'warn').mockImplementation(() => {})
      const config = createMockConfig({ NODE_ENV: 'development' })

      // Act
      new ResendEmailProvider(config as never)

      // Assert
      expect(config.get).toHaveBeenCalledWith('EMAIL_FROM', 'noreply@yourdomain.com')

      warnSpy.mockRestore()
    })
  })

  describe('send — console fallback (no API key)', () => {
    it('should log To + Subject + text preview when no API key is set', async () => {
      // Arrange
      const logSpy = vi.spyOn(Logger.prototype, 'log').mockImplementation(() => {})
      vi.spyOn(Logger.prototype, 'warn').mockImplementation(() => {})
      const config = createMockConfig({ NODE_ENV: 'development' })
      const provider = new ResendEmailProvider(config as never)

      // Act
      await provider.send({
        to: 'user@example.com',
        subject: 'Test Subject',
        html: '<p>Hello</p>',
      })

      // Assert — HTML is never logged; only To, Subject, and text preview
      expect(logSpy).toHaveBeenCalledWith(
        '[Console Email] To: user@example.com | Subject: Test Subject'
      )
      expect(logSpy).toHaveBeenCalledWith('[Console Email] Preview: (no text body)')

      logSpy.mockRestore()
    })

    it('should log first 80 chars of text body when text is provided', async () => {
      // Arrange
      const logSpy = vi.spyOn(Logger.prototype, 'log').mockImplementation(() => {})
      vi.spyOn(Logger.prototype, 'warn').mockImplementation(() => {})
      const config = createMockConfig({ NODE_ENV: 'development' })
      const provider = new ResendEmailProvider(config as never)

      // Act
      await provider.send({
        to: 'user@example.com',
        subject: 'Welcome',
        html: '<h1>Welcome</h1>',
        text: 'Click here to verify: https://example.com/verify?token=abc123',
      })

      // Assert — text preview (first 80 chars), never html
      expect(logSpy).toHaveBeenCalledWith(
        '[Console Email] Preview: Click here to verify: https://example.com/verify?token=abc123'
      )

      logSpy.mockRestore()
    })
  })

  describe('send — Resend SDK', () => {
    it('should call Resend SDK with correct params when API key is set', async () => {
      // Arrange
      const config = createMockConfig({
        RESEND_API_KEY: 're_test_123',
        EMAIL_FROM: 'hello@roxabi.com',
      })
      const provider = new ResendEmailProvider(config as never)

      // Act
      await provider.send({
        to: 'user@example.com',
        subject: 'Welcome',
        html: '<h1>Welcome!</h1>',
        text: 'Welcome!',
      })

      // Assert
      expect(mockSend).toHaveBeenCalledWith({
        from: 'hello@roxabi.com',
        to: 'user@example.com',
        subject: 'Welcome',
        html: '<h1>Welcome!</h1>',
        text: 'Welcome!',
      })
    })
  })

  describe('send — failure handling', () => {
    it('should throw EmailSendException when Resend SDK fails', async () => {
      // Arrange
      const resendError = new Error('Rate limit exceeded')
      mockSend.mockRejectedValueOnce(resendError)
      const errorSpy = vi.spyOn(Logger.prototype, 'error').mockImplementation(() => {})
      const config = createMockConfig({
        RESEND_API_KEY: 're_test_123',
        EMAIL_FROM: 'hello@roxabi.com',
      })
      const provider = new ResendEmailProvider(config as never)

      // Act & Assert
      await expect(
        provider.send({
          to: 'user@example.com',
          subject: 'Verify your email',
          html: '<p>Click here</p>',
        })
      ).rejects.toThrow(EmailSendException)

      errorSpy.mockRestore()
    })

    it('should log redacted recipient and stack trace when Resend SDK fails', async () => {
      // Arrange
      const resendError = new Error('Network timeout')
      mockSend.mockRejectedValueOnce(resendError)
      const errorSpy = vi.spyOn(Logger.prototype, 'error').mockImplementation(() => {})
      const config = createMockConfig({
        RESEND_API_KEY: 're_test_123',
        EMAIL_FROM: 'hello@roxabi.com',
      })
      const provider = new ResendEmailProvider(config as never)

      // Act
      await provider
        .send({
          to: 'user@example.com',
          subject: 'Reset your password',
          html: '<p>Click here</p>',
        })
        .catch(() => {})

      // Assert — email is redacted (PII), stack trace is included
      expect(errorSpy).toHaveBeenCalledWith(
        'Failed to send email to us***@example.com (subject: "Reset your password"): Network timeout',
        resendError.stack
      )

      errorSpy.mockRestore()
    })
  })
})
