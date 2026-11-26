import type { CSSProperties } from 'react'

import { cn } from '@/lib/cn'
import type { FabricType } from '@/lib/constants'

type Props = {
  color: string
  type: FabricType
  /** Zdjęcie tkaniny z panelu — gdy jest, zastępuje rysowaną fakturę. */
  imageUrl?: string | null
  className?: string
  style?: CSSProperties
}

/**
 * Próbka tkaniny. Bez zdjęcia rysujemy ją z koloru i rodzaju tkaniny (CSS), więc próbnik
 * wygląda dobrze od pierwszego dnia, a własne zdjęcia sprzedawca może dodać później.
 */
export function FabricSwatch({ color, type, imageUrl, className, style }: Props) {
  return (
    <span
      aria-hidden="true"
      className={cn('fabric', !imageUrl && `fabric-${type}`, className)}
      style={
        {
          '--swatch': color,
          ...(imageUrl ? { backgroundImage: `url("${imageUrl}")` } : {}),
          ...style,
        } as CSSProperties
      }
    />
  )
}
