'use client';
import { useEffect, useState } from 'react';

export function Field({ id, label, error, hint, ...input }: React.InputHTMLAttributes<HTMLInputElement> & {
  id: string; label: string; error?: string; hint?: string;
}) {
  return (
    <div className="field">
      <label htmlFor={id}>{label}</label>
      <input id={id} name={id} type="text" aria-invalid={!!error} aria-describedby={error ? `${id}-err` : undefined} {...input} />
      {hint && !error && <span className="hint">{hint}</span>}
      {error && <span className="err" id={`${id}-err`} role="alert">{error}</span>}
    </div>
  );
}

/** Seconds left of a 429 Retry-After; the submit button stays disabled until 0. */
export function useCooldown() {
  const [left, setLeft] = useState(0);
  useEffect(() => {
    if (left <= 0) return;
    const t = setTimeout(() => setLeft(left - 1), 1000);
    return () => clearTimeout(t);
  }, [left]);
  return [left, setLeft] as const;
}

export const tooMany = (s: number) => `Too many attempts. Try again in ${s} seconds.`;
export const PASSWORD_HINT = '10 to 200 characters';
export const checkPassword = (p: string) =>
  p.length < 10 ? 'Use at least 10 characters.' : p.length > 200 ? 'Use at most 200 characters.' : undefined;
