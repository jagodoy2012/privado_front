// components/tarjetaTipo/TarjetaTipoTable.tsx
// components/tarjetaTipo/TarjetaTipoTable.tsx
import type { TarjetaTipo } from '../hooks/useTarjetaTipos';
import TarjetaTipoRow from './TarjetaTipoRow';

type Props = {
  rows: TarjetaTipo[];
  onEdit: (item: TarjetaTipo) => void;
  onDelete: (item: TarjetaTipo) => void;
};

export default function TarjetaTipoTable({ rows, onEdit, onDelete }: Props) {
  return (
    <table className="table">
      <thead>
        <tr>
          <th style={{width: 64}}>ID</th>
          <th>Título</th>
          <th>Descripción</th>
          <th style={{width: 120}}>Estado</th>
          <th style={{width: 140}}>Fecha</th>
          <th style={{width: 120}}>Acciones</th>
        </tr>
      </thead>
      <tbody>
        {rows.length === 0 ? (
          <tr><td colSpan={6} className="empty">Sin registros</td></tr>
        ) : rows.map(r => (
          <TarjetaTipoRow key={r.id} item={r} onEdit={onEdit} onDelete={onDelete} />
        ))}
      </tbody>
    </table>
  );
}
