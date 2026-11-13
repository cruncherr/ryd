'use client'

import { useRouter } from 'next/navigation'
import { useState } from 'react'

/** „Wyślij ponownie” — ponawia wiadomości o zamówieniu, które wcześniej nie wyszły. */
export function ResendEmailsButton({ orderId }: { orderId: number | string }) {
  const router = useRouter()
  const [state, setState] = useState<'idle' | 'sending' | 'done' | 'error'>('idle')

  const resend = async () => {
    setState('sending')
    try {
      const response = await fetch(`/api/orders/${orderId}/resend-emails`, { method: 'POST', credentials: 'include' })
      if (!response.ok) throw new Error(String(response.status))
      setState('done')
      // Odświeża listę wiadomości obok — widać od razu, czy tym razem się udało.
      router.refresh()
    } catch {
      setState('error')
    }
  }

  return (
    <div className="ryd-order-side__resend">
      <button className="ryd-order-side__button" disabled={state === 'sending'} onClick={resend} type="button">
        {state === 'sending' ? 'Wysyłam…' : 'Wyślij ponownie'}
      </button>
      {state === 'done' && <span className="ryd-order-side__note">Gotowe — sprawdź status powyżej.</span>}
      {state === 'error' && <span className="ryd-order-side__note is-error">Nie udało się. Spróbuj ponownie za chwilę.</span>}
    </div>
  )
}
