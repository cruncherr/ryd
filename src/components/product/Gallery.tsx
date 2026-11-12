'use client'

import { Dialog } from '@base-ui/react/dialog'
import { ChevronLeft, ChevronRight, X } from 'lucide-react'
import Image from 'next/image'
import { useCallback, useEffect, useRef, useState } from 'react'

import { cn } from '@/lib/cn'

export type GalleryImage = {
  id: number
  url: string
  alt: string
}

type TrackProps = {
  images: GalleryImage[]
  sizes: string
  label: string
  startIndex?: number
  onIndexChange: (index: number) => void
  onSelect?: (index: number) => void
  /** Uchwyt do przewijania z zewnątrz (miniatury, strzałki). */
  trackRef: React.RefObject<HTMLDivElement | null>
  eagerFirst?: boolean
  className?: string
}

const prefersReducedMotion = () =>
  typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches

function scrollToIndex(track: HTMLDivElement | null, index: number, smooth = true) {
  if (!track) return
  track.scrollTo({
    left: index * track.clientWidth,
    behavior: smooth && !prefersReducedMotion() ? 'smooth' : 'instant',
  })
}

/**
 * Pasek zdjęć przewijany natywnie (scroll-snap): na telefonie przesuwa się palcem 1:1,
 * na komputerze gładzikiem, strzałkami lub miniaturami. Fizykę ruchu daje przeglądarka.
 */
