import type { CuentaTipo } from '../interfaces/CuentaTipo';
import CuentaTipoRow from './CuentaTipoRow';

type Props = {
  rows: CuentaTipo[];
  onEdit: (r: CuentaTipo) => void;
  onDelete: (id: number) => void;
};

export default function CuentaTipoTable({ rows, onEdit, onDelete }: Props) {
  return (
    <div className="table-wrap">
      <table className="table">
        <thead>
          <tr>
            <th style={{ width: 80 }}>ID</th>
            <th>Título</th>
            <th>Descripción</th>
            <th style={{ width: 120 }}>Estado</th>
            <th style={{ width: 120, textAlign: 'right' }}>Acciones</th>
          </tr>
        </thead>
        <tbody>
          {rows.length === 0 ? (
            <tr>
              <td colSpan={5} style={{ textAlign: 'center', opacity: .7 }}>Sin registros</td>
            </tr>
          ) : rows.map(r => (
            <tr key={r.id}>
              <CuentaTipoRow r={r} />
              <td style={{ textAlign: 'right' }}>
                <button className="icon-btn" title="Editar" onClick={() => onEdit(r)}>✏️</button>
                <button className="icon-btn danger" title="Eliminar" onClick={() => onDelete(r.id)}>🗑️</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
