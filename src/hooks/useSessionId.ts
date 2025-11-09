'use client';
import { useEffect, useState } from 'react';

const STORAGE_KEY = 'toyotaTinder.sessionId';

export function useSessionId() {
  const [sessionId, setSessionId] = useState('');

  useEffect(() => {
    if (typeof window === 'undefined') return;
    let cancelled = false;
    const frame = window.requestAnimationFrame(() => {
      if (cancelled) return;
      const stored = window.localStorage.getItem(STORAGE_KEY);
      if (stored) {
        setSessionId(stored);
        return;
      }
      const next = createSessionId();
      window.localStorage.setItem(STORAGE_KEY, next);
      setSessionId(next);
    });
    return () => {
      cancelled = true;
      window.cancelAnimationFrame(frame);
    };
  }, []);

  return sessionId;
}

function createSessionId() {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return `session-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}
