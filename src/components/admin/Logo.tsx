import type { Payload } from 'payload'

import { BRAND_NAME, isBrandName, Logo as BrandMark } from '@/components/brand/Logo'

/** Logo na ekranie logowania do panelu: znak marki albo nazwa sklepu z ustawień. */
export default async function Logo({ payload }: { payload?: Payload }) {
  let name = BRAND_NAME
  try {
    const settings = await payload?.findGlobal({ slug: 'settings', depth: 0 })
    if (settings?.storeName) name = settings.storeName
  } catch {
    // Przy pierwszym uruchomieniu ustawień jeszcze nie ma — zostaje nazwa domyślna.
  }

  return (
    <div style={{ textAlign: 'center' }}>
      {isBrandName(name) ? (
        <div aria-label={name} role="img" style={{ color: 'var(--theme-text)' }}>
          <BrandMark name={name} style={{ display: 'block', height: 30, width: 'auto', margin: '0 auto' }} />
        </div>
      ) : (
        <div
          style={{
            fontSize: 44,
            fontWeight: 600,
            letterSpacing: '0.2em',
            lineHeight: 1,
            marginRight: '-0.2em',
            color: 'var(--theme-text)',
          }}
        >
          {name.toUpperCase()}
        </div>
      )}
      <div
        style={{
          marginTop: 16,
          fontSize: 12,
          letterSpacing: '0.16em',
          textTransform: 'uppercase',
          color: 'var(--theme-elevation-500)',
        }}
      >
        Panel sklepu
      </div>
    </div>
  )
}
