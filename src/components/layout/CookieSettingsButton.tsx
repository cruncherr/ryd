'use client'

import { OPEN_EVENT } from '@/lib/consent'

/** Otwiera ponownie baner zgód, żeby klient mógł zmienić wcześniejszą decyzję. */
export function CookieSettingsButton() {
  return (
    <button
      className="link-line text-[0.8125rem]"
      onClick={() => window.dispatchEvent(new Event(OPEN_EVENT))}
      type="button"
    >
      Ustawienia cookies
    </button>
  )
}
