/**
 * Publiczny adres sklepu. Na Vercelu ustawia się sam (domena produkcyjna projektu);
 * można go też podać ręcznie w zmiennej NEXT_PUBLIC_SERVER_URL.
 */
export function getSiteUrl(): string {
  const explicit = process.env.NEXT_PUBLIC_SERVER_URL
  if (explicit) return explicit.replace(/\/+$/, '')

  const vercelProduction = process.env.VERCEL_PROJECT_PRODUCTION_URL
  if (vercelProduction) return `https://${vercelProduction}`

  const vercelPreview = process.env.VERCEL_URL
  if (vercelPreview) return `https://${vercelPreview}`

  return 'http://localhost:3000'
}

export function absoluteUrl(path: string): string {
  if (/^https?:\/\//.test(path)) return path
  return `${getSiteUrl()}${path.startsWith('/') ? path : `/${path}`}`
}
