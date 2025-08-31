import type { Operacion } from '../interfaces/Operacion';
import EstadoPill from '../../../globals/component/EstadoPill';

type Props = {
  r: Operacion;
  onEdit: (r: Operacion) => void;
  onDelete: (id: number) => void;
};

export default function OperacionRow({ r, onEdit, onDelete }: Props) {
  return (
    <>
      <td>{r.id}</td>
      <td>{r.titulo ?? ''}</td>
      <td>{r.descripcion ?? ''}</td>
      <td><EstadoPill estado={r.estado} /></td>
      <td style={{ textAlign: 'right' }}>
        <button className="icon-btn" title="Editar" onClick={() => onEdit(r)}>✏️</button>
        <button className="icon-btn danger" title="Eliminar" onClick={() => onDelete(r.id)}>🗑️</button>
      </td>
    </>
  );
}