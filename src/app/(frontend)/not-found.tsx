import type { Metadata } from 'next'

import { ButtonLink } from '@/components/ui/Button'

export const metadata: Metadata = {
  title: 'Nie znaleziono strony',
}

/** Strona „404": adres nie istnieje albo produkt został wycofany z oferty. */
export default function NotFound() {
  return (
    <div className="shell flex min-h-[60svh] flex-col justify-center py-20 md:py-28">
      <p className="eyebrow">Błąd 404</p>
      <h1 className="display-1 mt-4 max-w-3xl text-[clamp(2.5rem,1.5rem+3.6vw,4.5rem)]">Tej strony już tu nie ma</h1>
      <p className="lead mt-5 max-w-xl">
        Adres mógł się zmienić albo produkt został wycofany z oferty. Zajrzyj do sklepu — aktualne modele czekają tam na Ciebie.
      </p>
      <div className="mt-9 flex flex-wrap gap-3">
        <ButtonLink href="/sklep" size="lg">
          Zobacz sofy
        </ButtonLink>
        <ButtonLink href="/" size="lg" variant="secondary">
          Strona główna
        </ButtonLink>
      </div>
    </div>
  )
}
