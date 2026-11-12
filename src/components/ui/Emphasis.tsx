import { Fragment } from 'react'

import { noOrphans } from '@/lib/typography'

/**
 * Nagłówek z wyróżnieniem: słowa wpisane w panelu między gwiazdkami (np. „zostać *dłużej*”)
 * są składane kursywą. Reszta tekstu dostaje polskie „twarde spacje” po jednoliterowych słowach.
 */
export function Emphasis({ text }: { text: string | null | undefined }) {
  if (!text) return null
  const parts = text.split(/\*([^*]+)\*/g)

  return (
    <>
      {parts.map((part, index) =>
        index % 2 === 1 ? (
          <em className="font-[320] italic" key={index}>
            {noOrphans(part)}
          </em>
        ) : (
          <Fragment key={index}>{noOrphans(part)}</Fragment>
        ),
      )}
    </>
  )
}

/** Wersja bez znaczników — do opisów alternatywnych i metadanych. */
export function plainTitle(text: string | null | undefined): string {
  return (text ?? '').replace(/\*/g, '')
}
