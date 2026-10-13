import { useEffect, useState, type InputHTMLAttributes } from 'react';

interface Props extends Omit<InputHTMLAttributes<HTMLInputElement>, 'type' | 'value' | 'onChange'> {
  value: number;
  onValueChange: (value: number) => void;
  optional?: boolean;
}

// Native number fields can silently turn French "11,5" into "115" on an
// English device. Keep the editable text, accept either decimal separator,
// and reject the entire invalid string rather than accepting a numeric prefix.
export default function NumericInput({ value, onValueChange, optional = false, ...props }: Props) {
  const display = (n: number) => Number.isFinite(n) && n !== 0 ? String(n) : '';
  const [text, setText] = useState(() => display(value));
  useEffect(() => { setText(display(value)); }, [value]);
  return <input {...props} type="text" inputMode="decimal" data-numeric-input="true" value={text}
    onChange={e => {
      const raw = e.target.value;
      setText(raw);
      const normalized = raw.trim().replace(',', '.');
      const valid = /^[+-]?(?:\d+(?:\.\d*)?|\.\d+)$/.test(normalized);
      onValueChange(normalized === '' && optional ? 0 : valid ? Number(normalized) : NaN);
    }} />;
}
