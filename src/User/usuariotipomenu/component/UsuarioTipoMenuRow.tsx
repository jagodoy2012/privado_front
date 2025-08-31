import React from 'react';
import type { UsuarioTipoMenu } from '../interfaces/usuarioTipoMenu';

export default function UsuarioTipoMenuRow({
  r, ustLabel, menuLabel, onEdit, onDelete,
}: {
  r: UsuarioTipoMenu;
  ustLabel: string;
  menuLabel: string;
  onEdit: (row: UsuarioTipoMenu) => void;
  onDelete: (id: number) => void;
}) {
  return (
    <tr>
      <td style={{ width: 64 }}>{r.id}</td>
      <td>{ustLabel || r.id_usuario_tipo}</td>
      <td>{menuLabel || r.id_menu}</td>
      <td>{r.can_view ? 'Sí' : 'No'}</td>
      <td>{r.include_ancestors ? 'Sí' : 'No'}</td>
      <td>{r.include_descendants ? 'Sí' : 'No'}</td>
      <td>{r.estado ? 'Activo' : 'Inactivo'}</td>
      <td style={{ width: 120 }}>
        <button className="icon-btn" title="Editar" onClick={() => onEdit(r)}>✏️</button>
        <button className="icon-btn" title="Eliminar" onClick={() => onDelete(r.id)}>🗑️</button>
      </td>
    </tr>
  );
}