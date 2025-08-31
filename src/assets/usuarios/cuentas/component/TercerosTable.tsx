import React, { useMemo, useState } from 'react';
import type { CuentaTercero } from '../interfaces/cuenta';

type Props = {
  rows: CuentaTercero[];
  onUsar: (nroCuenta: number) => void;
  onEliminar?: (id: number) => void;
  pageSize?: number;
};

export default function TercerosTable({ rows, onUsar, onEliminar, pageSize = 10 }: Props) {
  const [q, setQ] = useState('');
  const [page, setPage] = useState(1);

  const filtered = useMemo(() => {
    const term = q.trim().toLowerCase();
    if (!term) return rows;
    return rows.filter(r => {
      const alias = (r.alias ?? '').toLowerCase();
      const cuenta = String(r.id_producto_bancario_usuario ?? '').toLowerCase();
      const id = String(r.id ?? '').toLowerCase();
      return alias.includes(term) || cuenta.includes(term) || id.includes(term);
    });
  }, [rows, q]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const safePage = Math.min(page, totalPages);
  const start = (safePage - 1) * pageSize;
  const visible = filtered.slice(start, start + pageSize);

  React.useEffect(() => { setPage(1); }, [q]);

  return (
    <div className="table-wrap">
      <div style={{display:'flex', gap:12, alignItems:'center', marginBottom:8}}>
        <input
          placeholder="Buscar cuenta (alias, número, id)…"
          value={q}
          onChange={e => setQ(e.currentTarget.value)}
          className="input"
          style={{flex:1}}
        />
        <div style={{opacity:.7, fontSize:12}}>
          {filtered.length} resultado{filtered.length===1?'':'s'}
        </div>
      </div>

      <table className="table">
        <thead>
          <tr>
            <th>Alias</th>
            <th style={{width:180}}>No. cuenta</th>
            <th style={{width:260}}>Acciones</th>
          </tr>
        </thead>
        <tbody>
          {visible.length === 0 ? (
            <tr><td colSpan={3} style={{opacity:.7}}>Sin cuentas guardadas…</td></tr>
          ) : visible.map(r => (
            <tr key={r.id}>
              <td>{r.alias}</td>
              <td>{r.id_producto_bancario_usuario}</td>
              <td>
                <button
                  className="btn small"
                  onClick={() => onUsar(r.id_producto_bancario_usuario)}
                  title="Usar esta cuenta en una nueva transacción"
                >
                  Usar
                </button>{' '}
                {onEliminar && (
                  <button
                    className="btn small danger"
                    onClick={() => onEliminar(r.id)}
                    title="Eliminar de mis terceros"
                  >
                    Eliminar
                  </button>
                )}
              </td>
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