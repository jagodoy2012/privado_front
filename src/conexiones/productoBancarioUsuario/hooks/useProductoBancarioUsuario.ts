// src/User/pbUsuario/hooks/useProductoBancarioUsuario.ts
import { useCallback, useMemo, useState } from 'react';
import { api } from '../../../lib/api';
import type {
  ProductoBancarioUsuario,
  ProductoBancarioUsuarioSave,
  Estado,
  UsuarioLite,
  PBAsignado,
  PBLite,
  PBTLite,
  CategoriaLite,
  MonedaLite,
} from '../interfaces/ProductoBancarioUsuario';

type LoadParams = { search?: string; page?: number; pageSize?: number; estado?: Estado | '' };

const LIST_URL  = '/api/producto_bancario_usuario';
const CRUD_BASE = '/api/producto_bancario_usuario';

// catálogos
const USERS_URL = '/api/usuarios';
const ASIG_URL  = '/api/producto_bancario_tipo_asignado';
const PB_URL    = '/api/productobancarios';
const PBT_URL   = '/api/producto_bancario_tipo';
const CAT_URL   = '/api/tipo_cuenta_tarjeta';
const MON_URL   = '/api/monedatipos';

const JSON_HEADERS = {
  Accept: 'application/json, text/plain, */*'
};


/* ===================== Helpers ===================== */

