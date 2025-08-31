import React, { useMemo, useState } from 'react';
import type { Transaccion } from '../interfaces/cuenta';

type Props = {
  rows: Transaccion[];
  simbolo: string;
  pageSize?: number;
  numberFormatter?: Intl.NumberFormat;
  cuentaId: number;          // 👈 agregado
  cuentaMonedaId: number;    // 👈 agregado
};

export default function MovimientosTable({
  rows,
  simbolo,
  pageSize = 10,
  numberFormatter,
  cuentaId,
  cuentaMonedaId,
}: Props) {
  const [q, setQ] = useState('');
  const [page, setPage] = useState(1);

  const nf = useMemo(
    () =>
      numberFormatter ??
      new Intl.NumberFormat('es-ES', { minimumFractionDigits: 2, maximumFractionDigits: 2 }),
    [numberFormatter]
  );

  // helpers
  const isDebit = (r: Transaccion) => {
    const byReceiver = r.id_producto_bancario_usuario_recibe === cuentaId;
    const byText = String(r.tipo ?? '').toLowerCase().includes('depos');
    return byReceiver || byText;
  };

  const debitAmount = (r: Transaccion) => {
    if (!isDebit(r)) return 0;
    const sameCurrency = Number(r.id_moneda_tipo) === Number(cuentaMonedaId);
    const monto = Number(r.monto) || 0;
    const cambio = Number(r.cambio) || 1;
    return sameCurrency ? monto : monto * cambio; // 👈 regla pedida
  };

  const creditAmount = (r: Transaccion) => {
    if (isDebit(r)) return 0;
    // Requisito indica conversión solo para Debe; Haber queda tal cual
    return Number(r.monto) || 0;
  };

  // Filtrado por texto
  const filtered = useMemo(() => {
    const term = q.trim().toLowerCase();
    if (!term) return rows;
    return rows.filter(r => {
      const fecha = (r.fecha_realizado ?? '').slice(0, 10);
      const tipo = String(r.tipo ?? '');
      const monto = String(r.monto ?? '');
      const nota = String(r.nota ?? '');
      const ids = `${r.id} ${r.id_operaciones} ${r.id_producto_bancario_usuario_envia} ${r.id_producto_bancario_usuario_recibe}`;
      return (
        fecha.toLowerCase().includes(term) ||
        tipo.toLowerCase().includes(term) ||
        monto.toLowerCase().includes(term) ||
        nota.toLowerCase().includes(term) ||
        ids.toLowerCase().includes(term)
      );
    });
  }, [rows, q]);

  // Totales (con la misma regla)
  const totales = useMemo(() => {
    let debe = 0,
      haber = 0;
    for (const t of filtered) {
      debe += debitAmount(t);
      haber += creditAmount(t);
    }
    return { debe, haber };
  }, [filtered]);

  // Paginación
  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const safePage = Math.min(page, totalPages);
  const start = (safePage - 1) * pageSize;
  const visible = filtered.slice(start, start + pageSize);

  React.useEffect(() => {
    setPage(1);
  }, [q]);

  return (
    <div className="table-wrap">
      {/* Búsqueda + resumen */}
      <div style={{ display: 'flex', gap: 12, alignItems: 'center', marginBottom: 8 }}>
        <input
          placeholder="Buscar movimiento (fecha, tipo, monto, comentario, id…)"
          value={q}
          onChange={e => setQ(e.currentTarget.value)}
          className="input"
          style={{ flex: 1 }}
        />
        <div style={{ opacity: 0.7, fontSize: 12 }}>
          {filtered.length} resultado{filtered.length === 1 ? '' : 's'}
        </div>
      </div>

      <table className="table">
        <thead>
          <tr>
            <th style={{ width: 140 }}>Fecha</th>
            <th>Descripción</th>
            <th>Comentario</th>
            <th style={{ width: 140 }}>Debe</th>
            <th style={{ width: 140 }}>Haber</th>
          </tr>
        </thead>

        <tbody>
          {visible.length === 0 ? (
            <tr>
              <td colSpan={5} style={{ opacity: 0.7 }}>
                Sin movimientos…
              </td>
            </tr>
          ) : (
            visible.map(r => {
              const debe = debitAmount(r);
              const haber = creditAmount(r);
              const debeFmt = debe ? `${simbolo}${nf.format(debe)}` : '';
              const haberFmt = haber ? `${simbolo}${nf.format(haber)}` : '';
              return (
                <tr key={r.id}>
                  <td>{(r.fecha_realizado ?? '').slice(0, 10)}</td>
                  <td>{r.tipo ?? '—'}</td>
                  <td>{r.nota ?? ''}</td>
                  <td className="num">{debeFmt}</td>
                  <td className="num">{haberFmt}</td>
                </tr>
              );
            })
          )}
        </tbody>

        <tfoot>
          <tr>
            <th colSpan={3} style={{ textAlign: 'right' }}>
              Totales (filtrados)
            </th>
            <th className="num">{`${simbolo}${nf.format(totales.debe)}`}</th>
            <th className="num">{`${simbolo}${nf.format(totales.haber)}`}</th>
          </tr>
        </tfoot>
      </table>

      {/* Paginación */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginTop: 8,
        }}
      >
        <div style={{ opacity: 0.7, fontSize: 12 }}>
          Página {safePage} de {totalPages}
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button
            className="btn small"
            onClick={() => setPage(p => Math.max(1, p - 1))}
            disabled={safePage <= 1}
          >
            « Anterior
          </button>
          <button
            className="btn small"
            onClick={() => setPage(p => Math.min(totalPages, p + 1))}
            disabled={safePage >= totalPages}
          >
            Siguiente »
          </button>
        </div>
      </div>
    </div>
  );
}