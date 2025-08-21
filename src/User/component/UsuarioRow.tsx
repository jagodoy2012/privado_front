// User/component/UsuarioRow.tsx
import type { Usuario } from '../interfaces/Usuario';
import { formatDDMMYYYY } from '../../globals/helpers/format';

type Props = {
  u: Usuario;
  // Mapa id_tipo -> titulo que te pasa la tabla
  tiposMap?: Map<number, string>;
};

export default function UsuarioRow({ u, tiposMap }: Props) {
  const tipoTitulo =
    tiposMap?.get(u.id_usuario_tipo ?? 0) ??
    (u.id_usuario_tipo ? String(u.id_usuario_tipo) : '');

  return (
    <>
      <td>{u.id}</td>
      <td>{u.nombres ?? ''}</td>
      <td>{u.apellidos ?? ''}</td>
      <td>{u.telefono ?? ''}</td>
      <td>{formatDDMMYYYY(u.fecha_nacimiento)}</td>
      <td>{u.correo ?? ''}</td>
      <td>{tipoTitulo}</td>
    </>
  );
}
