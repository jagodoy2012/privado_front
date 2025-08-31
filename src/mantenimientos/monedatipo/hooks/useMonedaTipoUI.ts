// src/User/monedaTipos/hooks/useMonedaTipoUI.ts
import { useEffect, useMemo, useState } from 'react';
import { useMonedaTipo } from './useMonedaTipo';
import type { MonedaTipo, MonedaTipoSave } from '../interfaces/MonedaTipo';

export type MTForm = {
  id?: number;
  titulo: string;
  descripcion?: string;
  simbolo: string;
  estado: number;
};

const empty: MTForm = { titulo: '', descripcion: '', simbolo: '', estado: 1 };

export function useMonedaTipoUI() {
  const api = useMonedaTipo();
  const { rows } = api;

  const [open, setOpen] = useState(false);
  const [form, setForm] = useState<MTForm>(empty);
  const isEdit = useMemo(() => typeof form.id === 'number', [form.id]);

  // 👉 CARGA INICIAL
  useEffect(() => {
    api.load({ search: '', page: 1, pageSize: 50, estado: '' });
  }, []); // eslint-disable-line

  function onNew() {
    setForm(empty);
    setOpen(true);
  }

  function onEdit(mt: MonedaTipo) {
    setForm({
      id: mt.id,
      titulo: mt.titulo ?? '',
      descripcion: mt.descripcion ?? '',
      simbolo: mt.simbolo ?? '',
      estado: mt.estado ?? 1,
    });
    setOpen(true);
  }

  async function onDelete(id: number) {
    if (!confirm('¿Eliminar este tipo de moneda?')) return;
    await api.remove(id);
    await api.reload(); // 👉 recarga lista
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    const body: MonedaTipoSave = {
      titulo: form.titulo.trim(),
      descripcion: form.descripcion?.trim() || '',
      simbolo: form.simbolo.trim(),
      estado: Number(form.estado) as 0 | 1,
    };
    if (isEdit && form.id != null) {
      await api.update(form.id, body);
    } else {
      await api.create(body);
    }
    setOpen(false);
    await api.reload(); // 👉 recarga lista
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