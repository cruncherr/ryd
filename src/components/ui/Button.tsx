import Link from 'next/link'
import type { ComponentProps, ReactNode } from 'react'

import { cn } from '@/lib/cn'

type Variant = 'primary' | 'secondary' | 'light' | 'outline-light'
type Size = 'sm' | 'md' | 'lg'

const VARIANTS: Record<Variant, string> = {
  primary: 'bg-ink text-paper hover:bg-black',
  secondary: 'border border-line-strong text-ink hover:border-ink',
  light: 'bg-paper text-ink hover:bg-white',
  'outline-light': 'border border-paper/40 text-paper hover:border-paper',
}

const SIZES: Record<Size, string> = {
  sm: 'h-10 px-4 text-sm',
  md: 'h-12 px-6 text-[0.9375rem]',
  lg: 'h-14 px-8 text-base',
}

type Shared = {
  variant?: Variant
  size?: Size
  className?: string
  children: ReactNode
}

export function buttonClass({ variant = 'primary', size = 'md', className }: Omit<Shared, 'children'> = {}): string {
  return cn('btn', VARIANTS[variant], SIZES[size], className)
}

type ButtonProps = Shared & Omit<ComponentProps<'button'>, 'className' | 'children'> & { loading?: boolean }

export function Button({ variant, size, className, children, loading, disabled, type = 'button', ...props }: ButtonProps) {
  return (
    <button
      {...props}
      aria-busy={loading || undefined}
      className={buttonClass({ variant, size, className })}
      disabled={disabled || loading}
      type={type}
    >
      {loading && <Spinner />}
      {children}
    </button>
  )
}

type ButtonLinkProps = Shared & Omit<ComponentProps<typeof Link>, 'className' | 'children'>

export function ButtonLink({ variant, size, className, children, ...props }: ButtonLinkProps) {
  return (
    <Link {...props} className={buttonClass({ variant, size, className })}>
      {children}
    </Link>
  )
}

/** Szybko obracający się wskaźnik — przy tym samym czasie oczekiwania wydaje się, że ładuje się szybciej. */
export function Spinner({ className }: { className?: string }) {
  return (
    <svg aria-hidden="true" className={cn('size-4 animate-spin [animation-duration:600ms]', className)} viewBox="0 0 16 16">
      <circle cx="8" cy="8" fill="none" opacity="0.25" r="6.5" stroke="currentColor" strokeWidth="1.5" />
      <path d="M14.5 8a6.5 6.5 0 0 0-6.5-6.5" fill="none" stroke="currentColor" strokeLinecap="round" strokeWidth="1.5" />
    </svg>
  )
}
