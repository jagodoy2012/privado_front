import { useCallback, useRef, useState } from 'react';
import { api } from '../../../lib/api';

export type Estado = 0 | 1;

export type ProductoBancario = {
  id: number;
  titulo: string;
  descripcion?: string | null;
  estado: Estado;
  fecha?: string | null;
  id_usuario?: number | null;
};

export type ProductoBancarioSave = {
  titulo: string;
  descripcion?: string | null;
  estado: Estado;
};

type LoadParams = {
  search?: string;
  estado?: Estado | '';
};

// ⚠️ AJUSTA según Swagger
const LIST_URL  = '/api/productobancarios';
const CRUD_BASE = '/api/productobancarios';

export function useProductoBancario() {
  const [rows, setRows] = useState<ProductoBancario[]>([]);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const lastParams = useRef<LoadParams>({ search: '', estado: '' });

  /** Acepta string (text/plain) u objeto y siempre devuelve array */
  function parsePayload(raw: any): any {
    try {
      if (typeof raw === 'string') {
        // algunos backends devuelven JSON en text/plain
        return JSON.parse(raw);
      }
      return raw;
    } catch {
      return raw; // si no es JSON, lo devolvemos tal cual
    }
  }

  /** Normaliza a ProductoBancario[] */
  function normalizeArray(raw: any): ProductoBancario[] {
    const data = parsePayload(raw);
    if (Array.isArray(data)) return data as ProductoBancario[];
    if (Array.isArray(data?.items)) return data.items as ProductoBancario[];
    if (Array.isArray(data?.data))  return data.data as ProductoBancario[];
    if (data && typeof data === 'object') return [data as ProductoBancario];
    return [];
  }

  const load = useCallback(async (params: LoadParams = {}) => {
    lastParams.current = { ...lastParams.current, ...params };
    setLoading(true);
    setErr(null);
    try {
      const resp = await api.get(LIST_URL, {
        headers: { Accept: 'application/json, text/plain, */*' },
      });

      const arr = normalizeArray(resp.data);

      // filtros locales
      let filtered = arr;
      const q = (params.search ?? '').trim().toLowerCase();
      if (q) {
        filtered = filtered.filter(r =>
          (r.titulo ?? '').toLowerCase().includes(q) ||
          (r.descripcion ?? '').toLowerCase().includes(q)
        );
      }
      if (params.estado !== '' && params.estado !== undefined) {
        filtered = filtered.filter(r => r.estado === params.estado);
      }

      console.log('[PB] load -> count:', filtered.length, filtered);
      setRows(filtered); // 👈 sin paginado aquí
    } catch (e: any) {
      console.error('[PB] load error:', e);
      setErr(e?.message ?? 'No se recibió respuesta del servidor');
      setRows([]);
    } finally {
      setLoading(false);
    }
  }, []);

  const refresh = useCallback(() => load(lastParams.current), [load]);

  const create = useCallback(async (data: ProductoBancarioSave) => {
    await api.post(CRUD_BASE, data, { headers: { Accept: 'application/json, text/plain, */*' } });
  }, []);

  const update = useCallback(async (id: number, data: ProductoBancarioSave) => {
    await api.put(`${CRUD_BASE}/${id}`, { id, ...data }, { headers: { Accept: 'application/json, text/plain, */*' } });
  }, []);

  const remove = useCallback(async (id: number) => {
    await api.delete(`${CRUD_BASE}/${id}`, { headers: { Accept: 'application/json, text/plain, */*' } });
  }, []);

  return { rows, loading, err, load, refresh, create, update, remove };
}