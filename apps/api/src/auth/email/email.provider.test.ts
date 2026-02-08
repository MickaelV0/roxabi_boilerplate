import { Logger } from '@nestjs/common'
import { describe, expect, it, vi } from 'vitest'
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

  it('should log email to console when no API key is set', async () => {
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

    // Assert
    expect(logSpy).toHaveBeenCalledWith(
      '[Console Email] To: user@example.com | Subject: Test Subject'
    )
    expect(logSpy).toHaveBeenCalledWith('[Console Email] HTML: <p>Hello</p>')

    logSpy.mockRestore()
  })

  it('should call Resend SDK when API key is set', async () => {
    // Arrange
    mockSend.mockClear()
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
