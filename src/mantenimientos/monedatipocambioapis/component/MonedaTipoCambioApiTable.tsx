import type { MonedaTipoCambioApi } from '../interfaces/MonedaTipoCambioApi';
import MonedaTipoCambioApiRow from './MonedaTipoCambioApiRow';

type Props = {
  rows: MonedaTipoCambioApi[];
  monedaById: Map<number, string>;
  onEdit: (r: MonedaTipoCambioApi) => void;
  onDelete: (id: number) => void;
};

export default function MonedaTipoCambioApiTable({ rows, monedaById, onEdit, onDelete }: Props) {
  return (
    <div className="table-wrap">
      <table className="table">
        <thead>
          <tr>
            <th>ID</th>
            <th>Moneda</th>
            <th>URL</th>
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
              <MonedaTipoCambioApiRow
                key={r.id}
                r={r}
                monedaById={monedaById}
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