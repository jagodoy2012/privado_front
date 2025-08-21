// components/tarjetaTipo/TarjetaTipoRow.tsx
// components/tarjetaTipo/TarjetaTipoRow.tsx
import type { TarjetaTipo } from '../hooks/useTarjetaTipos';
import { formatDDMMYYYY } from '../../../globals/helpers/format'; // ajusta ruta
import EstadoPill from '../../../globals/component/EstadoPill';             // ajusta ruta

type Props = {
  item: TarjetaTipo;
  onEdit: (item: TarjetaTipo) => void;
  onDelete: (item: TarjetaTipo) => void;
};

export default function TarjetaTipoRow({ item, onEdit, onDelete }: Props) {
  return (
    <tr>
      <td>{item.id}</td>
      <td className="fw">{item.titulo}</td>
      <td>{item.descripcion}</td>
      <td>
        <EstadoPill estado={(item.estado === 1 ? 1 : 0) as 0 | 1} />
      </td>
      <td>{item.fecha ? formatDDMMYYYY(item.fecha) : '—'}</td>
      <td className="actions">
        <button className="icon-btn" title="Editar" onClick={() => onEdit(item)}>✏️</button>
        <button className="icon-btn danger" title="Eliminar" onClick={() => onDelete(item)}>🗑️</button>
      </td>
    </tr>
  );
}