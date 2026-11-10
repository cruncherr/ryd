'use client'

import { useRowLabel } from '@payloadcms/ui'

/**
 * Czytelne nagłówki wierszy w panelu: zamiast „Kolor 01" widać „Grafitowy · 8 zdjęć".
 */

function Label({ children }: { children: React.ReactNode }) {
  return <span style={{ fontWeight: 500 }}>{children}</span>
}

const pad = (rowNumber: number | undefined) => String((rowNumber ?? 0) + 1).padStart(2, '0')

function photosLabel(count: number): string {
  if (count === 1) return '1 zdjęcie'
  const lastDigit = count % 10
  const lastTwo = count % 100
  if (lastDigit >= 2 && lastDigit <= 4 && (lastTwo < 12 || lastTwo > 14)) return `${count} zdjęcia`
  return `${count} zdjęć`
}

export function VariantRowLabel() {
  const { data, rowNumber } = useRowLabel<{ name?: string; images?: unknown[]; available?: boolean }>()
  const count = Array.isArray(data?.images) ? data.images.length : 0
  return (
    <Label>
      {data?.name || `Kolor ${pad(rowNumber)}`}
      {count > 0 ? ` · ${photosLabel(count)}` : ''}
      {data?.available === false ? ' · wyłączony' : ''}
    </Label>
  )
}

export function FunctionViewRowLabel() {
  const { data, rowNumber } = useRowLabel<{ label?: string }>()
  return <Label>{data?.label || `Widok ${pad(rowNumber)}`}</Label>
}

export function TitleRowLabel() {
  const { data, rowNumber } = useRowLabel<{ title?: string }>()
  return <Label>{data?.title || `Pozycja ${pad(rowNumber)}`}</Label>
}

export function SpecRowLabel() {
  const { data, rowNumber } = useRowLabel<{ label?: string; value?: string }>()
  if (!data?.label) return <Label>{`Pozycja ${pad(rowNumber)}`}</Label>
  return <Label>{data.value ? `${data.label}: ${data.value}` : data.label}</Label>
}

export function NavRowLabel() {
  const { data, rowNumber } = useRowLabel<{ label?: string; url?: string }>()
  if (!data?.label) return <Label>{`Pozycja ${pad(rowNumber)}`}</Label>
  return <Label>{data.url ? `${data.label} → ${data.url}` : data.label}</Label>
}

export function OrderItemRowLabel() {
  const { data, rowNumber } = useRowLabel<{ title?: string; variantName?: string; quantity?: number }>()
  if (!data?.title) return <Label>{`Pozycja ${pad(rowNumber)}`}</Label>
  return (
    <Label>
      {data.quantity ? `${data.quantity} × ` : ''}
      {data.title}
      {data.variantName ? ` · ${data.variantName}` : ''}
    </Label>
  )
}
