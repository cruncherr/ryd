'use client'

import { Switch } from '@base-ui/react/switch'
import { X } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'

import { Button } from '@/components/ui/Button'
import { cn } from '@/lib/cn'
import { currentConsent, OPEN_EVENT, saveConsent, useConsent } from '@/lib/consent'

type Props = {
  /** Czy sklep ma podłączone Google Analytics. */
  hasAnalytics: boolean
  /** Czy sklep ma podłączony piksel Meta. */
  hasMarketing: boolean
  privacyUrl: string | null
}

const EXIT_MS = 180

function Toggle({
  label,
  description,
  checked,
  onChange,
  disabled,
}: {
  label: string
  description: string
  checked: boolean
  onChange?: (checked: boolean) => void
  disabled?: boolean
}) {
  return (
    <label className={cn('flex items-start justify-between gap-4 py-3.5', disabled ? 'cursor-default' : 'cursor-pointer')}>
      <span className="min-w-0">
        <span className="block text-[0.9375rem] font-medium">{label}</span>
        <span className="mt-0.5 block text-[0.8125rem] leading-snug text-ink-soft">{description}</span>
      </span>
      <Switch.Root
        checked={checked}
        className="mt-0.5 flex h-[1.625rem] w-11 shrink-0 items-center rounded-full bg-line-strong p-[3px] transition-colors duration-150 data-checked:bg-ink data-disabled:opacity-50"
        disabled={disabled}
        onCheckedChange={onChange}
      >
        <Switch.Thumb className="size-5 rounded-full bg-surface shadow-[0_1px_2px_rgb(28_26_24/0.3)] transition-transform duration-150 ease-out data-checked:translate-x-[1.125rem]" />
      </Switch.Root>
    </label>
  )
}

/**
 * Baner zgody na pliki cookie. Pokazuje się tylko w sklepach, które mają podłączone
 * narzędzia analityczne lub marketingowe, i tylko do czasu podjęcia decyzji.
 * Odmowa jest równie łatwa jak zgoda; decyzję można zmienić ze stopki („Ustawienia cookies”).
 */
export function ConsentBanner({ hasAnalytics, hasMarketing, privacyUrl }: Props) {
  const consent = useConsent()
  const [reopened, setReopened] = useState(false)
  const [showSettings, setShowSettings] = useState(false)
  const [closing, setClosing] = useState(false)
  const [analytics, setAnalytics] = useState(false)
  const [marketing, setMarketing] = useState(false)
  const closeTimer = useRef<number | null>(null)

  useEffect(() => {
    const open = () => {
      const current = currentConsent()
      setAnalytics(current?.analytics === true)
      setMarketing(current?.marketing === true)
      setShowSettings(true)
      setClosing(false)
      setReopened(true)
    }
    window.addEventListener(OPEN_EVENT, open)
    return () => {
      window.removeEventListener(OPEN_EVENT, open)
      if (closeTimer.current !== null) window.clearTimeout(closeTimer.current)
    }
  }, [])

  // `undefined` = strona dopiero się wczytuje; nie pokazujemy banera „na chwilę” osobom, które już wybrały.
  if (consent === undefined) return null
  const visible = consent === null || reopened
  if (!visible) return null

  const finish = (choice: { analytics: boolean; marketing: boolean }) => {
    // Najpierw krótkie wyjście, potem zapis — baner nie znika „w pół ruchu”.
    setClosing(true)
    closeTimer.current = window.setTimeout(() => {
      saveConsent({ analytics: hasAnalytics && choice.analytics, marketing: hasMarketing && choice.marketing })
      setReopened(false)
      setShowSettings(false)
      setClosing(false)
    }, EXIT_MS)
  }

  const dismiss = () => {
    setClosing(true)
    closeTimer.current = window.setTimeout(() => {
      setReopened(false)
      setShowSettings(false)
      setClosing(false)
    }, EXIT_MS)
  }

  return (
    <section
      aria-label="Zgoda na pliki cookie"
      className={cn(
        'consent-banner fixed inset-x-3 bottom-[max(0.75rem,env(safe-area-inset-bottom))] z-40 rounded-[var(--radius-panel)] border border-line bg-surface p-5 shadow-[0_18px_50px_rgb(28_26_24/0.18)] sm:inset-x-auto sm:bottom-5 sm:left-5 sm:w-[26rem] sm:p-6',
        closing && 'consent-banner-closing',
      )}
      onKeyDown={(event) => {
        // Klawisz Esc zamyka okno tylko wtedy, gdy decyzja już istnieje — wtedy nic się nie zmienia.
        if (event.key === 'Escape' && consent !== null) dismiss()
      }}
    >
      <div className="flex items-start justify-between gap-4">
        <h2 className="display-4">Pliki cookie</h2>
        {consent !== null && (
          <button aria-label="Zamknij bez zmian" className="icon-btn -mt-2 -mr-2 size-9" onClick={dismiss} type="button">
            <X aria-hidden="true" size={18} strokeWidth={1.5} />
          </button>
        )}
      </div>

      <p className="mt-2 text-[0.9375rem] leading-relaxed text-ink-soft">
        Za Twoją zgodą użyjemy plików cookie do {hasAnalytics && hasMarketing ? 'statystyk odwiedzin i pomiaru reklam' : hasAnalytics ? 'statystyk odwiedzin' : 'pomiaru reklam'}.
        Koszyk i zamówienie działają bez nich.
        {privacyUrl && (
          <>
            {' '}
            <a className="text-ink underline underline-offset-4" href={privacyUrl}>
              Polityka prywatności
            </a>
          </>
        )}
      </p>

      {showSettings ? (
        <>
          <div className="mt-4 divide-y divide-line border-y border-line">
            <Toggle checked description="Koszyk, zamówienie i zapamiętanie tej decyzji. Zawsze włączone." disabled label="Niezbędne" />
            {hasAnalytics && (
              <Toggle
                checked={analytics}
                description="Google Analytics — pomaga nam zrozumieć, jak klienci korzystają ze sklepu."
                label="Statystyka"
                onChange={setAnalytics}
              />
            )}
            {hasMarketing && (
              <Toggle
                checked={marketing}
                description="Meta Pixel — pozwala mierzyć skuteczność reklam na Facebooku i Instagramie."
                label="Marketing"
                onChange={setMarketing}
              />
            )}
          </div>
          <Button className="mt-5 w-full" onClick={() => finish({ analytics, marketing })}>
            Zapisz wybór
          </Button>
        </>
      ) : (
        <>
          <div className="mt-5 grid grid-cols-2 gap-2.5">
            <Button onClick={() => finish({ analytics: false, marketing: false })} variant="secondary">
              Tylko niezbędne
            </Button>
            <Button onClick={() => finish({ analytics: true, marketing: true })}>Akceptuję</Button>
          </div>
          <button className="link-line mx-auto mt-4 block text-[0.8125rem] text-ink-soft" onClick={() => setShowSettings(true)} type="button">
            Ustawienia szczegółowe
          </button>
        </>
      )}
    </section>
  )
}
