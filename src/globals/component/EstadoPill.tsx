export default function EstadoPill({ estado }: { estado: number | null }) {
  const activo = estado === 1;

  return (
    <span className={'pill ' + (activo ? 'pill-ok' : 'pill-bad')}>
      {activo ? 'Activo' : 'Inactivo'}
    </span>
  );
}
