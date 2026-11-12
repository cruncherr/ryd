import { readFile } from 'node:fs/promises'
import { join } from 'node:path'

/**
 * Wspólne elementy obrazków generowanych przez sklep: ikony w karcie przeglądarki
 * i podglądu linku w komunikatorach oraz mediach społecznościowych.
 */

export const BRAND_COLORS = {
  paper: '#f6f3ee',
  stage: '#ebe6de',
  ink: '#1c1a18',
  soft: '#5c574f',
  accent: '#a34e2b',
} as const

const fontPath = (file: string) => join(process.cwd(), 'src/assets/fonts', file)

export async function loadBrandFonts() {
  const [display, sans] = await Promise.all([readFile(fontPath('fraunces-display.ttf')), readFile(fontPath('inter-regular.ttf'))])
  return [
    { name: 'Fraunces', data: display, weight: 400 as const, style: 'normal' as const },
    { name: 'Inter', data: sans, weight: 400 as const, style: 'normal' as const },
  ]
}

/** Pierwsza litera nazwy sklepu — znak na ikonie. */
export function monogram(storeName: string | null | undefined): string {
  const letter = (storeName ?? '').trim().charAt(0)
  return letter ? letter.toUpperCase() : 'R'
}
