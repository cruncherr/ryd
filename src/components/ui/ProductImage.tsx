import Image from 'next/image'

import { cn } from '@/lib/cn'
import type { Media } from '@/payload-types'

type Props = {
  media: Media | null
  alt: string
  /** Podpowiedź dla przeglądarki, jak szerokie będzie zdjęcie na ekranie. */
  sizes: string
  /** `contain` — całe zdjęcie mieści się w kadrze; `cover` — zdjęcie wypełnia kadr (zbliżenia detali). */
  fit?: 'contain' | 'cover'
  /** Dla zdjęcia widocznego od razu po wejściu na stronę. */
  eager?: boolean
  className?: string
}

/**
 * Zdjęcie z biblioteki sklepu, zawsze wypełniające swój kontener (rodzic ustala proporcje).
 * Białe tło zdjęcia stapia się z kolorem „sceny" pod spodem, więc rodzic musi mieć tło `bg-stage`.
 * Rozmiar i format (AVIF/WebP) dobiera automatycznie Next.js.
 */
export function ProductImage({ media, alt, sizes, fit = 'contain', eager = false, className }: Props) {
  if (!media?.url) return null

  return (
    <Image
      alt={alt}
      className={cn('packshot', fit === 'cover' && 'object-cover', className)}
      fetchPriority={eager ? 'high' : undefined}
      fill
      loading={eager ? 'eager' : 'lazy'}
      quality={85}
      sizes={sizes}
      src={media.url}
    />
  )
}
