// src/mantenimientos/pb_tipo_asignado/hooks/usePBTipoAsignado.ts
import { useCallback, useMemo, useRef, useState } from 'react';
import { api } from '../../../lib/api';
import type {
  PBTipoAsignado,
  PBTipoAsignadoSave,
  Estado,
  ProductoBancarioLite,
  ProductoBancarioTipoLite,
  TipoCuentaTarjetaLite,
} from '../interfaces/PBTipoAsignado';

export type PageResult<T> = { items: T[]; total: number };

type LoadParams = {
  search?: string;
  page?: number;
  pageSize?: number;
  estado?: Estado | '';
};

const LIST_URL  = '/api/producto_bancario_tipo_asignado';
const CRUD_BASE = '/api/producto_bancario_tipo_asignado';

// catálogos para combos
const PB_LIST   = '/api/productobancarios';
const PBT_LIST  = '/api/producto_bancario_tipo';
const CAT_LIST  = '/api/tipo_cuenta_tarjeta';

export function usePBTipoAsignado() {
  const [rows, setRows] = useState<PBTipoAsignado[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  // catálogos
  const [productos, setProductos] = useState<ProductoBancarioLite[]>([]);
  const [tipos, setTipos] = useState<ProductoBancarioTipoLite[]>([]);
  const [categorias, setCategorias] = useState<TipoCuentaTarjetaLite[]>([]);

  const productosIndex = useMemo(
    () => new Map(productos.map(p => [p.id, p.titulo])),
    [productos]
  );
  const tiposIndex = useMemo(
    () => new Map(tipos.map(t => [t.id, t.titulo])),
    [tipos]
  );
  const categoriasIndex = useMemo(
    () => new Map(categorias.map(c => [c.id, c.titulo])),
    [categorias]
  );

  /** Guardamos los últimos parámetros para poder recargar tras mutaciones */
  const lastParamsRef = useRef<LoadParams>({ page: 1, pageSize: 10 });

  const loadCatalogs = useCallback(async () => {
    const [pb, pbt, cat] = await Promise.all([
      api.get<ProductoBancarioLite[]>(PB_LIST),
      api.get<ProductoBancarioTipoLite[]>(PBT_LIST),
      api.get<TipoCuentaTarjetaLite[]>(CAT_LIST),
    ]);
    setProductos(pb.data ?? []);
    setTipos(pbt.data ?? []);
    setCategorias(cat.data ?? []);
  }, []);

  /** Carga base (devuelve TODA la lista filtrada; la paginación visible se hace en la página) */
  const load = useCallback(async ({ search, page = 1, pageSize = 10, estado }: LoadParams) => {
    lastParamsRef.current = { search, page, pageSize, estado };
    setLoading(true);
    setErr(null);
    try {
      const resp = await api.get<PBTipoAsignado[]>(LIST_URL);
      let data = resp.data ?? [];

      const q = (search ?? '').trim().toLowerCase();
      if (q) {
        data = data.filter(r =>
          (productosIndex.get(r.idProductoBancario) ?? '').toLowerCase().includes(q) ||
          (tiposIndex.get(r.idProductoBancarioTipo) ?? '').toLowerCase().includes(q) ||
          (categoriasIndex.get(r.id_categoria) ?? '').toLowerCase().includes(q)
        );
      }
      if (estado !== '' && estado !== undefined) {
        data = data.filter(r => r.estado === estado);
      }

      // Importante: devolvemos toda la lista filtrada. La tabla paginará localmente.
      setRows(data);
      setTotal(data.length);
    } catch (e: any) {
      setErr(e?.message || 'No se recibió respuesta del servidor');
      setRows([]); setTotal(0);
    } finally {
      setLoading(false);
    }
  }, [productosIndex, tiposIndex, categoriasIndex]);

  const reload = useCallback(async () => {
    await load(lastParamsRef.current);
  }, [load]);

  const create = useCallback(async (data: PBTipoAsignadoSave) => {
    await api.post(CRUD_BASE, data);
    await reload();
  }, [reload]);

  const update = useCallback(async (id: number, data: PBTipoAsignadoSave) => {
    await api.put(`${CRUD_BASE}/${id}`, { id, ...data });
    await reload();
  }, [reload]);

  const remove = useCallback(async (id: number) => {
    await api.delete(`${CRUD_BASE}/${id}`);
    await reload();
  }, [reload]);

  return {
    rows, total, loading, err,
    load, reload, create, update, remove,
    // catálogos
    loadCatalogs,
    productos, tipos, categorias,
    productosIndex, tiposIndex, categoriasIndex,
  };
}