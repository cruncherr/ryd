'use client'

import { Toaster as SonnerToaster } from 'sonner'

/** Krótkie komunikaty (np. „Skopiowano numer rachunku"). */
export function Toaster() {
  return (
    <SonnerToaster
      closeButton={false}
      offset={20}
      position="bottom-center"
      toastOptions={{
        style: {
          background: 'var(--color-ink)',
          color: 'var(--color-paper)',
          border: 'none',
          borderRadius: '14px',
          fontFamily: 'var(--font-sans)',
          fontSize: '0.9375rem',
          boxShadow: '0 12px 32px rgb(28 26 24 / 0.22)',
        },
      }}
    />
  )
}
