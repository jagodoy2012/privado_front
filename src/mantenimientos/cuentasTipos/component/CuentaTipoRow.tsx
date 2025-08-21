import type { CuentaTipo } from '../interfaces/CuentaTipo';
import EstadoPill from '../../../globals/component/EstadoPill';

export default function CuentaTipoRow({ r }: { r: CuentaTipo }) {
  return (
    <>
      <td>{r.id}</td>
      <td>{r.titulo ?? ''}</td>
      <td>{r.descripcion ?? ''}</td>
      <td><EstadoPill estado={r.estado} /></td>
    </>
  );
}
