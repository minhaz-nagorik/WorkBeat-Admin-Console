'use client';
import { useState } from 'react';

const SIZES = [10, 25, 50];

/** Search over the visible columns and a pager (A8). Changing the search returns to page 1. */
export function useList<T>(rows: T[], text: (r: T) => string, sizes = SIZES) {
  const [q, setQ] = useState('');
  const [page, setPage] = useState(1);
  const [size, setSize] = useState(sizes[0]);
  const needle = q.trim().toLowerCase();
  const hits = needle ? rows.filter((r) => text(r).toLowerCase().includes(needle)) : rows;
  const pages = Math.max(1, Math.ceil(hits.length / size));
  const pg = Math.min(page, pages); // a poll or delete that shrinks the list keeps a valid page
  const shown = hits.slice((pg - 1) * size, pg * size);

  const search = (label: string) => (
    <input type="search" className="search" placeholder={label} aria-label={label} value={q}
      onChange={(e) => { setQ(e.target.value); setPage(1); }} />
  );

  const nums: (number | '…')[] = [];
  for (let i = 1; i <= pages; i++) {
    if (i === 1 || i === pages || Math.abs(i - pg) <= 1) nums.push(i);
    else if (nums[nums.length - 1] !== '…') nums.push('…');
  }
  const a = hits.length ? (pg - 1) * size + 1 : 0, b = Math.min(pg * size, hits.length);
  const pager = (
    <div className="pager">
      <span>{hits.length ? `Showing ${a}–${b} of ${hits.length}` : 'No results'}</span>
      <div className="pgs">
        <label className="row" style={{ gap: 6 }}>Rows
          <select value={size} onChange={(e) => { setSize(+e.target.value); setPage(1); }}>
            {sizes.map((s) => <option key={s}>{s}</option>)}
          </select>
        </label>
        <button className="btn sm" disabled={pg <= 1} onClick={() => setPage(pg - 1)} aria-label="Previous page">‹</button>
        {nums.map((n, i) => n === '…' ? <span key={`e${i}`}>…</span> : (
          <button key={n} className={`btn sm ${n === pg ? 'on' : ''}`} aria-label={`Page ${n}`} aria-current={n === pg ? 'page' : undefined} onClick={() => setPage(n)}>{n}</button>
        ))}
        <button className="btn sm" disabled={pg >= pages} onClick={() => setPage(pg + 1)} aria-label="Next page">›</button>
      </div>
    </div>
  );
  return { rows: shown, total: hits.length, search, pager };
}
