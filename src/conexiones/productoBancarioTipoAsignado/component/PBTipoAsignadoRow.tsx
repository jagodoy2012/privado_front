import type { PBTipoAsignado } from '../interfaces/PBTipoAsignado';

type Props = {
  r: PBTipoAsignado;
  productoById: Map<number, string>;
  tipoById: Map<number, string>;
  categoriaById: Map<number, string>; // 👈 NUEVO
  onEdit: (r: PBTipoAsignado) => void;
  onDelete: (id: number) => void;
};

export default function PBTipoAsignadoRow({
  r, productoById, tipoById, categoriaById, onEdit, onDelete,
}: Props) {
  const producto = productoById.get(r.idProductoBancario) ?? r.idProductoBancario;
  const tipo = tipoById.get(r.idProductoBancarioTipo) ?? r.idProductoBancarioTipo;
  const categoria = categoriaById.get(r.id_categoria) ?? r.id_categoria; // 👈 NUEVO
  const estado = r.estado === 1 ? 'Activo' : 'Inactivo';

  return (
    <tr>
      <td>{r.id}</td>
      <td>{String(producto)}</td>
      <td>{String(tipo)}</td>
      <td>{String(categoria)}</td> {/* 👈 NUEVO */}
      <td>{estado}</td>
      <td style={{ textAlign: 'right' }}>
        <button className="icon-btn" title="Editar" onClick={() => onEdit(r)}>✏️</button>
        <button className="icon-btn" title="Eliminar" onClick={() => onDelete(r.id)}>🗑️</button>
      </td>
    </tr>
  );
}