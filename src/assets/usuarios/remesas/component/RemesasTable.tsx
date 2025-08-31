import React, { useEffect, useMemo, useState } from 'react';
import type { Remesa } from '../interfaces/remesa';

type Props = {
  rows: Remesa[];
  simboloByMonedaId: (id: number | undefined) => string;
  gtqId: number | null;
  aGTQ: (origenId: number, monto: number) => Promise<number>;
  pageSize?: number;
  onEliminar: (row: Remesa) => Promise<void>;
  showActions?: boolean;
};

type Key = string; // id|monto|moneda
type ConvMap = Record<Key, number>;

export default function RemesasTable({
  rows, simboloByMonedaId, gtqId, aGTQ, pageSize = 10, onEliminar, showActions = false
}: Props) {
  const [q, setQ] = useState('');
  const [page, setPage] = useState(1);

  const nf = useMemo(
    () => new Intl.NumberFormat('es-ES', { minimumFractionDigits: 2, maximumFractionDigits: 2 }),
    []
  );

  // 1) Filtro
  const filtered = useMemo(() => {
    const term = q.trim().toLowerCase();
    if (!term) return rows;
    return rows.filter(r => {
      const fecha = (r.fecha ?? r.fecha_envio ?? '').slice(0, 10);
      const nombre = `${r.nombre_receptor ?? ''} ${r.nombre_remitente ?? ''}`;
      const nop = String(r.no_pago ?? '');
      const estado = String(r.estado ?? '');
      const monto = String(r.monto ?? '');
      return (
        fecha.toLowerCase().includes(term) ||
        nombre.toLowerCase().includes(term) ||
        nop.toLowerCase().includes(term) ||
        estado.toLowerCase().includes(term) ||
        monto.toLowerCase().includes(term)
      );
    });
  }, [rows, q]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const safePage = Math.min(page, totalPages);
  const start = (safePage - 1) * pageSize;
  const visible = filtered.slice(start, start + pageSize);

  useEffect(() => setPage(1), [q]);

  // 2) Cache de conversiones a GTQ, sin setState en render
  const [convGTQ, setConvGTQ] = useState<ConvMap>({});

  useEffect(() => {
    if (gtqId == null) return; // aún no hay catálogo
    let alive = true;

    // Filas que necesitan conversión (moneda != GTQ y monto > 0)
    const pend = visible
      .map(r => {
        const monId = Number((r as any).id_moneda_tipo ?? 0);
        const monto = Number(r.monto || 0);
        const key: Key = `${r.id}|${monto}|${monId}`;
        return { r, monId, monto, key };
      })
      .filter(x =>
        x.monto > 0 &&
        x.monId !== gtqId &&
        convGTQ[x.key] == null
      );

    if (pend.length === 0) return;

    (async () => {
      try {
        const entries: Array<[Key, number]> = [];
        for (const item of pend) {
          try {
            const qVal = await aGTQ(item.monId, item.monto);
            entries.push([item.key, Number(qVal || 0)]);
          } catch {
            // si falla la conversión, no rompas la UI
          }
        }
        if (!alive || entries.length === 0) return;
        setConvGTQ(prev => {
          const next = { ...prev };
          for (const [k, v] of entries) next[k] = v;
          return next;
        });
      } catch { /* noop */ }
    })();

    return () => { alive = false; };
    // Dependencias: solo cambian cuando cambian las filas visibles o el gtqId/aGTQ
  }, [visible, gtqId, aGTQ]); // <- NO dependas de convGTQ aquí (evita bucle)

  const renderMonto = (r: Remesa, showDebe: boolean) => {
    const isEnvio = (r.tipo ?? '').toLowerCase().includes('env');
    const debe  = isEnvio ? r.monto : 0;
    const haber = isEnvio ? 0 : r.monto;
    const monto = showDebe ? debe : haber;

    if (!monto) return null;

    const monId = Number((r as any).id_moneda_tipo ?? 0);
    const simb = simboloByMonedaId(monId);
    const key: Key = `${r.id}|${monto}|${monId}`;
    const qVal = convGTQ[key];
    const showQ = gtqId != null && monId !== gtqId && qVal != null;

    return (
      <div style={{display:'flex', flexDirection:'column', alignItems:'flex-end', lineHeight:1.15}}>
        <span>{simb}{nf.format(monto)}</span>
        {showQ && <span style={{opacity:.8, fontSize:12}}>Q{nf.format(qVal)}</span>}
      </div>
    );
  };

  return (
    <div className="table-wrap">
      <div style={{ display:'flex', gap:12, alignItems:'center', marginBottom:8 }}>
        <input
          placeholder="Buscar (fecha, nombre, no_pago, estado)…"
          value={q}
          onChange={e => setQ(e.currentTarget.value)}
          className="input"
          style={{ flex:1 }}
        />
        <div style={{ opacity:.7, fontSize:12 }}>
          {filtered.length} registro{filtered.length===1?'':'s'}
        </div>
      </div>

      <table className="table">
        <thead>
          <tr>
            <th style={{width:130}}>Fecha</th>
            <th style={{width:160}}>No. cobro</th>
            <th>Nombre</th>
            <th style={{width:160}}>Debe</th>
            <th style={{width:160}}>Haber</th>
            <th style={{width:120}}>Estado</th>
            {showActions && <th style={{width:160}}>Acciones</th>}
          </tr>
        </thead>
        <tbody>
          {visible.length === 0 ? (
            <tr>
              <td colSpan={showActions ? 7 : 6} style={{opacity:.7}}>Sin remesas…</td>
            </tr>
          ) : visible.map(r => (
            <tr key={`${r.id}-${r.no_pago}`}>
              <td>{(r.fecha ?? r.fecha_envio ?? '').slice(0,10)}</td>
              <td>{r.no_pago ?? '—'}</td>
              <td>{r.nombre_receptor || r.nombre_remitente || '—'}</td>
              <td className="num">{renderMonto(r, true)}</td>
              <td className="num">{renderMonto(r, false)}</td>
              <td>{Number(r.estado) === 1 ? 'Activo' : String(r.estado)}</td>
              {showActions && (
                <td>
                  {Number(r.estado) === 1 ? (
                    <button className="btn small danger" onClick={() => onEliminar(r)}>
                      Eliminar
                    </button>
                  ) : null}
                </td>
              )}
            </tr>
          ))}
        </tbody>
      </table>

      <div style={{display:'flex', justifyContent:'space-between', alignItems:'center', marginTop:8}}>
        <div style={{opacity:.7, fontSize:12}}>
          Página {safePage} de {totalPages}
        </div>
        <div style={{display:'flex', gap:8}}>
          <button className="btn small" onClick={() => setPage(p => Math.max(1, p-1))} disabled={safePage<=1}>
            « Anterior
          </button>
          <button className="btn small" onClick={() => setPage(p => Math.min(totalPages, p+1))} disabled={safePage>=totalPages}>
            Siguiente »
          </button>
        </div>
      </div>
    </div>
  );
}