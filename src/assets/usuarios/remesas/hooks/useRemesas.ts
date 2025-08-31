import { useCallback, useEffect, useMemo, useState } from 'react';
import { api } from '../../../../lib/api';
import type { Cuenta, CuentaRaw, MonedaLite, NuevaTransaccion } from '../../cuentas/interfaces/cuenta';
import type { Remesa, RemesaNuevaEnvio, RemesaCobro, RemesaLiteByNoPago } from '../interfaces/remesa';

/* ======== Ajustes de negocio ======== */
const PRODUCTO_CUENTA_DEFAULT = 3;
export const DESTINO_TRANSACCION_REMESAS = 0; // reemplaza por ID real si existe

/* =============== Endpoints =============== */
const REMESAS_BY_USUARIO = (idUsuario: number) => `/api/remesas/by-usuario/${idUsuario}`;
const REMESAS_BY_NOPAGO  = (no_pago: string)   => `/api/remesas/by-nopago/${encodeURIComponent(no_pago)}`;
const REMESAS_CRUD       = `/api/remesas`;
const REMESA_BY_ID       = (id: number)        => `/api/remesas/${id}`;

const MONEDAS_URL  = `/api/monedatipos`;
const TC_APIS_URL  = `/api/monedatipocambioapis`;
const TRANSACCIONES_CRUD = `/api/transacciones`;

const ASIGNADOS_BY_PRODUCTO = (idProducto: number) =>
  `/api/PRODUCTO_BANCARIO_TIPO_ASIGNADO/by-producto/${idProducto}`;


const CUENTAS_FIND_PATH = `/api/producto_bancario_usuario/find`;

const CUENTA_BY_ID  = (id: number) => `/api/producto_bancario_usuario/${id}`;
const CUENTA_UPDATE = (id: number) => `/api/producto_bancario_usuario/${id}`;

/* =============== Helpers =============== */
function toIsoCode(m: MonedaLite | undefined): 'USD' | 'EUR' | 'GTQ' | string {
  if (!m) return '';
  const s = (m.titulo || m.simbolo || '').toUpperCase();
  if (s.includes('GTQ') || s.includes('QUETZALES')) return 'GTQ';
  if (s.includes('USD') || s.includes('DOLARES') || s.includes('DÓLAR') || s.includes('$')) return 'USD';
  if (s.includes('EUR') || s.includes('EUROS') || s.includes('E')) return 'EUR';
  if (s === 'Q') return 'GTQ';
  if (s === 'E') return 'EUR';
  if (s === '$') return 'USD';
  return s;
}

