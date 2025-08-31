// src/User/monedaTipos/component/MonedaTipoRow.tsx
import type { MonedaTipo } from '../interfaces/MonedaTipo';
import EstadoPill from '../../../globals/component/EstadoPill';

export default function MonedaTipoRow({ r }: { r: MonedaTipo }) {
  return (
    <>
      <td>{r.id}</td>
      <td>{r.titulo ?? ''}</td>
      <td>{r.descripcion ?? ''}</td>
      <td>{r.simbolo ?? ''}</td>
      <td><EstadoPill estado={r.estado} /></td>
    </>
  );
}