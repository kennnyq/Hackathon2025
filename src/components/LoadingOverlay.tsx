'use client';

import { AnimatePresence, motion } from 'framer-motion';

type LoadingOverlayProps = {
  isVisible: boolean;
  message: string;
  onExitComplete?: () => void;
};

export default function LoadingOverlay({ isVisible, message, onExitComplete }: LoadingOverlayProps) {
  return (
    <AnimatePresence mode="wait" onExitComplete={onExitComplete}>
      {isVisible && (
        <motion.div
          className="fixed inset-0 z-[100] bg-white/95 backdrop-blur-xl"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.25 }}
        >
          <div className="flex h-full flex-col items-center justify-center px-4">
            <motion.div
              className="w-full max-w-lg rounded-3xl border border-red-100 bg-white/85 p-7 shadow-[0_25px_65px_rgba(244,63,94,0.16)]"
              initial={{ opacity: 0, y: 22, scale: 0.97 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -18, scale: 0.95 }}
              transition={{ duration: 0.3, ease: 'easeOut' }}
            >
              <div className="flex flex-col items-center text-center">
                <motion.div
                  className="h-14 w-14 rounded-full border-[3px] border-red-100 border-t-red-500"
                  aria-hidden="true"
                  animate={{ rotate: 360, scale: [1, 1.06, 1] }}
                  transition={{ repeat: Infinity, duration: 1.3, ease: [0.65, 0, 0.35, 1] }}
                />
                <p className="mt-6 text-xs font-semibold uppercase tracking-[0.4em] text-red-500">Analyzing</p>
                <h2 className="mt-2 text-2xl font-bold text-slate-900">Building your Toyota swipe deck…</h2>
              </div>
              <div className="mt-6 w-full" aria-live="polite">
                <AnimatePresence mode="wait" initial={false}>
                  <motion.p
                    key={message}
                    initial={{ opacity: 0, y: 16 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -16 }}
                    transition={{ duration: 0.25, ease: 'easeInOut' }}
                    className="text-base font-medium text-slate-400 text-center"
                  >
                    {message}
                  </motion.p>
                </AnimatePresence>
              </div>
            </motion.div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
