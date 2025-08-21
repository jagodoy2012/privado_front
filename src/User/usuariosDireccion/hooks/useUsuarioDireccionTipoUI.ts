import { useMemo, useState } from 'react';
import type { UsuarioDireccionTipo } from '../interfaces/UsuarioDireccionTipo';
import { useUsuarioDireccionTipo } from './useUsuarioDireccionTipo';

export type FormState = {
  id?: number;
  titulo: string;
  descripcion: string;
  estado: number; // 0/1
};

const empty: FormState = {
  titulo: '',
  descripcion: '',
  estado: 1,
};

export function useUsuarioDireccionTipoUI() {
  const { rows, loading, err, create, update, remove } = useUsuarioDireccionTipo();

  const [open, setOpen] = useState(false);
  const [form, setForm] = useState<FormState>(empty);
  const isEdit = useMemo(() => typeof form.id === 'number', [form.id]);

  const onNew = () => { setForm(empty); setOpen(true); };

  const onEdit = (r: UsuarioDireccionTipo) => {
    setForm({
      id: r.id,
      titulo: r.titulo ?? '',
      descripcion: r.descripcion ?? '',
      estado: r.estado ?? 1,
    });
    setOpen(true);
  };

  const onDelete = async (id: number) => {
    if (!confirm('¿Eliminar este tipo de dirección?')) return;
    await remove(id);
  };

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const payload = {
      titulo: form.titulo.trim(),
      descripcion: form.descripcion.trim(),
      estado: Number(form.estado),
    };
    if (isEdit && form.id != null) {
      await update(form.id, payload);
    } else {
      await create(payload);
    }
    setOpen(false);
  };

  return {
    rows, loading, err,
    open, setOpen, form, setForm, isEdit,
    onNew, onEdit, onDelete, onSubmit,
  };
}
