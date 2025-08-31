import type { Remesa } from '../interfaces/Remesa';
import RemesaRow from './RemesaRow';

type Props = {
  rows: Remesa[];
  /** Mapa id_moneda_tipo -> titulo (ej. 1 -> 'Dólares') */
  monedaById: Map<number, string>;
  onEdit: (r: Remesa) => void;
  onDelete: (id: number) => void;
};

export default function RemesaTable({ rows, monedaById, onEdit, onDelete }: Props) {
  return (
    <div className="table-wrap">
      <table className="table">
        <thead>
          <tr>
            <th>ID</th>
            <th>No. de pago</th>
            <th>Remitente</th>
            <th>Receptor</th>
            <th>Moneda</th>
            <th>Monto</th>
            <th>Estado</th>
            <th style={{ width: 120, textAlign: 'right' }}>Acciones</th>
          </tr>
        </thead>

        <tbody>
          {rows.length === 0 ? (
            <tr>
              <td colSpan={8} style={{ textAlign: 'center', opacity: .7 }}>
                Sin registros
              </td>
            </tr>
          ) : (
            rows.map(r => (
              <RemesaRow
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