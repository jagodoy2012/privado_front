import type { Asignado } from '../interfaces/Asignado';

type Props = {
  r: Asignado;
  opById: Map<number, string>;
  pbById: Map<number, string>;
  onEdit: (r: Asignado) => void;
  onDelete: (id: number) => void;
};

export default function AsignadoRow({ r, opById, pbById, onEdit, onDelete }: Props) {
  const opTitulo = opById.get(r.id_operaciones) ?? r.id_operaciones;
  const pbTitulo = pbById.get(r.id_producto_bancario) ?? r.id_producto_bancario;
  const estadoTxt = r.estado === 1 ? 'Activo' : r.estado === 0 ? 'Inactivo' : String(r.estado);
  const disabled = !(r.estado === 0 || r.estado === 1);

  return (
    <tr>
      <td>{r.id}</td>
      <td>{opTitulo}</td>
      <td>{pbTitulo}</td>
      <td>{estadoTxt}</td>
      <td style={{ textAlign: 'right' }}>
        <div className="actions">
          <button className="icon-btn" title="Editar" onClick={() => onEdit(r)} disabled={disabled}>✏️</button>
          <button className="icon-btn" title="Eliminar" onClick={() => onDelete(r.id)} disabled={disabled}>🗑️</button>
        </div>
      </td>
    </tr>
  );
}