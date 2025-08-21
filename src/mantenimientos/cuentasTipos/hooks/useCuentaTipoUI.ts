import { useState } from 'react';
import { useCuentaTipo } from './useCuentaTipo';
import type { CuentaTipo } from '../interfaces/CuentaTipo';

export function useCuentaTipoUI() {
  const { rows, loading, err, load, create, update, remove } = useCuentaTipo();

  const [open, setOpen] = useState(false);
  const [form, setForm] = useState<{ id?: number; titulo: string; descripcion?: string; estado: number }>({
    titulo: '',
    descripcion: '',
    estado: 1,
  });

  const isEdit = typeof form.id === 'number';

  function onNew() {
    setForm({ titulo: '', descripcion: '', estado: 1 });
    setOpen(true);
  }

  function onEdit(r: CuentaTipo) {
    setForm({
      id: r.id,
      titulo: r.titulo ?? '',
      descripcion: r.descripcion ?? '',
      estado: r.estado ?? 1,
    });
    setOpen(true);
  }

  async function onDelete(id: number) {
    if (!confirm('¿Eliminar este tipo de cuenta?')) return;
    await remove(id);
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();

    const body = {
      titulo: form.titulo.trim(),
      descripcion: (form.descripcion ?? '').trim(),
      estado: Number(form.estado),
    };

    if (isEdit && form.id != null) {
      await update(form.id, body);
    } else {
      await create(body);
    }
    setOpen(false);
    await load();
  }

  return {
    rows, loading, err,
    open, setOpen, form, setForm, isEdit,
    onNew, onEdit, onDelete, onSubmit,
  };
}
