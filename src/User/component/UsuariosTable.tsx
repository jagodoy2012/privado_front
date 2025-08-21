// User/component/UsuariosTable.tsx
import type { Usuario } from '../interfaces/Usuario';
import UsuarioRow from './UsuarioRow';
import EstadoPill from '../../globals/component/EstadoPill';

type Props = {
  rows: Usuario[];
  tiposIndex: Map<number, string>;     // id_tipo -> titulo
  onEdit: (u: Usuario) => void;
  onDelete: (id: number) => void;
  onDirecciones: (u: Usuario) => void;
};

export default function UsuariosTable({
  rows, tiposIndex, onEdit, onDelete, onDirecciones
}: Props) {
  return (
    <div className="table-wrap">
      <table className="table">
        <thead>
          <tr>
            <th>ID</th>
            <th>Nombres</th>
            <th>Apellidos</th>
            <th>Teléfono</th>
            <th>Fecha nacimiento</th>
            <th>Correo</th>
            <th>Tipo Usuario</th>
            <th style={{ width: 120, textAlign: 'center' }}>Direcciones</th>
            <th>Estado</th>
            <th style={{ width: 120, textAlign: 'right' }}>Acciones</th>
          </tr>
        </thead>

        <tbody>
          {rows.length === 0 ? (
            <tr>
              <td colSpan={10} style={{ textAlign: 'center', opacity: .7 }}>
                Sin registros
              </td>
            </tr>
          ) : rows.map(u => (
            <tr key={u.id}>
              {/* 7 celdas */}
              <UsuarioRow u={u} tiposMap={tiposIndex} />

              {/* Direcciones */}
              <td style={{ textAlign: 'center' }}>
                <button
                  className="icon-btn"
                  onClick={() => onDirecciones(u)}
                  title="Direcciones"
                >
                  📍
                </button>
              </td>

              {/* Estado */}
              <td><EstadoPill estado={u.estado} /></td>

              {/* Acciones */}
              <td style={{ textAlign: 'right' }}>
                <button
                  className="icon-btn"
                  title="Editar"
                  onClick={() => onEdit(u)}
                >
                  ✏️
                </button>
                <button
                  className="icon-btn danger"
                  title="Eliminar"
                  onClick={() => onDelete(u.id)}
                >
                  🗑️
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
