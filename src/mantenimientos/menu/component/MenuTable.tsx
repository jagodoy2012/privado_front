import React from 'react';
import type { MenuItem } from '../interfaces/menu';
import MenuRow from './MenuRow';

export default function MenuTable({
  rows,
  byId,
  onEdit,
  onDelete,
}: {
  rows: MenuItem[];
  byId: Map<number, MenuItem>;
  onEdit: (row: MenuItem) => void;
  onDelete: (id: number) => void;
}) {
  return (
    <div className="table-wrap">
      <table className="table">
        <thead>
          <tr>
            <th>ID</th>
            <th>Etiqueta</th>
            <th>Padre</th>
            <th>Path</th>
            <th>Orden</th>
            <th>Estado</th>
            <th>Acciones</th>
          </tr>
        </thead>
        <tbody>
          {rows.length === 0 ? (
            <tr><td colSpan={7} style={{ textAlign: 'center', opacity: .7 }}>Sin resultados</td></tr>
          ) : rows.map(r => (
            <MenuRow
              key={r.id}
              r={r}
              parentLabel={r.parent_id ? (byId.get(r.parent_id)?.label ?? '') : ''}
              onEdit={onEdit}
              onDelete={onDelete}
            />
          ))}
        </tbody>
      </table>
    </div>
  );
}