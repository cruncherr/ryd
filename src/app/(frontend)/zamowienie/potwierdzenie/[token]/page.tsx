import { Check } from 'lucide-react'
import type { Metadata } from 'next'
import Image from 'next/image'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import type { ReactNode } from 'react'

import { CopyButton, OrderPlacedEffects, PaymentStatusPoller, PayOnlineButton } from '@/components/checkout/OrderClient'
import { buttonClass } from '@/components/ui/Button'
import { cn } from '@/lib/cn'
import { labelOf, ORDER_STATUSES, PAYMENT_METHODS } from '@/lib/constants'
import { safeTrackingUrl } from '@/lib/email/templates'
import { isOnlinePaymentConfigured } from '@/lib/launch'
import { formatPLN } from '@/lib/money'
import { findOrderByToken } from '@/lib/orders/find'
import {
  addressLines,
  canPayOnline,
  customerFullName,
  formatOrderDate,
  invoiceLines,
  orderItemImage,
  shippingLabel,
  transferDetails,
} from '@/lib/orders/view'
import { refreshPaymentStatus } from '@/lib/payments/stripe'
import { getPayloadClient } from '@/lib/payload'
import { getSettings } from '@/lib/queries'
import { formatPhone } from '@/lib/validation'
import type { Order, Setting } from '@/payload-types'

// Strona pokazuje dane jednego klienta i aktualny stan płatności — nigdy nie jest zapisywana na zapas.
export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  title: 'Twoje zamówienie',
  robots: { index: false, follow: false },
  referrer: 'same-origin',
}

const DAY = 24 * 60 * 60 * 1000
/** Po tym czasie strona przestaje pokazywać adres i dane kontaktowe — zostaje sam stan zamówienia. */
const DETAILS_VISIBLE_FOR = 60 * DAY
const FRESH_FOR = 30 * 60 * 1000

type StepState = 'done' | 'current' | 'upcoming'
type Step = { title: string; text: string; state: StepState }

function orderSteps(order: Order, detailed: boolean): Step[] {
  const paid = order.paymentStatus === 'paid'
  const cod = order.paymentMethod === 'cod'
  const shipped = order.status === 'shipped' || order.status === 'completed'
  const phone = detailed ? formatPhone(order.phone) : ''

  const paymentStep: Step = cod
    ? { title: 'Płatność przy odbiorze', text: `Zapłacisz ${formatPLN(order.total)} przy dostawie.`, state: shipped ? 'done' : 'upcoming' }
    : paid
      ? { title: 'Płatność zaksięgowana', text: `Otrzymaliśmy ${formatPLN(order.total)}. Dziękujemy!`, state: 'done' }
      : order.paymentMethod === 'transfer'
        ? { title: 'Czekamy na przelew', text: 'Realizację rozpoczniemy, gdy wpłata pojawi się na naszym koncie.', state: 'current' }
        : { title: 'Czekamy na płatność', text: 'Gdy tylko operator potwierdzi płatność, przystąpimy do realizacji.', state: 'current' }

  const tracking = order.trackingNumber?.trim()

  return [
    {
      title: 'Zamówienie przyjęte',
      text: detailed ? `Potwierdzenie wysłaliśmy na adres ${order.email}.` : 'Potwierdzenie wysłaliśmy e-mailem.',
      state: 'done',
    },
    paymentStep,
    {
      title: 'Przygotowanie zamówienia',
      text: 'Gdy Twój mebel będzie gotowy do wysyłki, damy Ci znać e-mailem.',
      state: shipped ? 'done' : paid || cod ? 'current' : 'upcoming',
    },
    {
      title: order.status === 'completed' ? 'Dostarczone' : shipped ? 'W drodze do Ciebie' : 'Dostawa',
      text: shipped
        ? [order.shippingMethodName, tracking ? `Numer przesyłki: ${tracking}.` : ''].filter(Boolean).join('. ').replace(/\.\.$/, '.')
        : phone
          ? `${order.shippingMethodName}. Przewoźnik zadzwoni pod numer ${phone}, żeby umówić termin.`
          : `${order.shippingMethodName}. Przewoźnik zadzwoni, żeby umówić termin.`,
      state: order.status === 'completed' ? 'done' : shipped ? 'current' : 'upcoming',
    },
  ]
}

