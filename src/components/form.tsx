'use client';
import { useEffect, useId, useMemo, useRef, useState } from 'react';

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

/**
 * A text field with a dropdown list in the site's style (WAI-ARIA combobox). Clicking the field or the arrow opens
 * every option with the current one highlighted; typing narrows the list. With `free` the typed text is kept as is
 * (suggestions only); without it the parent validates that the value is one of `options`.
 */
export function Combo({ id, label, value, onChange, options, error, hint, placeholder, maxLength, free }: {
  id: string; label: string; value: string; onChange: (v: string) => void; options: string[];
  error?: string; hint?: string; placeholder?: string; maxLength?: number; free?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState<string | null>(null); // null: show everything (just opened, nothing typed yet)
  const [active, setActive] = useState(-1);
  const input = useRef<HTMLInputElement>(null);
  const list = useRef<HTMLUListElement>(null);
  const listId = `${useId()}-list`;
  const shown = useMemo(() => {
    if (!query) return options;
    const q = query.toLowerCase().replace(/[\s_]+/g, ' ');
    return options.filter((o) => o.toLowerCase().replace(/[\s_]+/g, ' ').includes(q));
  }, [options, query]);

  useEffect(() => { // keep the highlighted option in view
    if (open && active >= 0) list.current?.children[active]?.scrollIntoView({ block: 'nearest' });
  }, [open, active]);

  const show = () => { setQuery(null); setActive(options.indexOf(value)); setOpen(true); };
  const close = () => { setOpen(false); setQuery(null); };
  const pick = (o: string) => { onChange(o); close(); };
  const move = (d: number) => {
    if (!open) return show();
    if (shown.length) setActive((a) => (a < 0 ? (d > 0 ? 0 : shown.length - 1) : (a + d + shown.length) % shown.length));
  };

  function key(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'ArrowDown') { e.preventDefault(); move(1); }
    else if (e.key === 'ArrowUp') { e.preventDefault(); move(-1); }
    else if (e.key === 'Enter' && open) { e.preventDefault(); if (shown[active]) pick(shown[active]); else close(); }
    else if (e.key === 'Escape' && open) { e.preventDefault(); e.stopPropagation(); close(); } // don't close a surrounding dialog
    else if (e.key === 'Tab') close();
  }

  return (
    <div className="field">
      <label htmlFor={id}>{label}</label>
      <div className="combo">
        <input ref={input} id={id} name={id} type="text" role="combobox" autoComplete="off" spellCheck={false}
          aria-expanded={open} aria-controls={listId} aria-autocomplete="list"
          aria-activedescendant={open && shown[active] ? `${listId}-${active}` : undefined}
          aria-invalid={!!error} aria-describedby={error ? `${id}-err` : hint ? `${id}-hint` : undefined}
          value={value} placeholder={placeholder} maxLength={maxLength}
          onClick={() => (open ? undefined : show())} onKeyDown={key} onBlur={close}
          onChange={(e) => { onChange(e.target.value); setQuery(e.target.value); setActive(free ? -1 : 0); setOpen(true); }} />
        <button type="button" className="combo-arrow" tabIndex={-1} aria-label={`Show ${label.toLowerCase()} options`}
          onMouseDown={(e) => e.preventDefault()} onClick={() => { if (open) close(); else { show(); input.current?.focus(); } }}>
          <svg width="12" height="12" viewBox="0 0 12 12" aria-hidden="true"><path d="M2.5 4.5 6 8l3.5-3.5" fill="none" stroke="currentColor" strokeWidth="1.5" /></svg>
        </button>
        {open && (
          <ul ref={list} id={listId} role="listbox" aria-label={label} className="combo-list">
            {shown.length ? shown.map((o, n) => (
              <li key={o} id={`${listId}-${n}`} role="option" aria-selected={o === value}
                className={`${n === active ? 'on' : ''} ${o === value ? 'cur' : ''}`}
                onMouseDown={(e) => e.preventDefault()} onMouseEnter={() => setActive(n)} onClick={() => pick(o)}>{o}</li>
            )) : <li className="none" role="presentation">{free ? 'No matches. What you typed will be used.' : 'No matches'}</li>}
          </ul>
        )}
      </div>
      {hint && !error && <span className="hint" id={`${id}-hint`}>{hint}</span>}
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
