/**
 * Shared Bun.$ stub factory for tool test files.
 * Injects a fake Bun.$ into globalThis so that top-level script code that
 * uses Bun.$ as a tagged template literal does not throw in Node.js / Vitest.
 *
 * Usage:
 *   import { stubBun } from './__tests__/stubBun.js'
 *   const { bunShellTag, bunShellResult } = stubBun()
 *   // For scripts with multiple sequential json() calls:
 *   const { bunShellTag } = stubBun(
 *     vi.fn().mockResolvedValueOnce(first).mockResolvedValueOnce(second)
 *   )
 */
import { vi } from 'vitest'

export interface BunShellResult {
  text: ReturnType<typeof vi.fn>
  json: ReturnType<typeof vi.fn>
  quiet: ReturnType<typeof vi.fn>
}

/**
 * Install a fake Bun.$ tag into globalThis and return the mock handles.
 * @param jsonFn Optional custom mock for .json() — defaults to returning [].
 *   Pass a custom mock when the script calls json() multiple times in sequence.
 */
export function stubBun(jsonFn?: ReturnType<typeof vi.fn>): {
  bunShellTag: ReturnType<typeof vi.fn>
  bunShellResult: BunShellResult
} {
  const bunShellResult: BunShellResult = {
    text: vi.fn().mockResolvedValue(''),
    json: jsonFn ?? vi.fn().mockResolvedValue([]),
    quiet: vi.fn().mockResolvedValue({}),
  }
  const bunShellTag = Object.assign(vi.fn().mockReturnValue(bunShellResult), bunShellResult)
  ;(globalThis as Record<string, unknown>).Bun = { $: bunShellTag }
  return { bunShellTag, bunShellResult }
}
