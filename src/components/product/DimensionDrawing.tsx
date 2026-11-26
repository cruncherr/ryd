import type { Side } from '@/lib/constants'
import type { SizeOption } from '@/lib/configurator'
import { cn } from '@/lib/cn'

type Props = {
  size: SizeOption
  /** Największy wymiar modelu — wszystkie rozmiary rysujemy w tej samej skali, więc widać różnicę. */
  largest: { width: number; depth: number }
  /** Narożnik: po której stronie jest szezlong. */
  side?: Side | null
  corner?: boolean
  className?: string
}

const VIEW_W = 360
const MAX_DRAWING_H = 150
const PAD_X = 34
const PAD_TOP = 34
const PAD_BOTTOM = 14

const cm = (value: number) => `${String(value).replace('.', ',')} cm`

/** Rzut z góry z naniesionymi wymiarami — zmienia się razem z wybranym rozmiarem. */
export function DimensionDrawing({ size, largest, side = 'right', corner = false, className }: Props) {
  const scale = Math.min((VIEW_W - PAD_X * 2) / largest.width, MAX_DRAWING_H / largest.depth)
  // Wysokość rysunku dopasowana do najgłębszego wariantu — bez pustego pasa pod prostą sofą.
  const VIEW_H = Math.ceil(PAD_TOP + largest.depth * scale + PAD_BOTTOM)
  const w = size.width * scale
  const d = size.depth * scale
  const x0 = (VIEW_W - w) / 2
  const y0 = PAD_TOP
  const isCorner = corner || Boolean(size.bodyDepth || size.chaiseWidth)

  // Proporcje elementów mebla: oparcie, boki, poduchy — tylko po to, by rysunek czytał się jak sofa.
  const back = Math.min(22 * scale, d * 0.28)
  const arm = Math.min(Math.max(12, size.width * 0.075) * scale, w * 0.12)
  const bodyDepth = isCorner ? (size.bodyDepth ?? Math.round(size.depth * 0.58)) * scale : d
  const chaise = isCorner ? Math.min((size.chaiseWidth ?? Math.round(size.width * 0.36)) * scale, w * 0.6) : 0
  const right = side !== 'left'

  const outline = isCorner
    ? right
      ? `M${x0} ${y0} H${x0 + w} V${y0 + d} H${x0 + w - chaise} V${y0 + bodyDepth} H${x0} Z`
      : `M${x0} ${y0} H${x0 + w} V${y0 + bodyDepth} H${x0 + chaise} V${y0 + d} H${x0} Z`
    : `M${x0} ${y0} H${x0 + w} V${y0 + d} H${x0} Z`

  // Podział siedziska na poduchy (bez szezlonga).
  const seatStart = isCorner ? (right ? x0 + arm : x0 + chaise) : x0 + arm
  const seatEnd = isCorner ? (right ? x0 + w - chaise : x0 + w - arm) : x0 + w - arm
  const cushions = Math.max(2, Math.min(3, Math.round((seatEnd - seatStart) / (62 * scale))))
  const dividers = Array.from({ length: cushions - 1 }, (_, index) => seatStart + ((seatEnd - seatStart) / cushions) * (index + 1))

  const depthX = x0 + w + 14
  const widthY = y0 - 16

  return (
    <figure className={cn('m-0', className)}>
      <svg
        aria-label={`Rzut z góry: szerokość ${cm(size.width)}, głębokość ${cm(size.depth)}`}
        className="drawing block h-auto w-full text-ink"
        role="img"
        viewBox={`0 0 ${VIEW_W} ${VIEW_H}`}
      >
        <path d={outline} fill="var(--color-surface)" stroke="currentColor" strokeLinejoin="round" strokeWidth={1.25} />
        {/* Oparcie */}
        <path
          d={`M${x0 + (isCorner && !right ? 0 : arm)} ${y0 + back} H${x0 + w - (isCorner && right ? 0 : arm)}`}
          fill="none"
          stroke="currentColor"
          strokeOpacity={0.45}
        />
        {/* Boki */}
        {(!isCorner || right) && (
          <path d={`M${x0 + arm} ${y0 + back} V${y0 + bodyDepth}`} fill="none" stroke="currentColor" strokeOpacity={0.45} />
        )}
        {(!isCorner || !right) && (
          <path d={`M${x0 + w - arm} ${y0 + back} V${y0 + bodyDepth}`} fill="none" stroke="currentColor" strokeOpacity={0.45} />
        )}
        {isCorner && (
          <path
            d={right ? `M${x0 + w - chaise} ${y0 + back} V${y0 + bodyDepth}` : `M${x0 + chaise} ${y0 + back} V${y0 + bodyDepth}`}
            fill="none"
            stroke="currentColor"
            strokeDasharray="3 3"
            strokeOpacity={0.4}
          />
        )}
        {dividers.map((x) => (
          <path d={`M${x} ${y0 + back} V${y0 + bodyDepth}`} fill="none" key={x} stroke="currentColor" strokeOpacity={0.22} />
        ))}

        {/* Wymiar: szerokość */}
        <g className="text-ink-soft" stroke="currentColor">
          <path d={`M${x0} ${widthY} H${x0 + w}`} />
          <path d={`M${x0} ${widthY - 5} V${widthY + 5} M${x0 + w} ${widthY - 5} V${widthY + 5}`} />
          <path d={`M${depthX} ${y0} V${y0 + d}`} />
          <path d={`M${depthX - 5} ${y0} H${depthX + 5} M${depthX - 5} ${y0 + d} H${depthX + 5}`} />
        </g>
        <text
          className="tabular fill-ink"
          fontSize={12}
          fontWeight={500}
          paintOrder="stroke"
          stroke="var(--color-paper)"
          strokeWidth={6}
          textAnchor="middle"
          x={x0 + w / 2}
          y={widthY + 4}
        >
          {cm(size.width)}
        </text>
        <text
          className="tabular fill-ink"
          fontSize={12}
          fontWeight={500}
          paintOrder="stroke"
          stroke="var(--color-paper)"
          strokeWidth={6}
          textAnchor="middle"
          transform={`rotate(-90 ${depthX} ${y0 + d / 2})`}
          x={depthX}
          y={y0 + d / 2 + 4}
        >
          {cm(size.depth)}
        </text>
      </svg>
    </figure>
  )
}
