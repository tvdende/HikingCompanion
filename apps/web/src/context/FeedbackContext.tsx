import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { useTranslation } from '../i18n';

export type ToastVariant = 'success' | 'info' | 'error';

export interface Toast {
  id: number;
  variant: ToastVariant;
  message: string;
}

export interface FeedbackContextValue {
  success: (message: string) => void;
  info: (message: string) => void;
  error: (message: string) => void;
  dismiss: (id: number) => void;
}

const FeedbackContext = createContext<FeedbackContextValue | null>(null);

export const FeedbackProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { t } = useTranslation();
  const [toasts, setToasts] = useState<Toast[]>([]);
  const [nextId, setNextId] = useState(1);

  const dismiss = useCallback((id: number) => {
    setToasts((current) => current.filter((toast) => toast.id !== id));
  }, []);

  const addToast = useCallback((variant: ToastVariant, message: string) => {
    setToasts((current) => {
      if (current.some((toast) => toast.variant === variant && toast.message === message)) {
        return current;
      }
      const toast = { id: nextId, variant, message };
      return [...current.slice(-2), toast];
    });
    setNextId((current) => current + 1);
  }, [nextId]);

  const value = useMemo<FeedbackContextValue>(() => ({
    success: (message) => addToast('success', message),
    info: (message) => addToast('info', message),
    error: (message) => addToast('error', message),
    dismiss,
  }), [addToast, dismiss]);

  useEffect(() => {
    const timers = toasts
      .filter((toast) => toast.variant !== 'error')
      .map((toast) => window.setTimeout(() => dismiss(toast.id), 4000));
    return () => timers.forEach(window.clearTimeout);
  }, [toasts, dismiss]);

  return (
    <FeedbackContext.Provider value={value}>
      {children}
      <div className="toast-viewport" aria-label={t('feedback.toastRegionLabel')}>
        {toasts.map((toast) => (
          <div
            key={toast.id}
            className={`toast toast-${toast.variant}`}
            role={toast.variant === 'error' ? 'alert' : 'status'}
            aria-live={toast.variant === 'error' ? 'assertive' : 'polite'}
          >
            <span className="toast-message">{toast.message}</span>
            <button
              type="button"
              className="toast-dismiss"
              onClick={() => dismiss(toast.id)}
              aria-label={t('feedback.dismissToast')}
            >
              ×
            </button>
          </div>
        ))}
      </div>
    </FeedbackContext.Provider>
  );
};

export const useFeedback = (): FeedbackContextValue => {
  const context = useContext(FeedbackContext);
  if (!context) {
    throw new Error('useFeedback must be used within a <FeedbackProvider>');
  }
  return context;
};