function StepList({ steps }: { steps: Step[] }) {
  return (
    <ol className="relative">
      {steps.map((step, index) => (
        <li className="relative flex gap-5 pb-8 last:pb-0" key={step.title}>
          {index < steps.length - 1 && (
            <span aria-hidden="true" className={cn('absolute top-7 bottom-0 left-[0.6875rem] w-px', step.state === 'done' ? 'bg-ink' : 'bg-line-strong')} />
          )}
          <span
            aria-hidden="true"
            className={cn(
              'relative mt-0.5 grid size-[1.4375rem] shrink-0 place-items-center rounded-full border',
              step.state === 'done' && 'border-ink bg-ink text-paper',
              step.state === 'current' && 'border-ink bg-paper',
              step.state === 'upcoming' && 'border-line-strong bg-paper',
            )}
          >
            {step.state === 'done' && <Check size={13} strokeWidth={2.75} />}
            {step.state === 'current' && <span className="size-2 rounded-full bg-accent" />}
          </span>
          <div className={cn(step.state === 'upcoming' && 'text-ink-soft')}>
            <p className="font-medium text-ink">
              {step.title}
              {step.state === 'current' && <span className="sr-only"> (obecny etap)</span>}
              {step.state === 'done' && <span className="sr-only"> (zakończone)</span>}
            </p>
            <p className="mt-1 text-[0.9375rem] leading-relaxed text-ink-soft">{step.text}</p>
          </div>
        </li>
      ))}
    </ol>
  )
}

function Notice({ tone = 'neutral', children }: { tone?: 'neutral' | 'warning' | 'success'; children: ReactNode }) {
  return (
    <div
      className={cn(
        'rounded-[var(--radius-field)] px-5 py-4 text-[0.9375rem] leading-relaxed',
        tone === 'neutral' && 'bg-stage',
        tone === 'warning' && 'bg-notice',
        tone === 'success' && 'bg-success/10 text-success',
      )}
      role={tone === 'warning' ? 'status' : undefined}
    >
      {children}
    </div>
  )
}

function TransferRow({ label, value, copyValue }: { label: string; value: string; copyValue?: string }) {
  if (!value) return null
  return (
    <div className="flex items-center justify-between gap-4 border-b border-line py-3.5 last:border-b-0">
      <div className="min-w-0">
        <dt className="text-[0.8125rem] text-ink-soft">{label}</dt>
        <dd className="tabular mt-0.5 font-medium break-words">{value}</dd>
      </div>
      {copyValue && <CopyButton label={label} value={copyValue} />}
    </div>
  )
}

