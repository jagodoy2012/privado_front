import { useMemo, useState } from 'react';
import { useOperaciones } from './useOperaciones';
import type { Operacion, OperacionSave } from '../interfaces/Operacion';

export type OpForm = {
  id?: number;
  titulo: string;
  descripcion?: string;
  estado: number; // 0|1
};

const empty: OpForm = { titulo: '', descripcion: '', estado: 1 };

export function useOperacionesUI() {
  const api = useOperaciones();
  const { rows } = api;

  const [open, setOpen] = useState(false);
  const [form, setForm] = useState<OpForm>(empty);
  const isEdit = useMemo(() => typeof form.id === 'number', [form.id]);

  function onNew() {
    setForm(empty);
    setOpen(true);
  }

  function onEdit(op: Operacion) {
    setForm({
      id: op.id,
      titulo: op.titulo ?? '',
      descripcion: op.descripcion ?? '',
      estado: (op.estado ?? 1) as number,
    });
    setOpen(true);
  }

  async function onDelete(id: number) {
    if (!confirm('¿Eliminar esta operación?')) return;
    await api.remove(id);
    // opcional: asegurar
    await api.refresh();
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();

    const body: OperacionSave = {
      titulo: form.titulo.trim(),
      descripcion: form.descripcion?.trim() || '',
      estado: Number(form.estado) as 0 | 1,
    };

    if (isEdit && form.id != null) {
      await api.update(form.id, body);
    } else {
      await api.create(body);
    }

    // asegura que la grilla quede al día aunque el backend no devuelva el objeto
    await api.refresh();

    setOpen(false);
  }

  return {
    ...api,
    open, setOpen,
    form, setForm,
    isEdit,
    onNew, onEdit, onDelete, onSubmit,
    rows,
  };
}