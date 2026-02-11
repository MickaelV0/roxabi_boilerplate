import { vi } from 'vitest'

/**
 * Shared mock factory for `@/paraglide/messages`.
 * Returns message keys as their function return values,
 * with arguments stringified for assertion matching.
 */
export function mockParaglideMessages() {
  vi.mock('@/paraglide/messages', () => ({
    m: new Proxy(
      {},
      {
        get:
          (_target, prop) =>
          (...args: unknown[]) => {
            if (args.length > 0 && typeof args[0] === 'object') {
              return `${String(prop)}(${JSON.stringify(args[0])})`
            }
            return String(prop)
          },
      }
    ),
  }))
}
