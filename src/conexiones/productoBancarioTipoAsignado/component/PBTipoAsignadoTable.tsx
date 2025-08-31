import type { PBTipoAsignado } from '../interfaces/PBTipoAsignado';
import PBTipoAsignadoRow from './PBTipoAsignadoRow';

type Props = {
  rows: PBTipoAsignado[];
  productoById: Map<number, string>;
  tipoById: Map<number, string>;
  categoriaById: Map<number, string>;  // 👈 NUEVO
  onEdit: (r: PBTipoAsignado) => void;
  onDelete: (id: number) => void;
};

export default function PBTipoAsignadoTable({
  rows, productoById, tipoById, categoriaById, onEdit, onDelete,
}: Props) {
  return (
    <div className="table-wrap">
      <table className="table">
        <thead>
          <tr>
            <th>ID</th>
            <th>Producto</th>
            <th>Tipo</th>
            <th>Categoría</th> {/* 👈 NUEVO */}
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
          ) : (
            rows.map(r => (
              <PBTipoAsignadoRow
                key={r.id}
                r={r}
                productoById={productoById}
                tipoById={tipoById}
                categoriaById={categoriaById}
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