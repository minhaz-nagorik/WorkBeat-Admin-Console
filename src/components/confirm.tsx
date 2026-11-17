'use client';
import { useEffect, useRef, useState } from 'react';

/** Inline confirmation naming the consequence; Cancel takes focus (A7, rule 8). */
export function Confirm({ question, action, onConfirm, onCancel }: {
  question: React.ReactNode; action: string; onConfirm: () => void | Promise<void>; onCancel: () => void;
}) {
  const cancel = useRef<HTMLButtonElement>(null);
  const [busy, setBusy] = useState(false);
  useEffect(() => cancel.current?.focus(), []);
  return (
    <div className="confirm" role="alertdialog" aria-label={typeof question === 'string' ? question : action}>
      <span>{question}</span>
      <button ref={cancel} className="btn sm" onClick={onCancel}>Cancel</button>
      <button className="btn sm danger" disabled={busy} onClick={async () => { setBusy(true); await onConfirm(); setBusy(false); }}>{action}</button>
    </div>
  );
}

/** A destructive button that asks first. */
export function ConfirmButton({ label, question, action = label, onConfirm, positive }: {
  label: string; question: React.ReactNode; action?: string; onConfirm: () => void | Promise<void>;
  /** Not destructive (e.g. Approve): primary style instead of danger. */ positive?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const btn = useRef<HTMLButtonElement>(null);
  if (open) return <Confirm question={question} action={action} onConfirm={async () => { await onConfirm(); setOpen(false); }} onCancel={() => { setOpen(false); setTimeout(() => btn.current?.focus()); }} />;
  return <button ref={btn} className={`btn sm ${positive ? 'pri' : 'danger'}`} onClick={() => setOpen(true)}>{label}</button>;
}

/** Modal dialog on the native <dialog>: focus trap, Escape, focus returns to the opener (A11). */
export function Modal({ title, open, onClose, children, wide }: {
  title: string; open: boolean; onClose: () => void; children: React.ReactNode; wide?: boolean;
}) {
  const ref = useRef<HTMLDialogElement>(null);
  const opener = useRef<HTMLElement | null>(null);
  useEffect(() => {
    const d = ref.current; if (!d) return;
    if (open && !d.open) { opener.current = document.activeElement as HTMLElement | null; d.showModal(); }
    if (!open && d.open) d.close();
  }, [open]);
  return (
    <dialog ref={ref} className={`modal ${wide ? 'wide' : ''}`} aria-labelledby="modal-title" onClose={() => { opener.current?.focus(); onClose(); }}>
      <div className="mh"><h2 id="modal-title">{title}</h2><button className="iconbtn" aria-label="Close" onClick={() => ref.current?.close()}>✕</button></div>
      {children}
    </dialog>
  );
}
