// src/User/monedaTipoCambioApi/hooks/useMonedaTipoCambioApiUI.ts
import { useEffect, useMemo, useState } from 'react';
import { useMonedaTipoCambioApi } from './useMonedaTipoCambioApi';
import type { MonedaTipoCambioApi, MonedaTipoCambioApiSave, MonedaTipo } from '../interfaces/MonedaTipoCambioApi';
import { api } from '../../../lib/api';

export type Form = {
  id?: number;
  id_moneda_tipo: number | ''; // '' cuando no está seleccionado
  url: string;
  estado: number;              // 0|1
};

const empty: Form = { id_moneda_tipo: '', url: '', estado: 1 };

export function useMonedaTipoCambioApiUI() {
  const apiCrud = useMonedaTipoCambioApi();
  const { rows } = apiCrud;

  const [open, setOpen] = useState(false);
  const [form, setForm] = useState<Form>(empty);
  const isEdit = useMemo(() => typeof form.id === 'number', [form.id]);

  // Monedas para combo y títulos
  const [monedas, setMonedas] = useState<MonedaTipo[]>([]);
  const monedasIndex = useMemo(() => new Map(monedas.map(m => [m.id, m.titulo])), [monedas]);

  useEffect(() => {
    // Reutiliza tu endpoint de MONEDA_TIPO (el que ya usaste para otras pantallas)
    // Ajusta la URL si tu backend es distinto
    api.get<MonedaTipo[]>('/api/monedatipos', { headers: { Accept: 'application/json, text/plain, */*' } })
      .then(r => setMonedas(r.data ?? []))
      .catch(() => setMonedas([]));
  }, []);

  function onNew() {
    setForm(empty);
    setOpen(true);
  }

  function onEdit(r: MonedaTipoCambioApi) {
    setForm({
      id: r.id,
      id_moneda_tipo: r.id_moneda_tipo,
      url: r.url,
      estado: r.estado,
    });
    setOpen(true);
  }

  async function onDelete(id: number) {
    if (!confirm('¿Eliminar API?')) return;
    await apiCrud.remove(id);
    // refresco suave
    await apiCrud.load({});
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (form.id_moneda_tipo === '') return;

    const body: MonedaTipoCambioApiSave = {
      id_moneda_tipo: Number(form.id_moneda_tipo),
      url: form.url.trim(),
      estado: Number(form.estado) as 0 | 1,
    };

    if (isEdit && form.id != null) {
      await apiCrud.update(form.id, body);
    } else {
      await apiCrud.create(body);
    }
    setOpen(false);
    await apiCrud.load({});
  }

  return {
    ...apiCrud,
    open, setOpen,
    form, setForm,
    isEdit,
    onNew, onEdit, onDelete, onSubmit,
    monedas, monedasIndex,
  };
}