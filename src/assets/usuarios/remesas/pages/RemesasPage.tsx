import React, { useMemo, useState } from 'react';
import Modal from '../../../../globals/component/modal/Modal';
import RemesasTable from '../component/RemesasTable';
import { useRemesas, DESTINO_TRANSACCION_REMESAS } from '../hooks/useRemesas';
import type { NuevaTransaccion } from '../../cuentas/interfaces/cuenta';
import { generarCodigoUnicoNoRepetido as genNoPago } from '../../../../mantenimientos/remesas/helpers/Codigos';

export default function RemesasPage() {
  const {
    remesas, monedas, cuentas, monedaIdx, simboloByMonedaId,
    loading, err,
    convertirMonto, debitarSaldo, acreditarSaldo,
    crearRemesaEnvio, cobrarRemesa, eliminarRemesa, verificarNoPago,
    registrarTransaccion,
    gtqId, aGTQ, 
  } = useRemesas();

  const nf = useMemo(
    () => new Intl.NumberFormat('es-ES', { minimumFractionDigits: 2, maximumFractionDigits: 2 }),
    []
  );

  // ======= ENVIAR =======
  const [openSend, setOpenSend] = useState(false);
  const today = new Date().toISOString().slice(0,10);
  const [send, setSend] = useState({
    fecha: today,
    id_monedatipo: '' as number | '',
    nombre_receptor: '',
    monto: 0,
    cuenta_origen: '' as number | '',
  });

  // ======= COBRAR =======
  const [openCharge, setOpenCharge] = useState(false);
  const [charge, setCharge] = useState({
    no_pago: '',
    cuenta_receptor: '' as number | '',
    verificado: null as null | {
      id_monedatipo: number;
      monto: number;
      no_pago: string;
      nombre_remitente?: string | null;
      id_usuario: number | null;
    },
  });

  return (
    <>
      <div className="header-row">
        <h1 className="page-title">Remesas</h1>
      </div>

      {err && <div className="error" style={{ marginBottom: 12 }}>{err}</div>}
      {loading && <div style={{opacity:.7, marginBottom: 12}}>Cargando…</div>}

      {/* Acciones */}
      <div style={{display:'flex', gap:12, marginBottom:16}}>
        <button className="btn primary" onClick={() => setOpenSend(true)}>Enviar</button>
        <button className="btn" onClick={() => setOpenCharge(true)}>Cobrar</button>
      </div>

      {/* Tabla */}
      <RemesasTable
        rows={remesas}
        simboloByMonedaId={simboloByMonedaId}
        gtqId={gtqId}
        aGTQ={aGTQ}
          showActions={false}   

        onEliminar={async (row) => {
          try {
            
            const ok = confirm('¿Eliminar esta remesa? (solo si está en estado 1)');
            if (!ok) return;
            await eliminarRemesa(row.id);
          } catch (e:any) {
            alert(e?.message || 'No se pudo eliminar');
          }
        }}
      />

      {/* ===== MODAL Enviar ===== */}
      <Modal
        open={openSend}
        onClose={() => setOpenSend(false)}
        title="Enviar remesa"
        footer={
          <>
            <button className="btn" onClick={() => setOpenSend(false)}>Cancelar</button>
            <button className="btn primary" form="send-form" type="submit">Enviar</button>
          </>
        }
      >
        <form
          id="send-form"
          className="form"
          onSubmit={async (e) => {
            e.preventDefault();

            if (!send.cuenta_origen) { alert('Selecciona la cuenta origen.'); return; }
            if (!send.id_monedatipo) { alert('Selecciona la moneda.'); return; }
            if (!send.nombre_receptor.trim()) { alert('Escribe el nombre del receptor.'); return; }
            if (Number(send.monto) <= 0) { alert('El monto debe ser mayor que 0.'); return; }

            const origen = cuentas.find(c => c.id === Number(send.cuenta_origen));
            if (!origen) { alert('Cuenta origen inválida.'); return; }
            if ((Number(origen.disponible) || 0) < Number(send.monto)) {
              alert('Saldo insuficiente en la cuenta seleccionada.');
              return;
            }

            // conversión
            let montoDebitar = Number(send.monto) || 0;
            let montoRemesa  = Number(send.monto) || 0;
            if (origen.id_moneda_tipo !== Number(send.id_monedatipo)) {
              try {
                montoRemesa = await convertirMonto(
                  origen.id_moneda_tipo,
                  Number(send.id_monedatipo),
                  montoDebitar
                );
              } catch (err:any) {
                alert(err?.message || 'No se pudo convertir monedas.');
                return;
              }
            }

            // no_pago
            const existentes = (remesas ?? []).map(r => r.no_pago).filter(Boolean) as string[];
            const no_pago = genNoPago(existentes);

            const simCuenta = monedaIdx.get(origen.id_moneda_tipo)?.simbolo || '';
            const simRemesa = monedaIdx.get(Number(send.id_monedatipo))?.simbolo || '';

            const ok = confirm(
              `Confirmar envío de remesa:\n` +
              `No. cobro: ${no_pago}\n` +
              `Cuenta origen #${origen.id} (${simCuenta})\n` +
              `Receptor: ${send.nombre_receptor}\n` +
              `Monto a debitar: ${simCuenta}${nf.format(montoDebitar)}\n` +
              `Monto de remesa: ${simRemesa}${nf.format(montoRemesa)}`
            );
            if (!ok) return;

            try {
              await debitarSaldo(origen.id, montoDebitar);

              await crearRemesaEnvio({
                id_usuario: Number(localStorage.getItem('id_usuario') ?? 0),
                id_producto_bancario_usuario: origen.id,
                id_moneda_tipo: Number(send.id_monedatipo),
                nombre_receptor: send.nombre_receptor.trim(),
                monto: montoRemesa,
                fecha_envio: send.fecha, 
                fecha: send.fecha,
                estado: 1,
                no_pago,
              });

              // Registro contable (opcional)
              const tx: NuevaTransaccion = {
                id_producto_bancario_usuario_envia: origen.id,
                id_producto_bancario_usuario_recibe: DESTINO_TRANSACCION_REMESAS,
                id_operaciones: 3,
                id_moneda_tipo: origen.id_moneda_tipo,
                monto: montoDebitar,
                cambio: Number(montoRemesa / (montoDebitar || 1)),
                nota: `Envío de remesa a ${send.nombre_receptor} (no_pago: ${no_pago})`,
                fecha_realizado: send.fecha,
                estado: 1,
                id_usuario: 1,
                fecha: send.fecha
              };
              try { await registrarTransaccion(tx); } catch {}

              setOpenSend(false);
              setSend(s => ({ ...s, monto: 0, nombre_receptor: '' }));
            } catch (err:any) {
              alert(err?.message || 'No se pudo completar el envío');
            }
          }}
        >
          <div className="form-row">
            <label>Fecha de envío</label>
            <input type="date" value={send.fecha} readOnly />
          </div>

          <div className="form-row">
            <label>Moneda</label>
            <select
              value={send.id_monedatipo === '' ? '' : String(send.id_monedatipo)}
              onChange={(e) => {
                const v = e.currentTarget.value;
                setSend(s => ({ ...s, id_monedatipo: v === '' ? '' : Number(v) }));
              }}
              required
            >
              <option value="">Seleccione…</option>
              {monedas.map(m => (
                <option key={m.id} value={m.id}>{m.simbolo} {m.titulo ?? ''}</option>
              ))}
            </select>
          </div>

          <div className="form-row">
            <label>Nombre del receptor</label>
            <input
              value={send.nombre_receptor}
              onChange={(e) => {
                const v = e.currentTarget.value;
                setSend(s => ({ ...s, nombre_receptor: v }));
              }}
              required
            />
          </div>

          <div className="form-row">
            <label>Monto</label>
            <input
              type="number"
              inputMode="decimal"
              step="0.01"
              min="0"
              value={Number.isFinite(send.monto) ? send.monto : 0}
              onChange={(e) => {
                const v = e.currentTarget.value;
                setSend(s => ({ ...s, monto: v === '' ? 0 : Number(v) }));
              }}
              required
            />
          </div>

          <div className="form-row">
            <label>Cuenta origen</label>
            <select
              value={send.cuenta_origen === '' ? '' : String(send.cuenta_origen)}
              onChange={(e) => {
                const v = e.currentTarget.value;
                setSend(s => ({ ...s, cuenta_origen: v === '' ? '' : Number(v) }));
              }}
              required
            >
              <option value="">Seleccione…</option>
              {cuentas.map(c => {
                const sim = monedaIdx.get(c.id_moneda_tipo)?.simbolo || '';
                return (
                  <option key={c.id} value={c.id}>
                    {`Cuenta #${c.id} — ${sim} ${nf.format(Number(c.disponible ?? 0))}`}
                  </option>
                );
              })}
            </select>
          </div>
        </form>
      </Modal>

      {/* ===== MODAL Cobrar ===== */}
      <Modal
        open={openCharge}
        onClose={() => setOpenCharge(false)}
        title="Cobrar remesa"
        footer={
          <>
            <button className="btn" onClick={() => setOpenCharge(false)}>Cancelar</button>
            <button
              className="btn primary"
              form="charge-form"
              type="submit"
              disabled={!charge.verificado || charge.verificado.id_usuario != null || !charge.cuenta_receptor}
            >
              Cobrar
            </button>
          </>
        }
      >
        <form
          id="charge-form"
          className="form"
          onSubmit={async (e) => {
            e.preventDefault();

            if (!charge.no_pago.trim()) { alert('Ingresa el número de cobro (no_pago).'); return; }
            if (!charge.cuenta_receptor) { alert('Selecciona la cuenta receptora.'); return; }
            if (!charge.verificado) { alert('Primero verifica el no_pago.'); return; }
            if (charge.verificado.id_usuario != null) { alert('Esta remesa ya fue cobrada.'); return; }

            const receptor = cuentas.find(c => c.id === Number(charge.cuenta_receptor));
            if (!receptor) { alert('Cuenta receptora inválida.'); return; }

            const idMonRemesa = Number(charge.verificado.id_monedatipo);
            let acreditado = Number(charge.verificado.monto) || 0;
            if (receptor.id_moneda_tipo !== idMonRemesa) {
              try {
                acreditado = await convertirMonto(idMonRemesa, receptor.id_moneda_tipo, acreditado);
              } catch (err:any) {
                alert(err?.message || 'No se pudo convertir monedas.');
                return;
              }
            }

            const simRem = monedaIdx.get(idMonRemesa)?.simbolo || '';
            const simRec = monedaIdx.get(receptor.id_moneda_tipo)?.simbolo || '';

            const ok = confirm(
              `Confirmar cobro:\n` +
              `No_pago: ${charge.no_pago}\n` +
              `Monto remesa: ${simRem}${nf.format(Number(charge.verificado.monto))}\n` +
              `Se acreditará en cuenta #${receptor.id}: ${simRec}${nf.format(acreditado)}`
            );
            if (!ok) return;

            try {
              await cobrarRemesa({
                no_pago: charge.no_pago.trim(),
                id_producto_bancario_usuario: receptor.id,
                fecha: today,
              });

              await acreditarSaldo(receptor.id, acreditado);

              const tx: NuevaTransaccion = {
                id_producto_bancario_usuario_envia: DESTINO_TRANSACCION_REMESAS,
                id_producto_bancario_usuario_recibe: receptor.id,
                id_operaciones: 3,
                id_moneda_tipo: receptor.id_moneda_tipo,
                monto: acreditado,
                cambio: 1,
                nota: `Cobro remesa no_pago: ${charge.no_pago}`,
                fecha_realizado: today,
                fecha: today,
                id_usuario: 1,
                estado: 1,
              };
              try { await registrarTransaccion(tx); } catch {}

              setOpenCharge(false);
              setCharge({ no_pago:'', cuenta_receptor:'', verificado: null });
            } catch (err:any) {
              alert(err?.message || 'No se pudo completar el cobro');
            }
          }}
        >
          <div className="form-row">
            <label>No. de cobro (no_pago)</label>
            <div style={{display:'flex', gap:8}}>
              <input
                value={charge.no_pago}
                onChange={(e) => {
                  const v = e.currentTarget.value;
                  setCharge(s => ({ ...s, no_pago: v }));
                }}
                required
              />
              <button
                type="button"
                className="btn small"
                onClick={async () => {
                  if (!charge.no_pago.trim()) { alert('Ingresa el no_pago.'); return; }
                  try {
                    const info = await verificarNoPago(charge.no_pago.trim());
                    if (!info) {
                      alert('No existe la remesa / no_pago.');
                      setCharge(s => ({ ...s, verificado: null }));
                      return;
                    }
                    setCharge(s => ({ ...s, verificado: {
                      id_monedatipo: Number(info.id_moneda_tipo),
                      monto: Number(info.monto),
                      no_pago: info.no_pago,
                      nombre_remitente: info.nombre_remitente ?? null,
                      id_usuario: info.id_usuario ?? null,
                    }}));
                    if (info.id_usuario != null) alert('Esta remesa YA fue cobrada.');
                  } catch (err:any) {
                    alert(err?.message || 'No se pudo verificar el no_pago.');
                  }
                }}
              >
                Verificar
              </button>
            </div>
          </div>

          <div className="form-row">
            <label>Cuenta receptora</label>
            <select
              value={charge.cuenta_receptor === '' ? '' : String(charge.cuenta_receptor)}
              onChange={(e) => {
                const v = e.currentTarget.value;
                setCharge(s => ({ ...s, cuenta_receptor: v === '' ? '' : Number(v) }));
              }}
              required
            >
              <option value="">Seleccione…</option>
              {cuentas.map(c => {
                const sim = monedaIdx.get(c.id_moneda_tipo)?.simbolo || '';
                return (
                  <option key={c.id} value={c.id}>
                    {`Cuenta #${c.id} — ${sim} ${nf.format(Number(c.disponible ?? 0))}`}
                  </option>
                );
              })}
            </select>
          </div>

          {charge.verificado && (
            <div className="hint" style={{opacity:.8, fontSize:12}}>
              Verificado: {charge.verificado.no_pago} — Monto {monedaIdx.get(charge.verificado.id_monedatipo)?.simbolo}
              {nf.format(charge.verificado.monto)} {charge.verificado.nombre_remitente ? `— Remitente: ${charge.verificado.nombre_remitente}` : ''}
              {charge.verificado.id_usuario != null ? ' — (YA COBRADA)' : ''}
            </div>
          )}
        </form>
      </Modal>
    </>
  );
}