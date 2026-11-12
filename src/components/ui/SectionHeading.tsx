import type { ReactNode } from 'react'

import { cn } from '@/lib/cn'
import { noOrphans } from '@/lib/typography'

import { Emphasis } from './Emphasis'

type Props = {
  eyebrow?: string | null
  title?: string | null
  text?: string | null
  /** Element po prawej stronie nagłówka, np. link „Zobacz wszystkie”. */
  action?: ReactNode
  /** Poziom nagłówka w strukturze strony. */
  as?: 'h1' | 'h2'
  className?: string
}

export function SectionHeading({ eyebrow, title, text, action, as: Tag = 'h2', className }: Props) {
  if (!title) return null

  return (
    <div className={cn('flex flex-col gap-6 md:flex-row md:items-end md:justify-between md:gap-12', className)}>
      <div className="max-w-3xl">
        {eyebrow && <p className="eyebrow mb-4">{eyebrow}</p>}
        <Tag className="display-2">
          <Emphasis text={title} />
        </Tag>
        {text && <p className="lead mt-5 max-w-[52ch]">{noOrphans(text)}</p>}
      </div>
      {action && <div className="shrink-0 md:pb-2">{action}</div>}
    </div>
  )
}
