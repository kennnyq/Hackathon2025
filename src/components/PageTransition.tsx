'use client';

import { ReactNode, useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';

const TRANSITION_DELAY_MS = 100; // wait ~100ms before triggering navigation

export default function PageTransition({ children }: { children: ReactNode }) {
  const router = useRouter();
  const [isDelaying, setIsDelaying] = useState(false);
  const pendingHrefRef = useRef<string | null>(null);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    function handleInternalLinkClick(event: MouseEvent) {
      if (event.defaultPrevented) return;
      if (event.button !== 0) return; // only left clicks
      if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;

      const target = event.target as HTMLElement | null;
      const anchor = target?.closest('a');
      if (!anchor) return;
      if (anchor.dataset.instant === 'true') return;
      if (anchor.target && anchor.target !== '_self') return;

      const href = anchor.getAttribute('href');
      if (!href || href.startsWith('#') || href.startsWith('mailto:') || href.startsWith('tel:')) return;
      if (!isInternalHref(href)) return;

      event.preventDefault();

      pendingHrefRef.current = normalizeHref(href);
      setIsDelaying(true);

      if (timeoutRef.current) clearTimeout(timeoutRef.current);

      timeoutRef.current = setTimeout(() => {
        const nextHref = pendingHrefRef.current;
        pendingHrefRef.current = null;
        timeoutRef.current = null;
        setIsDelaying(false);

        if (nextHref) {
          router.push(nextHref);
        }
      }, TRANSITION_DELAY_MS);
    }

    document.addEventListener('click', handleInternalLinkClick, true);
    return () => {
      document.removeEventListener('click', handleInternalLinkClick, true);
    };
  }, [router]);

  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  return (
    <div aria-busy={isDelaying}>
      {children}
    </div>
  );
}

function isInternalHref(href: string) {
  if (href.startsWith('/')) return true;
  if (href.startsWith('http://') || href.startsWith('https://')) {
    try {
      const url = new URL(href);
      return url.origin === window.location.origin;
    } catch {
      return false;
    }
  }
  return false;
}

function normalizeHref(href: string) {
  if (href.startsWith('/')) return href;
  try {
    const url = new URL(href);
    return url.pathname + url.search + url.hash;
  } catch {
    return href;
  }

}
