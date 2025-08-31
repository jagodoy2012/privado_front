// src/User/monedaTipoCambioApi/hooks/useMonedaTipoCambioApi.ts
import { useCallback, useState } from 'react';
import { api } from '../../../lib/api';
import type { MonedaTipoCambioApi, MonedaTipoCambioApiSave, Estado } from '../interfaces/MonedaTipoCambioApi';

export type PageResult<T> = { items: T[]; total: number };

type LoadParams = {
  search?: string;
  page?: number;
  pageSize?: number;
  estado?: Estado | '';
};

const BASE = '/api/monedatipocambioapis';

export function useMonedaTipoCambioApi() {
  const [rows, setRows] = useState<MonedaTipoCambioApi[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const load = useCallback(async ({ search = '', page = 1, pageSize = 1000, estado = '' }: LoadParams) => {
    setLoading(true);
    setErr(null);
    try {
      // Si tu backend no pagina, trae todo y filtramos local
      const resp = await api.get<MonedaTipoCambioApi[]>(BASE, { headers: { Accept: 'application/json, text/plain, */*' } });
      let data = resp.data ?? [];

      const q = search.trim().toLowerCase();
      if (q) {
        data = data.filter(r =>
          r.url.toLowerCase().includes(q) ||
          String(r.id_moneda_tipo).toLowerCase().includes(q)
        );
      }
      if (estado !== '' && estado !== undefined) {
        data = data.filter(r => r.estado === estado);
      }

      setTotal(data.length);
      setRows(data.slice((page - 1) * pageSize, (page - 1) * pageSize + pageSize));
    } catch (e: any) {
      setErr(e?.message || 'Error cargando APIs');
      setRows([]);
      setTotal(0);
    } finally {
      setLoading(false);
    }
  }, []);

  const create = useCallback(async (data: MonedaTipoCambioApiSave) => {
    await api.post(BASE, data, { headers: { Accept: 'application/json, text/plain, */*' } });
  }, []);

  const update = useCallback(async (id: number, data: MonedaTipoCambioApiSave) => {
    await api.put(`${BASE}/${id}`, { id, ...data }, { headers: { Accept: 'application/json, text/plain, */*' } });
  }, []);

  const remove = useCallback(async (id: number) => {
    await api.delete(`${BASE}/${id}`, { headers: { Accept: 'application/json, text/plain, */*' } });
  }, []);

  return { rows, total, loading, err, load, create, update, remove };
}