function PaymentPanel({ order, settings, token, paymentNote }: { order: Order; settings: Setting; token: string; paymentNote: string | null }) {
  const onlineReady = isOnlinePaymentConfigured()

  if (order.paymentMethod === 'transfer' && order.paymentStatus !== 'paid') {
    const details = transferDetails(order, settings)
    return (
      <section aria-labelledby="platnosc" className="rounded-[var(--radius-panel)] bg-stage p-6 md:p-8">
        <h2 className="display-4" id="platnosc">
          Dane do przelewu
        </h2>
        {details ? (
          <>
            <dl className="mt-4">
              <TransferRow label="Odbiorca" value={details.recipient} />
              <TransferRow copyValue={details.account.replace(/\s+/g, '')} label="Numer rachunku" value={details.account} />
              <TransferRow label="Bank" value={details.bank} />
              <TransferRow copyValue={details.title} label="Tytuł przelewu" value={details.title} />
              <TransferRow copyValue={details.amount.toFixed(2).replace('.', ',')} label="Kwota" value={formatPLN(details.amount)} />
            </dl>
            <p className="mt-4 text-sm text-ink-soft">
              Te same dane wysłaliśmy e-mailem. Realizację zamówienia rozpoczniemy po zaksięgowaniu wpłaty.
            </p>
          </>
        ) : (
          <p className="mt-3 text-ink-soft">Dane do przelewu prześlemy w osobnej wiadomości e-mail.</p>
        )}
      </section>
    )
  }

  if (canPayOnline(order)) {
    return (
      <section aria-labelledby="platnosc" className="rounded-[var(--radius-panel)] bg-stage p-6 md:p-8">
        <h2 className="display-4" id="platnosc">
          {order.paymentStatus === 'failed' ? 'Płatność się nie powiodła' : 'Zamówienie czeka na płatność'}
        </h2>
        <p className="mt-3 text-ink-soft">
          {paymentNote ?? `Do zapłaty: ${formatPLN(order.total)}. Zapłacisz BLIK-iem, szybkim przelewem lub kartą na bezpiecznej stronie operatora płatności.`}
        </p>
        <div className="mt-6">
          {onlineReady ? (
            <PayOnlineButton label={`Zapłać ${formatPLN(order.total)}`} token={token} />
          ) : (
            <p className="text-sm text-ink-soft">Płatności online są chwilowo niedostępne — skontaktuj się z nami, a podamy inny sposób zapłaty.</p>
          )}
        </div>
      </section>
    )
  }

  return null
}

function ItemList({ order }: { order: Order }) {
  return (
    <ul className="border-y border-line">
      {order.items.map((item, index) => {
        const image = orderItemImage(item)
        return (
          <li className="flex items-center gap-4 border-b border-line py-4 last:border-b-0" key={item.id ?? index}>
            <div className="relative aspect-[4/3] w-20 shrink-0 overflow-hidden rounded-lg bg-stage">
              {image && <Image alt="" className="packshot" fill sizes="80px" src={image} />}
            </div>
            <div className="min-w-0 flex-1">
              <p className="leading-snug font-medium">{item.title}</p>
              <p className="mt-0.5 text-sm text-ink-soft">{[item.variantName, `${item.quantity} szt.`].filter(Boolean).join(' · ')}</p>
            </div>
            <p className="tabular shrink-0 font-medium">{formatPLN(item.lineTotal)}</p>
          </li>
        )
      })}
    </ul>
  )
}

function DetailBlock({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div>
      <h3 className="eyebrow">{title}</h3>
      <div className="mt-2 text-[0.9375rem] leading-relaxed">{children}</div>
    </div>
  )
}

