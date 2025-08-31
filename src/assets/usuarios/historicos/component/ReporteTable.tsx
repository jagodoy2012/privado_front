import React, { useMemo, useState } from 'react';
import type { TransaccionVista } from '../interfaces/reporrte';

type Props = {
  rows: TransaccionVista[];
  pageSize?: number;
  nf: Intl.NumberFormat;
};

export default function ReporteTable({ rows, pageSize = 10, nf }: Props) {
  const [page, setPage] = useState(1);

  const totalDebe  = useMemo(() => rows.reduce((s, r) => s + (Number(r.debe)  || 0), 0), [rows]);
  const totalHaber = useMemo(() => rows.reduce((s, r) => s + (Number(r.haber) || 0), 0), [rows]);

  const totalPages = Math.max(1, Math.ceil(rows.length / pageSize));
  const safePage   = Math.min(page, totalPages);
  const start      = (safePage - 1) * pageSize;
  const visible    = rows.slice(start, start + pageSize);

  return (
    <div className="table-wrap">
      <table className="table">
        <thead>
          <tr>
            <th style={{width:120}}>Fecha</th>
            <th>Título</th>
            <th style={{width:140}}>Debe</th>
            <th style={{width:140}}>Haber</th>
          </tr>
        </thead>
        <tbody>
          {visible.length === 0 ? (
            <tr><td colSpan={4} style={{opacity:.7}}>Sin movimientos…</td></tr>
          ) : visible.map(r => (
            <tr key={r.id}>
              <td>{r.fecha}</td>
              <td>{r.titulo}</td>
              <td className="num">{r.debe  ? nf.format(r.debe)  : ''}</td>
              <td className="num">{r.haber ? nf.format(r.haber) : ''}</td>
            </tr>
          ))}
        </tbody>
        <tfoot>
          <tr>
            <td colSpan={2} style={{textAlign:'right', fontWeight:600}}>Totales (filtrados):</td>
            <td className="num" style={{fontWeight:600}}>{nf.format(totalDebe)}</td>
            <td className="num" style={{fontWeight:600}}>{nf.format(totalHaber)}</td>
          </tr>
        </tfoot>
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