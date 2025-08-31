import React from 'react';
import type { MenuItem } from '../interfaces/menu';

export default function MenuRow({
  r,
  parentLabel,
  onEdit,
  onDelete,
}: {
  r: MenuItem;
  parentLabel: string;
  onEdit: (row: MenuItem) => void;
  onDelete: (id: number) => void;
}) {
  return (
    <tr>
      <td style={{ width: 64 }}>{r.id}</td>
      <td>{r.label}</td>
      <td>{parentLabel || '—'}</td>
      <td>{r.path || '—'}</td>
      <td style={{ width: 90, textAlign: 'right' }}>{r.sort_order}</td>
      <td style={{ width: 90 }}>{r.is_active ? 'Activo' : 'Inactivo'}</td>
      <td style={{ width: 120 }}>
        <button className="icon-btn" title="Editar" onClick={() => onEdit(r)}>✏️</button>
        <button className="icon-btn" title="Eliminar" onClick={() => onDelete(r.id)}>🗑️</button>
      </td>
    </tr>
  );
}