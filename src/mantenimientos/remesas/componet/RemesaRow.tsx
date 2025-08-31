import type { Remesa } from '../interfaces/Remesa';
import EstadoPill from '../../../globals/component/EstadoPill';

type Props = {
  r: Remesa;
  monedaById: Map<number, string>;
  onEdit: (row: Remesa) => void;
  onDelete: (id: number) => void;
};

// Normaliza el estado para saber si se puede actuar
function canAct(estado: unknown): boolean {
  if (typeof estado === 'number') {
    // típicamente 1=Activo, 0=Inactivo
    return estado === 1 || estado === 0;
  }
  if (typeof estado === 'string') {
    const s = estado.trim().toLowerCase();
    return s === 'activo' || s === 'inactivo';
  }
  return false;
}

// Formatea el monto (si prefieres otra localización cámbiala)
function fmtMoney(n?: number | null): string {
  const val = typeof n === 'number' ? n : 0;
  return val.toLocaleString('es-ES', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

export default function RemesaRow({ r, monedaById, onEdit, onDelete }: Props) {
  const monedaLabel = monedaById.get(r.id_moneda_tipo) ?? r.id_moneda_tipo;
  const act = canAct(r.estado);

  return (
    <tr>
      <td>{r.id}</td>
      <td>{r.no_pago}</td>   {/* ⬅️ aquí se pinta el código */}
      <td>{r.nombre_remitente}</td>
      <td>{r.nombre_receptor}</td>
      <td>{monedaLabel}</td>
      <td>{fmtMoney((r as any).monto)}</td> {/* 👈 muestra el monto */}
      <td><EstadoPill estado={r.estado} /></td>
      <td style={{ textAlign: 'right' }}>
        <button
          className="icon-btn"
          onClick={() => onEdit(r)}
          disabled={!act}
          title={act ? 'Editar' : 'Acción no disponible por estado'}
        >
          ✏️
        </button>
        <button
          className="icon-btn danger"
          onClick={() => onDelete(r.id)}
          disabled={!act}
          title={act ? 'Eliminar' : 'Acción no disponible por estado'}
          style={{ marginLeft: 8 }}
        >
          🗑️
        </button>
      </td>
    </tr>
  );
}