import { useMemo, useState } from 'react';
import { useProductoBancario } from './useProductoBancario';
import type { ProductoBancario, ProductoBancarioSave } from './useProductoBancario';

export type PBForm = {
  id?: number;
  titulo: string;
  descripcion?: string;
  estado: number; // 0 | 1
};

const empty: PBForm = { titulo: '', descripcion: '', estado: 1 };

export function useProductoBancarioUI() {
  const api = useProductoBancario();

  const [open, setOpen] = useState(false);
  const [form, setForm] = useState<PBForm>(empty);
  const isEdit = useMemo(() => typeof form.id === 'number', [form.id]);

  function onNew() {
    setForm(empty);
    setOpen(true);
  }

  function onEdit(row: ProductoBancario) {
    setForm({
      id: row.id,
      titulo: row.titulo ?? '',
      descripcion: row.descripcion ?? '',
      estado: (row.estado ?? 1) as number,
    });
    setOpen(true);
  }

  async function onDelete(id: number) {
    if (!confirm('¿Eliminar este producto bancario?')) return;
    await api.remove(id);
    await api.refresh(); // 👈 vuelve a cargar
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    const body: ProductoBancarioSave = {
      titulo: form.titulo.trim(),
      descripcion: form.descripcion?.trim() || '',
      estado: Number(form.estado) as 0 | 1,
    };
    if (isEdit && form.id != null) {
      await api.update(form.id, body);
    } else {
      await api.create(body);
    }
    setOpen(false);
    await api.refresh(); // 👈 vuelve a cargar después de crear/editar
  }

  return {
    ...api,
    open, setOpen,
    form, setForm,
    isEdit,
    onNew, onEdit, onDelete, onSubmit,
  };
}