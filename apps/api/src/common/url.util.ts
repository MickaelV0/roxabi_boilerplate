/** Rewrite callbackURL to point to the frontend app instead of the API root */
export function rewriteCallbackUrl(url: string, appURL?: string, path = ''): string {
  if (!appURL) return url
  const target = path ? `${appURL}${path}` : appURL
  return url.replace(/callbackURL=[^&]*/, `callbackURL=${encodeURIComponent(target)}`)
}

/** Build a frontend page URL from a Better Auth callback URL by extracting the token */
export function buildFrontendUrl(url: string, appURL: string | undefined, path: string): string {
  if (!appURL) return url
  try {
    const parsed = new URL(url)
    const token = parsed.searchParams.get('token')
    if (!token) return url
    return `${appURL}${path}?token=${encodeURIComponent(token)}`
  } catch {
    return url
  }
}
