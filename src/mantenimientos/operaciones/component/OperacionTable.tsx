import type { Operacion } from '../interfaces/Operacion';
import OperacionRow from './OperacionRow';

type Props = {
  rows: Operacion[];
  onEdit: (r: Operacion) => void;
  onDelete: (id: number) => void;
};

export default function OperacionTable({ rows, onEdit, onDelete }: Props) {
  return (
    <div className="table-wrap">
      <table className="table">
        <thead>
          <tr>
            <th>ID</th>
            <th>Título</th>
            <th>Descripción</th>
            <th>Estado</th>
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
              <OperacionRow r={r} onEdit={onEdit} onDelete={onDelete} />
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}