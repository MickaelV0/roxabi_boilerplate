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
}

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
  return validatedConfig
}
