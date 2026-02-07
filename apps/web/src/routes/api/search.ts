import { createFileRoute } from '@tanstack/react-router'
import { createFromSource } from 'fumadocs-core/search/server'
import { source } from '@/lib/source'

const servers = {
  en: createFromSource(source, { language: 'english' }),
  fr: createFromSource(source, { language: 'french' }),
}

export const Route = createFileRoute('/api/search')({
  server: {
    handlers: {
      GET: async ({ request }) => {
        try {
          const url = new URL(request.url)
          const lang = url.searchParams.get('lang') === 'fr' ? 'fr' : 'en'
          return servers[lang].GET(request)
        } catch {
          return new Response(JSON.stringify({ error: 'Search failed' }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' },
          })
        }
      },
    },
  },
})
