import type { PriceView } from '@/lib/catalog'
import { cn } from '@/lib/cn'
import { discountPercent, formatPLN } from '@/lib/money'

type Props = {
  price: PriceView
  /** `card` — zwięźle na liście produktów; `full` — na stronie produktu, z informacją o najniższej cenie. */
  mode?: 'card' | 'full'
  note?: string | null
  className?: string
}

export function Price({ price, mode = 'card', note, className }: Props) {
  const onSale = price.regular !== null

  if (mode === 'card') {
    return (
      <p className={cn('tabular flex flex-wrap items-baseline justify-end gap-x-2', className)}>
        {onSale && (
          <s className="text-sm text-ink-faint">
            <span className="sr-only">Cena regularna: </span>
            {formatPLN(price.regular ?? 0)}
          </s>
        )}
        <span className={cn('font-medium', onSale && 'text-accent')}>
          {onSale && <span className="sr-only">Cena promocyjna: </span>}
          {formatPLN(price.current)}
        </span>
      </p>
    )
  }

  return (
    <div className={cn('tabular', className)}>
      <p className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
        <span className={cn('text-[1.75rem] leading-none font-medium tracking-tight', onSale && 'text-accent')}>
          {onSale && <span className="sr-only">Cena promocyjna: </span>}
          {formatPLN(price.current)}
        </span>
        {onSale && (
          <>
            <s className="text-lg text-ink-faint">
              <span className="sr-only">Cena regularna: </span>
              {formatPLN(price.regular ?? 0)}
            </s>
            <span className="rounded-full bg-accent px-2.5 py-1 text-xs font-semibold text-white">
              −{discountPercent(price.regular ?? 0, price.current)}%
            </span>
          </>
        )}
      </p>
      {onSale && price.lowest30 !== null && (
        <p className="mt-2 text-sm text-ink-soft">Najniższa cena z 30 dni przed obniżką: {formatPLN(price.lowest30)}</p>
      )}
      {note && <p className="mt-1.5 text-sm text-ink-soft">{note}</p>}
    </div>
  )
}
