import Link from 'next/link'

import { Logo } from '@/components/brand/Logo'
import { formatRegistryDate, type PieceView } from '@/lib/certificates'
import { cn } from '@/lib/cn'
import { padNumber } from '@/lib/editions'

type Props = {
  piece: PieceView
  storeName: string
  issued: boolean
  className?: string
}

/**
 * Karta egzemplarza na stronie potwierdzenia — jak bilecik z zaproszeniem: numer, model,
 * nazwisko właściciela i odnośnik do certyfikatu autentyczności.
 */
export function PieceCard({ piece, storeName, issued, className }: Props) {
  return (
    <article className={cn('certificate-frame px-6 py-10 text-center sm:px-10 md:py-12', className)}>
      <Logo className="mx-auto block h-3 w-auto text-brand" name={storeName} />
      <p className="eyebrow mt-6 text-brass">Rejestr egzemplarzy · {piece.editionTitle}</p>
      <p className="font-display tabular mt-6 flex items-baseline justify-center text-[clamp(4rem,3rem+5vw,6.5rem)] leading-none font-[300] tracking-tight">
        <span className="mr-2 text-[0.42em] text-ink-soft">Nº</span>
        {padNumber(piece.number, piece.size)}
        {piece.size && <span className="ml-3 text-[0.3em] text-ink-faint">/ {piece.size}</span>}
      </p>
      <p className="display-4 mt-5">{piece.productTitle}</p>
      {piece.owner && (
        <p className="mt-6 text-sm text-ink-soft">
          zapisany na nazwisko
          <span className="font-display mt-1 block text-[1.625rem] leading-tight text-ink italic">{piece.owner}</span>
        </p>
      )}
      <p className="tabular mt-6 text-[0.8125rem] text-ink-faint">Wpis do rejestru: {formatRegistryDate(piece.createdAt)}</p>
      {piece.token && (
        <div className="mt-7">
          {issued ? (
            <Link className="link-line text-[0.9375rem] font-medium" href={`/certyfikat/${piece.token}`}>
              Certyfikat autentyczności
            </Link>
          ) : (
            <p className="mx-auto max-w-[36ch] text-[0.8125rem] text-ink-soft">
              Certyfikat autentyczności wystawimy, gdy potwierdzimy zamówienie i zaksięgujemy płatność.
            </p>
          )}
        </div>
      )}
    </article>
  )
}
