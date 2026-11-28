'use client'

import NumberFlow from '@number-flow/react'

import { cn } from '@/lib/cn'
import { freeNumbers, padNumber } from '@/lib/editions'

type Props = {
  size: number
  taken: number[]
  /** Wybrany numer; `undefined` — kolejny wolny, przydzielany przy zamówieniu. */
  value: number | undefined
  onChange: (value: number | undefined) => void
  disabled?: boolean
}

/**
 * Wybór numeru egzemplarza — jak miejsce na widowni: zajęte numery są przekreślone, wolne można
 * kliknąć. To zwykłe pola wyboru, więc działa też strzałkami na klawiaturze i z czytnikiem ekranu.
 */
export function NumberPicker({ size, taken, value, onChange, disabled = false }: Props) {
  const takenSet = new Set(taken)
  const firstFree = freeNumbers(size, taken)[0]
  const shown = value ?? firstFree
  const allocated = takenSet.size

  return (
    <div>
      <div className="flex items-end justify-between gap-4">
        <div>
          <p className="font-display tabular flex items-baseline text-[2.75rem] leading-none font-[340] tracking-tight">
            <span className="mr-1.5 text-[0.55em] text-ink-soft">Nº</span>
            {shown !== undefined ? (
              <NumberFlow format={{ minimumIntegerDigits: String(size).length > 2 ? 3 : 2, useGrouping: false }} value={shown} />
            ) : (
              '—'
            )}
            <span className="ml-2 text-[0.45em] text-ink-faint">/ {size}</span>
          </p>
          <p className="mt-2 max-w-[34ch] text-sm text-ink-soft" aria-live="polite">
            {value !== undefined
              ? 'Ten numer zapiszemy w rejestrze na Twoje nazwisko.'
              : 'Pierwszy wolny numer — przydzielimy go przy zamówieniu, chyba że wybierzesz inny.'}
          </p>
        </div>
        <p className="tabular shrink-0 text-right text-sm text-ink-soft">
          {allocated} z {size}
          <br />
          ma właścicieli
        </p>
      </div>

      <div
        aria-label="Numer egzemplarza"
        className={cn('mt-5 grid grid-cols-10 gap-1', size > 100 && 'max-h-80 overflow-y-auto pr-1')}
        role="radiogroup"
      >
        {Array.from({ length: size }, (_, index) => index + 1).map((number) => {
          const isTaken = takenSet.has(number)
          const label = padNumber(number, size)
          return (
            <label className={cn('relative', isTaken || disabled ? 'cursor-not-allowed' : 'cursor-pointer')} key={number}>
              <input
                aria-label={isTaken ? `Numer ${label} — ma już właściciela` : `Numer ${label}`}
                checked={value === number}
                className="peer sr-only"
                disabled={isTaken || disabled}
                name="numer-egzemplarza"
                onChange={() => onChange(number)}
                type="radio"
                value={number}
              />
              <span
                aria-hidden="true"
                className={cn(
                  'tabular grid h-9 place-items-center rounded-[7px] text-[0.8125rem] transition-[background-color,color,box-shadow,transform] duration-150 ease-out',
                  'shadow-[inset_0_0_0_1px_var(--color-line)] peer-checked:bg-brand peer-checked:text-paper peer-checked:shadow-none',
                  'peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-ink',
                  isTaken
                    ? 'text-ink-faint/60 line-through shadow-none'
                    : 'active:scale-95 hover:shadow-[inset_0_0_0_1px_var(--color-ink)]',
                )}
              >
                {label}
              </span>
            </label>
          )
        })}
      </div>

      <div className="mt-3 flex min-h-6 flex-wrap items-center justify-between gap-x-4 gap-y-1 text-sm text-ink-soft">
        <span className="inline-flex items-center gap-2">
          <span aria-hidden="true" className="tabular grid h-4 w-5 place-items-center text-[0.625rem] line-through">00</span>
          ma właściciela
        </span>
        {value !== undefined && (
          <button className="link-line text-ink" onClick={() => onChange(undefined)} type="button">
            Przydzielcie mi pierwszy wolny
          </button>
        )}
      </div>
    </div>
  )
}
