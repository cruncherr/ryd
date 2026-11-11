'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import type { ReactNode } from 'react'

import { cn } from '@/lib/cn'

type Props = {
  href: string
  children: ReactNode
  className?: string
  onNavigate?: () => void
}

/** Link menu, który wie, czy prowadzi do bieżącej strony (dla czytników ekranu i podkreślenia). */
export function NavLink({ href, children, className, onNavigate }: Props) {
  const pathname = usePathname()
  const path = href.split('#')[0] || '/'
  const isAnchor = href.includes('#')
  const isCurrent = !isAnchor && (path === '/' ? pathname === '/' : pathname === path || pathname.startsWith(`${path}/`))

  return (
    <Link aria-current={isCurrent ? 'page' : undefined} className={cn(className)} href={href} onClick={onNavigate}>
      {children}
    </Link>
  )
}
