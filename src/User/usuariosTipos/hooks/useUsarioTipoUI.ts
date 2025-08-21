// hooks/useUsuarioTipoUI.ts
import { useMemo, useState } from 'react';
import { useUsuarioTipo } from './useUsuarioTipo';

type FormState = { id?: number; titulo: string; descripcion: string; estado: number };
const empty: FormState = { titulo: '', descripcion: '', estado: 1 };

export function useUsuarioTipoUI() {
  const { rows, loading, err, create, update, remove } = useUsuarioTipo();

  const [open, setOpen] = useState(false);
  const [form, setForm] = useState<FormState>(empty);
  const isEdit = useMemo(() => typeof form.id === 'number', [form.id]);

  const onNew = () => { setForm(empty); setOpen(true); };
  const onEdit = (r: { id:number; titulo:string|null; descripcion:string|null; estado:number|null }) => {
    setForm({
      id: r.id,
      titulo: r.titulo ?? '',
      descripcion: r.descripcion ?? '',
      estado: r.estado === 1 ? 1 : 0,
    });
    setOpen(true);
  };
  const onDelete = async (id: number) => {
    if (confirm('¿Eliminar este tipo?')) await remove(id);
  };
  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.titulo.trim()) return alert('Título requerido');

    if (isEdit && form.id != null) {
      await update(form.id, {
        titulo: form.titulo.trim(),
        descripcion: form.descripcion.trim(),
        estado: form.estado,
      });
    } else {
      await create({
        titulo: form.titulo.trim(),
        descripcion: form.descripcion.trim(),
        estado: form.estado,
      });
    }
    setOpen(false);
  };

  return {
    // datos
    rows, loading, err,
    // ui/form
    open, setOpen, form, setForm, isEdit,
    // acciones
    onNew, onEdit, onDelete, onSubmit,
  };
}
