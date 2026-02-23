/** Rewrite callbackURL to point to the frontend app instead of the API root */
export function rewriteCallbackUrl(url: string, appURL?: string): string {
  return appURL
    ? url.replace(/callbackURL=[^&]*/, `callbackURL=${encodeURIComponent(appURL)}`)
    : url
}
