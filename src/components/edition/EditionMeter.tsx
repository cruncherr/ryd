import { cn } from '@/lib/cn'
import { plural } from '@/lib/typography'

type Props = {
  size: number
  allocated: number
  className?: string
  /** `dark`: na ciemnym tle (pas w kolorze marki). */
  tone?: 'light' | 'dark'
  /** Krótka wersja do kart modeli. */
  compact?: boolean
}

/**
 * Stan nakładu: cienka linia wypełniona proporcjonalnie do liczby egzemplarzy, które mają już
 * właścicieli. Liczby pochodzą prosto z rejestru — sklep niczego tu nie zawyża.
 */
export function EditionMeter({ size, allocated, className, tone = 'light', compact = false }: Props) {
  const remaining = Math.max(0, size - allocated)
  const ratio = size > 0 ? Math.min(1, allocated / size) : 0
  const soft = tone === 'dark' ? 'text-paper/65' : 'text-ink-soft'

  return (
    <div className={className}>
      <div className={cn('tabular flex items-baseline justify-between gap-4', compact ? 'text-[0.8125rem]' : 'text-sm')}>
        <span className={soft}>
          {remaining === 0 ? (
            'Nakład wyczerpany'
          ) : (
            <>
              Pozostało <span className={tone === 'dark' ? 'text-paper' : 'text-ink'}>{remaining}</span>{' '}
              {plural(remaining, 'egzemplarz', 'egzemplarze', 'egzemplarzy')}
            </>
          )}
        </span>
        <span className={soft}>
          {allocated} / {size}
        </span>
      </div>
      <div
        aria-hidden="true"
        className={cn('mt-2 h-px w-full overflow-hidden', tone === 'dark' ? 'bg-paper/20' : 'bg-line-strong')}
      >
        <div
          className={cn('h-full origin-left', tone === 'dark' ? 'bg-brass-light' : 'bg-brass')}
          style={{ transform: `scaleX(${ratio})` }}
        />
      </div>
    </div>
  )
}
