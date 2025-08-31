import type { Asignado } from '../interfaces/Asignado';
import AsignadoRow from './AsignadoRow';

type Props = {
  rows: Asignado[];
  opById: Map<number, string>;
  pbById: Map<number, string>;
  onEdit: (r: Asignado) => void;
  onDelete: (id: number) => void;
};

export default function AsignadoTable({ rows, opById, pbById, onEdit, onDelete }: Props) {
  return (
    <div className="table-wrap">
      <table className="table">
        <thead>
          <tr>
            <th>ID</th>
            <th>Operación</th>
            <th>Producto bancario</th>
            <th>Estado</th>
            <th style={{ width: 120, textAlign: 'right' }}>Acciones</th>
          </tr>
        </thead>
        <tbody>
          {rows.length === 0 ? (
            <tr>
              <td colSpan={5} style={{ textAlign: 'center', opacity: .7 }}>
                Sin registros
              </td>
            </tr>
          ) : (
            rows.map(r => (
              <AsignadoRow
                key={r.id}
                r={r}
                opById={opById}
                pbById={pbById}
                onEdit={onEdit}
                onDelete={onDelete}
              />
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}