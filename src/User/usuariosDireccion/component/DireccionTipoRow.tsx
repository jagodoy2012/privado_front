import type { UsuarioDireccionTipo } from '../interfaces/UsuarioDireccionTipo';
import EstadoPill from '../../../globals/component/EstadoPill';

export default function DireccionTipoRow({ r }: { r: UsuarioDireccionTipo }) {
  return (
    <>
      <td>{r.id}</td>
      <td>{r.titulo ?? ''}</td>
      <td>{r.descripcion ?? ''}</td>
      <td><EstadoPill estado={r.estado} /></td>
    </>
  );
}
