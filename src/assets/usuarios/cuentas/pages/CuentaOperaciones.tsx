import React, { useEffect, useMemo, useState } from 'react';
import Modal from '../../../../globals/component/modal/Modal';
import { useCuentaOperaciones } from '../hooks/useCuentaOperaciones';
import MovimientosTable from '../component/MovimientosTable';
import TercerosTable from '../component/TercerosTable';
import type { NuevaTransaccion, NuevaCuentaTercero } from '../interfaces/cuenta';

export default function CuentaOperacionesPage() {
  const idCuentaInicial = null;
  const idProductoBancario = 2;

  const {
    loading, err,
    cuentas, cuenta, saldo, simbolo,
    trans, terceros, ops, monedas, monedaIdx,
    crearTransaccion, crearTercero, eliminarTercero, verificarCuenta,
    convertirMonto, debitarSaldoServidor,
    acreditarConConversion, revertirDebito,
    cambiarCuenta,
  } = useCuentaOperaciones(idCuentaInicial, idProductoBancario);

  const [openTx, setOpenTx] = useState(false);
  const [openTerc, setOpenTerc] = useState(false);

  const nf = useMemo(
    () => new Intl.NumberFormat('es-ES', { minimumFractionDigits: 2, maximumFractionDigits: 2 }),
    []
  );

  const today = useMemo(() => new Date().toISOString().slice(0,10), []);
  const [tx, setTx] = useState({
    id_operaciones: 0,
    id_moneda_tipo: 0,
    monto: 0,
    cuenta_destino: '' as number | '',
    nota: '',
    fecha_realizado: today,
    estado: 1 as 0 | 1,
  });

  useEffect(() => {
    if (cuenta?.id_moneda_tipo && tx.id_moneda_tipo !== cuenta.id_moneda_tipo) {
      setTx(s => ({ ...s, id_moneda_tipo: cuenta.id_moneda_tipo }));
    }
  }, [cuenta]); // eslint-disable-line

  const idUsuarioPrim = Number(localStorage.getItem('id_usuario') ?? 0);
  const [terc, setTerc] = useState({
    id_usuario_prim: idUsuarioPrim,
    id_producto_bancario_usuario: '' as number | '',
    alias: '',
    estado: 1 as 0 | 1,
  });

  const usarTercero = (nroCuenta: number) => {
    setTx(s => ({ ...s, cuenta_destino: nroCuenta }));
    setOpenTx(true);
  };

  const onEliminarTercero = async (id: number) => {
    if (!confirm('¿Eliminar esta cuenta de terceros?')) return;
    try {
      await eliminarTercero(id);
    } catch (e: any) {
      alert(e?.message || 'No se pudo eliminar la cuenta de terceros');
    }
  };

  const cardStyle: React.CSSProperties = {
    backdropFilter: 'blur(6px)',
    background: 'rgba(255,255,255,0.06)',
    border: '1px solid rgba(255,255,255,0.08)',
    borderRadius: 16,
    padding: 14,
    cursor: 'pointer',
    minWidth: 220,
  };
  const selectedStyle: React.CSSProperties = {
    boxShadow: '0 0 0 2px #5b9cff inset',
    background: 'rgba(91,156,255,0.12)',
  };

  return (
    <>
      <div className="header-row">
        <h1 className="page-title">Operaciones de cuenta</h1>
      </div>

      {/* Ocultamos el banner rojo de error */}
      {/* {err && <div className="error" style={{ marginBottom: 12 }}>{err}</div>} */}
      {loading && <div style={{opacity:.7, marginBottom: 12}}>Cargando…</div>}

      {/* TARJETAS DE CUENTAS */}
      <div style={{display:'flex', gap:12, overflowX:'auto', paddingBottom:8, marginBottom:12}}>
        {cuentas.map(c => {
          const simb = monedaIdx.get(c.id_moneda_tipo)?.simbolo || '';
          const isSel = c.id === cuenta?.id;
          return (
            <div
              key={c.id}
              style={{ ...cardStyle, ...(isSel ? selectedStyle : {}) }}
              onClick={() => cambiarCuenta(c.id)}
              title={`Cuenta #${c.id}`}
            >
              <div style={{fontSize:12, opacity:.8}}>Cuenta #{c.id}</div>
              <div style={{fontSize:24, fontWeight:600, margin:'6px 0'}}>
                {simb}{nf.format(Number(c.disponible ?? 0))}
              </div>
              <div style={{fontSize:12, opacity:.8}}>Moneda: {simb || '—'}</div>
            </div>
          );
        })}
      </div>

      {/* acciones */}
      <div style={{display:'flex', gap:12, marginBottom:16}}>
        <button className="btn primary" onClick={() => setOpenTx(true)} disabled={!cuenta}>Nueva transacción</button>
        <button className="btn" onClick={() => setOpenTerc(true)}>Agregar cuenta de terceros</button>
      </div>

      {/* MOVIMIENTOS */}
      <h2 className="section-title">Movimientos</h2>
      <MovimientosTable
        rows={trans}
        simbolo={simbolo}
        numberFormatter={nf}
        cuentaId={cuenta?.id ?? 0}
        cuentaMonedaId={cuenta?.id_moneda_tipo ?? 0}
      />

      {/* TERCEROS */}
      <h2 className="section-title" style={{marginTop:18}}>Cuentas de terceros</h2>
      <TercerosTable
        rows={terceros}
        onUsar={usarTercero}
        onEliminar={onEliminarTercero}
      />

      {/* MODAL: Nueva transacción */}
      <Modal
        open={openTx}
        onClose={() => setOpenTx(false)}
        title="Nueva transacción"
        footer={
          <>
            <button className="btn" onClick={() => setOpenTx(false)}>Cancelar</button>
            <button className="btn primary" form="tx-form" type="submit">Guardar</button>
          </>
        }
      >
        <form
          id="tx-form"
          className="form"
          onSubmit={async (e) => {
            e.preventDefault();
            if (!cuenta) return;

            if (tx.monto <= 0) { alert('El monto debe ser mayor que 0.'); return; }
            if (!tx.id_operaciones) { alert('Selecciona una operación.'); return; }
            if (!tx.cuenta_destino) { alert('Ingresa la cuenta destino.'); return; }

            const idCuentaOrigen   = cuenta.id;
            const idMonedaOrigen   = tx.id_moneda_tipo;
            const idCuentaDestino  = Number(tx.cuenta_destino);

            // Obtener moneda destino solo para preview
            let idMonedaDestino = idMonedaOrigen;
            try {
              const { cuenta: cDest } = await verificarCuenta(idCuentaDestino);
              idMonedaDestino = cDest.id_moneda_tipo;
            } catch {}

            let montoConvertido = tx.monto;
            try {
              if (idMonedaOrigen !== idMonedaDestino) {
                montoConvertido = await convertirMonto(idMonedaOrigen, idMonedaDestino, tx.monto);
              }
            } catch (err: any) {
              alert(err?.message || 'No se pudo obtener el tipo de cambio.');
              return;
            }

            const ok = confirm(
              `Confirmar transacción:\n` +
              `Envia: ${tx.monto}\n` +
              `Recibe: ${montoConvertido}\n` +
              (idMonedaOrigen !== idMonedaDestino ? '*Incluye conversión de moneda*' : '')
            );
            if (!ok) return;

            try {
              await debitarSaldoServidor(idCuentaOrigen, tx.monto);

              const { acreditado } = await acreditarConConversion(
                idCuentaDestino,
                tx.monto,
                idMonedaOrigen
              );

              const payload: NuevaTransaccion = {
                id_producto_bancario_usuario_envia: idCuentaOrigen,
                id_producto_bancario_usuario_recibe: idCuentaDestino,
                id_operaciones: Number(tx.id_operaciones),
                id_moneda_tipo: Number(tx.id_moneda_tipo),
                monto: Number(tx.monto),
                cambio: Number(acreditado / (tx.monto || 1)),
                nota: tx.nota || '',
                fecha_realizado: tx.fecha_realizado,
                estado: tx.estado,
                fecha: '',
                id_usuario: 1
              };

              await crearTransaccion(payload);

              setOpenTx(false);
              setTx(s => ({ ...s, monto: 0, cuenta_destino: '', nota: '' }));
            } catch (err: any) {
              try { await revertirDebito(cuenta.id, tx.monto); } catch {}
              alert(err?.message || 'No se pudo completar la transacción');
            }
          }}
        >
          <div className="form-row">
            <label>Operación</label>
            <select
              value={tx.id_operaciones ? String(tx.id_operaciones) : ''}
              onChange={(e) => {
                const v = (e.currentTarget.value || '').trim();
                setTx(s => ({ ...s, id_operaciones: v === '' ? 0 : Number(v) }));
              }}
              required
            >
              <option value="">Seleccione…</option>
              {ops.map(o => (
                <option key={o.id} value={o.id_operaciones}>{o.titulo}</option>
              ))}
            </select>
          </div>

          <div className="form-row">
            <label>Moneda</label>
            <select value={tx.id_moneda_tipo ? String(tx.id_moneda_tipo) : ''} disabled>
              <option value="">
                {cuenta ? (monedaIdx.get(cuenta.id_moneda_tipo)?.simbolo || monedaIdx.get(cuenta.id_moneda_tipo)?.titulo || '—') : '—'}
              </option>
            </select>
          </div>

          <div className="form-row">
            <label>Monto</label>
            <input
              type="number"
              inputMode="decimal"
              min="0"
              step="0.01"
              value={Number.isFinite(tx.monto) ? tx.monto : 0}
              onChange={(e) => {
                const v = e.currentTarget.value;
                setTx(s => ({ ...s, monto: v === '' ? 0 : Number(v) }));
              }}
              required
            />
          </div>

          <div className="form-row">
            <label>Cuenta destino</label>
            <div style={{ display:'flex', gap:8 }}>
              <input
                type="number"
                inputMode="numeric"
                value={tx.cuenta_destino === '' ? '' : String(tx.cuenta_destino)}
                onChange={(e) => {
                  const v = e.currentTarget.value;
                  setTx(s => ({ ...s, cuenta_destino: v === '' ? '' : Number(v) }));
                }}
                placeholder="Número de cuenta (id)"
                required
              />
              <button
                type="button"
                className="btn small"
                title="Verificar cuenta"
                onClick={async () => {
                  const nro = Number(tx.cuenta_destino) || 0;
                  if (!nro) return;
                  try {
                    const { cuenta: c, usuario: u } = await verificarCuenta(nro);
                    alert(`Cuenta encontrada:\nNo. ${c.id}\nTitular: ${u ? `${u.nombres} ${u.apellidos}` : 'N/D'}`);
                  } catch (err: any) {
                    alert(err?.message || 'No se pudo verificar');
                  }
                }}
              >
                ✓
              </button>
            </div>
          </div>

          <div className="form-row">
            <label>Nota</label>
            <input
              placeholder="Opcional"
              value={tx.nota ?? ''}
              onChange={(e) => {
                const v = e.currentTarget.value;
                setTx(s => ({ ...s, nota: v }));
              }}
            />
          </div>

          <div className="form-row">
            <label>Fecha</label>
            <input
              type="date"
              readOnly
              value={tx.fecha_realizado || ''}
              onChange={(e) => {
                const v = e.currentTarget.value;
                setTx(s => ({ ...s, fecha_realizado: v }));
              }}
            />
          </div>

          <div className="form-row">
            <label>Estado</label>
            <select
              value={String(tx.estado)}
              disabled
              onChange={(e) => {
                const v = e.currentTarget.value;
                setTx(s => ({ ...s, estado: (v === '0' ? 0 : 1) as 0 | 1 }));
              }}
            >
              <option value="1">Activo</option>
              <option value="0">Inactivo</option>
            </select>
          </div>
        </form>
      </Modal>

      {/* MODAL: Agregar terceros */}
      <Modal
        open={openTerc}
        onClose={() => setOpenTerc(false)}
        title="Agregar cuenta de terceros"
        footer={
          <>
            <button className="btn" onClick={() => setOpenTerc(false)}>Cancelar</button>
            <button className="btn primary" form="terc-form" type="submit">Guardar</button>
          </>
        }
      >
        <form
          id="terc-form"
          className="form"
          onSubmit={async (e) => {
            e.preventDefault();

            const payload: NuevaCuentaTercero = {
              id_usuario_prim: Number(terc.id_usuario_prim) || 0,
              id_producto_bancario_usuario: Number(terc.id_producto_bancario_usuario) || 0,
              alias: (terc.alias || '').trim(),
              estado: 1,
            };

            if (!payload.id_usuario_prim) { alert('No se encontró el usuario actual.'); return; }
            if (!payload.id_producto_bancario_usuario) { alert('Ingresa el número de cuenta.'); return; }
            if (!payload.alias) { alert('El alias es obligatorio.'); return; }

            try {
              const { cuenta: c, usuario: u } = await verificarCuenta(payload.id_producto_bancario_usuario);
              const ok = confirm(
                `Confirmar guardar:\nCuenta ${c.id}\nTitular: ${u ? `${u.nombres} ${u.apellidos}` : 'N/D'}\nAlias: ${payload.alias}`
              );
              if (!ok) return;

              await crearTercero(payload);
              setOpenTerc(false);
              setTerc(s => ({ ...s, id_producto_bancario_usuario: '', alias: '' }));
            } catch (err: any) {
              alert(err?.message || 'No se pudo verificar/guardar');
            }
          }}
        >
          <div className="form-row">
            <label>No. de cuenta</label>
            <div style={{ display:'flex', gap:8 }}>
              <input
                type="number"
                inputMode="numeric"
                value={terc.id_producto_bancario_usuario === '' ? '' : String(terc.id_producto_bancario_usuario)}
                onChange={(e) => {
                  const v = (e.target as HTMLInputElement | null)?.value ?? '';
                  setTerc(s => ({ ...s, id_producto_bancario_usuario: v === '' ? '' : Number(v) }));
                }}
                required
              />
              <button
                type="button"
                className="btn small"
                title="Verificar cuenta"
                onClick={async () => {
                  const nro = Number(terc.id_producto_bancario_usuario) || 0;
                  if (!nro) { alert('Ingresa el número de cuenta.'); return; }
                  try {
                    const { cuenta: c, usuario: u } = await verificarCuenta(nro);
                    alert(`Cuenta encontrada:\nNo. ${c.id}\nTitular: ${u ? `${u.nombres} ${u.apellidos}` : 'N/D'}`);
                  } catch (err: any) {
                    alert(err?.message || 'No se pudo verificar');
                  }
                }}
              >
                ✓
              </button>
            </div>
          </div>

          <div className="form-row">
            <label>Alias</label>
            <input
              placeholder="Escribe un alias"
              value={terc.alias ?? ''}
              onChange={(e) => {
                const v = (e.target as HTMLInputElement | null)?.value ?? '';
                setTerc(s => ({ ...s, alias: v }));
              }}
              required
            />
          </div>
        </form>
      </Modal>
    </>
  );
}