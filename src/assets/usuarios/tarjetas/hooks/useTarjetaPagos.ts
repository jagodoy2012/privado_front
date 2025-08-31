import { useCallback, useEffect, useMemo, useState } from 'react';
import { api } from '../../../../lib/api';
import type {
  OperacionAsignadoRaw, OperacionAsignado,
  Cuenta, CuentaRaw, MonedaLite, UsuarioLite,
  Transaccion, TransaccionRaw, NuevaTransaccion
} from '../../cuentas/interfaces/cuenta';

/** Ajusta estos IDs si tu backend usa otros para tarjetas y cuentas */
const PRODUCTO_TARJETA_DEFAULT = 1; // id del producto "tarjeta"
const PRODUCTO_CUENTA_DEFAULT  = 1; // id del producto "cuenta/depósitos"
const PRODUCTO_CUENTA_DEFAULT_RECEPTOR = 2;

/* ================= Endpoints ================= */
const OPS_BY_PRODUCTO = (idProducto: number) =>
  `/api/OPERACIONES_PRODUCTO_BANCARIO_TIPO_ASIGNADO/by-producto/${idProducto}`;

const ASIGNADOS_BY_PRODUCTO = (idProducto: number) =>
  `/api/PRODUCTO_BANCARIO_TIPO_ASIGNADO/by-producto/${idProducto}`;

const TRANSACCIONES_BY_CUENTA = (idCuenta: number) => `/api/transacciones/by-cuenta/${idCuenta}`;
const OPERACION_BY_ID = (id: number) => `/api/operaciones/${id}`;

const CUENTA_BY_ID   = (id: number) => `/api/producto_bancario_usuario/${id}`;
const CUENTA_UPDATE  = (id: number) => `/api/producto_bancario_usuario/${id}`;
const CUENTAS_FIND_BY_PROD_ASIGNADO = (idProdAsignado: number, idUsuario: number) =>
  `/api/producto_bancario_usuario/find?id_producto_bancario_asignado=${idProdAsignado}&id_usuario_producto=${idUsuario}`;

const MONEDAS_URL  = `/api/monedatipos`;
const USUARIOS_URL = `/api/usuarios`;
const TRANSACCIONES_CRUD = `/api/transacciones`;
const TC_APIS_URL   = `/api/monedatipocambioapis`;

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

