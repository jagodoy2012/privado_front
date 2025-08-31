// src/User/menus/hooks/useMenu.ts
import { useCallback, useRef, useState } from 'react';
import { api } from '../../../lib/api';
import type { MenuItemRaw, MenuItem, MenuSave } from '../interfaces/menu';

export type LoadParams = {
  search?: string;
  page: number;      // <- los mantenemos para consistencia, pero NO los usamos aquí
  pageSize: number;  // <- idem
  active?: '' | '1' | '0';
};

const LIST_URL  = '/api/menus';
const CRUD_BASE = '/api/menus';

function normalize(raw: MenuItemRaw): MenuItem {
  return {
    id: raw.id,
    parent_id: raw.id_padre,                 // ajusta si tu API envía parent_id
    label: raw.label,
    path: raw.path,
    sort_order: raw.sort_order,
    is_active: !!raw.is_active,              // acepta 0/1 o boolean
  };
}

export function useMenu() {
  const [rows, setRows] = useState<MenuItem[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const lastParams = useRef<LoadParams>({ search: '', page: 1, pageSize: 50, active: '' });

  const load = useCallback(async (params: LoadParams) => {
    lastParams.current = params;
    setLoading(true);
    setErr(null);
    try {
      const resp = await api.get<MenuItemRaw[]>(LIST_URL, {
        headers: { Accept: 'application/json, text/plain, */*' },
      });

      // Normaliza y filtra/ordena TODO, sin paginar aquí
      let data = (resp.data ?? []).map(normalize);

      const q = (params.search ?? '').trim().toLowerCase();
      if (q) {
        data = data.filter(m =>
          (m.label ?? '').toLowerCase().includes(q) ||
          (m.path ?? '').toLowerCase().includes(q)
        );
      }
      if (params.active === '1') data = data.filter(m => m.is_active);
      if (params.active === '0') data = data.filter(m => !m.is_active);

      data = data.slice().sort((a, b) => {
        const so = (a.sort_order ?? 0) - (b.sort_order ?? 0);
        if (so !== 0) return so;
        return a.label.localeCompare(b.label);
      });

      // 👉 ENTREGAMOS TODO (sin slice)
      setRows(data);
      setTotal(data.length);
    } catch (e: any) {
      setErr(e?.message || 'No se pudo cargar el menú');
      setRows([]);
      setTotal(0);
    } finally {
      setLoading(false);
    }
  }, []);

  const reload = useCallback(async () => {
    await load(lastParams.current);
  }, [load]);

  const create = useCallback(async (data: MenuSave) => {
    const payload = {
      id_padre: data.parent_id ?? null,
      label: data.label,
      path: data.path || null,               // ← si envías vacío, mejor null
      sort_order: data.sort_order,
      is_active: data.is_active,
    };
    await api.post(CRUD_BASE, payload, { headers: { Accept: 'application/json, text/plain, */*' } });
  }, []);

  const update = useCallback(async (id: number, data: MenuSave) => {
    const payload = {
      id,
      id_padre: data.parent_id ?? null,
      label: data.label,
      path: data.path || null,
      sort_order: data.sort_order,
      is_active: data.is_active,
    };
    await api.put(`${CRUD_BASE}/${id}`, payload, { headers: { Accept: 'application/json, text/plain, */*' } });
  }, []);

  const remove = useCallback(async (id: number) => {
    await api.delete(`${CRUD_BASE}/${id}`, { headers: { Accept: 'application/json, text/plain, */*' } });
  }, []);

  return { rows, total, loading, err, load, reload, create, update, remove };
}