/* =============== Hook principal =============== */
export function useRemesas() {
  const idUsuario = Number(localStorage.getItem('id_usuario') ?? 0);

  const [remesas, setRemesas] = useState<Remesa[]>([]);
  const [monedas, setMonedas] = useState<MonedaLite[]>([]);
  const [tcApis, setTcApis]   = useState<Array<{ id: number; id_monedatipo: number; url: string; estado: number }>>([]);
  const [cuentas, setCuentas] = useState<Cuenta[]>([]);

  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  /* ===== Carga inicial ===== */
  const loadRemesas = useCallback(async () => {
    setLoading(true);
    setErr(null);
    try {
      const [rR, monR, tcR] = await Promise.all([
        api.get<Remesa[]>(REMESAS_BY_USUARIO(idUsuario), { headers: { Accept: 'application/json, text/plain, */*' } }),
        api.get<MonedaLite[]>(MONEDAS_URL,               { headers: { Accept: 'application/json, text/plain, */*' } }),
        api.get(TC_APIS_URL,                              { headers: { Accept: 'application/json, text/plain, */*' } }),
      ]);
      setRemesas(rR.data ?? []);
      setMonedas(monR.data ?? []);
      setTcApis((tcR.data as any[]) ?? []);
    } catch (e: any) {
      setErr(e?.message || 'No se pudieron cargar las remesas');
      setRemesas([]); setMonedas([]); setTcApis([]);
    } finally {
      setLoading(false);
    }
  }, [idUsuario]);



  useEffect(() => { loadRemesas(); }, [loadRemesas]);

  /* ===== utilidades de moneda ===== */
  const monedaIdx = useMemo(() => new Map(monedas.map(m => [m.id, m] as const)), [monedas]);
  const simboloByMonedaId = useCallback((id?: number) => monedaIdx.get(id ?? -1)?.simbolo ?? '', [monedaIdx]);

  async function convertirMonto(origenId: number, destinoId: number, monto: number): Promise<number> {
    if (origenId === destinoId) return monto;
    const origen  = monedaIdx.get(origenId);
    const destino = monedaIdx.get(destinoId);
    if (!origen || !destino) return monto;

    const from = toIsoCode(origen);
    const to   = toIsoCode(destino);

    const tpl = tcApis.find(x => (x.url || '').toUpperCase().includes(`TO=${to}`));
    if (!tpl) throw new Error('No hay URL de tipo de cambio configurada para destino ' + to);

    const url = (tpl.url || '')
      .replace('{monedaCambio}', from)
      .replace('{moneda}', from)
      .replace('{moneda_cambio}', from);

    const { data } = await api.get(url, { headers: { Accept: 'application/json, text/plain, */*' } });
    const rate = data?.result?.[to];
    if (!rate || Number.isNaN(rate)) throw new Error('Tipo de cambio no disponible');
    return monto * rate;
  }

  /* === Identificar GTQ y helper para convertir a GTQ === */
  const gtqId = useMemo(() => {
    const m = monedas.find(mm => toIsoCode(mm) === 'GTQ' || (mm?.simbolo || '').toUpperCase() === 'Q');
    return m?.id ?? null;
  }, [monedas]);

  async function aGTQ(origenId: number, monto: number): Promise<number> {
    if (!gtqId) return monto;
    return convertirMonto(origenId, gtqId, monto);
  }

  /* ===== actualizar saldos ===== */
  const actualizarDisponible = useCallback(async (idCuenta: number, nuevoDisponible: number) => {
    const cr = await api.get<CuentaRaw>(CUENTA_BY_ID(idCuenta), { headers: { Accept: 'application/json, text/plain, */*' } });
    const payload: CuentaRaw = { ...cr.data, disponible: Number(nuevoDisponible) };
    await api.put(CUENTA_UPDATE(idCuenta), payload, { headers: { Accept: 'application/json, text/plain, */*' } });
    setCuentas(prev => prev.map(c => (c.id === idCuenta ? { ...c, disponible: payload.disponible } : c)));
  }, []);

  const debitarSaldo = useCallback(async (idCuenta: number, monto: number) => {
    const cr = await api.get<CuentaRaw>(CUENTA_BY_ID(idCuenta), { headers: { Accept: 'application/json, text/plain, */*' } });
    const disp = Number(cr.data.disponible) || 0;
    const nuevo = disp - (Number(monto) || 0);
    if (nuevo < 0) throw new Error('Saldo insuficiente');
    await actualizarDisponible(idCuenta, nuevo);
  }, [actualizarDisponible]);

  const acreditarSaldo = useCallback(async (idCuenta: number, monto: number) => {
    const cr = await api.get<CuentaRaw>(CUENTA_BY_ID(idCuenta), { headers: { Accept: 'application/json, text/plain, */*' } });
    const disp = Number(cr.data.disponible) || 0;
    const nuevo = disp + (Number(monto) || 0);
    await actualizarDisponible(idCuenta, nuevo);
  }, [actualizarDisponible]);

  /* ===== acciones REST ===== */

  // crear envío con no_pago + fecha_envio
  const crearRemesaEnvio = useCallback(async (payload: RemesaNuevaEnvio) => {
    const d = new Date();
    const pad = (n:number) => String(n).padStart(2, '0');
    const fechaDateTime = `${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}` +
      `T${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}Z`;

    const payloadFecha = {
      ...payload,
      fecha_envio: fechaDateTime,
      fecha: fechaDateTime,
      nombre_remitente: localStorage.getItem('nombreCompleto')
    };

    await api.post(REMESAS_CRUD, payloadFecha, { headers: { Accept: 'application/json, text/plain, */*' } });
    await loadRemesas();
  }, [loadRemesas]);

  // PUT: marcar cobrada (solo id_usuario)
  const cobrarRemesa = useCallback(
    async (payload: RemesaCobro) => {
      const { data } = await api.get<RemesaLiteByNoPago[]>(
        REMESAS_BY_NOPAGO(payload.no_pago),
        { headers: { Accept: 'application/json, text/plain, */*' } }
      );
      const info = (data ?? [])[0] ?? null;

      if (!info) throw new Error('No existe la remesa / no_pago.');
      if (info.id_usuario != null) throw new Error('La remesa ya fue cobrada.');

      const idUsuarioActual = Number(localStorage.getItem('id_usuario') ?? 0);

      let current: any;
      try {
        const { data: full } = await api.get<any>(REMESA_BY_ID(info.id), {
          headers: { Accept: 'application/json, text/plain, */*' },
        });
        current = full;
      } catch {
        current = {
          id: info.id,
          no_pago: info.no_pago,
          id_usuario: null,
          id_monedatipo: info.id_moneda_tipo,
          monto: info.monto,
          estado: info.estado,
          fecha_envio: info.fecha_envio ?? null,
          nombre_receptor: info.nombre_receptor ?? null,
          nombre_remitente: info.nombre_remitente ?? null,
          id_producto_bancario_usuario: (payload as any).id_producto_bancario_usuario,
        };
      }

      const body = { ...current, id_usuario: idUsuarioActual };

      await api.put(`${REMESAS_CRUD}/${info.id}`, body, {
        headers: { Accept: 'application/json, text/plain, */*', 'Content-Type': 'application/json' },
      });

      await loadRemesas();
    },
    [loadRemesas]
  );

  const eliminarRemesa = useCallback(async (id: number) => {
    await api.delete(`${REMESAS_CRUD}/${id}`, { headers: { Accept: 'application/json, text/plain, */*' } });
    await loadRemesas();
  }, [loadRemesas]);

  const verificarNoPago = useCallback(async (noPago: string): Promise<RemesaLiteByNoPago | null> => {
    const { data } = await api.get<RemesaLiteByNoPago[]>(REMESAS_BY_NOPAGO(noPago), { headers: { Accept: 'application/json, text/plain, */*' } });
    return (data ?? [])[0] ?? null;
  }, []);

  /* ===== transacciones (registro contable) ===== */
  const registrarTransaccion = useCallback(async (t: NuevaTransaccion) => {
    const d = new Date();
    const pad = (n:number) => String(n).padStart(2, '0');
    const fechaDateTime = `${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}` +
      `T${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}Z`;

    const payload = {
      ...t,
      fecha_realizado: fechaDateTime,
      fecha: fechaDateTime,
    };

    await api.post(TRANSACCIONES_CRUD, payload, {
      headers: { Accept: 'application/json, text/plain, */*' }
    });
  }, []);

  return {
    // datos
    remesas, monedas, cuentas, monedaIdx, simboloByMonedaId,

    // estado
    loading, err,

    // utilidades
    convertirMonto,
    gtqId,      // <-- nuevo
    aGTQ,       // <-- nuevo

    // saldos
    debitarSaldo, acreditarSaldo,

    // remesas
    crearRemesaEnvio, cobrarRemesa, eliminarRemesa, verificarNoPago,

    // transacciones
    registrarTransaccion,
  };
}