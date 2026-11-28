import type { Metadata } from 'next'
import { notFound } from 'next/navigation'

import { Logo } from '@/components/brand/Logo'
import { PrintButton } from '@/components/edition/PrintButton'
import { certificateIssued, findPieceByToken, formatRegistryDate } from '@/lib/certificates'
import { padNumber } from '@/lib/editions'
import { getPayloadClient } from '@/lib/payload'
import { getSettings } from '@/lib/queries'
import { getSiteUrl } from '@/lib/site'

// Certyfikat pokazuje nazwisko właściciela i aktualny stan zamówienia — nigdy nie jest zapisywany na zapas.
export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  title: 'Certyfikat autentyczności',
  robots: { index: false, follow: false },
  referrer: 'same-origin',
}

/**
 * Certyfikat autentyczności egzemplarza: numer z nakładu, model, konfiguracja, właściciel i data
 * wpisu do rejestru. Strona jest przygotowana do druku na A4 — bez menu i stopki.
 */
export default async function CertificatePage({ params }: PageProps<'/certyfikat/[token]'>) {
  const { token } = await params
  const payload = await getPayloadClient()
  const found = await findPieceByToken(payload, token)
  if (!found) notFound()

  const { piece, order, configuration } = found
  const settings = await getSettings()
  const storeName = settings.storeName?.trim() || 'VELURO'
  const issued = certificateIssued(order)
  const verifyUrl = `${getSiteUrl().replace(/^https?:\/\//, '')}/certyfikat/${piece.token ?? ''}`

  return (
    <div className="shell pt-8 pb-20 md:pt-14 md:pb-28 print:p-0">
      <article className="certificate-frame mx-auto max-w-[46rem] px-7 py-14 text-center sm:px-14 md:py-20 print:py-12">
        {order?.isTest && (
          <p className="no-print mx-auto mb-8 w-fit rounded-full bg-notice px-4 py-1.5 text-[0.8125rem]">Wzór — egzemplarz z zamówienia testowego</p>
        )}
        <Logo className="mx-auto block h-3.5 w-auto text-brand" name={storeName} textClassName="eyebrow text-brand" />
        <h1 className="eyebrow mt-8 text-brass">Certyfikat autentyczności</h1>

        <p className="font-display tabular mt-10 flex items-baseline justify-center text-[clamp(5rem,3.5rem+7vw,8.5rem)] leading-none font-[280] tracking-tight">
          <span className="mr-3 text-[0.38em] text-ink-soft">Nº</span>
          {padNumber(piece.number, piece.size)}
        </p>
        {piece.size && (
          <p className="mt-3 text-[0.9375rem] text-ink-soft">
            egzemplarz z nakładu {piece.size} sztuk · {piece.editionTitle}
          </p>
        )}

        <p className="display-3 mt-10">{piece.productTitle}</p>

        {configuration.length > 0 && (
          <dl className="mx-auto mt-8 grid max-w-md gap-y-2 border-y border-line py-5 text-left text-[0.9375rem]">
            {configuration.map((row) => (
              <div className="grid grid-cols-[7.5rem_1fr] gap-4" key={row.label}>
                <dt className="text-ink-soft">{row.label}</dt>
                <dd>{row.value}</dd>
              </div>
            ))}
          </dl>
        )}

        {issued ? (
          <>
            {piece.owner && (
              <div className="mt-10">
                <p className="eyebrow">Właściciel</p>
                <p className="font-display mt-3 text-[clamp(1.75rem,1.4rem+1.4vw,2.5rem)] leading-tight italic">{piece.owner}</p>
              </div>
            )}
            <div className="mx-auto mt-12 grid max-w-md gap-8 text-[0.875rem] sm:grid-cols-2">
              <div>
                <p className="text-ink-faint">Wpis do rejestru</p>
                <p className="tabular mt-1">{formatRegistryDate(piece.createdAt)}</p>
              </div>
              <div>
                <p className="text-ink-faint">Numer w rejestrze</p>
                <p className="tabular mt-1">{piece.registry}</p>
              </div>
            </div>
            <div className="mx-auto mt-14 w-56 border-t border-ink pt-3">
              <p className="text-[0.8125rem] text-ink-soft">Atelier {storeName}</p>
            </div>
            <p className="mt-10 text-[0.75rem] break-all text-ink-faint">Autentyczność potwierdzisz pod adresem {verifyUrl}</p>
          </>
        ) : (
          <p className="mx-auto mt-10 max-w-[40ch] text-ink-soft">
            {order?.status === 'cancelled'
              ? 'Zamówienie z tym egzemplarzem zostało anulowane — certyfikat nie jest ważny.'
              : 'Egzemplarz jest zarezerwowany. Certyfikat wystawimy, gdy potwierdzimy zamówienie i zaksięgujemy płatność.'}
          </p>
        )}
      </article>

      {issued && (
        <div className="no-print mt-10 flex justify-center">
          <PrintButton />
        </div>
      )}
    </div>
  )
}
