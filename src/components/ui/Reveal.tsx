'use client'

import { useEffect, useRef, type CSSProperties, type ReactNode } from 'react'

type Props = {
  children: ReactNode
  /** Kolejność w grupie — kolejne elementy pojawiają się co 70 ms. */
  index?: number
  className?: string
}

/**
 * Jednorazowe, spokojne wejście elementu, gdy pojawia się na ekranie.
 * Używamy go tylko na stronach „wystawowych” (strona główna), nigdy w koszyku czy zamówieniu.
 * Styl i wariant dla ograniczonego ruchu są w globals.css ([data-reveal]).
 */
export function Reveal({ children, index = 0, className }: Props) {
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const element = ref.current
    if (!element) return

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) {
          element.setAttribute('data-visible', '')
          observer.disconnect()
        }
      },
      { rootMargin: '0px 0px -10% 0px', threshold: 0.08 },
    )

    observer.observe(element)
    return () => observer.disconnect()
  }, [])

  return (
    <div className={className} data-reveal ref={ref} style={{ '--reveal-index': index } as CSSProperties}>
      {children}
    </div>
  )
}
