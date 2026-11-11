import { CreditCard, RotateCcw, Truck } from 'lucide-react'
import Link from 'next/link'
import type { ReactNode } from 'react'

import { LEGAL_SLUGS } from '@/lib/constants'
import { formatPLN } from '@/lib/money'
import type { Setting, ShippingMethod } from '@/payload-types'

function Row({ icon, title, text }: { icon: ReactNode; title: ReactNode; text?: ReactNode }) {
  return (
    <li className="flex gap-3.5 py-3.5">
      <span aria-hidden="true" className="mt-0.5 text-ink-soft">
        {icon}
      </span>
      <div className="text-sm">
        <p className="font-medium">{title}</p>
        {text && <p className="mt-0.5 text-ink-soft">{text}</p>}
      </div>
    </li>
  )
}

/** Krótkie odpowiedzi na trzy pytania przed zakupem: dostawa, zwrot, płatność. */
export function PurchaseInfo({ settings, shippingMethods }: { settings: Setting; shippingMethods: ShippingMethod[] }) {
  const cheapest = shippingMethods.reduce<number | null>(
    (lowest, method) => (lowest === null || method.price < lowest ? method.price : lowest),
    null,
  )
  const payments = [
    settings.payments?.onlineEnabled ? 'BLIK, szybki przelew, karta' : null,
    settings.payments?.transferEnabled ? 'przelew tradycyjny' : null,
    settings.payments?.codEnabled ? 'przy odbiorze' : null,
  ].filter(Boolean)

  return (
    <ul className="mt-8 divide-y divide-line border-y border-line">
      {cheapest !== null && (
        <Row
          icon={<Truck size={19} strokeWidth={1.5} />}
          text={
            <Link className="link-line" href={`/${LEGAL_SLUGS.delivery}`}>
              Jak dostarczamy meble
            </Link>
          }
          title={cheapest > 0 ? `Dostawa od ${formatPLN(cheapest)}` : 'Bezpłatna dostawa'}
        />
      )}
      <Row
        icon={<RotateCcw size={19} strokeWidth={1.5} />}
        text={
          <Link className="link-line" href={`/${LEGAL_SLUGS.returns}`}>
            Zasady zwrotów i reklamacji
          </Link>
        }
        title="14 dni na zwrot"
      />
      {payments.length > 0 && (
        <Row icon={<CreditCard size={19} strokeWidth={1.5} />} title={`Płatność: ${payments.join(', ')}`} />
      )}
    </ul>
  )
}
