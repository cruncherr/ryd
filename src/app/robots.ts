import type { MetadataRoute } from 'next'

import { getSettings } from '@/lib/queries'
import { getSiteUrl } from '@/lib/site'

// Zawsze aktualny: w chwili uruchomienia sklepu wyszukiwarki od razu dostają zgodę na indeksowanie.
export const dynamic = 'force-dynamic'

/**
 * Wskazówki dla wyszukiwarek. Dopóki sklep jest w trybie przygotowania, prosimy je,
 * żeby niczego nie indeksowały. Po uruchomieniu zamykamy tylko panel, koszyk i zamówienia.
 */
export default async function robots(): Promise<MetadataRoute.Robots> {
  const settings = await getSettings()

  if (settings.storeStatus !== 'live') {
    return { rules: { userAgent: '*', disallow: '/' } }
  }

  return {
    rules: {
      userAgent: '*',
      // Zdjęcia produktów wgrane lokalnie są podawane spod /api/media — muszą pozostać dostępne.
      allow: ['/', '/api/media/'],
      disallow: ['/admin', '/api/', '/koszyk', '/zamowienie', '/platnosc'],
    },
    sitemap: `${getSiteUrl()}/sitemap.xml`,
  }
}
