'use client'

import { Tabs } from '@base-ui/react/tabs'
import Image from 'next/image'
import { useEffect, useRef, useState } from 'react'

import { cn } from '@/lib/cn'

export type FunctionView = {
  id: string
  label: string
  caption?: string | null
  imageUrl: string
  alt: string
}

type Props = {
  views: FunctionView[]
  sizes: string
  className?: string
}

const STEP_MS = 1900

/**
 * Pokaz funkcji mebla: te same ujęcie w kolejnych ustawieniach, przełączane zakładkami.
 * Cel animacji: wyjaśnienie — pokazuje, jak mebel się zmienia, czego nie odda pojedyncze zdjęcie.
 * Gdy sekcja pierwszy raz pojawi się na ekranie, odtwarza kolejne ustawienia jeden raz,
 * a potem oddaje sterowanie klientowi. Przy ograniczonym ruchu nic nie odtwarza się samo.
 */
export function FunctionViewer({ views, sizes, className }: Props) {
  const [active, setActive] = useState(views[0]?.id ?? '')
  const root = useRef<HTMLDivElement>(null)
  const autoplay = useRef<{ timer: ReturnType<typeof setInterval> | null; done: boolean }>({ timer: null, done: false })

  const stopAutoplay = () => {
    if (autoplay.current.timer) clearInterval(autoplay.current.timer)
    autoplay.current.timer = null
    autoplay.current.done = true
  }

  useEffect(() => {
    const element = root.current
    if (!element || views.length < 2) return
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return

    const state = autoplay.current
    const observer = new IntersectionObserver(
      (entries) => {
        if (state.done || !entries.some((entry) => entry.isIntersecting)) return
        observer.disconnect()
        let index = 0
        state.timer = setInterval(() => {
          index += 1
          const next = views[index]
          if (!next) {
            if (state.timer) clearInterval(state.timer)
            state.timer = null
            state.done = true
            return
          }
          setActive(next.id)
        }, STEP_MS)
      },
      { threshold: 0.55 },
    )
    observer.observe(element)

    return () => {
      observer.disconnect()
      if (state.timer) clearInterval(state.timer)
    }
  }, [views])

  if (views.length === 0) return null
  const current = views.find((view) => view.id === active) ?? views[0]

  return (
    <Tabs.Root
      className={cn('grid gap-5', className)}
      onValueChange={(value) => {
        stopAutoplay()
        setActive(String(value))
      }}
      ref={root}
      value={active}
    >
      <div className="stage aspect-[4/3]">
        {views.map((view, index) => (
          <Image
            alt={view.alt}
            aria-hidden={view.id === active ? undefined : true}
            className={cn(
              'packshot transition-[opacity,filter] duration-500 ease-out',
              view.id === active ? 'opacity-100 blur-0' : 'opacity-0 blur-[3px]',
            )}
            fill
            key={view.id}
            loading={index === 0 ? 'eager' : 'lazy'}
            quality={85}
            sizes={sizes}
            src={view.imageUrl}
          />
        ))}
      </div>

      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between md:gap-8">
        <Tabs.List
          aria-label="Ustawienia mebla"
          className="relative isolate flex w-fit max-w-full gap-1 overflow-x-auto rounded-full bg-stage p-1 [scrollbar-width:none]"
        >
          {views.map((view) => (
            <Tabs.Tab
              className="relative z-10 h-10 shrink-0 rounded-full px-4 text-sm font-medium text-ink-soft transition-colors duration-200 ease-out outline-none hover:text-ink focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink data-active:text-paper"
              key={view.id}
              value={view.id}
            >
              {view.label}
            </Tabs.Tab>
          ))}
          <Tabs.Indicator
            className="absolute top-1 left-0 h-10 w-(--active-tab-width) translate-x-(--active-tab-left) rounded-full bg-ink transition-[translate,width] duration-300 ease-in-out motion-reduce:transition-none"
            renderBeforeHydration
          />
        </Tabs.List>

        {/* Podpis zmienia się razem ze zdjęciem; klucz wymusza krótkie przenikanie. */}
        <p aria-live="polite" className="min-h-[1.5em] text-[0.9375rem] text-ink-soft md:text-right">
          <span className="inline-block animate-[fade-only_300ms_ease_both]" key={current?.id}>
            {current?.caption}
          </span>
        </p>
      </div>

      {views.map((view) => (
        <Tabs.Panel className="sr-only" key={view.id} value={view.id}>
          {view.label}
          {view.caption ? `: ${view.caption}` : ''}
        </Tabs.Panel>
      ))}
    </Tabs.Root>
  )
}
