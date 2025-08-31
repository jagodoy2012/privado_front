import { useCallback, useRef, useState } from 'react';
import { api } from '../../../lib/api';

export type Estado = 0 | 1;

export type Operacion = {
  id: number;
  titulo: string;
  descripcion?: string | null;
  estado: Estado;
  fecha?: string | null;
  id_usuario?: number | null;
};

export type OperacionSave = {
  titulo: string;
  descripcion?: string | null;
  estado: Estado;
};

export type PageResult<T> = { items: T[]; total: number };

type LoadParams = {
  search?: string;
  page: number;
  pageSize: number;
  estado?: Estado | '';
};

const LIST_URL  = '/api/operaciones';
const CRUD_BASE = '/api/operaciones';

export function useOperaciones() {
  const [rows, setRows] = useState<Operacion[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  // guardo los últimos parámetros para poder refrescar tras create/update/delete
  const lastParams = useRef<LoadParams | null>(null);

  const load = useCallback(async (params: LoadParams) => {
    lastParams.current = params;
    setLoading(true);
    setErr(null);
    try {
      const resp = await api.get(LIST_URL, {
        headers: { Accept: 'application/json, text/plain, */*' },
        // si tu backend soporta query string, puedes pasar params aquí
        // params,
      });

      const raw = resp.data as any;
      let data: Operacion[] =
        Array.isArray(raw) ? raw :
        Array.isArray(raw?.items) ? raw.items :
        Array.isArray(raw?.data) ? raw.data :
        [];

      // filtros/paginado local (si el backend no lo hace)
      const q = (params.search ?? '').trim().toLowerCase();
      if (q) {
        data = data.filter(r =>
          (r.titulo ?? '').toLowerCase().includes(q) ||
          (r.descripcion ?? '').toLowerCase().includes(q)
        );
      }
      if (params.estado !== '' && params.estado !== undefined) {
        data = data.filter(r => r.estado === params.estado);
      }

      const totalLocal = data.length;
      const start = Math.max(0, (params.page - 1) * params.pageSize);
      const slice = data.slice(start, start + params.pageSize);

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

  const refresh = useCallback(async () => {
    if (lastParams.current) {
      await load(lastParams.current);
    }
  }, [load]);

  const create = useCallback(async (data: OperacionSave) => {
    const resp = await api.post(CRUD_BASE, data, {
      headers: { Accept: 'application/json, text/plain, */*' },
    });
    const created: Operacion | undefined = resp?.data;
    if (created && created.id) {
      // optimista: lo sumo arriba
      setRows(prev => [created, ...prev]);
      setTotal(t => t + 1);
    } else {
      await refresh();
    }
  }, [refresh]);

  const update = useCallback(async (id: number, data: OperacionSave) => {
    const resp = await api.put(`${CRUD_BASE}/${id}`, { id, ...data }, {
      headers: { Accept: 'application/json, text/plain, */*' },
    });
    const updated: Operacion | undefined = resp?.data;
    if (updated && updated.id) {
      // optimista: reemplazo en memoria
      setRows(prev => prev.map(r => (r.id === id ? { ...r, ...updated } : r)));
    } else {
      await refresh();
    }
  }, [refresh]);

  const remove = useCallback(async (id: number) => {
    await api.delete(`${CRUD_BASE}/${id}`, {
      headers: { Accept: 'application/json, text/plain, */*' },
    });
    // optimista: lo saco; si tu backend no elimina, un refresh lo repondrá
    setRows(prev => prev.filter(r => r.id !== id));
    setTotal(t => Math.max(0, t - 1));
  }, []);

  return { rows, total, loading, err, load, refresh, create, update, remove };
}