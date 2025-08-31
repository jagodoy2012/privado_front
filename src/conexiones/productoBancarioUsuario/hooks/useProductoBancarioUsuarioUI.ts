// src/User/pbUsuario/hooks/useProductoBancarioUsuarioUI.ts
import { useCallback, useMemo, useState } from 'react';
import type { AsignacionIndices, AsignadoLite, Mini } from '../helpers/asignaciones';
import { useProductoBancarioUsuario } from './useProductoBancarioUsuario';

/* ========= Tipos mínimos que usa la UI ========= */
export type Estado = 0 | 1;

export type PBUsuarioRow = {
  id: number;
  id_usuario_producto: number;
  id_producto_bancario_asignado: number;
  id_moneda_tipo: number;
  monto: number;
  disponible: number;
  fecha_ultimo_corte?: string | null | undefined;
  estado: Estado;
};

export type PBUsuarioSave = Omit<PBUsuarioRow, 'id'> & { id?: number };

export type UsuarioLite = { id: number; nombres: string; apellidos: string };
export type MonedaLite  = { id: number; simbolo: string; titulo?: string };

/* ========= Form vacío ========= */
const emptyForm: PBUsuarioSave = {
  id_usuario_producto: 0,
  id_producto_bancario_asignado: 0,
  id_moneda_tipo: 0,
  monto: 0,
  disponible: 0,
  fecha_ultimo_corte: '',
  estado: 1,
};

/* ========= Hook UI ========= */
export function useProductoBancarioUsuarioUI() {
  const base = useProductoBancarioUsuario();

  const {
    rows,
    total,
    loading,
    err,
    load,
    create,
    update,
    remove,
    loadCatalogs: baseLoadCatalogs,
  } = base as typeof base & { loadCatalogs?: () => Promise<void> };

  const loadCatalogs = baseLoadCatalogs ?? (async () => {});

  // Catálogos (con defaults)
  const usuarios  = (base as any).usuarios  ?? ([] as UsuarioLite[]);
  const monedas   = (base as any).monedas   ?? ([] as MonedaLite[]);
  const asignados = (base as any).asignados ?? ([] as AsignadoLite[]);
  const productosBancarios    = (base as any).pbs    ?? ([] as Mini[]);
  const productoBancarioTipos = (base as any).pbts   ?? ([] as Mini[]);
  const categorias            = (base as any).cats   ?? ([] as Mini[]);

  // Unificar create/update
  const save = useCallback(
    async (data: PBUsuarioSave) => (data.id ? update(data.id, data) : create(data)),
    [create, update]
  );

  // Modal + form
  const [open, setOpen] = useState(false);
  const [isEdit, setIsEdit] = useState(false);
  const [form, setForm] = useState<PBUsuarioSave>(emptyForm);

  // Índices útiles
  const usuariosIndex = useMemo(
    () => new Map<number, UsuarioLite>(usuarios.map((u: { id: any }) => [u.id, u] as const)),
    [usuarios]
  );
  const monedasIndex = useMemo(
    () => new Map<number, MonedaLite>(monedas.map((m: { id: any }) => [m.id, m] as const)),
    [monedas]
  );

  // Índices para etiqueta “Producto — Tipo / Categoría”
  const asignacionIdx: AsignacionIndices = useMemo(() => {
    const asignadosById = new Map<number, AsignadoLite>(
      asignados.map((a: { id: any; id_producto_bancario: any; id_producto_bancario_tipo: any; id_categoria: any }) => {
        const lite: AsignadoLite = {
          id: a.id,
          id_producto_bancario: a.id_producto_bancario,
          id_producto_bancario_tipo: a.id_producto_bancario_tipo,
          id_categoria: a.id_categoria,
        };
        return [a.id, lite] as const;
      })
    );

    const pbById  = new Map<number, Mini>(
      productosBancarios.map((pb: { id: any; titulo: any }) => [pb.id, { id: pb.id, titulo: pb.titulo ?? '' }] as const)
    );
    const pbtById = new Map<number, Mini>(
      productoBancarioTipos.map((t: { id: any; titulo: any }) => [t.id, { id: t.id, titulo: t.titulo ?? '' }] as const)
    );
    const catById = new Map<number, Mini>(
      categorias.map((c: { id: any; titulo: any }) => [c.id, { id: c.id, titulo: c.titulo ?? '' }] as const)
    );

    return { asignadosById, pbById, pbtById, catById };
  }, [asignados, productosBancarios, productoBancarioTipos, categorias]);

  /* ====== Acciones UI ====== */
  const onNew = useCallback(() => {
    setIsEdit(false);
    setForm(emptyForm);
    setOpen(true);
  }, []);

  const onEdit = useCallback((r: PBUsuarioRow) => {
    setIsEdit(true);
    setForm({
      id: r.id,
      id_usuario_producto: r.id_usuario_producto,
      id_producto_bancario_asignado: r.id_producto_bancario_asignado,
      id_moneda_tipo: r.id_moneda_tipo,
      monto: r.monto,
      disponible: r.disponible,
      fecha_ultimo_corte: r.fecha_ultimo_corte ?? '',
      estado: r.estado,
    });
    setOpen(true);
  }, []);

  const onDelete = useCallback(async (id: number) => {
    await remove(id);
    await load({});
  }, [remove, load]);

  const onSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    await save(form);
    await load({});
    setOpen(false);
  }, [form, save, load]);

  return {
    // data
    rows, total, loading, err, load,

    // modal/form
    open, setOpen, form, setForm, isEdit,
    onNew, onEdit, onDelete, onSubmit,

    // catálogos + índices
    usuarios, monedas, asignados,
    usuariosIndex, monedasIndex, asignacionIdx,

    // carga de catálogos
    loadCatalogs,
  };
}