export default async function OrderConfirmationPage({ params, searchParams }: PageProps<'/zamowienie/potwierdzenie/[token]'>) {
  const [{ token }, query] = await Promise.all([params, searchParams])
  const payload = await getPayloadClient()

  let order = await findOrderByToken(payload, token)
  if (!order) notFound()

  // Klient mógł właśnie wrócić ze strony płatności — pytamy operatora, czy pieniądze już dotarły.
  if (canPayOnline(order) && order.stripeSessionId && isOnlinePaymentConfigured()) {
    const outcome = await refreshPaymentStatus(payload, order)
    if (outcome === 'paid') order = (await findOrderByToken(payload, token)) ?? order
  }

  const settings = await getSettings()
  const createdAt = new Date(order.createdAt).getTime()
  const age = Date.now() - createdAt
  const detailed = age < DETAILS_VISIBLE_FOR
  const fresh = age < FRESH_FOR
  const cancelled = order.status === 'cancelled'
  const paid = order.paymentStatus === 'paid'
  const paymentParam = Array.isArray(query.platnosc) ? query.platnosc[0] : query.platnosc
  const awaitingOnline = canPayOnline(order)

  const paymentNote =
    paymentParam === 'anulowana'
      ? 'Płatność nie została dokończona. Zamówienie jest zapisane — możesz zapłacić teraz albo wrócić tu później z odnośnika w e-mailu.'
      : paymentParam === 'blad'
        ? 'Nie udało się połączyć z operatorem płatności. Zamówienie jest zapisane — spróbuj zapłacić ponownie.'
        : paymentParam === 'ok'
          ? 'Czekamy na potwierdzenie od operatora płatności — zwykle trwa to do kilku minut. Tę stronę można bezpiecznie zamknąć: potwierdzenie wyślemy e-mailem.'
          : null

  const heading = cancelled ? 'Zamówienie anulowane' : fresh ? 'Dziękujemy za zamówienie' : `Zamówienie ${order.orderNumber}`
  const invoice = detailed ? invoiceLines(order) : []
  const trackingUrl = safeTrackingUrl(order.trackingUrl)
  const contactEmail = settings.contact?.email
  const contactPhone = settings.contact?.phone

  return (
    <div className="shell pt-8 pb-20 md:pt-14 md:pb-28">
      <OrderPlacedEffects
        purchase={
          order.isTest || cancelled
            ? null
            : {
                number: order.orderNumber,
                total: order.total,
                shipping: order.shippingCost,
                items: order.items.map((item) => ({
                  id: typeof item.product === 'object' && item.product ? item.product.id : (item.product ?? item.title),
                  name: item.title,
                  variant: item.variantName,
                  price: item.unitPrice,
                  quantity: item.quantity,
                })),
              }
        }
      />
      {awaitingOnline && paymentParam === 'ok' && <PaymentStatusPoller />}

      <div className="max-w-3xl">
        <p className="eyebrow">
          {fresh && !cancelled ? `Zamówienie ${order.orderNumber}` : labelOf(ORDER_STATUSES, order.status)} · {formatOrderDate(order.createdAt)}
        </p>
        <h1 className="display-1 mt-4 text-[clamp(2.5rem,1.5rem+3.6vw,4.5rem)]">{heading}</h1>
        {!cancelled && fresh && (
          <p className="lead mt-5">
            Przyjęliśmy Twoje zamówienie{detailed ? (
              <>
                {' '}
                i wysłaliśmy potwierdzenie na adres <strong className="font-medium text-ink">{order.email}</strong>
              </>
            ) : null}
            . Jeśli wiadomości nie ma w skrzynce, zajrzyj do folderu ze spamem.
          </p>
        )}
        {cancelled && <p className="lead mt-5">To zamówienie zostało anulowane i nie będzie realizowane. Jeśli to pomyłka — skontaktuj się z nami.</p>}
      </div>

      {order.isTest && (
        <div className="mt-8 max-w-3xl">
          <Notice tone="warning">
            <strong className="font-medium">Zamówienie testowe.</strong> Sklep działa w trybie przygotowania — to zamówienie nie zostanie zrealizowane.
          </Notice>
        </div>
      )}

      <div className="mt-10 grid gap-x-16 gap-y-12 md:mt-14 lg:grid-cols-12">
        <div className="space-y-10 lg:col-span-7">
          {!cancelled && paid && paymentParam === 'ok' && (
            <Notice tone="success">
              <strong className="font-medium">Płatność zaksięgowana.</strong> Dziękujemy — przystępujemy do realizacji zamówienia.
            </Notice>
          )}

          {!cancelled && <PaymentPanel order={order} paymentNote={paymentNote} settings={settings} token={token} />}

          {!cancelled && (
            <section aria-labelledby="co-dalej">
              <h2 className="display-4 border-b border-line pb-4" id="co-dalej">
                Co dalej
              </h2>
              <div className="mt-7">
                <StepList steps={orderSteps(order, detailed)} />
              </div>
              {trackingUrl && (order.status === 'shipped' || order.status === 'completed') && (
                <a className={buttonClass({ variant: 'secondary', className: 'mt-7' })} href={trackingUrl} rel="noopener noreferrer" target="_blank">
                  Śledź przesyłkę
                </a>
              )}
            </section>
          )}

          <section aria-labelledby="pomoc" className="border-t border-line pt-8">
            <h2 className="display-4" id="pomoc">
              Masz pytania?
            </h2>
            <p className="mt-3 max-w-xl text-ink-soft">
              Chętnie pomożemy — podaj numer zamówienia <strong className="font-medium text-ink">{order.orderNumber}</strong>.
            </p>
            <div className="mt-5 flex flex-wrap gap-x-8 gap-y-2 text-[0.9375rem]">
              {contactEmail && (
                <a className="link-line" href={`mailto:${contactEmail}?subject=${encodeURIComponent(`Zamówienie ${order.orderNumber}`)}`}>
                  {contactEmail}
                </a>
              )}
              {contactPhone && (
                <a className="link-line" href={`tel:${contactPhone.replace(/[^\d+]/g, '')}`}>
                  {formatPhone(contactPhone) || contactPhone}
                </a>
              )}
              <Link className="link-line" href="/sklep">
                Wróć do sklepu
              </Link>
            </div>
          </section>
        </div>

        <aside aria-label="Podsumowanie zamówienia" className="lg:col-span-5">
          <div className="rounded-[var(--radius-panel)] bg-stage p-6 md:p-8 lg:sticky lg:top-28">
            <div className="flex items-baseline justify-between gap-4">
              <h2 className="display-4">Podsumowanie</h2>
              <p className="tabular text-sm text-ink-soft">{order.orderNumber}</p>
            </div>

            <div className="mt-5">
              <ItemList order={order} />
            </div>

            <dl className="mt-5 space-y-2 text-[0.9375rem]">
              <div className="flex items-baseline justify-between gap-4">
                <dt className="text-ink-soft">Produkty</dt>
                <dd className="tabular">{formatPLN(order.subtotal)}</dd>
              </div>
              <div className="flex items-baseline justify-between gap-4">
                <dt className="text-ink-soft">{shippingLabel(order.shippingMethodName)}</dt>
                <dd className="tabular shrink-0">{order.shippingCost > 0 ? formatPLN(order.shippingCost) : 'bezpłatnie'}</dd>
              </div>
              {order.paymentFee != null && order.paymentFee > 0 && (
                <div className="flex items-baseline justify-between gap-4">
                  <dt className="text-ink-soft">Płatność przy odbiorze</dt>
                  <dd className="tabular">{formatPLN(order.paymentFee)}</dd>
                </div>
              )}
              <div className="flex items-baseline justify-between gap-4 border-t border-line pt-4">
                <dt className="font-medium">{paid ? 'Zapłacono' : 'Do zapłaty'}</dt>
                <dd className="tabular font-display text-[1.75rem] leading-none">{formatPLN(order.total)}</dd>
              </div>
            </dl>
            {settings.priceNote && <p className="mt-1 text-right text-sm text-ink-soft">{settings.priceNote}</p>}

            <div className="mt-7 grid gap-6 border-t border-line pt-6 sm:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2">
              <DetailBlock title="Płatność">{labelOf(PAYMENT_METHODS, order.paymentMethod)}</DetailBlock>
              {detailed && (
                <DetailBlock title="Adres dostawy">
                  {customerFullName(order)}
                  {addressLines(order).map((line) => (
                    <span className="block" key={line}>
                      {line}
                    </span>
                  ))}
                  <span className="block text-ink-soft">{formatPhone(order.phone)}</span>
                </DetailBlock>
              )}
              {invoice.length > 0 && (
                <DetailBlock title="Dane do faktury">
                  {invoice.map((line) => (
                    <span className="block" key={line}>
                      {line}
                    </span>
                  ))}
                </DetailBlock>
              )}
              {detailed && order.customerNote && (
                <DetailBlock title="Twoje uwagi">
                  <span className="whitespace-pre-line">{order.customerNote}</span>
                </DetailBlock>
              )}
            </div>
          </div>
        </aside>
      </div>
    </div>
  )
}
