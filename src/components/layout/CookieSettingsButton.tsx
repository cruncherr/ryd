'use client'

/** Otwiera ponownie baner zgód, żeby klient mógł zmienić wcześniejszą decyzję. */
export function CookieSettingsButton() {
  return (
    <button
      className="link-line text-[0.8125rem]"
      onClick={() => window.dispatchEvent(new CustomEvent('ryd:open-consent'))}
      type="button"
    >
      Ustawienia cookies
    </button>
  )
}
