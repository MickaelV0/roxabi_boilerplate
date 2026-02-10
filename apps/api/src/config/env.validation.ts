import { plainToInstance } from 'class-transformer'
import { IsEnum, IsNumber, IsOptional, IsString, validateSync } from 'class-validator'

enum Environment {
  Development = 'development',
  Production = 'production',
  Test = 'test',
}

export class EnvironmentVariables {
  @IsEnum(Environment)
  @IsOptional()
  NODE_ENV: Environment = Environment.Development

  @IsNumber()
  @IsOptional()
  PORT = 3001

  @IsString()
  @IsOptional()
  DATABASE_URL?: string

  @IsString()
  @IsOptional()
  CORS_ORIGIN = 'http://localhost:3000'

  @IsString()
  @IsOptional()
  LOG_LEVEL = 'debug'

  @IsString()
  BETTER_AUTH_SECRET = 'dev-secret-do-not-use-in-production'

  @IsString()
  @IsOptional()
  BETTER_AUTH_URL = 'http://localhost:3001'

  @IsString()
  @IsOptional()
  GOOGLE_CLIENT_ID?: string

  @IsString()
  @IsOptional()
  GOOGLE_CLIENT_SECRET?: string

  @IsString()
  @IsOptional()
  GITHUB_CLIENT_ID?: string

  @IsString()
  @IsOptional()
  GITHUB_CLIENT_SECRET?: string

  @IsString()
  @IsOptional()
  RESEND_API_KEY?: string

  @IsString()
  @IsOptional()
  EMAIL_FROM = 'noreply@yourdomain.com'
}

const INSECURE_SECRETS: readonly string[] = [
  'dev-secret-do-not-use-in-production',
  'change-me-to-a-random-32-char-string',
]

export function validate(config: Record<string, unknown>) {
  const validatedConfig = plainToInstance(EnvironmentVariables, config, {
    enableImplicitConversion: true,
  })
  const errors = validateSync(validatedConfig, {
    skipMissingProperties: false,
  })

  if (errors.length > 0) {
    throw new Error(errors.toString())
  }

  if (
    validatedConfig.NODE_ENV === Environment.Production &&
    INSECURE_SECRETS.includes(validatedConfig.BETTER_AUTH_SECRET)
  ) {
    throw new Error(
      'BETTER_AUTH_SECRET must be set to a secure value in production. ' +
        'Generate one with: openssl rand -base64 32'
    )
  }

  return validatedConfig
}
