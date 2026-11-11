import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

/** Łączy klasy warunkowo i usuwa sprzeczne klasy Tailwinda (ostatnia wygrywa). */
export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs))
}
