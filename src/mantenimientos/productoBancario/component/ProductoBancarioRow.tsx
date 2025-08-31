import type { ProductoBancario } from '../interfaces/ProductoBancario';

type Props = {
  p: ProductoBancario;
  onEdit: (p: ProductoBancario) => void;
  onDelete: (id: number) => void;
};

export default function ProductoBancarioRow({ p, onEdit, onDelete }: Props) {
  return (
    <tr>
      <td>{p.id}</td>
      <td>{p.titulo}</td>
      <td>{p.descripcion}</td>
      <td>
        {p.estado === 1 ? (
          <span className="pill success">Activo</span>
        ) : (
          <span className="pill danger">Inactivo</span>
        )}
      </td>
      <td style={{ textAlign: 'right' }}>
        <button className="icon-btn" title="Editar" onClick={() => onEdit(p)}>✏️</button>
        <button className="icon-btn danger" title="Eliminar" onClick={() => onDelete(p.id)}>🗑️</button>
      </td>
    </tr>
  );
}