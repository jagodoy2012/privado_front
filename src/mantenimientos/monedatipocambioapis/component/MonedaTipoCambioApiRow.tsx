import type { MonedaTipoCambioApi } from '../interfaces/MonedaTipoCambioApi';

type Props = {
  r: MonedaTipoCambioApi;
  monedaById: Map<number, string>;
  onEdit: (r: MonedaTipoCambioApi) => void;
  onDelete: (id: number) => void;
};

export default function MonedaTipoCambioApiRow({ r, monedaById, onEdit, onDelete }: Props) {
  return (
    <tr>
      <td>{r.id}</td>
      <td>{monedaById.get(r.id_moneda_tipo) ?? r.id_moneda_tipo}</td>
      <td>{r.url}</td>
      <td>{r.estado === 1 ? 'Activo' : 'Inactivo'}</td>
      
      {/* 👇 Acciones con iconitos */}
      <td style={{ textAlign: 'right' }}>
        <button
          className="icon-btn"
          onClick={() => onEdit(r)}
          title="Editar"
          aria-label="Editar"
        >
          <span aria-hidden>✏️</span>
        </button>
        <button
          className="icon-btn danger"
          onClick={() => onDelete(r.id)}
          title="Eliminar"
          aria-label="Eliminar"
        >
          <span aria-hidden>🗑️</span>
        </button>
      </td>
    </tr>
  );
}