import { vi } from 'vitest'

vi.stubEnv('NODE_ENV', 'test')
vi.stubEnv('BETTER_AUTH_SECRET', 'test-secret-minimum-32-characters-long')
