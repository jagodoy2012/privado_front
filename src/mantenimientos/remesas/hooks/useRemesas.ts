import { useCallback, useState } from 'react';
import { api } from '../../../lib/api';
import type { Remesa, RemesaSave, MonedaTipo } from '../interfaces/Remesa';

type LoadParams = { };
export type LoadMonedasResult = { monedas: MonedaTipo[]; monedasIndex: Map<number, string> };

export function useRemesas() {
  const [rows, setRows] = useState<Remesa[]>([]);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const load = useCallback(async (_: LoadParams) => {
    setLoading(true);
    setErr(null);
    try {
      const resp = await api.get<Remesa[]>('/api/remesas', {
        headers: { Accept: 'application/json, text/plain, */*' },
      });
      setRows(resp.data ?? []);
    } catch (e: any) {
      setErr(e?.message || 'No se recibió respuesta del servidor');
      setRows([]);
    } finally {
      setLoading(false);
    }
  }, []);

  const create = useCallback(async (data: RemesaSave) => {
    await api.post('/api/remesas', data, {
      headers: { Accept: 'application/json, text/plain, */*' },
    });
  }, []);

  const update = useCallback(async (id: number, data: RemesaSave) => {
    await api.put(`/api/remesas/${id}`, { id, ...data }, {
      headers: { Accept: 'application/json, text/plain, */*' },
    });
  }, []);

  const remove = useCallback(async (id: number) => {
    await api.delete(`/api/remesas/${id}`, {
      headers: { Accept: 'application/json, text/plain, */*' },
    });
  }, []);

  const loadMonedas = useCallback(async (): Promise<LoadMonedasResult> => {
    const r = await api.get<MonedaTipo[]>('/api/monedatipos', {
      headers: { Accept: 'application/json, text/plain, */*' },
    });
    const monedas = r.data ?? [];
    const monedasIndex = new Map<number, string>(monedas.map(m => [m.id, m.titulo]));
    return { monedas, monedasIndex };
  }, []);

  return { rows, loading, err, load, create, update, remove, loadMonedas };
}