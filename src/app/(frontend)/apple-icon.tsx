import { ImageResponse } from 'next/og'

import { BRAND_COLORS, loadBrandFonts, monogram } from '@/lib/brandImage'
import { getSettings } from '@/lib/queries'

export const size = { width: 180, height: 180 }
export const contentType = 'image/png'

/** Ikona sklepu po dodaniu strony do ekranu głównego telefonu. */
export default async function AppleIcon() {
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
          fontFamily: 'Fraunces',
          fontSize: 120,
          lineHeight: 1,
          paddingBottom: 10,
        }}
      >
        {monogram(settings.storeName)}
      </div>
    ),
    { ...size, fonts },
  )
}
