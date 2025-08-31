import type { ProductoBancarioTipo } from '../interfaces/ProductoBancarioTipo';
import ProductoBancarioTipoRow from './ProductoBancarioTipoRow';

export default function ProductoBancarioTipoTable({
  rows,
  onEdit,
  onDelete,
}: {
  rows: ProductoBancarioTipo[];
  onEdit: (row: ProductoBancarioTipo) => void;
  onDelete: (id: number) => void;
}) {
  return (
    <div className="table-wrap">
      <table className="table">
        <thead>
          <tr>
            <th>ID</th>
            <th>Título</th>
            <th>Descripción</th>
            <th>Tabla</th>
            <th>Estado</th>
            <th style={{ width: 120, textAlign: 'right' }}>Acciones</th>
          </tr>
        </thead>
        <tbody>
          {rows.length === 0 ? (
            <tr>
              <td colSpan={6} style={{ textAlign: 'center', opacity: .7 }}>
                Sin registros
              </td>
            </tr>
          ) : rows.map(r => (
            <tr key={r.id}>
              <ProductoBancarioTipoRow r={r} onEdit={onEdit} onDelete={onDelete} />
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}