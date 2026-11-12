'use client'

import { Accordion as BaseAccordion } from '@base-ui/react/accordion'
import { Plus } from 'lucide-react'
import type { ReactNode } from 'react'

import { cn } from '@/lib/cn'

export type AccordionItem = {
  value: string
  title: string
  content: ReactNode
}

type Props = {
  items: AccordionItem[]
  /** Sekcje otwarte na starcie. */
  defaultOpen?: string[]
  className?: string
}

/**
 * Rozwijane sekcje (szczegóły produktu, pytania).
 * Zamknięte sekcje zostają w kodzie strony (`hidden="until-found"`), więc znajdzie je
 * wyszukiwarka i Ctrl+F w przeglądarce. Wysokość animujemy krótko — to jedyny wyjątek
 * od zasady „tylko transform i opacity”, bo panel nie ma odpowiednika w transformacjach.
 */
export function Accordion({ items, defaultOpen = [], className }: Props) {
  if (items.length === 0) return null

  return (
    <BaseAccordion.Root className={cn('border-t border-line', className)} defaultValue={defaultOpen} hiddenUntilFound multiple>
      {items.map((item) => (
        <BaseAccordion.Item className="border-b border-line" key={item.value} value={item.value}>
          <BaseAccordion.Header>
            <BaseAccordion.Trigger className="group flex w-full items-center justify-between gap-6 py-5 text-left text-[1.0625rem] font-medium outline-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink">
              {item.title}
              <Plus
                aria-hidden="true"
                className="shrink-0 transition-transform duration-200 ease-out group-data-panel-open:rotate-45"
                size={20}
                strokeWidth={1.5}
              />
            </BaseAccordion.Trigger>
          </BaseAccordion.Header>
          <BaseAccordion.Panel className="h-(--accordion-panel-height) overflow-hidden transition-[height] duration-200 ease-out data-ending-style:h-0 data-starting-style:h-0 motion-reduce:transition-none">
            <div className="pr-8 pb-7">{item.content}</div>
          </BaseAccordion.Panel>
        </BaseAccordion.Item>
      ))}
    </BaseAccordion.Root>
  )
}
