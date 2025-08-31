import { useCallback, useEffect, useMemo, useState } from 'react';
import { api } from '../../../../lib/api';
import type {
  OperacionAsignadoRaw, OperacionAsignado,
  Cuenta, CuentaRaw, MonedaLite, UsuarioLite,
  Transaccion, TransaccionRaw,
  NuevaTransaccion, CuentaTercero, NuevaCuentaTercero
} from '../interfaces/cuenta';
  const idUsuario = Number(localStorage.getItem('id_usuario') ?? 0);

/* ================= Endpoints ================= */
const OPS_BY_PRODUCTO = (idProducto: number) =>
  `/api/OPERACIONES_PRODUCTO_BANCARIO_TIPO_ASIGNADO/by-producto/${idProducto}`;

const ASIGNADOS_BY_PRODUCTO = (idProducto: number) =>
  `/api/PRODUCTO_BANCARIO_TIPO_ASIGNADO/by-producto/${idProducto}`;

const OPERACION_BY_ID = (id: number) => `/api/operaciones/${id}`;
const TRANSACCIONES_BY_CUENTA = (idCuenta: number) => `/api/transacciones/by-cuenta/${idCuenta}`;
const TRANSACCIONES_CRUD = `/api/transacciones`;
const TERCEROS_CRUD = `/api/cuentaterceros`;
const TERCEROS_CRUDB = `/api/cuentaterceros/buscar?id_usuario_prim=${idUsuario}`;

const CUENTA_BY_ID = (id: number) => `/api/producto_bancario_usuario/${id}`;
const CUENTA_UPDATE = (id: number) => `/api/producto_bancario_usuario/${id}`;

const MONEDAS_URL  = `/api/monedatipos`;
const USUARIOS_URL = `/api/usuarios`;
const TC_APIS_URL  = `/api/monedatipocambioapis`;

const CUENTAS_FIND_BY_PROD_ASIGNADO = (idProdAsignado: number, idUsuario: number) =>
  `/api/producto_bancario_usuario/find?id_producto_bancario_asignado=${idProdAsignado}&id_usuario_producto=${idUsuario}`;

/* =============== Helpers =============== */
function normOperacion(r: OperacionAsignadoRaw, titulo: string): OperacionAsignado {
  return { id: r.id, id_operaciones: r.id_operaciones, id_producto_bancario: r.id_producto_bancario, titulo };
}

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