export function useTarjetaPagos(
  idTarjetaInicial: number | null,
  productoTarjeta = PRODUCTO_TARJETA_DEFAULT,
  productoCuenta  = PRODUCTO_CUENTA_DEFAULT
) {
  // Tarjetas (destinos)
  const [tarjetas, setTarjetas] = useState<Cuenta[]>([]);
  const [tarjeta,  setTarjeta]  = useState<Cuenta | null>(null);
  const [trans, setTrans]       = useState<Transaccion[]>([]);
  const [ops, setOps]           = useState<OperacionAsignado[]>([]);

  // Cuentas del usuario (orígenes)
  const [cuentasUsuario, setCuentasUsuario] = useState<Cuenta[]>([]);

  // Catálogos
  const [monedas, setMonedas] = useState<MonedaLite[]>([]);
  const [tcApis, setTcApis]   = useState<Array<{ id: number; id_monedatipo: number; url: string; estado: number }>>([]);

  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  /* ====== cargar tarjetas (productoTarjeta) ====== */
  const loadTarjetas = useCallback(async () => {
    setErr(null);
    setLoading(true);
    try {
      const idUsuario = Number(localStorage.getItem('id_usuario') ?? 0);

      // producto_bancario_asignado para TARJETAS
      const asgTar = await api.get<Array<{ id:number }>>(ASIGNADOS_BY_PRODUCTO(productoTarjeta),
        { headers: { Accept: 'application/json, text/plain, */*' } });
      const asignadosTar = (asgTar.data ?? []).map(a => a.id);

      // find por asignado + usuario
      const reqTar = asignadosTar.map(async (idAsig) => {
        try {
                console.log("asignados::____",idAsig);
                                console.log("asignados::____",idUsuario);


          const r = await api.get<CuentaRaw[]>(
            CUENTAS_FIND_BY_PROD_ASIGNADO(idAsig, idUsuario),
            { headers: { Accept: 'application/json, text/plain, */*' } }
          );
          return r.data ?? [];
        } catch { return []; }
      });

      const matricesT = await Promise.all(reqTar);
      const listaTar = Array.from(new Map(matricesT.flat().map(c => [c.id, c as Cuenta])).values());
      setTarjetas(listaTar);

      // operaciones válidas para TARJETAS
      const opsR = await api.get<OperacionAsignadoRaw[]>(
        OPS_BY_PRODUCTO(productoTarjeta),
        { headers: { Accept: 'application/json, text/plain, */*' } }
      );
      const withTitles = await Promise.all(
        (opsR.data ?? []).map(async row => {
          try {
            const title = await api.get<{id:number; titulo:string}>(OPERACION_BY_ID(row.id_operaciones),
              { headers: { Accept: 'application/json, text/plain, */*' } });
            return normOperacion(row, title.data?.titulo || `Operación #${row.id_operaciones}`);
          } catch {
            return normOperacion(row, `Operación #${row.id_operaciones}`);
          }
        })
      );
      setOps(withTitles);

      // catálogos
      const [monR, tcR] = await Promise.all([
        api.get<MonedaLite[]>(MONEDAS_URL, { headers: { Accept: 'application/json, text/plain, */*' } }),
        api.get(TC_APIS_URL,               { headers: { Accept: 'application/json, text/plain, */*' } }),
      ]);
      setMonedas(monR.data ?? []);
      setTcApis((tcR.data as any[]) ?? []);

      // seleccionar primera
      const primera = listaTar[0];
      const idSel = idTarjetaInicial ?? primera?.id;
      if (idSel) {
        const cR = await api.get<CuentaRaw>(CUENTA_BY_ID(idSel), { headers: { Accept: 'application/json, text/plain, */*' } });
        setTarjeta(cR.data as Cuenta);
        const tr = await api.get<TransaccionRaw[]>(TRANSACCIONES_BY_CUENTA(idSel), { headers: { Accept: 'application/json, text/plain, */*' } });
        setTrans(tr.data ?? []);
      }
    } catch (e:any) {
      setErr(e?.message || 'No se pudieron cargar las tarjetas');
      setTarjetas([]); setTarjeta(null); setTrans([]); setOps([]);
    } finally {
      setLoading(false);
    }
  }, [idTarjetaInicial, productoTarjeta]);



  useEffect(() => { loadTarjetas(); }, [loadTarjetas]);

  /* ===== cambiar tarjeta seleccionada ===== */
  const cambiarTarjeta = useCallback(async (idTarjeta: number) => {
    const [cR, tr] = await Promise.all([
      api.get<CuentaRaw>(CUENTA_BY_ID(idTarjeta), { headers: { Accept: 'application/json, text/plain, */*' } }),
      api.get<TransaccionRaw[]>(TRANSACCIONES_BY_CUENTA(idTarjeta), { headers: { Accept: 'application/json, text/plain, */*' } }),
    ]);
    setTarjeta(cR.data as Cuenta);
    setTrans(tr.data ?? []);
  }, []);

  /* ===== maps / helpers ===== */
  const monedaIdx = useMemo(() => new Map(monedas.map(m => [m.id, m] as const)), [monedas]);
  const simboloTarj = useMemo(() => monedaIdx.get(tarjeta?.id_moneda_tipo ?? -1)?.simbolo ?? '', [tarjeta, monedaIdx]);

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

  /* ===== saldo server ===== */
  const actualizarDisponible = useCallback(async (idCuenta: number, nuevoDisponible: number) => {
    const cr = await api.get<CuentaRaw>(CUENTA_BY_ID(idCuenta), { headers: { Accept: 'application/json, text/plain, */*' } });
    const payload: CuentaRaw = { ...cr.data, disponible: Number(nuevoDisponible) };
    await api.put(CUENTA_UPDATE(idCuenta), payload, { headers: { Accept: 'application/json, text/plain, */*' } });
    // si es la tarjeta seleccionada, refresca y refleja
    setTarjeta(prev => (prev && prev.id === idCuenta ? { ...prev, disponible: payload.disponible } : prev));
    setTarjetas(prev => prev.map(c => (c.id === idCuenta ? { ...c, disponible: payload.disponible } : c)));
    setCuentasUsuario(prev => prev.map(c => (c.id === idCuenta ? { ...c, disponible: payload.disponible } : c)));
  }, []);

  const debitarSaldoServidor = useCallback(async (idCuenta: number, montoOrigen: number) => {
    const cr = await api.get<CuentaRaw>(CUENTA_BY_ID(idCuenta), { headers: { Accept: 'application/json, text/plain, */*' } });
    const disp = Number(cr.data.disponible) || 0;
    const nuevo = disp - (Number(montoOrigen) || 0);
    if (nuevo < 0) throw new Error('Saldo insuficiente');
    await actualizarDisponible(idCuenta, nuevo);
    return nuevo;
  }, [actualizarDisponible]);

  const acreditarSaldoServidor = useCallback(async (idCuentaDestino: number, montoDestino: number) => {
    const cr = await api.get<CuentaRaw>(CUENTA_BY_ID(idCuentaDestino), { headers: { Accept: 'application/json, text/plain, */*' } });
    const disp = Number(cr.data.disponible) || 0;
    const nuevo = disp + (Number(montoDestino) || 0);
    await actualizarDisponible(idCuentaDestino, nuevo);
    return nuevo;
  }, [actualizarDisponible]);

  /* ===== POST transacción ===== */
  const crearTransaccion = useCallback(async (payload: NuevaTransaccion) => {
    await api.post(TRANSACCIONES_CRUD, payload, { headers: { Accept: 'application/json, text/plain, */*' } });
    const idTarjeta = payload.id_producto_bancario_usuario_recibe; // refrescamos movimientos de la tarjeta
    const [tr, cR] = await Promise.all([
      api.get<TransaccionRaw[]>(TRANSACCIONES_BY_CUENTA(idTarjeta), { headers: { Accept: 'application/json, text/plain, */*' } }),
      api.get<CuentaRaw>(CUENTA_BY_ID(idTarjeta),                   { headers: { Accept: 'application/json, text/plain, */*' } }),
    ]);
    setTrans(tr.data ?? []);
    setTarjeta(cR.data as Cuenta);
  }, []);

  const verificarCuenta = useCallback(async (numeroCuenta: number) => {
    const cr = await api.get<CuentaRaw>(CUENTA_BY_ID(numeroCuenta), { headers: { Accept: 'application/json, text/plain, */*' } });
    const c = cr.data as Cuenta;
    const ur = await api.get<UsuarioLite[]>(`${USUARIOS_URL}?id=${c.id_usuario_producto}`, { headers: { Accept: 'application/json, text/plain, */*' } });
    const u = (ur.data ?? []).find(x => x.id === c.id_usuario_producto);
    return { cuenta: c, usuario: u };
  }, []);

  return {
    // tarjetas (destino)
    tarjetas, tarjeta, trans, ops,
    // cuentas del usuario (origen)
    cuentasUsuario,

    monedas, monedaIdx,
    simboloTarj,

    // estado
    loading, err,

    // acciones
    cambiarTarjeta,
    convertirMonto,
    debitarSaldoServidor,
    acreditarSaldoServidor,
    crearTransaccion,
    verificarCuenta,

    // nuevos helpers para GTQ
    gtqId,
    aGTQ,
  };
}