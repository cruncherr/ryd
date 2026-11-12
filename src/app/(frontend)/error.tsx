'use client'

import Link from 'next/link'
import { useEffect } from 'react'

import { Button, buttonClass } from '@/components/ui/Button'

/**
 * Strona awarii: coś nieoczekiwanie nie zadziałało po stronie sklepu.
 * Koszyk klienta jest zapisany w jego przeglądarce, więc niczego nie traci.
 */
export default function StoreError({ error, retry }: { error: Error & { digest?: string }; retry: () => void }) {
  useEffect(() => {
    console.error(error)
  }, [error])

  return (
    <div className="shell flex min-h-[60svh] flex-col justify-center py-20 md:py-28">
      <p className="eyebrow">Coś poszło nie tak</p>
      <h1 className="display-1 mt-4 max-w-3xl text-[clamp(2.5rem,1.5rem+3.6vw,4.5rem)]">Ta strona chwilowo nie działa</h1>
      <p className="lead mt-5 max-w-xl">
        To problem po naszej stronie. Spróbuj ponownie za chwilę — Twój koszyk jest bezpieczny i czeka na Ciebie.
      </p>
      <div className="mt-9 flex flex-wrap gap-3">
        <Button onClick={() => retry()} size="lg">
          Spróbuj ponownie
        </Button>
        <Link className={buttonClass({ size: 'lg', variant: 'secondary' })} href="/">
          Strona główna
        </Link>
      </div>
      {error.digest && <p className="tabular mt-8 text-sm text-ink-faint">Kod zdarzenia: {error.digest}</p>}
    </div>
  )
}
