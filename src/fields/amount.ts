import type { NumberField } from 'payload'

import { isValidAmount } from '@/lib/money'

type AmountOptions = {
  name: string
  label: string
  required?: boolean
  description?: string
  readOnly?: boolean
  defaultValue?: number
  /** Szerokość pola w wierszu, np. '50%'. */
  width?: string
}

/** Pole kwoty w złotych (brutto): nieujemne, najwyżej dwa miejsca po przecinku. */
export function amountField({
  name,
  label,
  required = false,
  description,
  readOnly,
  defaultValue,
  width,
}: AmountOptions): NumberField {
  return {
    name,
    type: 'number',
    label,
    required,
    min: 0,
    defaultValue,
    admin: {
      description,
      readOnly,
      step: 1,
      placeholder: 'np. 3990',
      width,
    },
    validate: (value: unknown) => {
      if (value === null || value === undefined || value === '') {
        return required ? 'To pole jest wymagane.' : true
      }
      if (!isValidAmount(value)) {
        return 'Podaj kwotę w złotych, np. 3990 albo 3990,50 (bez wartości ujemnych).'
      }
      return true
    },
  }
}
