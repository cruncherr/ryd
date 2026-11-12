import { Check } from 'lucide-react'
import type { ComponentProps, ReactNode } from 'react'

import { cn } from '@/lib/cn'

/**
 * Elementy formularzy sklepu: pole tekstowe, pole wielowierszowe, pole wyboru i karta opcji.
 * Etykieta jest zawsze widoczna nad polem, a komunikat błędu — powiązany z polem
 * tak, żeby czytnik ekranu odczytał go razem z nazwą pola.
 */

export const fieldId = (name: string): string => `pole-${name}`

function Label({ htmlFor, children, optional }: { htmlFor: string; children: ReactNode; optional?: boolean }) {
  return (
    <label className="field-label" htmlFor={htmlFor}>
      {children}
      {optional && <span className="font-normal text-ink-faint"> (opcjonalnie)</span>}
    </label>
  )
}

export function FieldError({ id, message }: { id: string; message?: string }) {
  if (!message) return null
  return (
    <p className="field-message text-danger" id={id}>
      {message}
    </p>
  )
}

function describedBy(id: string, error?: string, hint?: string): string | undefined {
  if (error) return `${id}-blad`
  if (hint) return `${id}-opis`
  return undefined
}

type TextFieldProps = {
  label: string
  name: string
  error?: string
  hint?: string
  optional?: boolean
  className?: string
} & Omit<ComponentProps<'input'>, 'className' | 'name' | 'id'>

export function TextField({ label, name, error, hint, optional, className, ...props }: TextFieldProps) {
  const id = fieldId(name)
  return (
    <div className={className}>
      <Label htmlFor={id} optional={optional}>
        {label}
      </Label>
      <input
        {...props}
        aria-describedby={describedBy(id, error, hint)}
        aria-invalid={error ? true : undefined}
        className="field-input"
        id={id}
        name={name}
      />
      {hint && !error && (
        <p className="field-message text-ink-soft" id={`${id}-opis`}>
          {hint}
        </p>
      )}
      <FieldError id={`${id}-blad`} message={error} />
    </div>
  )
}

type TextAreaProps = {
  label: string
  name: string
  error?: string
  hint?: string
  optional?: boolean
  className?: string
} & Omit<ComponentProps<'textarea'>, 'className' | 'name' | 'id'>

export function TextArea({ label, name, error, hint, optional, className, rows = 3, ...props }: TextAreaProps) {
  const id = fieldId(name)
  return (
    <div className={className}>
      <Label htmlFor={id} optional={optional}>
        {label}
      </Label>
      <textarea
        {...props}
        aria-describedby={describedBy(id, error, hint)}
        aria-invalid={error ? true : undefined}
        className="field-input min-h-28 resize-y"
        id={id}
        name={name}
        rows={rows}
      />
      {hint && !error && (
        <p className="field-message text-ink-soft" id={`${id}-opis`}>
          {hint}
        </p>
      )}
      <FieldError id={`${id}-blad`} message={error} />
    </div>
  )
}

type CheckboxProps = {
  name: string
  /** Treść przy polu — może zawierać odnośniki. */
  children: ReactNode
  error?: string
  className?: string
} & Omit<ComponentProps<'input'>, 'className' | 'name' | 'id' | 'type' | 'children'>

export function Checkbox({ name, children, error, className, ...props }: CheckboxProps) {
  const id = fieldId(name)
  return (
    <div className={className}>
      <div className="flex items-start gap-3">
        <span className="relative mt-px grid size-6 shrink-0 place-items-center">
          <input
            {...props}
            aria-describedby={error ? `${id}-blad` : undefined}
            aria-invalid={error ? true : undefined}
            className="peer absolute inset-0 size-full cursor-pointer appearance-none rounded-md border border-line-strong bg-surface transition-[background-color,border-color] duration-150 checked:border-ink checked:bg-ink aria-[invalid=true]:border-danger"
            id={id}
            name={name}
            type="checkbox"
          />
          <Check
            aria-hidden="true"
            className="pointer-events-none relative size-4 scale-75 text-paper opacity-0 transition-[opacity,transform] duration-150 ease-out peer-checked:scale-100 peer-checked:opacity-100"
            strokeWidth={2.5}
          />
        </span>
        <label className="cursor-pointer text-[0.9375rem] leading-relaxed" htmlFor={id}>
          {children}
        </label>
      </div>
      <FieldError id={`${id}-blad`} message={error} />
    </div>
  )
}

type OptionCardProps = {
  name: string
  value: string
  checked: boolean
  onChange: () => void
  title: string
  description?: ReactNode
  /** Tekst po prawej stronie, np. cena dostawy. */
  aside?: ReactNode
  invalid?: boolean
  describedBy?: string
}

/** Opcja do wyboru jednej z kilku (dostawa, płatność) w formie dużej, wygodnej karty. */
export function OptionCard({ name, value, checked, onChange, title, description, aside, invalid, describedBy: describedById }: OptionCardProps) {
  return (
    <label
      className={cn(
        'flex cursor-pointer items-start gap-4 rounded-[var(--radius-field)] border bg-surface p-4 transition-[border-color,box-shadow] duration-150 sm:p-5',
        'has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-3 has-[:focus-visible]:outline-ink',
        checked
          ? 'border-ink shadow-[inset_0_0_0_1px_var(--color-ink)]'
          : cn('hover:border-ink-soft', invalid ? 'border-danger' : 'border-line-strong'),
      )}
    >
      <input
        aria-describedby={describedById}
        checked={checked}
        className="sr-only"
        name={name}
        onChange={onChange}
        type="radio"
        value={value}
      />
      <span
        aria-hidden="true"
        className={cn(
          'mt-0.5 grid size-5 shrink-0 place-items-center rounded-full border transition-colors duration-150',
          checked ? 'border-ink' : 'border-line-strong',
        )}
      >
        <span
          className={cn(
            'size-2.5 rounded-full bg-ink transition-[opacity,transform] duration-150 ease-out',
            checked ? 'scale-100 opacity-100' : 'scale-50 opacity-0',
          )}
        />
      </span>
      <span className="min-w-0 flex-1">
        <span className="flex items-baseline justify-between gap-4">
          <span className="font-medium">{title}</span>
          {aside && <span className="tabular shrink-0 font-medium">{aside}</span>}
        </span>
        {description && <span className="mt-1 block text-sm leading-relaxed text-ink-soft">{description}</span>}
      </span>
    </label>
  )
}
