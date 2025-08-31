// src/User/productoBancarioTipos/hooks/useProductoBancarioTipoUI.ts
import { useMemo, useState } from 'react';
import { useProductoBancarioTipo } from './useProductoBancarioTipo';
import type { ProductoBancarioTipo, ProductoBancarioTipoSave } from '../interfaces/ProductoBancarioTipo';

export type PBTForm = {
  id?: number;
  titulo: string;
  descripcion?: string;
  tabla?: string;
  estado: number; // 0 | 1
};

const empty: PBTForm = { titulo: '', descripcion: '', tabla: '', estado: 1 };

export function useProductoBancarioTipoUI() {
  const api = useProductoBancarioTipo();
  const { load } = api; // para refrescar

  const [open, setOpen] = useState(false);
  const [form, setForm] = useState<PBTForm>(empty);
  const isEdit = useMemo(() => typeof form.id === 'number', [form.id]);

  function onNew() {
    setForm(empty);
    setOpen(true);
  }

  function onEdit(row: ProductoBancarioTipo) {
    setForm({
      id: row.id,
      titulo: row.titulo ?? '',
      descripcion: row.descripcion ?? '',
      tabla: row.tabla ?? '',
      estado: (row.estado ?? 1) as number,
    });
    setOpen(true);
  }

  async function onDelete(id: number) {
    if (!confirm('¿Eliminar este tipo de producto bancario?')) return;
    await api.remove(id);
    await load({ search: '', page: 1, pageSize: 1000, estado: '' });
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();

    const body: ProductoBancarioTipoSave = {
      titulo: form.titulo.trim(),
      descripcion: form.descripcion?.trim() || '',
      tabla: form.tabla?.trim() || '',
      estado: Number(form.estado) as 0 | 1,
    };

    if (isEdit && form.id != null) {
      await api.update(form.id, body);
    } else {
      await api.create(body);
    }

    await load({ search: '', page: 1, pageSize: 1000, estado: '' }); // refresco
    setOpen(false);
  }

  return {
    ...api,
    open, setOpen,
    form, setForm,
    isEdit,
    onNew, onEdit, onDelete, onSubmit,
  };
}