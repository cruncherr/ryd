'use client'

import type { TextFieldClientComponent } from 'payload'

import { FieldError, TextInput, useField } from '@payloadcms/ui'

const HEX_COLOR = /^#[0-9a-fA-F]{6}$/

/**
 * Pole koloru próbki: obok zapisu #RRGGBB jest próbnik, w którym kolor wybiera się myszką.
 */
const ColorField: TextFieldClientComponent = ({ field, path, readOnly }) => {
  const { value, setValue, showError, errorMessage } = useField<string>({ path })
  const current = typeof value === 'string' ? value : ''
  const pickerValue = HEX_COLOR.test(current) ? current : '#4A4D52'

  return (
    <div style={{ display: 'flex', alignItems: 'flex-end', gap: 8, flex: '1 1 20%', minWidth: 180 }}>
      <div style={{ flex: 1, minWidth: 0 }}>
        <TextInput
          Error={<FieldError message={errorMessage} path={path} showError={showError} />}
          label={field.label}
          onChange={(event: React.ChangeEvent<HTMLInputElement>) => setValue(event.target.value.trim())}
          path={path}
          placeholder="#4A4D52"
          readOnly={readOnly}
          required={field.required}
          showError={showError}
          value={current}
        />
      </div>
      <input
        aria-label="Wybierz kolor próbki"
        disabled={readOnly}
        onChange={(event) => setValue(event.target.value.toUpperCase())}
        style={{
          width: 40,
          height: 40,
          padding: 2,
          flexShrink: 0,
          border: '1px solid var(--theme-elevation-150)',
          borderRadius: 4,
          background: 'var(--theme-input-bg)',
          cursor: readOnly ? 'not-allowed' : 'pointer',
        }}
        type="color"
        value={pickerValue}
      />
    </div>
  )
}

export default ColorField
