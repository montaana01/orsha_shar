'use client';

import { useMemo, useState } from 'react';

type Props = {
  name: string;
  defaultValue?: string;
  disabled?: boolean;
};

const HEX_RE = /^#([\dA-Fa-f]{3}|[\dA-Fa-f]{6})$/;

function normalizeHex(value: string): string {
  const raw = value.trim();
  if (!HEX_RE.test(raw)) return '#FFFFFF';
  if (raw.length === 4) {
    const [r, g, b] = raw.slice(1).split('');
    return `#${r}${r}${g}${g}${b}${b}`.toUpperCase();
  }
  return raw.toUpperCase();
}

export function ColorPickerField({ name, defaultValue = '#FFFFFF', disabled }: Props) {
  const initial = useMemo(() => normalizeHex(defaultValue), [defaultValue]);
  const [value, setValue] = useState(initial);
  const [hexInput, setHexInput] = useState(initial);

  const syncValue = (next: string) => {
    const normalized = normalizeHex(next);
    setValue(normalized);
    setHexInput(normalized);
  };

  return (
    <div className="colorPicker">
      <input type="hidden" name={name} value={value} />
      <input
        className="colorPicker__input"
        type="color"
        id={`color-picker-${name}`}
        value={value}
        onChange={(e) => syncValue(e.target.value)}
        disabled={disabled}
        aria-label="Выбрать цвет"
      />
      <input
        className="field__control colorPicker__hex"
        type="text"
        id={`color-hex-${name}`}
        value={hexInput}
        onChange={(e) => {
          const raw = e.target.value.toUpperCase();
          setHexInput(raw);
          if (HEX_RE.test(raw)) {
            setValue(normalizeHex(raw));
          }
        }}
        onBlur={() => {
          if (!HEX_RE.test(hexInput)) {
            setHexInput(value);
          } else {
            const normalized = normalizeHex(hexInput);
            setValue(normalized);
            setHexInput(normalized);
          }
        }}
        inputMode="text"
        autoCapitalize="characters"
        spellCheck={false}
        disabled={disabled}
        aria-label="HEX код"
      />
    </div>
  );
}