function Track({ images, sizes, label, startIndex = 0, onIndexChange, onSelect, trackRef, eagerFirst, className }: TrackProps) {
  useEffect(() => {
    const track = trackRef.current
    if (!track) return
    if (startIndex > 0) scrollToIndex(track, startIndex, false)

    let frame = 0
    const onScroll = () => {
      cancelAnimationFrame(frame)
      frame = requestAnimationFrame(() => {
        if (track.clientWidth === 0) return
        onIndexChange(Math.round(track.scrollLeft / track.clientWidth))
      })
    }
    track.addEventListener('scroll', onScroll, { passive: true })
    return () => {
      cancelAnimationFrame(frame)
      track.removeEventListener('scroll', onScroll)
    }
    // Pozycję startową ustawiamy tylko raz, przy otwarciu.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [trackRef, onIndexChange])

  return (
    <div
      aria-label={label}
      aria-roledescription="karuzela"
      className={cn(
        'flex h-full snap-x snap-mandatory overflow-x-auto overscroll-x-contain outline-none [scrollbar-width:none] focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-ink [&::-webkit-scrollbar]:hidden',
        className,
      )}
      onKeyDown={(event) => {
        const track = trackRef.current
        if (!track || track.clientWidth === 0) return
        const current = Math.round(track.scrollLeft / track.clientWidth)
        if (event.key === 'ArrowRight') {
          event.preventDefault()
          // Klawiatura: bez animacji — reakcja ma być natychmiastowa.
          scrollToIndex(track, Math.min(images.length - 1, current + 1), false)
        }
        if (event.key === 'ArrowLeft') {
          event.preventDefault()
          scrollToIndex(track, Math.max(0, current - 1), false)
        }
      }}
      ref={trackRef}
      role="region"
      tabIndex={0}
    >
      {images.map((image, index) => (
        <div
          aria-label={`Zdjęcie ${index + 1} z ${images.length}`}
          aria-roledescription="slajd"
          className="relative h-full w-full shrink-0 snap-center bg-stage"
          key={image.id}
          role="group"
        >
          <Image
            alt={image.alt}
            className={cn('packshot', onSelect && 'cursor-zoom-in')}
            fetchPriority={eagerFirst && index === 0 ? 'high' : undefined}
            fill
            loading={eagerFirst && index === 0 ? 'eager' : 'lazy'}
            onClick={onSelect ? () => onSelect(index) : undefined}
            quality={85}
            sizes={sizes}
            src={image.url}
          />
        </div>
      ))}
    </div>
  )
}

type Props = {
  images: GalleryImage[]
  title: string
}

export function Gallery({ images, title }: Props) {
  const track = useRef<HTMLDivElement>(null)
  const zoomTrack = useRef<HTMLDivElement>(null)
  const [active, setActive] = useState(0)
  const [zoomIndex, setZoomIndex] = useState<number | null>(null)
  const [zoomActive, setZoomActive] = useState(0)

  const count = images.length
  const clamp = useCallback((index: number) => Math.max(0, Math.min(count - 1, index)), [count])
  const onIndexChange = useCallback((index: number) => setActive(clamp(index)), [clamp])
  const onZoomIndexChange = useCallback((index: number) => setZoomActive(clamp(index)), [clamp])

  if (count === 0) {
    return <div aria-hidden="true" className="stage aspect-[4/3]" />
  }

  return (
    <div className="grid gap-3">
      <div className="stage group/gallery aspect-[4/3]">
        <Track
          eagerFirst
          images={images}
          label={`Zdjęcia: ${title}`}
          onIndexChange={onIndexChange}
          onSelect={(index) => {
            setZoomActive(index)
            setZoomIndex(index)
          }}
          sizes="(min-width: 1024px) 58vw, 100vw"
          trackRef={track}
        />

        {count > 1 && (
          <>
            <div className="pointer-events-none absolute inset-x-3 top-1/2 hidden -translate-y-1/2 justify-between opacity-0 transition-opacity duration-200 ease-out group-focus-within/gallery:opacity-100 group-hover/gallery:opacity-100 md:flex">
              <button
                aria-label="Poprzednie zdjęcie"
                className="icon-btn pointer-events-auto bg-paper/90 shadow-sm disabled:opacity-0"
                disabled={active === 0}
                onClick={() => scrollToIndex(track.current, active - 1)}
                type="button"
              >
                <ChevronLeft aria-hidden="true" size={20} strokeWidth={1.5} />
              </button>
              <button
                aria-label="Następne zdjęcie"
                className="icon-btn pointer-events-auto bg-paper/90 shadow-sm disabled:opacity-0"
                disabled={active === count - 1}
                onClick={() => scrollToIndex(track.current, active + 1)}
                type="button"
              >
                <ChevronRight aria-hidden="true" size={20} strokeWidth={1.5} />
              </button>
            </div>
            <p
              aria-hidden="true"
              className="tabular pointer-events-none absolute right-3 bottom-3 rounded-full bg-paper/90 px-2.5 py-1 text-xs font-medium md:hidden"
            >
              {active + 1} / {count}
            </p>
          </>
        )}
      </div>

      {count > 1 && (
        <ul className="hidden grid-cols-8 gap-2 md:grid">
          {images.map((image, index) => (
            <li key={image.id}>
              <button
                aria-current={index === active ? 'true' : undefined}
                aria-label={`Pokaż zdjęcie ${index + 1} z ${count}`}
                className={cn(
                  'pressable relative block aspect-[4/3] w-full overflow-hidden rounded-lg bg-stage ring-1 ring-transparent ring-offset-2 ring-offset-paper transition-[transform,box-shadow] duration-150 ease-out',
                  index === active ? 'ring-ink' : 'hover:ring-line-strong',
                )}
                onClick={() => scrollToIndex(track.current, index)}
                type="button"
              >
                <Image alt="" className="packshot" fill quality={60} sizes="120px" src={image.url} />
              </button>
            </li>
          ))}
        </ul>
      )}

      <Dialog.Root onOpenChange={(open) => !open && setZoomIndex(null)} open={zoomIndex !== null}>
        <Dialog.Portal>
          <Dialog.Backdrop className="fixed inset-0 z-50 min-h-dvh bg-stage transition-opacity duration-200 ease-out data-ending-style:opacity-0 data-starting-style:opacity-0" />
          <Dialog.Popup className="fixed inset-0 z-50 flex flex-col bg-stage outline-none transition-[opacity,scale] duration-200 ease-out data-ending-style:scale-[0.98] data-ending-style:opacity-0 data-starting-style:scale-[0.98] data-starting-style:opacity-0 motion-reduce:scale-100">
            <div className="flex items-center justify-between px-4 pt-[max(0.75rem,env(safe-area-inset-top))] md:px-6">
              <Dialog.Title className="tabular text-sm text-ink-soft">
                <span className="sr-only">{title} — </span>
                {zoomActive + 1} / {count}
              </Dialog.Title>
              <Dialog.Close aria-label="Zamknij powiększenie" className="icon-btn">
                <X aria-hidden="true" size={22} strokeWidth={1.5} />
              </Dialog.Close>
            </div>
            <div className="relative min-h-0 flex-1">
              {zoomIndex !== null && (
                <Track
                  images={images}
                  label={`Powiększone zdjęcia: ${title}`}
                  onIndexChange={onZoomIndexChange}
                  sizes="100vw"
                  startIndex={zoomIndex}
                  trackRef={zoomTrack}
                />
              )}
              {count > 1 && (
                <div className="pointer-events-none absolute inset-x-4 top-1/2 hidden -translate-y-1/2 justify-between md:flex">
                  <button
                    aria-label="Poprzednie zdjęcie"
                    className="icon-btn pointer-events-auto bg-paper/90 disabled:opacity-0"
                    disabled={zoomActive === 0}
                    onClick={() => scrollToIndex(zoomTrack.current, zoomActive - 1)}
                    type="button"
                  >
                    <ChevronLeft aria-hidden="true" size={22} strokeWidth={1.5} />
                  </button>
                  <button
                    aria-label="Następne zdjęcie"
                    className="icon-btn pointer-events-auto bg-paper/90 disabled:opacity-0"
                    disabled={zoomActive === count - 1}
                    onClick={() => scrollToIndex(zoomTrack.current, zoomActive + 1)}
                    type="button"
                  >
                    <ChevronRight aria-hidden="true" size={22} strokeWidth={1.5} />
                  </button>
                </div>
              )}
            </div>
            <div className="h-[max(0.75rem,env(safe-area-inset-bottom))]" />
          </Dialog.Popup>
        </Dialog.Portal>
      </Dialog.Root>
    </div>
  )
}
