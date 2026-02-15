import { createFileRoute } from '@tanstack/react-router'
import { json } from '@tanstack/react-start'
import { clientEnv } from '@/lib/env.client.js'

export const Route = createFileRoute('/demo/api/names')({
  server: {
    handlers: {
      GET: () => {
        if (clientEnv.VITE_ENABLE_DEMO !== 'true') {
          return Response.json({ error: 'Not Found' }, { status: 404 })
        }
        return json(['Alice', 'Bob', 'Charlie'])
      },
    },
  },
})
