'use client';

import { createContext, useContext, useCallback, useRef, useState, ReactNode } from 'react';
import LoadingOverlay from './LoadingOverlay';

type LoadingOverlayContextValue = {
  showOverlay: (message: string) => void;
  updateOverlayMessage: (message: string) => void;
  hideOverlay: (onExitComplete?: () => void) => void;
  isVisible: boolean;
};

const DEFAULT_OVERLAY_MESSAGE = 'Building your Toyota swipe deck…';

const LoadingOverlayContext = createContext<LoadingOverlayContextValue | null>(null);

export default function LoadingOverlayProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState({ visible: false, message: DEFAULT_OVERLAY_MESSAGE });
  const exitCallbackRef = useRef<(() => void) | null>(null);

  const showOverlay = useCallback((message: string) => {
    setState({ visible: true, message });
  }, []);

  const updateOverlayMessage = useCallback((message: string) => {
    setState(prev => (prev.visible ? { ...prev, message } : prev));
  }, []);

  const hideOverlay = useCallback((onExitComplete?: () => void) => {
    exitCallbackRef.current = onExitComplete ?? null;
    setState(prev => {
      if (!prev.visible) {
        const cb = exitCallbackRef.current;
        exitCallbackRef.current = null;
        cb?.();
        return prev;
      }
      return { ...prev, visible: false };
    });
  }, []);

  const handleExitComplete = useCallback(() => {
    const cb = exitCallbackRef.current;
    exitCallbackRef.current = null;
    cb?.();
  }, []);

  return (
    <LoadingOverlayContext.Provider value={{ showOverlay, updateOverlayMessage, hideOverlay, isVisible: state.visible }}>
      {children}
      <LoadingOverlay
        isVisible={state.visible}
        message={state.message}
        onExitComplete={handleExitComplete}
      />
    </LoadingOverlayContext.Provider>
  );
}

export function useLoadingOverlay() {
  const context = useContext(LoadingOverlayContext);
  if (!context) {
    throw new Error('useLoadingOverlay must be used within a LoadingOverlayProvider');
  }
  return context;
}
