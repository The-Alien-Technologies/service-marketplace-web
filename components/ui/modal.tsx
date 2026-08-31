'use client';

import { useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';
import { useTranslations } from 'next-intl';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  children: React.ReactNode;
  className?: string;
  showCloseButton?: boolean;
}

export function Modal({ 
  isOpen, 
  onClose, 
  children, 
  className = '',
  showCloseButton = true 
}: ModalProps) {
  const t = useTranslations('Common');
  useEffect(() => {
    const previousOverflow = document.body.style.overflow;
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    }

    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [isOpen]);

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
    }

    return () => {
      document.removeEventListener('keydown', handleEscape);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return createPortal(
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4"
      role="dialog"
      aria-modal="true"
    >
      {/* Backdrop with blur */}
      <div 
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />
      
      {/* Modal content */}
      <div className={`
        relative z-10 w-full
        bg-white dark:bg-gray-900 
        rounded-2xl shadow-2xl
        max-h-[calc(100dvh-1.5rem)] overflow-y-auto overscroll-contain sm:max-h-[calc(100dvh-2rem)]
        ${className}
      `}>
        {showCloseButton && (
          <button
            onClick={onClose}
            aria-label={t('close')}
            className="absolute right-2 top-2 z-20 inline-flex h-11 w-11 items-center justify-center rounded-full transition-colors hover:bg-gray-100 dark:hover:bg-gray-800 sm:right-4 sm:top-4"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        )}
        
        {children}
      </div>
    </div>,
    document.body
  );
}
