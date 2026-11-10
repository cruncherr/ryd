import type { Payload } from 'payload'

import Link from 'next/link'

import { ORDER_STATUSES, PAYMENT_STATUSES, labelOf } from '@/lib/constants'
import { blockingProblems, getLaunchChecklist } from '@/lib/launch'
import { formatPLN } from '@/lib/money'

import './dashboard.css'

/**
 * Pulpit panelu: stan sklepu, lista kontrolna przed startem i ostatnie zamówienia.
 */
export default async function BeforeDashboard({ payload }: { payload: Payload }) {
  const [settings, checklist, recentOrders, newOrders, openMessages] = await Promise.all([
    payload.findGlobal({ slug: 'settings', depth: 0 }),
    getLaunchChecklist(payload),
    payload.find({ collection: 'orders', limit: 5, sort: '-createdAt', depth: 0 }),
    payload.count({ collection: 'orders', where: { status: { equals: 'new' } } }),
    payload.count({ collection: 'messages', where: { handled: { not_equals: true } } }),
  ])

  const isLive = settings.storeStatus === 'live'
  const problems = blockingProblems(checklist)
  const doneCount = checklist.filter((item) => item.done).length
  const dateFormat = new Intl.DateTimeFormat('pl-PL', { dateStyle: 'medium', timeStyle: 'short' })

  return (
    <div className="ryd-dash">
      <header className="ryd-dash__header">
        <div>
          <h2 className="ryd-dash__title">{settings.storeName || 'RYD'} — panel sklepu</h2>
          <p className="ryd-dash__lead">
            {isLive
              ? 'Sklep jest uruchomiony i przyjmuje zamówienia.'
              : problems.length > 0
                ? `Sklep działa w trybie testowym. Do uruchomienia zostało: ${problems.length} z ${
                    checklist.filter((item) => item.blocking).length
                  } obowiązkowych punktów.`
                : 'Wszystko gotowe. Możesz uruchomić sklep w Ustawieniach sklepu → Stan sklepu.'}
          </p>
        </div>
        <span className={`ryd-dash__status ${isLive ? 'is-live' : 'is-preparing'}`}>
          {isLive ? 'Sprzedaż włączona' : 'Tryb testowy'}
        </span>
      </header>

      <div className="ryd-dash__stats">
        <Link className="ryd-dash__stat" href="/admin/collections/orders?where[status][equals]=new">
          <span className="ryd-dash__stat-value">{newOrders.totalDocs}</span>
          <span className="ryd-dash__stat-label">nowe zamówienia</span>
        </Link>
        <Link className="ryd-dash__stat" href="/admin/collections/messages">
          <span className="ryd-dash__stat-value">{openMessages.totalDocs}</span>
          <span className="ryd-dash__stat-label">wiadomości do obsłużenia</span>
        </Link>
        <Link className="ryd-dash__stat" href="/" target="_blank">
          <span className="ryd-dash__stat-value">↗</span>
          <span className="ryd-dash__stat-label">zobacz sklep</span>
        </Link>
      </div>

      {!isLive && (
        <section className="ryd-dash__card">
          <h3 className="ryd-dash__card-title">
            Lista kontrolna przed startem
            <span className="ryd-dash__count">
              {doneCount} / {checklist.length}
            </span>
          </h3>
          <ul className="ryd-dash__list">
            {checklist.map((item) => (
              <li className={`ryd-dash__item ${item.done ? 'is-done' : ''}`} key={item.id}>
                <span aria-hidden="true" className="ryd-dash__check">
                  {item.done ? '✓' : ''}
                </span>
                <div className="ryd-dash__item-body">
                  <Link className="ryd-dash__item-label" href={item.href}>
                    {item.label}
                    {!item.blocking && <span className="ryd-dash__optional">zalecane</span>}
                  </Link>
                  {!item.done && <p className="ryd-dash__hint">{item.hint}</p>}
                </div>
              </li>
            ))}
          </ul>
        </section>
      )}

      <section className="ryd-dash__card">
        <h3 className="ryd-dash__card-title">Ostatnie zamówienia</h3>
        {recentOrders.docs.length === 0 ? (
          <p className="ryd-dash__empty">
            Nie ma jeszcze zamówień. Złóż zamówienie testowe w sklepie, żeby zobaczyć, jak wygląda cały proces.
          </p>
        ) : (
          <table className="ryd-dash__table">
            <thead>
              <tr>
                <th>Numer</th>
                <th>Data</th>
                <th>Klient</th>
                <th>Status</th>
                <th>Płatność</th>
                <th className="is-number">Kwota</th>
              </tr>
            </thead>
            <tbody>
              {recentOrders.docs.map((order) => (
                <tr key={order.id}>
                  <td>
                    <Link href={`/admin/collections/orders/${order.id}`}>{order.orderNumber}</Link>
                    {order.isTest && <span className="ryd-dash__optional">test</span>}
                  </td>
                  <td>{dateFormat.format(new Date(order.createdAt))}</td>
                  <td>{order.customerName}</td>
                  <td>{labelOf(ORDER_STATUSES, order.status)}</td>
                  <td>{labelOf(PAYMENT_STATUSES, order.paymentStatus)}</td>
                  <td className="is-number">{formatPLN(order.total)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>
    </div>
  )
}
