import React, { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { useTranslation } from '../i18n';
import { Button } from './ui/button';

interface ConfirmationModalProps {
  isOpen: boolean;
  title: string;
  description: string;
  onConfirm: () => Promise<void> | void;
  onClose: () => void;
  triggerElement?: HTMLElement | null;
  confirmLabel?: string;
  cancelLabel?: string;
}

export const ConfirmationModal: React.FC<ConfirmationModalProps> = ({
  isOpen,
  title,
  description,
  onConfirm,
  onClose,
  triggerElement,
  confirmLabel,
  cancelLabel,
}) => {
  const { t } = useTranslation();
  const [isPending, setIsPending] = useState(false);
  const [requestError, setRequestError] = useState<string | null>(null);
  const dialogRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLElement | null>(null);
  const cancelRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!isOpen) return;
    triggerRef.current = triggerElement || document.activeElement as HTMLElement | null;
    setRequestError(null);
    cancelRef.current?.focus();
  }, [isOpen, triggerElement]);

  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && !isPending) {
        event.preventDefault();
        onClose();
        return;
      }
      if (event.key !== 'Tab' || !dialogRef.current) return;
      const focusable = Array.from(dialogRef.current.querySelectorAll<HTMLElement>(
        'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled])'
      ));
      if (focusable.length === 0) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, isPending, onClose]);

  useEffect(() => {
    if (isOpen || !triggerRef.current) return;
    const trigger = triggerRef.current;
    trigger.focus();
    const frame = window.requestAnimationFrame(() => trigger.focus());
    triggerRef.current = null;
    return () => window.cancelAnimationFrame(frame);
  }, [isOpen]);

  if (!isOpen) return null;

  const handleConfirm = async () => {
    try {
      setIsPending(true);
      setRequestError(null);
      await onConfirm();
      onClose();
    } catch (error) {
      setRequestError(error instanceof Error ? error.message : t('feedback.requestFailed'));
    } finally {
      setIsPending(false);
    }
  };

  // Portal to the body: ancestors with backdrop-filter would otherwise clip the fixed overlay.
  return createPortal(
    <div className="modal-overlay confirmation-overlay" role="presentation">
      <div
        ref={dialogRef}
        className="modal-content confirmation-modal"
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="confirmation-modal-title"
        aria-describedby="confirmation-modal-description"
      >
        <div className="modal-header">
          <div className="modal-title-wrap">
            <span className="modal-icon">⚠️</span>
            <h2 id="confirmation-modal-title" className="modal-title">{title}</h2>
          </div>
          <button
            type="button"
            className="modal-close-btn"
            onClick={onClose}
            disabled={isPending}
            aria-label={t('common.close')}
          >
            ×
          </button>
        </div>
        <p id="confirmation-modal-description" className="modal-description">{description}</p>
        {requestError && (
          <div className="confirmation-error" role="alert">{requestError}</div>
        )}
        <div className="modal-actions">
          <Button ref={cancelRef} variant="secondary" onClick={onClose} disabled={isPending}>
            {cancelLabel || t('common.cancel')}
          </Button>
          <Button variant="danger" onClick={handleConfirm} disabled={isPending}>
            {isPending ? t('feedback.processing') : confirmLabel || t('common.delete')}
          </Button>
        </div>
      </div>
    </div>,
    document.body,
  );
};
