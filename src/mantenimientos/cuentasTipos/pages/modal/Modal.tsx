import { useEffect, useRef, type ReactNode } from 'react';

type Props = {
  open: boolean;
  onClose: () => void;
  title?: string;
  footer?: ReactNode;
  wide?: boolean;            // agrega la clase "wide" a la tarjeta
  children: ReactNode;
};

export default function Modal({ open, onClose, title, footer, wide = false, children }: Props) {
  const backdropRef = useRef<HTMLDivElement>(null);

  // Cerrar con Escape y bloquear scroll de body
  useEffect(() => {
    if (!open) return;

    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };

    document.addEventListener('keydown', onKey);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = prevOverflow;
    };
  }, [open, onClose]);

  if (!open) return null;

  // Cerrar clickeando fuera de la tarjeta
  const handleBackdrop = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === backdropRef.current) onClose();
  };

  return (
    <div
      className="modal-backdrop"
      ref={backdropRef}
      onMouseDown={handleBackdrop}
      role="presentation"
    >
      <div
        className={`modal-card ${wide ? 'wide' : ''}`}
        role="dialog"
        aria-modal="true"
        aria-labelledby="modal-title"
      >
        <div className="modal-header">
          <h3 id="modal-title">{title}</h3>
          <button className="icon-btn" aria-label="Cerrar" onClick={onClose}>✖</button>
        </div>

        <div className="modal-body">
          {children}
        </div>

        <div className="modal-footer">
          {footer ?? <button className="btn" onClick={onClose}>Cerrar</button>}
        </div>
      </div>
    </div>
  );
}
