import { useCallback, useMemo, useState } from 'react';
import { useMenu } from './useMenu';
import type { MenuItem, MenuSave } from '../interfaces/menu';

const emptyForm: MenuSave = {
  parent_id: null,
  label: '',
  path: '',
  sort_order: 10,
  is_active: true,
};

export function useMenuUI() {
  const { rows, total, loading, err, load, reload, create, update, remove } = useMenu();

  const [open, setOpen] = useState(false);
  const [isEdit, setIsEdit] = useState(false);
  const [form, setForm] = useState<MenuSave>(emptyForm);

  // índice para mostrar nombre del padre
  const byId = useMemo(
    () => new Map<number, MenuItem>(rows.map(r => [r.id, r] as const)),
    [rows]
  );

  const onNew = useCallback(() => {
    setIsEdit(false);
    setForm(emptyForm);
    setOpen(true);
  }, []);

  const onEdit = useCallback((r: MenuItem) => {
    setIsEdit(true);
    setForm({
      id: r.id,
      parent_id: r.parent_id,
      label: r.label,
      path: r.path,
      sort_order: r.sort_order,
      is_active: r.is_active,
    });
    setOpen(true);
  }, []);

  const onDelete = useCallback(async (id: number) => {
    await remove(id);
    await reload();
  }, [remove, reload]);

  const save = useCallback(async (data: MenuSave) => {
    if (data.id) await update(data.id, data);
    else await create(data);
  }, [create, update]);

  const onSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    await save(form);
    await reload();
    setOpen(false);
  }, [form, save, reload]);

  return {
    // data
    rows, total, loading, err, load,

    // modal/form
    open, setOpen, isEdit, form, setForm,
    onNew, onEdit, onDelete, onSubmit,

    // indices
    byId,
  };
}