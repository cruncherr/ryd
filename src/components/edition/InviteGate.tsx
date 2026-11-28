'use client'

import { KeyRound } from 'lucide-react'
import { useId, useState, type FormEvent } from 'react'

import { buttonClass } from '@/components/ui/Button'
import { checkInvite } from '@/lib/waitlist/actions'

import { WaitlistForm } from './WaitlistForm'

type Props = {
  productId: number
  onUnlock: (code: string) => void
}

/**
 * Przedsprzedaż na zaproszenie: model jest widoczny dla wszystkich, ale egzemplarz zarezerwuje
 * tylko osoba z kodem od atelier. Bez kodu można poprosić o zaproszenie.
 */
export function InviteGate({ productId, onUnlock }: Props) {
  const id = useId()
  const [code, setCode] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [checking, setChecking] = useState(false)
  const [asking, setAsking] = useState(false)

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (checking) return
    setChecking(true)
    setError(null)
    const result = await checkInvite(productId, code).catch(() => null)
    setChecking(false)
    if (result?.ok) onUnlock(code.trim())
    else setError(result && !result.ok ? result.message : 'Nie udało się sprawdzić kodu. Spróbuj ponownie.')
  }

  return (
    <div className="rounded-[var(--radius-panel)] bg-brand p-6 text-paper md:p-7">
      <p className="eyebrow flex items-center gap-2 text-brass-light">
        <KeyRound aria-hidden="true" size={14} strokeWidth={1.75} />
        Przedsprzedaż na zaproszenie
      </p>
      <p className="mt-3 max-w-[44ch] text-paper/75">
        Ten model mogą teraz zarezerwować wyłącznie osoby z listy prywatnej. Wpisz kod z zaproszenia od atelier.
      </p>
      <form className="mt-5 flex flex-wrap gap-3" noValidate onSubmit={submit}>
        <label className="sr-only" htmlFor={`${id}-kod`}>
          Kod zaproszenia
        </label>
        <input
          aria-describedby={error ? `${id}-blad` : undefined}
          aria-invalid={error ? true : undefined}
          autoCapitalize="characters"
          autoComplete="off"
          className="field-input field-input-dark tabular min-w-0 flex-1 basis-48 tracking-[0.12em] uppercase placeholder:tracking-normal placeholder:normal-case"
          id={`${id}-kod`}
          onChange={(event) => setCode(event.target.value)}
          placeholder="Kod zaproszenia"
          spellCheck={false}
          value={code}
        />
        <button className={buttonClass({ size: 'lg', variant: 'light', className: 'px-6' })} disabled={checking} type="submit">
          {checking ? 'Sprawdzam…' : 'Otwórz zaproszenie'}
        </button>
      </form>
      {error && (
        <p className="mt-3 text-sm text-[#f3b9a9]" id={`${id}-blad`} role="alert">
          {error}
        </p>
      )}

      <div className="mt-6 border-t border-paper/15 pt-5">
        {asking ? (
          <WaitlistForm
            productId={productId}
            submitLabel="Poproś o zaproszenie"
            successText="Dziękujemy. Atelier odezwie się do Ciebie, gdy zwolni się miejsce w przedsprzedaży."
            tone="dark"
          />
        ) : (
          <button className="link-line text-sm text-paper" onClick={() => setAsking(true)} type="button">
            Nie masz zaproszenia? Poproś o nie
          </button>
        )}
      </div>
    </div>
  )
}
