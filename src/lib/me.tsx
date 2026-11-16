'use client';
import { createContext, useContext } from 'react';
import type { Me } from './types';

const Ctx = createContext<Me | null>(null);
export const MeProvider = Ctx.Provider;

/** The signed-in user from the shell's `GET /v1/me`; `tz` is the company zone (A9). */
export function useMe(): Me & { tz: string } {
  const me = useContext(Ctx);
  if (!me) throw new Error('useMe outside the app shell');
  return { ...me, tz: me.company?.timezone ?? 'UTC' };
}
