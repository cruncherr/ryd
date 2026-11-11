import type { Metadata, Viewport } from 'next'
import type { ReactNode } from 'react'
import ReactDOM from 'react-dom'

import { CartDrawer } from '@/components/cart/CartDrawer'
import { Footer } from '@/components/layout/Footer'
import { Header } from '@/components/layout/Header'
import { AnnouncementBar, PreviewBar } from '@/components/layout/PreviewBar'
import { Toaster } from '@/components/layout/Toaster'
import { asMedia } from '@/lib/catalog'
import { getCategories, getSettings } from '@/lib/queries'
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
  const image = asMedia(settings.seo?.image)
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
      images: image?.url ? [{ url: image.url, width: image.width ?? undefined, height: image.height ?? undefined }] : undefined,
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

  const [settings, categories] = await Promise.all([getSettings(), getCategories()])
  const isLive = settings.storeStatus === 'live'

  return (
    <html lang="pl" suppressHydrationWarning>
      <head>
        {/* Znacznik „JavaScript działa" — bez niego treść z animacją wejścia jest po prostu widoczna. */}
        <script dangerouslySetInnerHTML={{ __html: "document.documentElement.classList.add('js')" }} />
      </head>
      <body className="flex min-h-svh flex-col">
        <a className="skip-link" href="#tresc">
          Przejdź do treści
        </a>
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
