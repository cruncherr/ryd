import type { Metadata, Viewport } from 'next'
import type { ReactNode } from 'react'
import ReactDOM from 'react-dom'

import { CartDrawer } from '@/components/cart/CartDrawer'
import { Analytics } from '@/components/consent/Analytics'
import { ConsentBanner } from '@/components/consent/ConsentBanner'
import { Footer } from '@/components/layout/Footer'
import { Header } from '@/components/layout/Header'
import { AnnouncementBar, PreviewBar } from '@/components/layout/PreviewBar'
import { Toaster } from '@/components/layout/Toaster'
import { defaultShareImage } from '@/lib/metadata'
import { LEGAL_SLUGS } from '@/lib/constants'
import { getCategories, getPublishedPageSlugs, getSettings } from '@/lib/queries'
import { getSiteUrl } from '@/lib/site'

import './globals.css'

// Strony sklepu są zapisywane statycznie i odświeżane po każdej zmianie w panelu;
// dodatkowo, na wszelki wypadek, najpóźniej co 5 minut.
export const revalidate = 300

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover',
  interactiveWidget: 'resizes-content',
  themeColor: '#f6f3ee',
  colorScheme: 'light',
}

export async function generateMetadata(): Promise<Metadata> {
  const settings = await getSettings()
  const storeName = settings.storeName || 'RYD'
  const title = settings.seo?.title || [storeName, settings.tagline].filter(Boolean).join(' — ')
  const description = settings.seo?.description || undefined
  const isLive = settings.storeStatus === 'live'

  return {
    metadataBase: new URL(getSiteUrl()),
    title: { default: title, template: `%s · ${storeName}` },
    description,
    applicationName: storeName,
    openGraph: {
      type: 'website',
      locale: 'pl_PL',
      siteName: storeName,
      title,
      description,
      // Własna grafika z panelu ma pierwszeństwo; bez niej sklep generuje obrazek z nazwą i hasłem.
      images: [defaultShareImage(settings, title)],
    },
    twitter: { card: 'summary_large_image' },
    // W trybie przygotowania sklep nie trafia do wyszukiwarek.
    robots: isLive ? { index: true, follow: true } : { index: false, follow: false },
    formatDetection: { telephone: false },
  }
}

export default async function FrontendLayout({ children }: { children: ReactNode }) {
  // Kroje ładują się równolegle z HTML-em — tekst od razu wygląda tak, jak powinien.
  ReactDOM.preload('/fonts/inter-roman.woff2', { as: 'font', type: 'font/woff2', crossOrigin: 'anonymous' })
  ReactDOM.preload('/fonts/fraunces-roman.woff2', { as: 'font', type: 'font/woff2', crossOrigin: 'anonymous' })

  const [settings, categories, pages] = await Promise.all([getSettings(), getCategories(), getPublishedPageSlugs()])
  const isLive = settings.storeStatus === 'live'

  // Identyfikatory narzędzi pomiarowych trafiają do skryptów — przepuszczamy tylko poprawnie zbudowane.
  const ga4Id = /^G-[A-Z0-9]{6,}$/.test(settings.analytics?.ga4Id ?? '') ? (settings.analytics?.ga4Id ?? null) : null
  const metaPixelId = /^\d{8,20}$/.test(settings.analytics?.metaPixelId ?? '') ? (settings.analytics?.metaPixelId ?? null) : null
  const hasPrivacyPage = pages.some((page) => page.slug === LEGAL_SLUGS.privacy)

  return (
    <html data-scroll-behavior="smooth" lang="pl">
      <body className="flex min-h-svh flex-col">
        <a className="skip-link" href="#tresc">
          Przejdź do treści
        </a>
        {/* Baner zgody istnieje tylko w sklepach z podłączoną analityką; stoi wysoko w kolejności klawisza Tab. */}
        {(ga4Id || metaPixelId) && (
          <>
            <ConsentBanner
              hasAnalytics={Boolean(ga4Id)}
              hasMarketing={Boolean(metaPixelId)}
              privacyUrl={hasPrivacyPage ? `/${LEGAL_SLUGS.privacy}` : null}
            />
            <Analytics ga4Id={ga4Id} metaPixelId={metaPixelId} />
          </>
        )}
        {!isLive && <PreviewBar />}
        {settings.announcement && <AnnouncementBar text={settings.announcement} />}
        <Header settings={settings} />
        <main className="flex-1" id="tresc">
          {children}
        </main>
        <Footer categories={categories} settings={settings} />
        <CartDrawer />
        <Toaster />
      </body>
    </html>
  )
}
