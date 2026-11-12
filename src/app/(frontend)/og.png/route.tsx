import { ImageResponse } from 'next/og'

import { BRAND_COLORS, loadBrandFonts } from '@/lib/brandImage'
import { getSettings } from '@/lib/queries'
import { getSiteUrl } from '@/lib/site'

// Obrazek zmienia się tylko razem z nazwą lub hasłem sklepu — wystarczy odświeżać go raz na godzinę.
export const revalidate = 3600

const WIDTH = 1200
const HEIGHT = 630

const capitalize = (text: string): string => (text ? text.charAt(0).toUpperCase() + text.slice(1) : text)

/**
 * Domyślny obrazek podglądu linku (komunikatory, media społecznościowe): nazwa sklepu i hasło
 * w barwach witryny. Strony produktów pokazują zamiast niego zdjęcie produktu, a własną grafikę
 * można wgrać w panelu (Ustawienia sklepu → Wyszukiwarki) — wtedy to ona ma pierwszeństwo.
 */
export async function GET(): Promise<Response> {
  const [settings, fonts] = await Promise.all([getSettings(), loadBrandFonts()])
  const storeName = settings.storeName?.trim() || 'RYD'
  // Hasło sklepu; gdy go nie ma — tytuł strony bez nazwy sklepu na początku.
  const fromTitle = (settings.seo?.title ?? '').replace(/^.*?\s[—–-]\s/, '')
  const tagline = capitalize((settings.tagline?.trim() || fromTitle.trim() || 'Meble tapicerowane').slice(0, 90))
  const host = getSiteUrl().replace(/^https?:\/\//, '')

  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          background: BRAND_COLORS.paper,
          color: BRAND_COLORS.ink,
          padding: '72px 80px',
        }}
      >
        <div style={{ display: 'flex', fontFamily: 'Inter', fontSize: 30, letterSpacing: 12, textTransform: 'uppercase' }}>{storeName}</div>
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          <div style={{ display: 'flex', width: 96, height: 3, background: BRAND_COLORS.accent, marginBottom: 40 }} />
          <div
            style={{
              display: 'flex',
              fontFamily: 'Fraunces',
              fontSize: tagline.length > 44 ? 64 : tagline.length > 26 ? 76 : 92,
              lineHeight: 1.08,
              letterSpacing: -2,
              maxWidth: 1000,
            }}
          >
            {tagline}
          </div>
        </div>
        <div style={{ display: 'flex', fontFamily: 'Inter', fontSize: 26, color: BRAND_COLORS.soft }}>{host}</div>
      </div>
    ),
    { width: WIDTH, height: HEIGHT, fonts },
  )
}
