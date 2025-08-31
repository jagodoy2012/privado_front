import { useEffect, useMemo, useState, useCallback } from 'react';
import { useRemesas } from './useRemesas';
import type { Remesa, RemesaSave, MonedaTipo, Estado } from '../interfaces/Remesa';
import { generarCodigoUnicoNoRepetido } from '../helpers/Codigos'; // tu helper

// Form para el modal
type Form = {
  id?: number;
  fecha_envio?: string | null;
  nombre_remitente: string;
  nombre_receptor: string;
  id_moneda_tipo: number | '';   // <- puede estar vacío en el select
  monto: number;
  no_pago: string;
  estado: Estado;
};

const empty: Form = {
  fecha_envio: '',
  nombre_remitente: '',
  nombre_receptor: '',
  id_moneda_tipo: '',
  monto: 0,
  no_pago: '',
  estado: 1,
};

export function useRemesaUI() {
  const api = useRemesas();
  const { rows, load, create, update, remove, loadMonedas } = api;

  const [open, setOpen] = useState(false);
  const [form, setForm] = useState<Form>(empty);
  const isEdit = useMemo(() => typeof form.id === 'number', [form.id]);

  const [monedas, setMonedas] = useState<MonedaTipo[]>([]);
  const [monedasIndex, setMonedasIndex] = useState<Map<number, string>>(new Map());

  // catálogo de monedas
  const loadCat = useCallback(async () => {
    const { monedas, monedasIndex } = await loadMonedas();
    setMonedas(monedas);
    setMonedasIndex(monedasIndex);
  }, [loadMonedas]);

  useEffect(() => { loadCat(); }, [loadCat]);

  function onNew() {
    const cod = generarCodigoUnicoNoRepetido(rows.map(r => r.no_pago));
    setForm({ ...empty, no_pago: cod });
    setOpen(true);
  }

  function onEdit(r: Remesa) {
    setForm({
      id: r.id,
      fecha_envio: r.fecha_envio ?? '',
      nombre_remitente: r.nombre_remitente,
      nombre_receptor: r.nombre_receptor,
      id_moneda_tipo: r.id_moneda_tipo, // number
      monto: r.monto,
      no_pago: r.no_pago,
      estado: r.estado,
    });
    setOpen(true);
  }

  async function onDelete(id: number) {
    if (!confirm('¿Eliminar esta remesa?')) return;
    await remove(id);
    await load({});
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    const payload: RemesaSave = {
      fecha_envio: form.fecha_envio || null,
      nombre_remitente: form.nombre_remitente.trim(),
      nombre_receptor: form.nombre_receptor.trim(),
      id_moneda_tipo: Number(form.id_moneda_tipo),  // convertir
      monto: Number(form.monto),
      no_pago: form.no_pago,
      estado: Number(form.estado) as Estado,
    };

    if (isEdit && form.id != null) {
      await update(form.id, payload);
    } else {
      await create(payload);
    }
    await load({});
    setOpen(false);
  }

  return {
    // data
    rows, loading: api.loading, err: api.err,
    monedas, monedasIndex,

    // form/ui
    open, setOpen, form, setForm, isEdit,

    // ops
    onNew, onEdit, onDelete, onSubmit, load,
  };
}