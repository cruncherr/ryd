import type { Metadata } from 'next'

import { asMedia } from '@/lib/catalog'
import { getSettings } from '@/lib/queries'
import type { Media, Setting } from '@/payload-types'

/**
 * Opis strony dla wyszukiwarek i podglądu linków (tytuł, opis, obrazek, adres kanoniczny).
 * Każda podstrona buduje go tą samą funkcją, dzięki czemu udostępniony link zawsze ma
 * własny tytuł i obrazek — a nie dane strony głównej.
 */

type ShareImage = { url: string; width?: number; height?: number; alt?: string }

export function mediaShareImage(media: Media | null | undefined, alt?: string): ShareImage | null {
  if (!media?.url) return null
  return { url: media.url, width: media.width ?? undefined, height: media.height ?? undefined, alt: alt ?? media.alt ?? undefined }
}

/** Grafika wgrana w ustawieniach sklepu albo — gdy jej nie ma — obrazek z nazwą i hasłem sklepu. */
export function defaultShareImage(settings: Setting, alt?: string): ShareImage {
  return mediaShareImage(asMedia(settings.seo?.image), alt) ?? { url: '/og.png', width: 1200, height: 630, alt }
}

type PageMetadataInput = {
  title: string
  description?: string | null
  /** Ścieżka strony, np. „/sklep”. */
  path: string
  image?: ShareImage | null
  type?: 'website' | 'article'
}

export async function pageMetadata({ title, description, path, image, type = 'website' }: PageMetadataInput): Promise<Metadata> {
  const settings = await getSettings()
  const storeName = settings.storeName || 'RYD'
  const summary = description?.trim() || undefined

  return {
    title,
    description: summary,
    alternates: { canonical: path },
    openGraph: {
      type,
      locale: 'pl_PL',
      siteName: storeName,
      title,
      description: summary,
      url: path,
      images: [image ?? defaultShareImage(settings, title)],
    },
  }
}
