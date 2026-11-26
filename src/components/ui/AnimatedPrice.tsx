'use client'

import NumberFlow from '@number-flow/react'

import { cn } from '@/lib/cn'

/** Kwota, której cyfry płynnie się przewijają przy zmianie (ilość w koszyku, opcje konfiguratora). */
export function AnimatedPrice({ value, className }: { value: number; className?: string }) {
  const hasGrosze = Math.round(value * 100) % 100 !== 0
  return (
    <NumberFlow
      className={cn('tabular', className)}
      format={{
        style: 'currency',
        currency: 'PLN',
        useGrouping: 'always',
        minimumFractionDigits: hasGrosze ? 2 : 0,
        maximumFractionDigits: hasGrosze ? 2 : 0,
      }}
      locales="pl-PL"
      value={value}
    />
  )
}
