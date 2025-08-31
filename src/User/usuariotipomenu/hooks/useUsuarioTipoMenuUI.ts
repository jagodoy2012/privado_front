import { useCallback, useEffect, useMemo, useState } from 'react';
import { useUsuarioTipoMenu } from './useUsuarioTipoMenu';
import type { UsuarioTipoMenu, UsuarioTipoMenuSave } from '../interfaces/usuarioTipoMenu';

const emptyForm: UsuarioTipoMenuSave = {
  id_usuario_tipo: 0,
  id_menu: 0,
  can_view: true,
  include_ancestors: true,
  include_descendants: true,
  estado: 1,
  fecha: null,
  id_usuario: null,
};

export function useUsuarioTipoMenuUI() {
  const base = useUsuarioTipoMenu();
  const {
    rows, total, loading, err, load, reload, create, update, remove,
    usuarioTipos, menus, loadCatalogs,
  } = base;

  useEffect(() => { loadCatalogs(); }, [loadCatalogs]);

  const [open, setOpen] = useState(false);
  const [isEdit, setIsEdit] = useState(false);
  const [form, setForm] = useState<UsuarioTipoMenuSave>(emptyForm);

  const ustIndex = useMemo(() => new Map(usuarioTipos.map(u => [u.id, u] as const)), [usuarioTipos]);
  const menIndex = useMemo(() => new Map(menus.map(m => [m.id, m] as const)), [menus]);

  const onNew = useCallback(() => {
    setIsEdit(false);
    setForm(emptyForm);
    setOpen(true);
  }, []);

  const onEdit = useCallback((r: UsuarioTipoMenu) => {
    setIsEdit(true);
    setForm({
      id: r.id,
      id_usuario_tipo: r.id_usuario_tipo,
      id_menu: r.id_menu,
      can_view: r.can_view,
      include_ancestors: r.include_ancestors,
      include_descendants: r.include_descendants,
      estado: r.estado,
      fecha: r.fecha ?? '',
      id_usuario: r.id_usuario ?? null,
    });
    setOpen(true);
  }, []);

  const onDelete = useCallback(async (id: number) => {
    await remove(id);
    await reload();
  }, [remove, reload]);

  const save = useCallback(async (data: UsuarioTipoMenuSave) => {
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

    // modal
    open, setOpen, isEdit, form, setForm,
    onNew, onEdit, onDelete, onSubmit,

    // catálogos + índices
    usuarioTipos, menus, ustIndex, menIndex,
  };
}