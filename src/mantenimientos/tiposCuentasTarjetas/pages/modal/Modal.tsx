import { useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';

type Props = {
  open: boolean;
  title?: React.ReactNode;
  onClose: () => void;
  footer?: React.ReactNode;
  children: React.ReactNode;
  /** Cerrar al hacer click fuera del cuadro (por defecto true) */
  closeOnOutsideClick?: boolean;
  /** Cerrar con tecla ESC (por defecto true) */
  closeOnEsc?: boolean;
};

export default function Modal({
  open,
  title,
  onClose,
  footer,
  children,
  closeOnOutsideClick = true,
  closeOnEsc = true,
}: Props) {
  const backdropRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open || !closeOnEsc) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, closeOnEsc, onClose]);

  if (!open) return null;

  const handleBackdropMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!closeOnOutsideClick) return;
    if (e.target === backdropRef.current) onClose();
  };

  const content = (
    <div
      ref={backdropRef}
      className="modal-backdrop"
      onMouseDown={handleBackdropMouseDown}
    >
      <div
        className="modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="modal-title"
        onMouseDown={(e) => e.stopPropagation()}
      >
        <div className="modal-header">
          {title ? <h2 id="modal-title">{title}</h2> : <span />}
          <button className="icon-btn" aria-label="Cerrar" onClick={onClose}>✕</button>
        </div>

        <div className="modal-body">{children}</div>

        {footer && <div className="modal-footer">{footer}</div>}
      </div>
    </div>
  );

  return createPortal(content, document.body);
}
