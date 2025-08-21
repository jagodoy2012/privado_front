// pages/hooks/useTarjetaTipoUI.ts
import { useEffect, useState } from 'react';
import { api } from '../../../lib/api'; // ajusta si tu api vive en otra ruta

export type TarjetaTipo = {
  id: number;
  titulo: string;
  descripcion?: string | null;
  estado: number;          // 1 activo, 0 inactivo
  fecha?: string | null;   // opcional
  id_usuario?: number | null;
};

type FormState = {
  titulo: string;
  descripcion: string;
  estado: number;
};

const emptyForm: FormState = { titulo: '', descripcion: '', estado: 1 };

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
      const resp = await api.get('/api/tarjeta_tipo');
      // acepta array o {items,total}
      const data = Array.isArray(resp.data) ? resp.data : resp.data?.items ?? [];
      setRows(data);
    } catch (e: any) {
      if (e?.response) {
        setErr(e.response.status === 401 ? 'No autorizado' : 'Error del servidor');
      } else if (e?.request) {
        setErr('No se recibió respuesta del servidor');
      } else {
        setErr('Error inesperado');
      }
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
      await api.delete(`/api/tarjeta_tipo/${id}`);
      await load();
    } catch (e) {
      // deja el mismo manejo que load() si quieres mostrarlo arriba
      await load();
    }
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    const payload = {
      id: editId,  
      titulo: form.titulo.trim(),
      descripcion: (form.descripcion || '').trim() || null,
      estado: Number(form.estado) as 0 | 1,
    };
    if (!payload.titulo) return;

    try {
      if (isEdit && editId != null) {
        await api.put(`/api/tarjeta_tipo/${editId}`, payload);
      } else {
        await api.post('/api/tarjeta_tipo', payload);
      }
      setOpen(false);
      await load();
    } catch {
      // si falla, el banner superior mostrará err en el próximo load si aplica
      await load();
    }
  }

  return {
    rows, loading, err,
    open, setOpen, form, setForm, isEdit,
    onNew, onEdit, onDelete, onSubmit,
  };
}
