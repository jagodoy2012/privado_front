// src/User/productoBancarioTipos/hooks/useProductoBancarioTipo.ts
import { useCallback, useState } from 'react';
import { api } from '../../../lib/api';
import type { ProductoBancarioTipo, ProductoBancarioTipoSave, Estado } from '../interfaces/ProductoBancarioTipo';

type LoadParams = {
  search?: string;
  page: number;
  pageSize: number;
  estado?: Estado | '';
};

const LIST_URL  = '/api/producto_bancario_tipo';
const CRUD_BASE = '/api/producto_bancario_tipo';

export function useProductoBancarioTipo() {
  const [rows, setRows] = useState<ProductoBancarioTipo[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const load = useCallback(async ({ search, page, pageSize, estado }: LoadParams) => {
    setLoading(true);
    setErr(null);
    try {
      const resp = await api.get<ProductoBancarioTipo[]>(LIST_URL, {
        headers: { Accept: 'application/json, text/plain, */*' },
      });

      let data = resp.data ?? [];

      // filtros locales
      const q = (search ?? '').trim().toLowerCase();
      if (q) {
        data = data.filter(r =>
          (r.titulo ?? '').toLowerCase().includes(q) ||
          (r.descripcion ?? '').toLowerCase().includes(q) ||
          (r.tabla ?? '').toLowerCase().includes(q)
        );
      }
      if (estado !== '' && estado !== undefined) {
        data = data.filter(r => r.estado === estado);
      }

      // paginado local
      const totalLocal = data.length;
      const start = Math.max(0, (page - 1) * pageSize);
      const slice = data.slice(start, start + pageSize);

      setRows(slice);
      setTotal(totalLocal);
    } catch (e: any) {
      setErr(e?.message || 'No se recibió respuesta del servidor');
      setRows([]);
      setTotal(0);
    } finally {
      setLoading(false);
    }
  }, []);

  const create = useCallback(async (data: ProductoBancarioTipoSave) => {
    await api.post(CRUD_BASE, data, {
      headers: { Accept: 'application/json, text/plain, */*' },
    });
  }, []);

  const update = useCallback(async (id: number, data: ProductoBancarioTipoSave) => {
    await api.put(`${CRUD_BASE}/${id}`, { id, ...data }, {
      headers: { Accept: 'application/json, text/plain, */*' },
    });
  }, []);

  const remove = useCallback(async (id: number) => {
    await api.delete(`${CRUD_BASE}/${id}`, {
      headers: { Accept: 'application/json, text/plain, */*' },
    });
  }, []);

  return { rows, total, loading, err, load, create, update, remove };
}