import { ImageResponse } from 'next/og'

import { BRAND_COLORS, loadBrandFonts, monogram } from '@/lib/brandImage'
import { getSettings } from '@/lib/queries'

export const size = { width: 64, height: 64 }
export const contentType = 'image/png'

/** Ikona sklepu w karcie przeglądarki: pierwsza litera nazwy na ciemnym tle. */
export default async function Icon() {
  const [settings, fonts] = await Promise.all([getSettings(), loadBrandFonts()])

  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: BRAND_COLORS.ink,
          color: BRAND_COLORS.paper,
          borderRadius: 14,
          fontFamily: 'Fraunces',
          fontSize: 44,
          lineHeight: 1,
          paddingBottom: 4,
        }}
      >
        {monogram(settings.storeName)}
      </div>
    ),
    { ...size, fonts },
  )
}
