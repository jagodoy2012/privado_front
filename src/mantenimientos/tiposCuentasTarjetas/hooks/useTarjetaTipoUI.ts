// pages/hooks/useTarjetaTipoUI.ts
import { useEffect, useState } from 'react';
import { api } from '../../../lib/api';

export type TarjetaTipo = {
  id: number;
  titulo: string;
  descripcion?: string | null;
  estado: number;                 // 1 activo, 0 inactivo
  fecha?: string | null;
  id_usuario?: number | null;
};

type FormState = {
  titulo: string;
  descripcion: string;
  estado: number;
};

const emptyForm: FormState = { titulo: '', descripcion: '', estado: 1 };

/* ================= Helpers ================= */

// Backend -> UI
function toUI(row: any): TarjetaTipo {
  return {
    id: Number(row.id ?? 0),
    titulo: String(row.titulo ?? ''),
    // tolerante: si el backend algún día manda "descripcion", también lo tomamos
    descripcion: (row.descripcion ?? row.descripcion ?? null) as string | null,
    estado: Number(row.estado ?? 1),
    fecha: row.fecha ?? null,
    id_usuario: row.id_usuario ?? null,
  };
}

// UI -> Backend
function toAPI(form: FormState, id?: number) {
  const base: any = {
    titulo: form.titulo.trim(),
    // ⚠️ el campo correcto en tu API es "descripcon"
    descripcion: (form.descripcion || '').trim() || null,
    estado: Number(form.estado) as 0 | 1,
  };
  return id == null ? base : { id, ...base }; // POST sin id, PUT con id
}

// Mensaje legible para ProblemDetails de ASP.NET
function parseAspNetError(e: any): string {
  const s = e?.response?.status;
  const d = e?.response?.data;
  if (d?.errors) {
    const msgs = Object.entries(d.errors)
      .map(([k, v]) => `${k}: ${(v as any[]).join(' ')}`)
      .join(' | ');
    return `HTTP ${s}. ${msgs}`;
  }
  return `HTTP ${s}. ${typeof d === 'string' ? d : JSON.stringify(d ?? e?.message)}`;
}

/* ================= Hook ================= */

export function useTarjetaTipoUI() {
  const [rows, setRows] = useState<TarjetaTipo[]>([]);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const [open, setOpen] = useState(false);
  const [isEdit, setIsEdit] = useState(false);
  const [editId, setEditId] = useState<number | null>(null);
  const [form, setForm] = useState<FormState>(emptyForm);

  async function load() {
    setLoading(true);
    setErr(null);
    try {
      const resp = await api.get('/api/tipo_cuenta_tarjeta', {
        headers: { Accept: 'application/json, text/plain, */*' },
      });
      const raw = Array.isArray(resp.data)
        ? resp.data
        : resp.data?.items ?? resp.data?.data ?? [];
      setRows(raw.map(toUI));
    } catch (e: any) {
      if (e?.response?.status === 401) setErr('No autorizado');
      else if (e?.request) setErr('No se recibió respuesta del servidor');
      else setErr(parseAspNetError(e));
      setRows([]);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, []);

  function onNew() {
    setIsEdit(false);
    setEditId(null);
    setForm(emptyForm);
    setOpen(true);
  }

  function onEdit(row: TarjetaTipo) {
    setIsEdit(true);
    setEditId(row.id);
    setForm({
      titulo: row.titulo ?? '',
      descripcion: row.descripcion ?? '',
      estado: Number(row.estado) as 0 | 1,
    });
    setOpen(true);
  }

  async function onDelete(id: number) {
    if (!confirm('¿Eliminar este tipo de tarjeta?')) return;
    try {
      await api.delete(`/api/tipo_cuenta_tarjeta/${id}`, {
        headers: { Accept: 'application/json, text/plain, */*' },
      });
      await load();
    } catch (e: any) {
      setErr(parseAspNetError(e));
      await load();
    }
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();

    const titulo = form.titulo.trim();
    if (!titulo) { setErr('El título es requerido'); return; }

    try {
      if (isEdit && editId != null) {
        const payload = toAPI(form, editId); // incluye id
        await api.put(`/api/tipo_cuenta_tarjeta/${editId}`, payload, {
          headers: { 'Content-Type': 'application/json', Accept: 'application/json, text/plain, */*' },
        });
      } else {
        const payload = toAPI(form); // sin id
        await api.post('/api/tipo_cuenta_tarjeta', payload, {
          headers: { 'Content-Type': 'application/json', Accept: 'application/json, text/plain, */*' },
        });
      }
      setOpen(false);
      setForm(emptyForm);
      await load();
    } catch (e: any) {
      setErr(parseAspNetError(e));
    }
  }

  return {
    rows, loading, err,
    open, setOpen, form, setForm, isEdit,
    onNew, onEdit, onDelete, onSubmit,
  };
}