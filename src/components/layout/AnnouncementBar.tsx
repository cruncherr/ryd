'use client'

import { useEffect, useState } from 'react'

import { useMediaQuery } from '@/lib/hooks'

/**
 * Pasek nad menu w kolorze marki. Kilka haseł rozdzielonych „·”: na komputerze widać wszystkie naraz,
 * na telefonie zmieniają się co kilka sekund (bez ruchu, gdy system prosi o ograniczenie animacji).
 */
export function AnnouncementBar({ text }: { text: string }) {
  const items = text
    .split(/\s*[·|]\s*/)
    .map((item) => item.trim())
    .filter(Boolean)
  const [index, setIndex] = useState(0)
  const reduceMotion = useMediaQuery('(prefers-reduced-motion: reduce)')
  const count = items.length

  useEffect(() => {
    if (count < 2 || reduceMotion) return
    const timer = window.setInterval(() => setIndex((value) => (value + 1) % count), 4200)
    return () => window.clearInterval(timer)
  }, [count, reduceMotion])

  if (count === 0) return null

  return (
    <div className="bg-brand text-paper">
      <p className="sr-only">{items.join('. ')}</p>
      <div aria-hidden="true" className="shell flex h-9 items-center justify-center overflow-hidden text-[0.8125rem] leading-none font-medium tracking-[0.01em]">
        <ul className="hidden items-center md:flex">
          {items.map((item, itemIndex) => (
            <li className="flex items-center" key={item}>
              {itemIndex > 0 && <span className="mx-5 size-1 rounded-full bg-paper/45" />}
              {item}
            </li>
          ))}
        </ul>
        <span className="announce-item truncate md:hidden" key={reduceMotion ? 'static' : index}>
          {reduceMotion ? items[0] : items[index % count]}
        </span>
      </div>
    </div>
  )
}
