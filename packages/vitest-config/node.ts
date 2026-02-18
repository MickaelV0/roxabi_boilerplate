import { baseConfig } from './base.ts'

export const nodeConfig = {
  ...baseConfig,
  environment: 'node' as const,
  include: ['src/**/*.test.ts'],
}
