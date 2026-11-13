import type { UIFieldServerProps } from 'payload'

import { ResendEmailsButton } from './ResendEmailsButton'

import './dashboard.css'

/**
 * Boczny panel zamówienia: odnośnik do strony, którą widzi klient, oraz historia wiadomości
 * e-mail wysłanych w sprawie tego zamówienia — żeby było jasne, czy potwierdzenie na pewno wyszło.
 */

const EMAIL_LABELS: Record<string, string> = {
  confirmation: 'Potwierdzenie dla klienta',
  owner: 'Powiadomienie dla sklepu',
  paid: 'Płatność zaksięgowana',
  shipped: 'Informacja o wysyłce',
}

const STATUS_LABELS: Record<string, { text: string; tone: 'ok' | 'warn' | 'error' }> = {
  sent: { text: 'wysłano', tone: 'ok' },
  skipped: { text: 'nie wysłano — poczta sklepu nie jest podłączona', tone: 'warn' },
  failed: { text: 'błąd wysyłki — sprawdź ustawienia poczty', tone: 'error' },
}

const dateFormat = new Intl.DateTimeFormat('pl-PL', { dateStyle: 'medium', timeStyle: 'short', timeZone: 'Europe/Warsaw' })

type LogEntry = { status?: string; at?: string }

export default function OrderSidebar({ data, id }: UIFieldServerProps) {
  const token = typeof data?.accessToken === 'string' ? data.accessToken : null
  const log = data?.emailsSent && typeof data.emailsSent === 'object' && !Array.isArray(data.emailsSent) ? (data.emailsSent as Record<string, LogEntry>) : {}
  const entries = Object.keys(EMAIL_LABELS)
    .map((key) => ({ key, entry: log[key] }))
    .filter((item): item is { key: string; entry: LogEntry } => Boolean(item.entry?.status))

  // Nowe, jeszcze niezapisane zamówienie nie ma ani strony, ani historii.
  if (!token && entries.length === 0) return null

  return (
    <div className="ryd-order-side">
      {token && (
        <a className="ryd-order-side__link" href={`/zamowienie/potwierdzenie/${token}`} rel="noopener noreferrer" target="_blank">
          Zobacz stronę zamówienia klienta ↗
        </a>
      )}

      <p className="ryd-order-side__title">Wiadomości e-mail</p>
      {entries.length === 0 ? (
        <p className="ryd-order-side__empty">Brak wysłanych wiadomości.</p>
      ) : (
        <ul className="ryd-order-side__list">
          {entries.map(({ key, entry }) => {
            const status = STATUS_LABELS[entry.status ?? ''] ?? { text: entry.status ?? '', tone: 'warn' as const }
            return (
              <li key={key}>
                <span className="ryd-order-side__name">{EMAIL_LABELS[key]}</span>
                <span className={`ryd-order-side__status is-${status.tone}`}>
                  {status.text}
                  {entry.at ? ` · ${dateFormat.format(new Date(entry.at))}` : ''}
                </span>
              </li>
            )
          })}
        </ul>
      )}
      {/* Ponowna wysyłka ma sens tylko wtedy, gdy potwierdzenie albo powiadomienie nie wyszło. */}
      {id !== undefined && ['confirmation', 'owner'].some((key) => log[key]?.status && log[key]?.status !== 'sent') && (
        <ResendEmailsButton orderId={id} />
      )}
    </div>
  )
}
