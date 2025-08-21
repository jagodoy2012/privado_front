// useUsuarioDirecciones.ts
import { useEffect, useMemo, useState } from 'react';
import { apiRequest } from '../../../lib/api';

export interface Dpto { id: number; titulo: string }
export interface Mun  { id: number; titulo: string }
export interface Zona { id: number; titulo: string }

const token = localStorage.getItem('token') || sessionStorage.getItem('token');

export function useUsuarioDirecciones(userId: number | null) {
  // catálogos para el formulario
  const [tipos, setTipos] = useState<{ id:number; titulo:string }[]>([]);
  const [deps,  setDeps]  = useState<Dpto[]>([]);
  const [muns,  setMuns]  = useState<Mun[]>([]);
  const [zonas, setZonas] = useState<Zona[]>([]);

  // índices/labels para la tabla
  const tiposIndex = useMemo(
    () => Object.fromEntries(tipos.map(t => [t.id, t.titulo])),
    [tipos]
  );
  const [zonaLabelById, setZonaLabelById] = useState<Record<number, string>>({});

  // selección en el formulario
  const [depId,  setDepId]  = useState<number | ''>('');
  const [munId,  setMunId]  = useState<number | ''>('');
  const [zonaId, setZonaId] = useState<number | ''>('');

  // filas (direcciones del usuario)
  const [rows, setRows] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  // form
  const [form, setForm] = useState({ direccion: '', id_tipo: 0 });
  const isEdit = false;

  // ─────────── CARGAS ───────────
  async function loadTipos() {
    const data = await apiRequest<{id:number; titulo:string}[]>('/api/usuario_direccion_tipo');
    setTipos(data);
  }
  async function loadDeps() {
    const data = await apiRequest<Dpto[]>('/api/departamentos');
    setDeps(data);
  }
  async function loadMuns(dptoId: number) {
    const data = await apiRequest<Mun[]>(`/api/municipios/${dptoId}/departamentos`);
    setMuns(data);
  }
  async function loadZonas(municipioId: number) {
    const data = await apiRequest<Zona[]>(`/api/zonas/${municipioId}/municipios`);
    setZonas(data);
  }
  async function loadRows() {
    if (userId == null) return;
    setLoading(true);
    try {
      // ← tu endpoint actual
      const data = await apiRequest<any[]>(`/api/usuario_direccion/${userId}/direcciones`);
      setRows(data);
    } catch (e: any) {
      setErr(e.message || 'Error al cargar direcciones');
    } finally {
      setLoading(false);
    }
  }

  // inicial
  useEffect(() => { loadTipos(); loadDeps(); }, []);
  useEffect(() => { loadRows(); }, [userId]);

  // cascada del formulario
  useEffect(() => {
    if (depId === '') {
      setMuns([]); setMunId(''); setZonas([]); setZonaId('');
      return;
    }
    setMunId(''); setZonas([]); setZonaId('');
    loadMuns(depId);
  }, [depId]);

  useEffect(() => {
    if (munId === '') {
      setZonas([]); setZonaId('');
      return;
    }
    setZonaId('');
    loadZonas(munId);
  }, [munId]);

  // ─────────── RESOLVER LABEL "Dpto / Mun / Zona" PARA LA TABLA ───────────
  // Si tu API expone endpoints por ID, ajusta las rutas si usan singular:
  // /api/zonas/:id  /api/municipios/:id  /api/departamentos/:id
  async function resolveZonaLabel(zonaId: number): Promise<string> {
    if (zonaLabelById[zonaId]) return zonaLabelById[zonaId];

    const z = await apiRequest<{ id:number; titulo:string; id_municipio:number }>(`/api/zonas/${zonaId}`);
    const m = await apiRequest<{ id:number; titulo:string; id_departamento:number }>(`/api/municipios/${z.id_municipio}`);
    const d = await apiRequest<{ id:number; titulo:string }>(`/api/departamentos/${m.id_departamento}`);

    const label = `${d.titulo} / ${m.titulo} / ${z.titulo}`;
    setZonaLabelById(prev => ({ ...prev, [zonaId]: label }));
    return label;
  }

  // cada vez que cambien filas, resuelve los labels de zona (una sola vez por id)
  useEffect(() => {
    const ids = Array.from(new Set(rows.map(r => Number(r.id_zona)).filter(Boolean)));
    if (!ids.length) return;
    (async () => {
      await Promise.all(ids.map(id => resolveZonaLabel(id)));
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [rows]);

  // ─────────── CRUD ───────────
  async function create() {
    if (userId == null) return;
    await apiRequest<void>(`/api/usuario_direccion`, {
      method: 'POST',
      data: {
        direccion: form.direccion.trim(),
        id_usuario_direccion_tipo: Number(form.id_tipo),
        id_zona: Number(zonaId),
        id_usuario_direccion: Number(userId),
        estado: 1,
        fecha: new Date().toISOString(),
        id_usuario: 2,
      },
      headers: token ? { Authorization: `Bearer ${token}` } : undefined,
    });
    await loadRows();
  }

  async function remove(id: number) {
    await apiRequest<void>(`/api/usuario_direccion/${id}`, { method: 'DELETE' });
    setRows(prev => prev.filter(r => r.id !== id));
  }

  // ─────────── EXPOSE ───────────
  return {
    // data
    rows, loading, err,
    tipos, deps, muns, zonas,
    tiposIndex,          // 👈 índice id→título para la tabla
    zonaLabelById,       // 👈 cache "Dpto / Mun / Zona" por id_zona

    // selects (form)
    depId, setDepId,
    munId, setMunId,
    zonaId, setZonaId,

    form, setForm, isEdit,

    // ops
    create, remove, loadRows,

    // helpers
    resetGeo: () => { setDepId(''); setMunId(''); setZonaId(''); setMuns([]); setZonas([]); },
  };
}
