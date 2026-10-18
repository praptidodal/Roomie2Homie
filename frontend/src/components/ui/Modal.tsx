import React, { useEffect } from 'react';
import { createPortal } from 'react-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { XIcon } from 'lucide-react';

interface ModalProps {
  open: boolean;
  onClose: () => void;
  title: string;
  description?: string;
  children?: React.ReactNode;
  footer?: React.ReactNode;
  size?: 'sm' | 'md' | 'lg';
}

const widths = { sm: 'max-w-sm', md: 'max-w-lg', lg: 'max-w-2xl' };

export function Modal({
  open,
  onClose,
  title,
  description,
  children,
  footer,
  size = 'md',
}: ModalProps) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    document.addEventListener('keydown', onKey);
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = '';
    };
  }, [open, onClose]);

  return createPortal(
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-[1200] flex items-center justify-center p-3 sm:p-4 md:p-6 overflow-hidden">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.16, ease: [0.23, 1, 0.32, 1] }}
            className="absolute inset-0 bg-stone-900/40 backdrop-blur-sm"
            onClick={onClose}
          />

          <motion.div
            role="dialog"
            aria-modal="true"
            aria-label={title}
            initial={{ opacity: 0, scale: 0.97, y: 14 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.97, y: 8 }}
            transition={{ duration: 0.22, ease: [0.23, 1, 0.32, 1] }}
            className={`relative flex flex-col w-full ${widths[size]} max-h-[calc(100dvh-1.5rem)] sm:max-h-[calc(100dvh-3rem)] md:max-h-[min(90vh,860px)] rounded-[2rem] sm:rounded-[2.5rem] border border-stone-200/70 bg-white shadow-floating overflow-hidden`}
          >
            {/* Pinned Header */}
            <div className="flex items-start justify-between gap-4 shrink-0 px-6 pt-5 pb-4 sm:px-7 sm:pt-6 sm:pb-4 border-b border-stone-100">
              <div className="min-w-0 pr-1">
                <h2 className="font-display text-xl sm:text-2xl font-bold tracking-tight text-wellness-dark truncate">
                  {title}
                </h2>
                {description && (
                  <p className="mt-1 text-xs sm:text-sm text-wellness-muted leading-relaxed">
                    {description}
                  </p>
                )}
              </div>
              <button
                type="button"
                onClick={onClose}
                aria-label="Close dialog"
                className="shrink-0 -mr-1 -mt-1 rounded-full p-2 text-stone-400 transition-colors duration-150 ease-out hover:bg-stone-100 hover:text-stone-800 active:scale-95"
              >
                <XIcon className="h-5 w-5" />
              </button>
            </div>

            {/* Scrollable Content Body */}
            {children && (
              <div className="flex-1 min-h-0 overflow-y-auto px-6 py-5 sm:px-7 sm:py-6 overscroll-contain">
                {children}
              </div>
            )}

            {/* Pinned Footer */}
            {footer && (
              <div className="shrink-0 border-t border-stone-100 bg-stone-50/70 px-6 py-4 sm:px-7 sm:py-4 flex flex-wrap justify-end gap-2.5">
                {footer}
              </div>
            )}
          </motion.div>
        </div>
      )}
    </AnimatePresence>,
    document.body
  );
}