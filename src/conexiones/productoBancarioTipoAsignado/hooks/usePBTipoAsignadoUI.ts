// src/mantenimientos/pb_tipo_asignado/hooks/usePBTipoAsignadoUI.ts
import { useEffect, useMemo, useState } from 'react';
import { usePBTipoAsignado } from './usePBTipoAsignado';
import type { PBTipoAsignado, PBTipoAsignadoSave } from '../interfaces/PBTipoAsignado';

export type Form = {
  id?: number;
  idProductoBancario: number | '';
  idProductoBancarioTipo: number | '';
  id_categoria: number | '';
  estado: 0 | 1;
};

const empty: Form = {
  idProductoBancario: '',
  idProductoBancarioTipo: '',
  id_categoria: '',
  estado: 1,
};

export function usePBTipoAsignadoUI() {
  const api = usePBTipoAsignado();
  const { rows } = api;

  const [open, setOpen] = useState(false);
  const [form, setForm] = useState<Form>(empty);
  const isEdit = useMemo(() => typeof form.id === 'number', [form.id]);

  useEffect(() => { api.loadCatalogs(); }, [api.loadCatalogs]);

  function onNew() {
    setForm(empty);
    setOpen(true);
  }

  function onEdit(r: PBTipoAsignado) {
    setForm({
      id: r.id,
      idProductoBancario: r.idProductoBancario,
      idProductoBancarioTipo: r.idProductoBancarioTipo,
      id_categoria: r.id_categoria,
      estado: r.estado,
    });
    setOpen(true);
  }

  async function onDelete(id: number) {
    if (!confirm('¿Eliminar asignación?')) return;
    await api.remove(id); // se recarga solo
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (form.idProductoBancario === '' || form.idProductoBancarioTipo === '' || form.id_categoria === '') {
      alert('Selecciona Producto, Tipo y Categoría.');
      return;
    }

    const body: PBTipoAsignadoSave = {
      idProductoBancario: Number(form.idProductoBancario),
      idProductoBancarioTipo: Number(form.idProductoBancarioTipo),
      id_categoria: Number(form.id_categoria),
      estado: Number(form.estado) as 0 | 1,
    };

    try {
      if (isEdit && form.id != null) {
        await api.update(form.id, body); // se recarga solo
      } else {
        await api.create(body);          // se recarga solo
      }
      setOpen(false);
    } catch (err: any) {
      alert(err?.message || 'No se pudo guardar');
    }
  }

  return {
    ...api,
    rows,
    open, setOpen,
    form, setForm,
    isEdit,
    onNew, onEdit, onDelete, onSubmit,
  };
}