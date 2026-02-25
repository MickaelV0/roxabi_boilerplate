/** Rewrite callbackURL to point to the frontend app instead of the API root */
export function rewriteCallbackUrl(url: string, appURL?: string, path = ''): string {
  if (!appURL) return url
  const target = path ? `${appURL}${path}` : appURL
  return url.replace(/callbackURL=[^&]*/, `callbackURL=${encodeURIComponent(target)}`)
}
