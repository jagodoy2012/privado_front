import { useCallback, useMemo, useState } from 'react';
import { api } from '../../../../lib/api';
import type {
  Cuenta, MonedaLite, ProductoBancario, PBTipoAsignado,
  TransaccionRaw, TransaccionVista
} from '../interfaces/reporrte';

const CUENTAS_URL   = '/api/producto_bancario_usuario';
const MONEDAS_URL   = '/api/monedatipos';
const ASIG_URL      = '/api/producto_bancario_tipo_asignado';
const PRODUCTOS_URL = '/api/productobancarios';
const TX_BY_CTA     = (id: number) => `/api/transacciones/by-cuenta/${id}`;

export function useReporteCuenta() {
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const [cuentas, setCuentas] = useState<Cuenta[]>([]);
  const [monedas, setMonedas] = useState<MonedaLite[]>([]);
  const [asignados, setAsignados] = useState<PBTipoAsignado[]>([]);
  const [productos, setProductos] = useState<ProductoBancario[]>([]);

  const [cuentaSel, setCuentaSel] = useState<number | ''>('');
  const [desde, setDesde] = useState<string>(() => {
    const d = new Date(); d.setDate(d.getDate() - 30);
    return d.toISOString().slice(0,10);
  });
  const [hasta, setHasta] = useState<string>(() => new Date().toISOString().slice(0,10));

  const [rows, setRows] = useState<TransaccionVista[]>([]);

  const monedaIdx   = useMemo(() => new Map(monedas.map(m => [m.id, m] as const)), [monedas]);
  const productoIdx = useMemo(() => new Map(productos.map(p => [p.id, p.titulo] as const)), [productos]);
  const asigProdIdx = useMemo(
    () => new Map(asignados.map(a => [a.id, a.idProductoBancario] as const)),
    [asignados]
  );

  const nf = useMemo(
    () => new Intl.NumberFormat('es-ES', { minimumFractionDigits: 2, maximumFractionDigits: 2 }),
    []
  );

  const loadCombos = useCallback(async () => {
    setErr(null);
    setLoading(true);
    try {
      const idUser = Number(localStorage.getItem('id_usuario') ?? 0);
      const [cR, mR, aR, pR] = await Promise.all([
        api.get<Cuenta[]>(CUENTAS_URL,   { headers: { Accept: 'application/json, text/plain, */*' } }),
        api.get<MonedaLite[]>(MONEDAS_URL),
        api.get<PBTipoAsignado[]>(ASIG_URL),
        api.get<ProductoBancario[]>(PRODUCTOS_URL),
      ]);

      const allCuentas = (cR.data ?? []).filter(c => c.id_usuario_producto === idUser);
      setCuentas(allCuentas);
      setMonedas(mR.data ?? []);
      setAsignados(aR.data ?? []);
      setProductos(pR.data ?? []);
      // Selecciona la primera por defecto si no hay aún
      if (!cuentaSel && allCuentas[0]) setCuentaSel(allCuentas[0].id);
    } catch (e: any) {
      setErr(e?.message || 'No se pudieron cargar combos');
      setCuentas([]); setMonedas([]); setAsignados([]); setProductos([]);
    } finally {
      setLoading(false);
    }
  }, [cuentaSel]);

  const generar = useCallback(async () => {
    if (!cuentaSel) return;
    setErr(null);
    setLoading(true);
    try {
      const { data } = await api.get<TransaccionRaw[]>(TX_BY_CTA(Number(cuentaSel)),
        { headers: { Accept: 'application/json, text/plain, */*' } });

      const dIni = new Date(`${desde}T00:00:00`);
      const dFin = new Date(`${hasta}T23:59:59`);

      const filtradas = (data ?? []).filter(t => {
        const f = new Date(t.fecha_realizado ?? t['fecha'] ?? '');
        return !Number.isNaN(f.getTime()) && f >= dIni && f <= dFin;
      });

      const m = new Map<number, string>(); // memo de texto título por id_op si hace falta
      const cuentaId = Number(cuentaSel);

      const vistas: TransaccionVista[] = filtradas.map(t => {
        const f = (t.fecha_realizado ?? '').slice(0,10) || '';
        // título simple: recibe/envía
        const esDebe  = t.id_producto_bancario_usuario_envia  === cuentaId;
        const esHaber = t.id_producto_bancario_usuario_recibe === cuentaId;
        let titulo = '';
        if (esDebe)  titulo = `Envío a #${t.id_producto_bancario_usuario_recibe}`;
        if (esHaber) titulo = `Recibo de #${t.id_producto_bancario_usuario_envia}`;

        return {
          id: t.id,
          fecha: f,
          titulo,
          debe:  esDebe  ? Number(t.monto) || 0 : 0,
          haber: esHaber ? Number(t.monto) || 0 : 0,
        };
      });

      setRows(vistas);
    } catch (e:any) {
      setErr(e?.message || 'No se pudo generar el reporte');
      setRows([]);
    } finally {
      setLoading(false);
    }
  }, [cuentaSel, desde, hasta]);

  return {
    // estado
    loading, err, nf,

    // combos + helpers
    cuentas, monedas, monedaIdx, productoIdx, asigProdIdx,
    cuentaSel, setCuentaSel,
    desde, setDesde, hasta, setHasta,

    // datos tabla
    rows,

    // acciones
    loadCombos,
    generar,
  };
}