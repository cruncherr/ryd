'use client'

import { Check, Copy } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useEffect, useRef, useState, useTransition } from 'react'

import { Button } from '@/components/ui/Button'
import { useCart } from '@/lib/cart/store'
import { cn } from '@/lib/cn'
import { startOnlinePayment } from '@/lib/orders/actions'

import { clearDraft, consumeOrderPlaced } from './draft'

/**
 * Po przejściu z formularza zamówienia opróżnia koszyk — dopiero tutaj, żeby podsumowanie
 * nie znikało klientowi sprzed oczu w trakcie przechodzenia na tę stronę.
 * Późniejsze wejścia z odnośnika w e-mailu nie ruszają nowego koszyka.
 */
export function OrderPlacedEffects() {
  useEffect(() => {
    if (!consumeOrderPlaced()) return
    clearDraft()
    // Koszyk mógł jeszcze nie zostać wczytany z pamięci przeglądarki — czyścimy również zapis.
    const clear = () => useCart.getState().clear()
    if (useCart.persist.hasHydrated()) clear()
    else void Promise.resolve(useCart.persist.rehydrate()).then(clear)
  }, [])

  return null
}

/** Przycisk „Kopiuj" przy danych do przelewu, z krótkim potwierdzeniem. */
export function CopyButton({ value, label }: { value: string; label: string }) {
  const [copied, setCopied] = useState(false)
  const timer = useRef<number | null>(null)

  useEffect(
    () => () => {
      if (timer.current !== null) window.clearTimeout(timer.current)
    },
    [],
  )

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(value)
    } catch {
      // Starsze przeglądarki lub brak uprawnień: zaznaczenie i skopiowanie ręczne nadal działa.
      return
    }
    setCopied(true)
    if (timer.current !== null) window.clearTimeout(timer.current)
    timer.current = window.setTimeout(() => setCopied(false), 1800)
  }

  return (
    <button
      aria-label={copied ? `Skopiowano: ${label}` : `Kopiuj: ${label}`}
      className={cn(
        'pressable inline-flex h-9 shrink-0 items-center gap-1.5 rounded-full border px-3 text-[0.8125rem] font-medium transition-[transform,background-color,border-color,color] duration-150',
        copied ? 'border-success/40 bg-success/10 text-success' : 'border-line-strong bg-surface text-ink hover:border-ink',
      )}
      onClick={copy}
      type="button"
    >
      <span className="inline-flex animate-[label-swap_180ms_var(--ease-out)_both] items-center gap-1.5" key={copied ? 'ok' : 'copy'}>
        {copied ? <Check aria-hidden="true" size={14} strokeWidth={2.25} /> : <Copy aria-hidden="true" size={14} strokeWidth={1.75} />}
        {copied ? 'Skopiowano' : 'Kopiuj'}
      </span>
    </button>
  )
}

/** „Zapłać online" — rozpoczyna płatność za złożone zamówienie i przenosi na stronę operatora. */
export function PayOnlineButton({ token, label = 'Zapłać online' }: { token: string; label?: string }) {
  const [isPending, startTransition] = useTransition()
  const [leaving, setLeaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const pay = () => {
    if (isPending || leaving) return
    setError(null)
    startTransition(async () => {
      try {
        const result = await startOnlinePayment(token)
        if (result.ok) {
          setLeaving(true)
          window.location.assign(result.url)
        } else {
          setError(result.message)
        }
      } catch {
        setError('Nie udało się połączyć ze sklepem. Sprawdź połączenie z internetem i spróbuj ponownie.')
      }
    })
  }

  return (
    <div>
      <Button loading={isPending || leaving} onClick={pay} size="lg">
        {label}
      </Button>
      {error && (
        <p className="field-message text-danger" role="alert">
          {error}
        </p>
      )}
    </div>
  )
}

/**
 * Po powrocie ze strony płatności potwierdzenie od operatora potrafi przyjść z opóźnieniem.
 * Przez około minutę strona sama sprawdza stan płatności, żeby klient nie musiał jej odświeżać.
 */
export function PaymentStatusPoller({ attempts = 10, intervalMs = 6000 }: { attempts?: number; intervalMs?: number }) {
  const router = useRouter()

  useEffect(() => {
    let remaining = attempts
    const timer = window.setInterval(() => {
      remaining -= 1
      if (remaining < 0) {
        window.clearInterval(timer)
        return
      }
      if (document.visibilityState === 'visible') router.refresh()
    }, intervalMs)
    return () => window.clearInterval(timer)
  }, [attempts, intervalMs, router])

  return null
}
