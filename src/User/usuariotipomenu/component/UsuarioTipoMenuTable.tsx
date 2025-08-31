import React from 'react';
import type { UsuarioTipoMenu } from '../interfaces/usuarioTipoMenu';
import UsuarioTipoMenuRow from './UsuarioTipoMenuRow';

export default function UsuarioTipoMenuTable({
  rows, ustIndex, menIndex, onEdit, onDelete,
}: {
  rows: UsuarioTipoMenu[];
  ustIndex: Map<number, { id: number; titulo: string }>;
  menIndex: Map<number, { id: number; label: string }>;
  onEdit: (row: UsuarioTipoMenu) => void;
  onDelete: (id: number) => void;
}) {
  return (
    <div className="table-wrap">
      <table className="table">
        <thead>
          <tr>
            <th>ID</th>
            <th>Tipo de usuario</th>
            <th>Menú</th>
            <th>Ver</th>
            <th>Padres</th>
            <th>Hijos</th>
            <th>Estado</th>
            <th>Acciones</th>
          </tr>
        </thead>
        <tbody>
          {rows.length === 0 ? (
            <tr><td colSpan={8} style={{ textAlign: 'center', opacity: .7 }}>Sin resultados</td></tr>
          ) : rows.map(r => (
            <UsuarioTipoMenuRow
              key={r.id}
              r={r}
              ustLabel={ustIndex.get(r.id_usuario_tipo)?.titulo ?? ''}
              menuLabel={menIndex.get(r.id_menu)?.label ?? ''}
              onEdit={onEdit}
              onDelete={onDelete}
            />
          ))}
        </tbody>
      </table>
    </div>
  );
}