// 'YYYY-MM-DD' (para DateOnly)
function toYmd(date: string | Date) {
  const d = typeof date === 'string' ? new Date(date) : date;
  if (isNaN(d.getTime())) return null;
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

// ISO con Z (por si el backend guarda DateTime)
function toIsoZ(date?: string | Date | null) {
  if (!date) return null;
  const d = typeof date === 'string' ? new Date(date) : date;
  return isNaN(d.getTime()) ? null : d.toISOString();
}

// Mensaje legible de ProblemDetails (ASP.NET)
function readableAspNetError(e: any): string {
  const s = e?.response?.status;
  const d = e?.response?.data;
  if (d?.errors && typeof d.errors === 'object') {
    const msgs = Object.entries(d.errors)
      .map(([k, v]) => `${k}: ${(v as any[]).join(' ')}`)
      .join(' | ');
    return `HTTP ${s}. ${msgs}`;
  }
  return `HTTP ${s}. ${typeof d === 'string' ? d : JSON.stringify(d ?? e?.message)}`;
}

// Normaliza lo que ENVIAS al backend para POST/PUT
function toPayload(d: ProductoBancarioUsuarioSave) {
  const idUsuario = Number(localStorage.getItem('id_usuario')) || 0;

  return {
    id_usuario_producto: Number(d.id_usuario_producto) || 0,
    id_producto_bancario_asignado: Number(d.id_producto_bancario_asignado) || 0,
    id_moneda_tipo: Number(d.id_moneda_tipo) || 0,
    monto: Number(d.monto) || 0,
    disponible: Number(d.disponible) || 0,

    // >>> Campos que tu API expone en Swagger y suelen ser requeridos <<<
    id_usuario: idUsuario,              // si tu API lo calcula en servidor, puedes enviar 0 o no enviarlo
    fecha: toIsoZ(new Date()),          // ahora (o null si el backend lo setea)

    // En Swagger el ejemplo es "2025-08-25" (DateOnly)
    fecha_ultimo_corte: d.fecha_ultimo_corte
      ? toYmd(d.fecha_ultimo_corte)
      : null,

    estado: (Number(d.estado) as 0 | 1) ?? 1,
  };
}

/* ===================== Hook ===================== */

export function useProductoBancarioUsuario() {
  const [rows, setRows] = useState<ProductoBancarioUsuario[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  // catálogos
  const [usuarios, setUsuarios]   = useState<UsuarioLite[]>([]);
  const [asignados, setAsignados] = useState<PBAsignado[]>([]);
  const [pbs, setPBs]             = useState<PBLite[]>([]);
  const [pbts, setPBTs]           = useState<PBTLite[]>([]);
  const [cats, setCats]           = useState<CategoriaLite[]>([]);
  const [monedas, setMonedas]     = useState<MonedaLite[]>([]);

  // índices
  const usuarioIndex = useMemo(
    () => new Map(usuarios.map(u => [u.id, `${u.nombres} ${u.apellidos}`.trim()])),
    [usuarios]
  );
  const pbIndex     = useMemo(() => new Map(pbs.map(p  => [p.id,  p.titulo])),  [pbs]);
  const pbtIndex    = useMemo(() => new Map(pbts.map(t => [t.id,  t.titulo])),  [pbts]);
  const catIndex    = useMemo(() => new Map(cats.map(c => [c.id,  c.titulo])),  [cats]);
  const monedaIndex = useMemo(
    () => new Map(monedas.map(m => [m.id, m.simbolo || m.titulo || String(m.id)])),
    [monedas]
  );

  // etiqueta: Producto — Tipo / Categoría
  const asigLabel = useCallback((a: PBAsignado) => {
    const prod = pbIndex.get(a.id_producto_bancario)       ?? a.id_producto_bancario;
    const tipo = pbtIndex.get(a.id_producto_bancario_tipo) ?? a.id_producto_bancario_tipo;
    const cat  = catIndex.get(a.id_categoria)              ?? a.id_categoria;
    return `${prod} — ${tipo} / ${cat}`;
  }, [pbIndex, pbtIndex, catIndex]);

  const asignadoIndex = useMemo(() => {
    const m = new Map<number, string>();
    for (const a of asignados) m.set(a.id, asigLabel(a));
    return m;
  }, [asignados, asigLabel]);

  // === Cargar catálogos ===
  const loadCatalogs = useCallback(async () => {
    const headers = { Accept: 'application/json, text/plain, */*' };

    const results = await Promise.allSettled([
      api.get(USERS_URL, { headers }),
      api.get(ASIG_URL,  { headers }),
      api.get(PB_URL,    { headers }),
      api.get(PBT_URL,   { headers }),
      api.get(CAT_URL,   { headers }),
      api.get(MON_URL,   { headers }),
    ]);

    const take = <T = any>(i: number): T[] =>
      results[i].status === 'fulfilled'
        ? ((results[i] as PromiseFulfilledResult<any>).value?.data ?? [])
        : [];

    const u: UsuarioLite[] = take<UsuarioLite>(0);

    const aRaw = take<any>(1);
    const a: PBAsignado[] = aRaw.map(x => ({
      id: x.id,
      id_producto_bancario:      x.idProductoBancario     ?? x.id_producto_bancario,
      id_producto_bancario_tipo: x.idProductoBancarioTipo ?? x.id_producto_bancario_tipo,
      id_categoria:              x.id_categoria           ?? x.idCategoria,
    }));

    const p: PBLite[]  = take<any>(2).map(x => ({ id: x.id, titulo: x.titulo ?? x.nombre ?? String(x.id) }));
    const t: PBTLite[] = take<any>(3).map(x => ({ id: x.id, titulo: x.titulo ?? x.nombre ?? String(x.id) }));
    const c: CategoriaLite[] = take<any>(4).map(x => ({ id: x.id, titulo: x.titulo ?? x.nombre ?? String(x.id) }));

    const m: MonedaLite[] = take<any>(5).map(x => ({
      id: x.id,
      simbolo: x.simbolo ?? x.symbol ?? '',
      titulo:  x.titulo  ?? x.nombre ?? '',
    }));

    setUsuarios(u);
    setAsignados(a);
    setPBs(p);
    setPBTs(t);
    setCats(c);
    setMonedas(m);
  }, []);

  // === Cargar filas y filtrar con índices ===
  const load = useCallback(async ({ search, page = 1, pageSize = 10, estado }: LoadParams) => {
    setLoading(true);
    setErr(null);
    try {
      const resp = await api.get<ProductoBancarioUsuario[]>(LIST_URL, { headers: JSON_HEADERS });

      let data = resp.data ?? [];

      const q = (search ?? '').trim().toLowerCase();
      if (q) {
        data = data.filter(r =>
          (usuarioIndex.get(r.id_usuario_producto)?.toLowerCase() ?? '').includes(q) ||
          (asignadoIndex.get(r.id_producto_bancario_asignado)?.toLowerCase() ?? '').includes(q) ||
          (monedaIndex.get(r.id_moneda_tipo)?.toLowerCase() ?? '').includes(q)
        );
      }
      if (estado !== '' && estado !== undefined) {
        data = data.filter(r => r.estado === estado);
      }

      const totalLocal = data.length;
      const start = Math.max(0, (page - 1) * pageSize);
      const slice = data.slice(start, start + pageSize);

      setRows(slice);
      setTotal(totalLocal);
    } catch (e: any) {
      setErr(readableAspNetError(e));
      setRows([]);
      setTotal(0);
    } finally {
      setLoading(false);
    }
  }, [usuarioIndex, asignadoIndex, monedaIndex]);

  // ========= CRUD =========
  const create = useCallback(async (data: ProductoBancarioUsuarioSave) => {
    try {
      const payload = toPayload(data);
      console.log("DATOSSSS:::",payload)
      await api.post(CRUD_BASE, payload, { headers: JSON_HEADERS });
    } catch (e: any) {
      console.error('POST error:', e?.response?.data);
      throw new Error(readableAspNetError(e));
    }
  }, []);

  const update = useCallback(async (id: number, data: ProductoBancarioUsuarioSave) => {
    try {
      const payload = { id, ...toPayload(data) };
      await api.put(`${CRUD_BASE}/${id}`, payload, { headers: JSON_HEADERS });
    } catch (e: any) {
      console.error('PUT error:', e?.response?.data);
      throw new Error(readableAspNetError(e));
    }
  }, []);

  const remove = useCallback(async (id: number) => {
    try {
      await api.delete(`${CRUD_BASE}/${id}`, { headers: JSON_HEADERS });
    } catch (e: any) {
      console.error('DELETE error:', e?.response?.data);
      throw new Error(readableAspNetError(e));
    }
  }, []);

  return {
    rows, total, loading, err,
    load, create, update, remove,

    // catálogos + índices
    loadCatalogs,
    usuarios, asignados, pbs, pbts, cats, monedas,
    usuarioIndex, asignadoIndex, monedaIndex,
  };
}