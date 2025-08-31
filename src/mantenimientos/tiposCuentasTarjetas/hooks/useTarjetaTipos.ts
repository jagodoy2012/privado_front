// pages/hooks/useTarjetaTipos.ts
import { useCallback, useRef, useState } from 'react';
import { api } from '../../../lib/api';

export type Estado = 0 | 1;

export type TarjetaTipo = {
  id: number;
  titulo: string;                 // UI
  descripcion?: string | null;
  estado: Estado;
  fecha?: string | null;
  id_usuario?: number | null;
};

export type TarjetaTipoSave = {
  titulo: string;                 // UI
  descripcion?: string | null;
  estado: Estado;
};

const JSON_HEADERS = {
  Accept: 'application/json, text/plain, */*',
  'Content-Type': 'application/json',
};

// Según tu Swagger
const BASE = '/api/tipo_cuenta_tarjeta';

// Backend -> UI
function toUI(row: any): TarjetaTipo {
  return {
    id: Number(row.id ?? row.ID ?? 0),
    titulo: String(row.titulo ?? ''),
    descripcion: (row.descripcion ?? row.descripcion ?? null) as string | null,
    estado: (row.estado ?? 1) as Estado,
    fecha: row.fecha ?? null,
    id_usuario: row.id_usuario ?? null,
  };
}

// UI -> Backend
function toAPI(data: TarjetaTipoSave, id?: number) {
  const payload: any = {
    ...(id == null ? {} : { id }),
    titulo: (data.titulo || '').trim(),
    // ⚠️ campo correcto en tu API
    descripcion: (data.descripcion || '').trim() || null,
    estado: data.estado,
  };
  return payload;
}

function normalizeList(raw: any): TarjetaTipo[] {
  const data = typeof raw === 'string' ? (() => { try { return JSON.parse(raw); } catch { return raw; } })() : raw;
  const arr = Array.isArray(data) ? data
           : Array.isArray(data?.items) ? data.items
           : Array.isArray(data?.data)  ? data.data
           : data ? [data] : [];
  return arr.map(toUI);
}

function readableAspNetError(e: any): string {
  const s = e?.response?.status;
  const d = e?.response?.data;
  if (d?.errors) {
    const msgs = Object.entries(d.errors)
      .map(([k, v]) => `${k}: ${(v as any[]).join(' ')}`)
      .join(' | ');
    return `HTTP ${s}. ${msgs}`;
  }
  return `HTTP ${s}. ${typeof d === 'string' ? d : JSON.stringify(d ?? e.message)}`;
}

export function useTarjetaTipos() {
  const [rows, setRows] = useState<TarjetaTipo[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const baseRef = useRef<string>(BASE);

  const load = useCallback(async () => {
    setLoading(true);
    setErr(null);
    try {
      const resp = await api.get(baseRef.current, { headers: JSON_HEADERS });
      const list = normalizeList(resp.data);
      setRows(list);
      setTotal(list.length);
    } catch (e: any) {
      setErr(readableAspNetError(e));
      setRows([]); setTotal(0);
    } finally {
      setLoading(false);
    }
  }, []);

  const create = useCallback(async (data: TarjetaTipoSave) => {
    try {
      const payload = toAPI(data);        // POST sin id
      await api.post(baseRef.current, payload, { headers: JSON_HEADERS });
    } catch (e: any) {
      throw new Error(readableAspNetError(e));
    }
  }, []);

  const update = useCallback(async (id: number, data: TarjetaTipoSave) => {
    try {
      const payload = toAPI(data, id);    // PUT con id
      await api.put(`${baseRef.current}/${id}`, payload, { headers: JSON_HEADERS });
    } catch (e: any) {
      throw new Error(readableAspNetError(e));
    }
  }, []);

  const remove = useCallback(async (id: number) => {
    try {
      await api.delete(`${baseRef.current}/${id}`, { headers: JSON_HEADERS });
    } catch (e: any) {
      throw new Error(readableAspNetError(e));
    }
  }, []);

  return { rows, total, loading, err, load, create, update, remove };
}