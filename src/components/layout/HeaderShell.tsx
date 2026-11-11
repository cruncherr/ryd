'use client'

import { useEffect, useRef, useState, type ReactNode } from 'react'

/**
 * Przyklejony nagłówek. Na samej górze strony jest przezroczysty; po przewinięciu
 * dostaje półprzezroczyste tło i cienką linię, żeby treść pod spodem go nie zagłuszała.
 */
export function HeaderShell({ children }: { children: ReactNode }) {
  const sentinel = useRef<HTMLDivElement>(null)
  const [scrolled, setScrolled] = useState(false)

  useEffect(() => {
    const element = sentinel.current
    if (!element) return
    const observer = new IntersectionObserver((entries) => {
      const entry = entries[0]
      if (entry) setScrolled(!entry.isIntersecting)
    })
    observer.observe(element)
    return () => observer.disconnect()
  }, [])

  return (
    <>
      <div aria-hidden="true" className="-mb-px h-px" ref={sentinel} />
      <header
        className="sticky top-0 z-40 border-b border-transparent transition-[background-color,border-color] duration-200 ease-out data-scrolled:border-line data-scrolled:bg-paper/90 data-scrolled:backdrop-blur-lg"
        data-scrolled={scrolled ? '' : undefined}
      >
        {children}
      </header>
    </>
  )
}
