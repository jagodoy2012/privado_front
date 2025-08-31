// src/User/monedaTipos/hooks/useMonedaTipo.ts
import { useCallback, useRef, useState } from 'react';
import { api } from '../../../lib/api';
import type { MonedaTipo, MonedaTipoSave, Estado } from '../interfaces/MonedaTipo';

export type PageResult<T> = { items: T[]; total: number };

type LoadParams = {
  search?: string;
  page: number;
  pageSize: number;
  estado?: Estado | '';
};

const LIST_URL  = '/api/monedatipos';
const CRUD_BASE = '/api/monedatipos';

export function useMonedaTipo() {
  const [rows, setRows] = useState<MonedaTipo[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  // 👉 guardamos los últimos parámetros para poder recargar luego
  const lastParams = useRef<LoadParams>({ search: '', page: 1, pageSize: 50, estado: '' });

  const load = useCallback(async (params: LoadParams) => {
    lastParams.current = params; // ← recuerda los últimos
    setLoading(true);
    setErr(null);
    try {
      const resp = await api.get<MonedaTipo[]>(LIST_URL, {
        headers: { Accept: 'application/json, text/plain, */*' },
      });

      let data = resp.data ?? [];

      // filtros locales
      const q = (params.search ?? '').trim().toLowerCase();
      if (q) {
        data = data.filter(m =>
          (m.titulo ?? '').toLowerCase().includes(q) ||
          (m.simbolo ?? '').toLowerCase().includes(q) ||
          (m.descripcion ?? '').toLowerCase().includes(q)
        );
      }
      if (params.estado !== '' && params.estado !== undefined) {
        data = data.filter(m => m.estado === params.estado);
      }

      // paginado local (deja aquí un tamaño amplio para que luego puedas paginar en la UI)
      const start = Math.max(0, (params.page - 1) * params.pageSize);
      const slice = data.slice(start, start + params.pageSize);

      setRows(slice);
      setTotal(data.length);
    } catch (e: any) {
      setErr(e?.message || 'No se recibió respuesta del servidor');
      setRows([]);
      setTotal(0);
    } finally {
      setLoading(false);
    }
  }, []);

  // 👉 recarga usando los últimos parámetros
  const reload = useCallback(async () => {
    await load(lastParams.current);
  }, [load]);

  const create = useCallback(async (data: MonedaTipoSave) => {
    await api.post(CRUD_BASE, data, { headers: { Accept: 'application/json, text/plain, */*' } });
  }, []);

  const update = useCallback(async (id: number, data: MonedaTipoSave) => {
    await api.put(`${CRUD_BASE}/${id}`, { id, ...data }, { headers: { Accept: 'application/json, text/plain, */*' } });
  }, []);

  const remove = useCallback(async (id: number) => {
    await api.delete(`${CRUD_BASE}/${id}`, { headers: { Accept: 'application/json, text/plain, */*' } });
  }, []);

  return { rows, total, loading, err, load, reload, create, update, remove };
}