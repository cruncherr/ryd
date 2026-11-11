'use client'

import { ChevronDown } from 'lucide-react'
import { usePathname, useRouter } from 'next/navigation'

import type { ProductSort } from '@/lib/queries'

const OPTIONS: Array<{ value: ProductSort; label: string }> = [
  { value: 'domyslnie', label: 'Polecane' },
  { value: 'cena-rosnaco', label: 'Cena: od najniższej' },
  { value: 'cena-malejaco', label: 'Cena: od najwyższej' },
  { value: 'nazwa', label: 'Nazwa: A–Z' },
]

/** Sortowanie listy. Zwykłe pole wyboru systemu — na telefonie otwiera natywną listę. */
export function SortSelect({ value }: { value: ProductSort }) {
  const router = useRouter()
  const pathname = usePathname()

  return (
    <label className="relative inline-flex items-center text-sm">
      <span className="mr-2 text-ink-soft">Sortuj:</span>
      <select
        className="h-10 cursor-pointer appearance-none rounded-full border border-line-strong bg-transparent pr-9 pl-4 text-sm font-medium outline-none transition-colors duration-150 hover:border-ink focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink"
        onChange={(event) => {
          const next = event.target.value
          router.replace(next === 'domyslnie' ? pathname : `${pathname}?sortuj=${next}`, { scroll: false })
        }}
        value={value}
      >
        {OPTIONS.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
      <ChevronDown aria-hidden="true" className="pointer-events-none absolute right-3" size={16} strokeWidth={1.5} />
    </label>
  )
}
