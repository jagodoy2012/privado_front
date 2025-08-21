// User/hooks/useUsuariosUI.ts
import { useEffect, useMemo, useState } from 'react';
import { apiRequest } from '../../lib/api';
import type { Usuario } from '../interfaces/Usuario';

type UsuarioTipo = { id:number; titulo:string };

const BASE = '/api/usuarios';
const BASE_TIPOS = '/api/usuario_tipo';

export type UsuarioForm = {
  id?: number;
  nombres: string;
  apellidos: string;
  telefono: string;
  fecha_nacimiento: string;     // yyyy-MM-dd
  correo: string;
  id_usuario_tipo: number;
  estado: number;               // 0/1
};

const empty: UsuarioForm = {
  nombres:'', apellidos:'', telefono:'',
  fecha_nacimiento:'', correo:'',
  id_usuario_tipo: 0, estado: 1,
};

export function useUsuariosUI() {
  const [rows, setRows] = useState<Usuario[]>([]);
  const [tipos, setTipos] = useState<UsuarioTipo[]>([]);     // 👈 cat. tipos
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string|null>(null);

  const [open, setOpen] = useState(false);                   // 👈 modal visible
  const [form, setForm] = useState<UsuarioForm>(empty);
  const isEdit = useMemo(() => typeof form.id === 'number', [form.id]);

  async function load() {
    try {
      setErr(null); setLoading(true);
      const data = await apiRequest<Usuario[]>(BASE, { method:'GET' });
      setRows(data);
    } catch (e:any) {
      setErr(e.message || 'Error al cargar usuarios');
    } finally {
      setLoading(false);
    }
  }

  async function loadTipos() {
    try {
      const data = await apiRequest<UsuarioTipo[]>(BASE_TIPOS, { method:'GET' });
      setTipos(data);
    } catch {
      setTipos([]);
    }
  }

  useEffect(() => { load(); loadTipos(); }, []);

  const onNew = () => { setForm(empty); setOpen(true); };

  const onEdit = (u: Usuario) => {
    const d = u.fecha_nacimiento ? new Date(u.fecha_nacimiento) : null;
    const yyyy = d ? d.getFullYear() : '';
    const mm   = d ? String(d.getMonth()+1).padStart(2,'0') : '';
    const dd   = d ? String(d.getDate()).padStart(2,'0') : '';
    setForm({
      id: u.id,
      nombres: u.nombres ?? '',
      apellidos: u.apellidos ?? '',
      telefono: u.telefono ?? '',
      fecha_nacimiento: d ? `${yyyy}-${mm}-${dd}` : '',
      correo: u.correo ?? '',
      id_usuario_tipo: u.id_usuario_tipo ?? 0,
      estado: u.estado ?? 1,
    });
    setOpen(true);
  };

  const onDelete = async (id:number) => {
    if (!confirm('¿Eliminar este usuario?')) return;
    await apiRequest<void>(`${BASE}/${id}`, { method:'DELETE' });
    await load();
  };

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const body = {
      nombres: form.nombres.trim(),
      apellidos: form.apellidos.trim(),
      telefono: form.telefono.trim(),
      fecha_nacimiento: form.fecha_nacimiento
        ? new Date(form.fecha_nacimiento).toISOString()
        : null,
      correo: form.correo.trim(),
      id_usuario_tipo: Number(form.id_usuario_tipo),
      estado: Number(form.estado),
    };
    if (isEdit && form.id != null) {
      await apiRequest<void>(`${BASE}/${form.id}`, { method:'PUT', data:{ id:form.id, ...body } });
    } else {
      await apiRequest<void>(BASE, { method:'POST', data: body });
    }
    setOpen(false);
    await load();
  };

  return {
    rows, tipos, loading, err,
    open, setOpen, form, setForm, isEdit,
    onNew, onEdit, onDelete, onSubmit,
  };
}
