import { useCallback, useState } from 'react';
import { api } from '../../../lib/api';

export type Estado = 0 | 1;

export type TarjetaTipo = {
  id: number;
  titulo: string;
  descripcion?: string | null;
  estado: Estado;
  fecha?: string | null;        // ISO string si la envías del backend
  id_usuario?: number | null;
};

export type TarjetaTipoSave = {
  titulo: string;
  descripcion?: string | null;
  estado: Estado;
};

export type PageResult<T> = {
  items: T[];
  total: number;
};

type LoadParams = {
  search?: string;
  page: number;
  pageSize: number;
  estado?: Estado | '';
};

export function useTarjetaTipos() {
  const [rows, setRows] = useState<TarjetaTipo[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);

  const load = useCallback(async ({ search, page, pageSize, estado }: LoadParams) => {
    setLoading(true);
    try {
      const resp = await api.get<PageResult<TarjetaTipo>>('/api/tarjeta_tipo', {
        params: {
          search: search ?? '',
          page,
          pageSize,
          estado: estado === '' ? undefined : estado
        }
      });
      setRows(resp.data.items);
      setTotal(resp.data.total);
    } finally {
      setLoading(false);
    }
  }, []);

  const create = useCallback(async (data: TarjetaTipoSave) => {
    await api.post('/api/tarjeta_tipo', data);
  }, []);

  const update = useCallback(async (id: number, data: TarjetaTipoSave) => {
    await api.put(`/api/tarjeta_tipo/${id}`, { id, ...data });
  }, []);

  const remove = useCallback(async (id: number) => {
    await api.delete(`/api/tarjeta_tipo/${id}`);
  }, []);

  return { rows, total, loading, load, create, update, remove };
}
