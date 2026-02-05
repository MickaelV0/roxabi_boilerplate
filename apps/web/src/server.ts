import handler from '@tanstack/react-start/server-entry'
import { paraglideMiddleware } from './paraglide/server'

// Server-side URL localization/redirects for Paraglide
export default {
  fetch(req: Request): Promise<Response> {
    return paraglideMiddleware(req, () => handler.fetch(req))
  },
}
