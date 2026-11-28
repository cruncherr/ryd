'use client'

import { Printer } from 'lucide-react'

import { buttonClass } from '@/components/ui/Button'

export function PrintButton({ label = 'Wydrukuj certyfikat' }: { label?: string }) {
  return (
    <button className={buttonClass({ size: 'lg', variant: 'secondary', className: 'no-print' })} onClick={() => window.print()} type="button">
      <Printer aria-hidden="true" size={18} strokeWidth={1.5} />
      {label}
    </button>
  )
}
