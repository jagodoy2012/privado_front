import { useMemo, useState } from 'react';
import { useAsignado } from './useAsignado';
import type { Asignado } from '../interfaces/Asignado';

export type Form = {
  id?: number;
  id_operaciones: number | '';
  id_producto_bancario: number | '';
  estado: number; // 0 | 1
};

const empty: Form = { id_operaciones: '', id_producto_bancario: '', estado: 1 };

export function useAsignadoUI() {
  const api = useAsignado();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState<Form>(empty);
  const isEdit = useMemo(() => typeof form.id === 'number', [form.id]);

  function onNew() {
    setForm(empty);
    setOpen(true);
  }

  function onEdit(row: Asignado) {
    setForm({
      id: row.id,
      id_operaciones: row.id_operaciones ?? '',
      id_producto_bancario: row.id_producto_bancario ?? '',
      estado: Number(row.estado ?? 1),
    });
    setOpen(true);
  }

  async function onDelete(id: number) {
    if (!confirm('¿Eliminar asignación?')) return;
    await api.remove(id);
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (form.id_operaciones === '' || form.id_producto_bancario === '') return;

    const body = {
      id_operaciones: Number(form.id_operaciones),
      id_producto_bancario: Number(form.id_producto_bancario),
      estado: Number(form.estado) as 0 | 1,
    };

    if (isEdit && form.id != null) {
      await api.update(form.id, body);
    } else {
      await api.create(body);
    }
    setOpen(false);
  }

  return { ...api, open, setOpen, form, setForm, isEdit, onNew, onEdit, onDelete, onSubmit };
}