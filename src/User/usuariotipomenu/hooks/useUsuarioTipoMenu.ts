import { useCallback, useRef, useState } from 'react';
import { api } from '../../../lib/api';
import type {
  UsuarioTipoMenuRaw, UsuarioTipoMenu, UsuarioTipoMenuSave,
  UsuarioTipoLite, MenuLite,
} from '../interfaces/usuarioTipoMenu';

export type LoadParams = {
  search?: string;
  page: number;
  pageSize: number;
  estado?: '' | 0 | 1;
};

const LIST_URL  = '/api/usuario_tipo_menu';
const CRUD_BASE = '/api/usuario_tipo_menu';

// catálogos
const UST_URL = '/api/usuario_tipo'; // ajusta si la ruta es distinta
const MEN_URL = '/api/menus';

function normalize(r: UsuarioTipoMenuRaw): UsuarioTipoMenu {
  return {
    id: r.id,
    id_usuario_tipo: r.id_usuario_tipo,
    id_menu: r.id_menu,
    can_view: !!r.can_view,
    include_ancestors: !!r.include_ancestors,
    include_descendants: !!r.include_descendants,
    estado: (r.estado ?? 1) as 0 | 1,
    fecha: r.fecha ?? null,
    id_usuario: r.id_usuario ?? null,
  };
}

export function useUsuarioTipoMenu() {
  const [rows, setRows] = useState<UsuarioTipoMenu[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  // catálogos
  const [usuarioTipos, setUsuarioTipos] = useState<UsuarioTipoLite[]>([]);
  const [menus, setMenus] = useState<MenuLite[]>([]);

  const lastParams = useRef<LoadParams>({ search: '', page: 1, pageSize: 10, estado: '' });

  const loadCatalogs = useCallback(async () => {
    const [ust, men] = await Promise.all([
      api.get<UsuarioTipoLite[]>(UST_URL, { headers: { Accept: 'application/json, text/plain, */*' } }),
      api.get<MenuLite[]>(MEN_URL,        { headers: { Accept: 'application/json, text/plain, */*' } }),
    ]);
    setUsuarioTipos(ust.data ?? []);
    setMenus(men.data ?? []);
  }, []);

  const load = useCallback(async (params: LoadParams) => {
    lastParams.current = params;
    setLoading(true);
    setErr(null);
    try {
      const resp = await api.get<UsuarioTipoMenuRaw[]>(LIST_URL, {
        headers: { Accept: 'application/json, text/plain, */*' },
      });

      let data = (resp.data ?? []).map(normalize);

      // filtros locales
      if (params.estado !== '' && params.estado !== undefined) {
        data = data.filter(r => r.estado === params.estado);
      }
      const q = (params.search ?? '').trim().toLowerCase();
      if (q) {
        // Para búsqueda libre: por id, etc. (la UI avanzada lo hace con catálogos)
        data = data.filter(r =>
          String(r.id).includes(q) ||
          String(r.id_usuario_tipo).includes(q) ||
          String(r.id_menu).includes(q)
        );
      }

      // orden estable por id asc
      data = data.slice().sort((a, b) => a.id - b.id);

      const start = Math.max(0, (params.page - 1) * params.pageSize);
      const slice = data.slice(start, start + params.pageSize);

      setRows(slice);
      setTotal(data.length);
    } catch (e: any) {
      setErr(e?.message || 'No se pudo cargar usuario_tipo_menu');
      setRows([]);
      setTotal(0);
    } finally {
      setLoading(false);
    }
  }, []);

  const reload = useCallback(async () => { await load(lastParams.current); }, [load]);

  const create = useCallback(async (data: UsuarioTipoMenuSave) => {
    const payload = { ...data }; // backend ya espera snake?
    await api.post(CRUD_BASE, payload, { headers: { Accept: 'application/json, text/plain, */*' } });
  }, []);

  const update = useCallback(async (id: number, data: UsuarioTipoMenuSave) => {
    const payload = { id, ...data };
    await api.put(`${CRUD_BASE}/${id}`, payload, { headers: { Accept: 'application/json, text/plain, */*' } });
  }, []);

  const remove = useCallback(async (id: number) => {
    await api.delete(`${CRUD_BASE}/${id}`, { headers: { Accept: 'application/json, text/plain, */*' } });
  }, []);

  return {
    rows, total, loading, err,
    load, reload, create, update, remove,
    usuarioTipos, menus, loadCatalogs,
  };
}