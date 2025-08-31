// component/ProductoBancarioUsuarioRow.tsx

import { labelAsignacion } from "../helpers/asignaciones";
import type { PBUsuarioRow, UsuarioLite, MonedaLite } from "../hooks/useProductoBancarioUsuarioUI";
import type { AsignacionIndices } from "../helpers/asignaciones";

type Props = {
  r: PBUsuarioRow;
  usuarioById: Map<number, UsuarioLite>;
  monedaById: Map<number, MonedaLite>;
  asignacionIdx: AsignacionIndices;
  onEdit: (r: PBUsuarioRow) => void;
  onDelete: (id: number) => void;
};

export default function ProductoBancarioUsuarioRow({
  r,
  usuarioById,
  monedaById,
  asignacionIdx,
  onEdit,
  onDelete,
}: Props) {
  const u = usuarioById.get(r.id_usuario_producto);
  const usuario = u ? `${u.nombres} ${u.apellidos}`.trim() : String(r.id_usuario_producto);

  const asignacion = labelAsignacion(r.id_producto_bancario_asignado, asignacionIdx);

  const m = monedaById.get(r.id_moneda_tipo);
  const simbolo = m?.simbolo ?? m?.titulo ?? '';

  const fmt = (n?: number) =>
    (n ?? 0).toLocaleString('es-ES', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

  const estado = r.estado === 1 ? 'Activo' : 'Inactivo';

  return (
    <tr>
      <td>{r.id}</td>
      <td>{usuario}</td>
      <td>{asignacion}</td>
      <td>{simbolo}</td>
      <td style={{ textAlign: 'right' }}>{fmt(r.monto)}</td>
      <td style={{ textAlign: 'right' }}>{fmt(r.disponible)}</td>
      <td>{(r.fecha_ultimo_corte ?? '').slice(0, 10)}</td>
      <td>{estado}</td>
      <td style={{ textAlign: 'right', width: 120 }}>
        <button className="icon-btn" onClick={() => onEdit(r)} title="Editar">
          ✏️
        </button>
        <button className="icon-btn" onClick={() => onDelete(r.id)} title="Eliminar" style={{ marginLeft: 8 }}>
          🗑️
        </button>
      </td>
    </tr>
  );
}