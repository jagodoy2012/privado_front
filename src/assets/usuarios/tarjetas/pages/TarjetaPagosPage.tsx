import React, { useEffect, useMemo, useState } from 'react';
import Modal from '../../../../globals/component/modal/Modal';
import { useTarjetaPagos } from '../hooks/useTarjetaPagos';
import MovimientosTable from '../../cuentas/component/MovimientosTable';
import type { NuevaTransaccion } from '../../cuentas/interfaces/cuenta';

export default function TarjetaPagosPage() {
  const {
    loading, err,
    tarjetas, tarjeta, trans, ops,
    cuentasUsuario,
    monedas, monedaIdx, simboloTarj,
    cambiarTarjeta,
    convertirMonto, debitarSaldoServidor, acreditarSaldoServidor,
    crearTransaccion,
    gtqId, aGTQ, // <-- nuevos
  } = useTarjetaPagos(null /* idTarjetaInicial */);

  const nf = useMemo(
    () => new Intl.NumberFormat('es-ES', { minimumFractionDigits: 2, maximumFractionDigits: 2 }),
    []
  );

  const [openPay, setOpenPay] = useState(false);
  const today = new Date().toISOString().slice(0,10);
  const [form, setForm] = useState({
    id_operaciones: 0,
    cuenta_origen: '' as number | '',
    monto: 0,
    nota: '',
    fecha_realizado: today,
  });

  // ==== Capital (GTQ) si la tarjeta no está en GTQ
  const [capitalGTQ, setCapitalGTQ] = useState<number | null>(null);
  useEffect(() => {
    (async () => {
      if (!tarjeta) { setCapitalGTQ(null); return; }
      const cap = Number(tarjeta.monto || 0);
      if (!gtqId) { setCapitalGTQ(null); return; }
      if (tarjeta.id_moneda_tipo === gtqId) { setCapitalGTQ(cap); return; }
      try {
        const v = await aGTQ(tarjeta.id_moneda_tipo, cap);
        setCapitalGTQ(v);
      } catch { setCapitalGTQ(null); }
    })();
  }, [tarjeta, gtqId, aGTQ]);

  // ==== Totales Debe/Haber en GTQ (sobre movimientos)
  const [totDebeGTQ, setTotDebeGTQ]   = useState(0);
  const [totHaberGTQ, setTotHaberGTQ] = useState(0);
  useEffect(() => {
    (async () => {
      if (!tarjeta) { setTotDebeGTQ(0); setTotHaberGTQ(0); return; }
      let d = 0, h = 0;
      for (const t of trans) {
        const monto = Number((t as any).monto ?? 0);
        const monId = (t as any).id_moneda_tipo ?? tarjeta.id_moneda_tipo;
        let enGTQ = monto;
        try { if (gtqId && monId !== gtqId) enGTQ = await aGTQ(monId, monto); } catch {}

        const recibe = (t as any).id_producto_bancario_usuario_recibe;
        const envia  = (t as any).id_producto_bancario_usuario_envia;

        if (recibe === tarjeta.id) h += enGTQ;       // Haber (acredita)
        else if (envia === tarjeta.id) d += enGTQ;   // Debe  (debita)
      }
      setTotDebeGTQ(d);
      setTotHaberGTQ(h);
    })();
  }, [trans, tarjeta, gtqId, aGTQ]);

  const cardStyle: React.CSSProperties = {
    backdropFilter: 'blur(6px)',
    background: 'rgba(255,255,255,0.06)',
    border: '1px solid rgba(255,255,255,0.08)',
    borderRadius: 16,
    padding: 14,
    cursor: 'pointer',
    minWidth: 260,
  };
  const selectedStyle: React.CSSProperties = {
    boxShadow: '0 0 0 2px #5b9cff inset',
    background: 'rgba(91,156,255,0.12)',
  };

  const simb = simboloTarj;

  return (
    <>
      <div className="header-row">
        <h1 className="page-title">Pagos de tarjeta</h1>
      </div>

      {err && <div className="error" style={{ marginBottom: 12 }}>{err}</div>}
      {loading && <div style={{opacity:.7, marginBottom: 12}}>Cargando…</div>}

      {/* CARDS de TARJETAS */}
      <div style={{display:'flex', gap:12, overflowX:'auto', paddingBottom:8, marginBottom:12}}>
        {tarjetas.map(t => {
          const simbT = monedaIdx.get(t.id_moneda_tipo)?.simbolo || '';
          const isSel = t.id === tarjeta?.id;
          return (
            <div
              key={t.id}
              style={{ ...cardStyle, ...(isSel ? selectedStyle : {}) }}
              onClick={() => cambiarTarjeta(t.id)}
              title={`Tarjeta #${t.id}`}
            >
              <div style={{fontSize:12, opacity:.8}}>Tarjeta #{t.id}</div>
              <div style={{fontSize:24, fontWeight:600, margin:'6px 0'}}>
                {simbT}{nf.format(Number(t.disponible ?? 0))}
              </div>
              <div style={{fontSize:12, opacity:.8, marginBottom:4}}>Moneda: {simbT || '—'}</div>
              <div style={{fontSize:12, opacity:.8}}>Capital: {simbT}{nf.format(Number(t.monto ?? 0))}</div>
              {isSel && capitalGTQ != null && gtqId && t.id_moneda_tipo !== gtqId && (
                <div style={{fontSize:12, opacity:.9, marginTop:4}}>
                  Capital (GTQ): <strong>Q{nf.format(capitalGTQ)}</strong>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Acciones */}
      <div style={{display:'flex', gap:12, marginBottom:16}}>
        <button className="btn primary" onClick={() => setOpenPay(true)} disabled={!tarjeta}>Pagar</button>
      </div>

      {/* Tabla de movimientos */}
      <h2 className="section-title">Movimientos</h2>

      {gtqId && (
        <div style={{
          margin: '6px 0 8px',
          fontSize: 13,
          opacity: 0.9,
          display: 'flex',
          gap: 18,
        }}>
          <span><strong>Totales en GTQ:</strong></span>
          <span>Debe: <strong>Q{nf.format(totDebeGTQ)}</strong></span>
          <span>Haber: <strong>Q{nf.format(totHaberGTQ)}</strong></span>
        </div>
      )}

      <MovimientosTable
        rows={trans}
        simbolo={simb}
        numberFormatter={nf}
        cuentaId={tarjeta?.id ?? 0}
        cuentaMonedaId={tarjeta?.id_moneda_tipo ?? 0}
      />

      {/* MODAL: Pagar tarjeta */}
      <Modal
        open={openPay}
        onClose={() => setOpenPay(false)}
        title="Pagar tarjeta"
        footer={
          <>
            <button className="btn" onClick={() => setOpenPay(false)}>Cancelar</button>
            <button className="btn primary" form="pay-form" type="submit">Guardar</button>
          </>
        }
      >
        <form
          id="pay-form"
          className="form"
          onSubmit={async (e) => {
            e.preventDefault();
            if (!tarjeta) return;

            const idTarjeta = tarjeta.id;                 // destino
            const idMonedaTarjeta = tarjeta.id_moneda_tipo;

            if (form.monto <= 0) { alert('El monto debe ser mayor que 0.'); return; }
            if (!form.id_operaciones) { alert('Selecciona una operación.'); return; }
            if (!form.cuenta_origen) { alert('Selecciona la cuenta de origen.'); return; }

            const origen = cuentasUsuario.find(c => c.id === Number(form.cuenta_origen));
            if (!origen) { alert('Cuenta de origen inválida.'); return; }
            if ((Number(origen.disponible) || 0) < Number(form.monto)) {
              alert('Saldo insuficiente en la cuenta seleccionada.');
              return;
            }

            // Pre-calcular conversión para mensaje
            let acreditado = Number(form.monto) || 0;
            try {
              if (origen.id_moneda_tipo !== idMonedaTarjeta) {
                acreditado = await convertirMonto(origen.id_moneda_tipo, idMonedaTarjeta, acreditado);
              }
            } catch (err:any) {
              alert(err?.message || 'No se pudo obtener el tipo de cambio.');
              return;
            }

            const ok = confirm(
              `Confirmar pago:\n` +
              `Origen: Cuenta #${origen.id} (${monedaIdx.get(origen.id_moneda_tipo)?.simbolo})\n` +
              `Destino: Tarjeta #${idTarjeta} (${monedaIdx.get(idMonedaTarjeta)?.simbolo})\n` +
              `Monto a debitar: ${monedaIdx.get(origen.id_moneda_tipo)?.simbolo}${nf.format(form.monto)}\n` +
              `Monto que acredita: ${monedaIdx.get(idMonedaTarjeta)?.simbolo}${nf.format(acreditado)}`
            );
            if (!ok) return;

            try {
              // 1) Debitar cuenta origen en su propia moneda
              await debitarSaldoServidor(origen.id, form.monto);

              // 2) Acreditar tarjeta en su moneda (ya convertido)
              await acreditarSaldoServidor(idTarjeta, acreditado);

              // 3) Registrar transacción (moneda = de la cuenta que envía)
              const payload: NuevaTransaccion = {
                id_producto_bancario_usuario_envia: origen.id,
                id_producto_bancario_usuario_recibe: idTarjeta,
                id_operaciones: Number(form.id_operaciones),
                id_moneda_tipo: Number(origen.id_moneda_tipo),
                monto: Number(form.monto),
                cambio: Number(acreditado / (form.monto || 1)),
                nota: form.nota || '',
                fecha_realizado: form.fecha_realizado,
                estado: 1,
                fecha: '',
                id_usuario: 1
              };
              await crearTransaccion(payload);

              setOpenPay(false);
              setForm(s => ({ ...s, monto: 0, cuenta_origen: '' }));
            } catch (err:any) {
              alert(err?.message || 'No se pudo completar el pago');
            }
          }}
        >
          {/* Operación */}
          <div className="form-row">
            <label>Operación</label>
            <select
              value={form.id_operaciones ? String(form.id_operaciones) : ''}
              onChange={(e) => {
                const el = e.target as HTMLSelectElement;
                const v = (el.value || '').trim();
                setForm(s => ({ ...s, id_operaciones: v === '' ? 0 : Number(v) }));
              }}
              required
            >
              <option value="">Seleccione…</option>
              {ops.map(o => (
                <option key={o.id} value={o.id_operaciones}>{o.titulo}</option>
              ))}
            </select>
          </div>

          {/* Moneda (destino: tarjeta) */}
          <div className="form-row">
            <label>Moneda (destino)</label>
            <select value={tarjeta ? String(tarjeta.id_moneda_tipo) : ''} disabled>
              <option value="">
                {tarjeta
                  ? (monedaIdx.get(tarjeta.id_moneda_tipo)?.simbolo ||
                     monedaIdx.get(tarjeta.id_moneda_tipo)?.titulo || '—')
                  : '—'}
              </option>
            </select>
          </div>

          {/* Monto */}
          <div className="form-row">
            <label>Monto</label>
            <input
              type="number"
              inputMode="decimal"
              min="0"
              step="0.01"
              value={Number.isFinite(form.monto) ? form.monto : 0}
              onChange={(e) => {
                const el = e.target as HTMLInputElement;
                const v = el.value;
                setForm(s => ({ ...s, monto: v === '' ? 0 : Number(v) }));
              }}
              required
            />
          </div>

          {/* Cuenta origen (combo) */}
          <div className="form-row">
            <label>Cuenta origen</label>
            <select
              value={form.cuenta_origen === '' ? '' : String(form.cuenta_origen)}
              onChange={(e) => {
                const el = e.target as HTMLSelectElement;
                const v = el.value;
                setForm(s => ({ ...s, cuenta_origen: v === '' ? '' : Number(v) }));
              }}
              required
            >
              <option value="">Seleccione…</option>
              {cuentasUsuario.map(c => {
                const sim = monedaIdx.get(c.id_moneda_tipo)?.simbolo || '';
                return (
                  <option key={c.id} value={c.id}>
                    {`Cuenta #${c.id} — ${sim} ${nf.format(Number(c.disponible ?? 0))}`}
                  </option>
                );
              })}
            </select>
          </div>

          {/* Nota */}
          <div className="form-row">
            <label>Nota</label>
            <input
              placeholder="Opcional"
              value={form.nota}
              onChange={(e) => {
                const el = e.target as HTMLInputElement;
                setForm(s => ({ ...s, nota: el.value }));
              }}
            />
          </div>

          {/* Fecha */}
          <div className="form-row">
            <label>Fecha</label>
            <input
              type="date"
              value={form.fecha_realizado}
              onChange={(e) => {
                const el = e.target as HTMLInputElement;
                setForm(s => ({ ...s, fecha_realizado: el.value }));
              }}
              readOnly
            />
          </div>
        </form>
      </Modal>
    </>
  );
}