/* ================= Hook principal ================= */
export function useCuentaOperaciones(idCuentaInicial: number | null, idProductoBancario = 2) {
  const [cuentas, setCuentas] = useState<Cuenta[]>([]);
  const [cuenta, setCuenta]   = useState<Cuenta | null>(null);
  const [monedas, setMonedas] = useState<MonedaLite[]>([]);
  const [ops, setOps]         = useState<OperacionAsignado[]>([]);
  const [trans, setTrans]     = useState<Transaccion[]>([]);
  const [terceros, setTerceros] = useState<CuentaTercero[]>([]);
  const [tcApis, setTcApis]   = useState<Array<{ id: number; id_monedatipo: number; url: string; estado: number }>>([]);

  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const loadAll = useCallback(async (idCuentaSel: number) => {
    setLoading(true);
    setErr(null);
    try {
      const [opsR, monR, transR, cR, tR, tcR] = await Promise.all([
        api.get<OperacionAsignadoRaw[]>(OPS_BY_PRODUCTO(idProductoBancario), { headers: { Accept: 'application/json, text/plain, */*' } }),
        api.get<MonedaLite[]>(MONEDAS_URL,                                   { headers: { Accept: 'application/json, text/plain, */*' } }),
        api.get<TransaccionRaw[]>(TRANSACCIONES_BY_CUENTA(idCuentaSel),      { headers: { Accept: 'application/json, text/plain, */*' } }),
        api.get<CuentaRaw>(CUENTA_BY_ID(idCuentaSel),                         { headers: { Accept: 'application/json, text/plain, */*' } }),
        api.get<CuentaTercero[]>(TERCEROS_CRUDB,                               { headers: { Accept: 'application/json, text/plain, */*' } }),
        api.get(TC_APIS_URL,                                                  { headers: { Accept: 'application/json, text/plain, */*' } }),
      ]);

      const withTitles = await Promise.all(
        (opsR.data ?? []).map(async (row) => {
          try {
            const titleResp = await api.get<{ id:number; titulo:string }>(
              OPERACION_BY_ID(row.id_operaciones),
              { headers: { Accept: 'application/json, text/plain, */*' } }
            );
            return normOperacion(row, titleResp.data?.titulo || `Operación #${row.id_operaciones}`);
          } catch {
            return normOperacion(row, `Operación #${row.id_operaciones}`);
          }
        })
      );

      setOps(withTitles);
      setMonedas(monR.data ?? []);
      setTrans(transR.data ?? []);
      setCuenta(cR.data as Cuenta);
      setTerceros(tR.data ?? []);
      setTcApis((tcR.data as any[]) ?? []);
    } catch (e: any) {
      setErr(e?.message || 'No se pudo cargar la cuenta');
      setOps([]); setMonedas([]); setTrans([]); setTerceros([]); setCuenta(null); setTcApis([]);
    } finally {
      setLoading(false);
    }
  }, [idProductoBancario]);

  const loadCuentas = useCallback(async () => {
    try {
      const idUsuario = Number(localStorage.getItem('id_usuario') ?? 0);

      const asg = await api.get<Array<{ id: number }>>(
        ASIGNADOS_BY_PRODUCTO(idProductoBancario),
        { headers: { Accept: 'application/json, text/plain, */*' } }
      );
      const asignados = (asg.data ?? []).map(a => a.id);

      const reqs = asignados.map(async (idAsig) => {
        try {
          const r = await api.get<CuentaRaw[]>(
            CUENTAS_FIND_BY_PROD_ASIGNADO(idAsig, idUsuario),
            { headers: { Accept: 'application/json, text/plain, */*' } }
          );
          return r.data ?? [];
        } catch {
          return [];
        }
      });

      const matrices = await Promise.all(reqs);
      const listaSinDup = Array.from(
        new Map(matrices.flat().map(c => [c.id, c as Cuenta])).values()
      );

      setCuentas(listaSinDup);

      const primera = listaSinDup[0];
      const idSel = idCuentaInicial ?? primera?.id;
      if (idSel) await loadAll(idSel);
    } catch (e: any) {
      setErr(e?.message || 'No se pudieron cargar las cuentas');
      setCuentas([]);
    }
  }, [idCuentaInicial, idProductoBancario, loadAll]);

  useEffect(() => { loadCuentas(); }, [loadCuentas]);

  const cambiarCuenta = useCallback(async (idCuenta: number) => {
    await loadAll(idCuenta);
  }, [loadAll]);

  const monedaIdx = useMemo(() => new Map(monedas.map(m => [m.id, m] as const)), [monedas]);
  const simbolo = useMemo(() => monedaIdx.get(cuenta?.id_moneda_tipo ?? -1)?.simbolo ?? '', [cuenta, monedaIdx]);
  const saldo   = useMemo(() => cuenta?.disponible ?? 0, [cuenta]);

  useEffect(() => {
    if (!cuenta?.id) return;
    setCuentas(prev => prev.map(c => (c.id === cuenta.id ? { ...c, disponible: cuenta.disponible } : c)));
  }, [cuenta?.id, cuenta?.disponible]);

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

  /* ================== Saldo (servidor) ================== */
  const actualizarDisponible = useCallback(async (idCuenta: number, nuevoDisponible: number) => {
    const cr = await api.get<CuentaRaw>(CUENTA_BY_ID(idCuenta), { headers: { Accept: 'application/json, text/plain, */*' } });
    const payload: CuentaRaw = { ...cr.data, disponible: Number(nuevoDisponible) };
    await api.put(CUENTA_UPDATE(idCuenta), payload, { headers: { Accept: 'application/json, text/plain, */*' } });
    setCuenta(prev => (prev && prev.id === idCuenta ? { ...prev, disponible: payload.disponible } : prev));
    setCuentas(prev => prev.map(c => (c.id === idCuenta ? { ...c, disponible: payload.disponible } : c)));
  }, []);

  const debitarSaldoServidor = useCallback(async (idCuenta: number, montoOrigen: number) => {
    const cr = await api.get<CuentaRaw>(CUENTA_BY_ID(idCuenta), { headers: { Accept: 'application/json, text/plain, */*' } });
    const disp = Number(cr.data.disponible) || 0;
    const nuevo = disp - (Number(montoOrigen) || 0);
    if (nuevo < 0) throw new Error('Saldo insuficiente');
    await actualizarDisponible(idCuenta, nuevo);
    return nuevo;
  }, [actualizarDisponible]);

  const acreditarSaldoServidor = useCallback(async (idCuentaDestino: number, montoDestinoEnMonedaDestino: number) => {
    const cr = await api.get<CuentaRaw>(CUENTA_BY_ID(idCuentaDestino), { headers: { Accept: 'application/json, text/plain, */*' } });
    const disp = Number(cr.data.disponible) || 0;
    const nuevo = disp + (Number(montoDestinoEnMonedaDestino) || 0);
    await actualizarDisponible(idCuentaDestino, nuevo);
    return nuevo;
  }, [actualizarDisponible]);

  const acreditarConConversion = useCallback(
    async (idCuentaDestino: number, montoOrigen: number, idMonedaOrigen: number) => {
      const cr = await api.get<CuentaRaw>(CUENTA_BY_ID(idCuentaDestino), { headers: { Accept: 'application/json, text/plain, */*' } });
      const idMonedaDestino = cr.data.id_moneda_tipo;

      let acreditado = Number(montoOrigen) || 0;
      let cambio = 1;

      if (idMonedaOrigen !== idMonedaDestino) {
        const convertido = await convertirMonto(idMonedaOrigen, idMonedaDestino, acreditado);
        cambio = (convertido || 0) / (acreditado || 1);
        acreditado = convertido;
      }

      await acreditarSaldoServidor(idCuentaDestino, acreditado);
      return { acreditado, cambio };
    },
    [convertirMonto, acreditarSaldoServidor]
  );

  const revertirDebito = useCallback(async (idCuenta: number, monto: number) => {
    try {
      const cr = await api.get<CuentaRaw>(CUENTA_BY_ID(idCuenta), { headers: { Accept: 'application/json, text/plain, */*' } });
      const disp = Number(cr.data.disponible) || 0;
      await actualizarDisponible(idCuenta, disp + (Number(monto) || 0));
    } catch { /* noop */ }
  }, [actualizarDisponible]);

  /* ================= Acciones ================= */
  const crearTransaccion = useCallback(async (payload: NuevaTransaccion) => {
    await api.post(TRANSACCIONES_CRUD, payload, { headers: { Accept: 'application/json, text/plain, */*' } });
    const idCuenta = payload.id_producto_bancario_usuario_envia;
    const [tr, cR] = await Promise.all([
      api.get<TransaccionRaw[]>(TRANSACCIONES_BY_CUENTA(idCuenta), { headers: { Accept: 'application/json, text/plain, */*' } }),
      api.get<CuentaRaw>(CUENTA_BY_ID(idCuenta),                   { headers: { Accept: 'application/json, text/plain, */*' } }),
    ]);
    setTrans(tr.data ?? []);
    setCuenta(cR.data as Cuenta);
  }, []);

  const crearTercero = useCallback(async (payload: NuevaCuentaTercero) => {
    await api.post(TERCEROS_CRUD, payload, { headers: { Accept: 'application/json, text/plain, */*' } });
    const tR = await api.get<CuentaTercero[]>(TERCEROS_CRUDB, { headers: { Accept: 'application/json, text/plain, */*' } });
    setTerceros(tR.data ?? []);
  }, []);

  const eliminarTercero = useCallback(async (id: number) => {
    await api.delete(`${TERCEROS_CRUD}/${id}`, { headers: { Accept: 'application/json, text/plain, */*' } });
    const tR = await api.get<CuentaTercero[]>(TERCEROS_CRUDB, { headers: { Accept: 'application/json, text/plain, */*' } });
    setTerceros(tR.data ?? []);
  }, []);

  const verificarCuenta = useCallback(async (numeroCuenta: number) => {
    const cr = await api.get<CuentaRaw>(CUENTA_BY_ID(numeroCuenta), { headers: { Accept: 'application/json, text/plain, */*' } });
    const c = cr.data as Cuenta;
    const ur = await api.get<UsuarioLite[]>(`${USUARIOS_URL}?id=${c.id_usuario_producto}`, { headers: { Accept: 'application/json, text/plain, */*' } });
    const u = (ur.data ?? []).find(x => x.id === c.id_usuario_producto);
    return { cuenta: c, usuario: u };
  }, []);

  return {
    // listados / datos
    cuentas, cuenta, saldo, simbolo,
    trans, terceros, ops, monedas, monedaIdx,

    // estado
    loading, err,

    // acciones
    crearTransaccion,
    crearTercero,
    eliminarTercero,
    verificarCuenta,
    cambiarCuenta,
    convertirMonto,
    debitarSaldoServidor,
    acreditarSaldoServidor,
    acreditarConConversion,
    revertirDebito,
  };
}