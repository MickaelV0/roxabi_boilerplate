import { vi } from 'vitest'

/**
 * Creates a chainable mock that mimics Drizzle's query-builder API.
 * Every builder method returns the same proxy so chains like
 * `.select().from().innerJoin().where().limit()` resolve correctly.
 *
 * The final awaited value is controlled by `result`.
 */
export function createChainMock(result: unknown = []) {
  const chain: Record<string, unknown> = {}
  const methods = [
    'select',
    'from',
    'innerJoin',
    'leftJoin',
    'where',
    'orderBy',
    'limit',
    'offset',
    'insert',
    'values',
    'returning',
    'update',
    'set',
    'delete',
    'groupBy',
  ]
  for (const m of methods) {
    chain[m] = vi.fn(() => chain)
  }
  // Make the chain thenable so `await db.select()...` resolves to `result`
  // biome-ignore lint/suspicious/noThenProperty: intentional thenable mock for Drizzle chain
  chain.then = (resolve: (v: unknown) => void) => resolve(result)
  return chain
}
