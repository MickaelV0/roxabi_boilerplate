import type { FastifyRequest } from 'fastify'

export function toFetchHeaders(req: FastifyRequest): Headers {
  const headers = new Headers()
  for (const [key, value] of Object.entries(req.headers)) {
    if (value) headers.set(key, Array.isArray(value) ? value.join(', ') : String(value))
  }
  return headers
}
