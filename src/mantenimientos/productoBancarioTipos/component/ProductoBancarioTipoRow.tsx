import type { ProductoBancarioTipo } from '../interfaces/ProductoBancarioTipo';

export default function ProductoBancarioTipoRow({
  r,
  onEdit,
  onDelete,
}: {
  r: ProductoBancarioTipo;
  onEdit: (row: ProductoBancarioTipo) => void;
  onDelete: (id: number) => void;
}) {
  return (
    <>
      <td>{r.id}</td>
      <td>{r.titulo ?? ''}</td>
      <td>{r.descripcion ?? ''}</td>
      <td>{r.tabla ?? ''}</td>
      <td>
        {r.estado === 1 ? (
          <span className="pill pill--ok">Activo</span>
        ) : (
          <span className="pill pill--warn">Inactivo</span>
        )}
      </td>
      <td style={{ textAlign: 'right' }}>
        <button className="icon-btn" title="Editar" onClick={() => onEdit(r)}>✏️</button>
        <button className="icon-btn danger" title="Eliminar" onClick={() => onDelete(r.id)}>🗑️</button>
      </td>
    </>
  );
}