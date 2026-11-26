'use client'

import { useRowLabel } from '@payloadcms/ui'

/**
 * Czytelne nagłówki wierszy w panelu: zamiast „Kolor 01” widać „Grafitowy · 8 zdjęć”.
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

export function FabricColorRowLabel() {
  const { data, rowNumber } = useRowLabel<{ name?: string; code?: string; swatchColor?: string; available?: boolean }>()
  return (
    <Label>
      {data?.swatchColor && (
        <span
          aria-hidden="true"
          style={{
            display: 'inline-block',
            width: 12,
            height: 12,
            borderRadius: 999,
            background: data.swatchColor,
            marginRight: 8,
            verticalAlign: '-1px',
            boxShadow: 'inset 0 0 0 1px rgb(0 0 0 / 0.15)',
          }}
        />
      )}
      {data?.name || `Kolor ${pad(rowNumber)}`}
      {data?.code ? ` · ${data.code}` : ''}
      {data?.available === false ? ' · wyłączony' : ''}
    </Label>
  )
}

export function SizeRowLabel() {
  const { data, rowNumber } = useRowLabel<{ label?: string; width?: number; depth?: number; priceDelta?: number }>()
  if (!data?.label) return <Label>{`Wymiar ${pad(rowNumber)}`}</Label>
  const size = data.width && data.depth ? ` · ${data.width} × ${data.depth} cm` : ''
  const delta = typeof data.priceDelta === 'number' && data.priceDelta !== 0 ? ` · ${data.priceDelta > 0 ? '+' : '−'}${Math.abs(data.priceDelta)} zł` : ''
  return <Label>{`${data.label}${size}${delta}`}</Label>
}

export function OptionRowLabel() {
  const { data, rowNumber } = useRowLabel<{ name?: string; priceDelta?: number }>()
  if (!data?.name) return <Label>{`Opcja ${pad(rowNumber)}`}</Label>
  const delta = typeof data.priceDelta === 'number' && data.priceDelta !== 0 ? ` · +${data.priceDelta} zł` : ''
  return <Label>{`${data.name}${delta}`}</Label>
}
