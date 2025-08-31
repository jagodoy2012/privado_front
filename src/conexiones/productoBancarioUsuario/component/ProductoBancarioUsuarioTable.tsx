// component/ProductoBancarioUsuarioTable.tsx

import Row from "./ProductoBancarioUsuarioRow";
import type { PBUsuarioRow, UsuarioLite, MonedaLite } from "../hooks/useProductoBancarioUsuarioUI";
import type { AsignacionIndices } from "../helpers/asignaciones";

type Props = {
  rows: PBUsuarioRow[];
  usuarioById: Map<number, UsuarioLite>;
  monedaById: Map<number, MonedaLite>;
  asignacionIdx: AsignacionIndices;
  onEdit: (r: PBUsuarioRow) => void;
  onDelete: (id: number) => void;
};

export default function ProductoBancarioUsuarioTable({
  rows,
  usuarioById,
  monedaById,
  asignacionIdx,
  onEdit,
  onDelete,
}: Props) {
  return (
    <div className="table-wrap">
      <table className="table">
        <thead>
          <tr>
            <th>ID</th>
            <th>Usuario</th>
            <th>Asignación</th>
            <th>Moneda</th>
            <th>Monto</th>
            <th>Disponible</th>
            <th>Último corte</th>
            <th>Estado</th>
            <th style={{ width: 120 }}>Acciones</th>
          </tr>
        </thead>
        <tbody>
          {rows.map(r => (
            <Row
              key={r.id}
              r={r}
              usuarioById={usuarioById}
              monedaById={monedaById}
              asignacionIdx={asignacionIdx}
              onEdit={onEdit}
              onDelete={onDelete}
            />
          ))}
        </tbody>
      </table>
    </div>
  );
}