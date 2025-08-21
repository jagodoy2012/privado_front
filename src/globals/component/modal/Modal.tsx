// User/component/modal/Modal.tsx
import { type ReactNode, useEffect } from 'react';
import '../../../styles/Modal.css'; // (opcional si ya lo tienes)

type Props = {
  open: boolean;
  onClose: () => void;
  title?: string;
  footer?: ReactNode;
  wide?: boolean;
  children: ReactNode;
};

export default function Modal({ open, onClose, title, footer, wide, children }: Props) {
  useEffect(() => {
    const h = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    if (open) document.addEventListener('keydown', h);
    return () => document.removeEventListener('keydown', h);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="modal-backdrop" onClick={onClose} style={{ zIndex: 50 }}>
      <div className={`modal-card ${wide ? 'wide' : ''}`} onClick={(e)=>e.stopPropagation()}>
        {title && <div className="modal-header"><h3>{title}</h3></div>}
        <div className="modal-body">{children}</div>
        {footer && <div className="modal-footer">{footer}</div>}
      </div>
    </div>
  );
}
