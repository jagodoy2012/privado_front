import type { ProductoBancario } from '../interfaces/ProductoBancario';
import ProductoBancarioRow from './ProductoBancarioRow';

type Props = {
  rows: ProductoBancario[];
  onEdit: (p: ProductoBancario) => void;
  onDelete: (id: number) => void;
};

export default function ProductoBancarioTable({ rows, onEdit, onDelete }: Props) {
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
              <td colSpan={5} style={{ textAlign: 'center', opacity: .7 }}>
                Sin registros
              </td>
            </tr>
          ) : (
            rows.map(p => (
              <ProductoBancarioRow
                key={p.id}
                p={p}
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