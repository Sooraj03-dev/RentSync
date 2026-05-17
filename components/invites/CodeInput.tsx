'use client';

import { useRef, useState, useEffect, ClipboardEvent, KeyboardEvent } from 'react';

interface Props {
  onComplete: (code: string) => void;
  loading: boolean;
  error?: string;
}

export function CodeInput({ onComplete, loading, error }: Props) {
  const [values, setValues] = useState(['', '', '', '', '', '']);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  useEffect(() => {
    if (!loading) inputRefs.current[0]?.focus();
  }, [loading]);

  const handleChange = (i: number, char: string) => {
    const upper = char.toUpperCase().replace(/[^A-Z0-9]/g, '');
    if (!upper) return;
    const next = [...values];
    next[i] = upper[0];
    setValues(next);
    if (i < 5) inputRefs.current[i + 1]?.focus();
    const code = next.join('');
    if (code.length === 6 && !next.includes('')) onComplete(code);
  };

  const handleKeyDown = (i: number, e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace') {
      if (values[i]) {
        const next = [...values];
        next[i] = '';
        setValues(next);
      } else if (i > 0) {
        inputRefs.current[i - 1]?.focus();
        const next = [...values];
        next[i - 1] = '';
        setValues(next);
      }
    } else if (e.key === 'ArrowLeft' && i > 0) {
      inputRefs.current[i - 1]?.focus();
    } else if (e.key === 'ArrowRight' && i < 5) {
      inputRefs.current[i + 1]?.focus();
    }
  };

  const handlePaste = (e: ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData('text').toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 6);
    const next = ['', '', '', '', '', ''];
    pasted.split('').forEach((c, i) => { next[i] = c; });
    setValues(next);
    const lastIdx = Math.min(pasted.length - 1, 5);
    inputRefs.current[lastIdx]?.focus();
    if (pasted.length === 6) onComplete(pasted);
  };

  const borderColor = error ? '#ef4444' : '#cbd5e1';

  return (
    <div>
      <div className="flex items-center gap-2 justify-center">
        {[0, 1, 2].map(i => (
          <input
            key={i}
            ref={el => { inputRefs.current[i] = el; }}
            value={values[i]}
            maxLength={1}
            disabled={loading}
            onChange={e => handleChange(i, e.target.value)}
            onKeyDown={e => handleKeyDown(i, e)}
            onPaste={handlePaste}
            className="text-center font-semibold outline-none transition-all"
            style={{
              width: 44, height: 52, fontSize: 22, borderRadius: 8,
              border: `1.5px solid ${error ? '#ef4444' : values[i] ? '#2563eb' : borderColor}`,
              opacity: loading ? 0.5 : 1,
              textTransform: 'uppercase',
              background: values[i] ? '#eff6ff' : '#fff',
              color: '#0f172a',
            }}
          />
        ))}
        <span className="text-slate-400 font-bold text-xl select-none">·</span>
        {[3, 4, 5].map(i => (
          <input
            key={i}
            ref={el => { inputRefs.current[i] = el; }}
            value={values[i]}
            maxLength={1}
            disabled={loading}
            onChange={e => handleChange(i, e.target.value)}
            onKeyDown={e => handleKeyDown(i, e)}
            onPaste={handlePaste}
            className="text-center font-semibold outline-none transition-all"
            style={{
              width: 44, height: 52, fontSize: 22, borderRadius: 8,
              border: `1.5px solid ${error ? '#ef4444' : values[i] ? '#2563eb' : borderColor}`,
              opacity: loading ? 0.5 : 1,
              textTransform: 'uppercase',
              background: values[i] ? '#eff6ff' : '#fff',
              color: '#0f172a',
            }}
          />
        ))}
      </div>
      {error && (
        <p className="text-red-500 text-sm text-center mt-3 font-medium">{error}</p>
      )}
    </div>
  );
}
