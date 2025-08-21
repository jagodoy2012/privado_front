import { useEffect, useState } from 'react';
import { apiRequest } from '../../../lib/api';
import type { UsuarioDireccionTipo } from '../interfaces/UsuarioDireccionTipo';

const BASE = '/api/usuario_direccion_tipo'; // ← AJUSTA según tu API

export function useUsuarioDireccionTipo() {
  const [rows, setRows] = useState<UsuarioDireccionTipo[]>([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);

  async function load() {
    try {
      setErr(null);
      setLoading(true);
      const token = localStorage.getItem('token') || sessionStorage.getItem('token');
      const data = await apiRequest<UsuarioDireccionTipo[]>(BASE, {
        method: 'GET',
        headers: token ? { Authorization: `Bearer ${token}` } : undefined,
      });
      setRows(data);
    } catch (e: any) {
      setErr(e.message || 'Error al cargar tipos de dirección');
      setRows([]);
    } finally {
      setLoading(false);
    }
  }

  async function create(body: { titulo: string; descripcion?: string; estado: number }) {
    const token = localStorage.getItem('token') || sessionStorage.getItem('token');
    const created = await apiRequest<UsuarioDireccionTipo>(BASE, {
      method: 'POST',
      data: body,
      headers: token ? { Authorization: `Bearer ${token}` } : undefined,
    });
    // optimista:
    setRows(prev => [created, ...prev]);
  }

  async function update(
    id: number,
    body: { titulo: string; descripcion?: string; estado: number }
  ) {
    const token = localStorage.getItem('token') || sessionStorage.getItem('token');
    const updated = await apiRequest<UsuarioDireccionTipo>(`${BASE}/${id}`, {
      method: 'PUT',
      data: { id, ...body }, // quita 'id' si tu backend no lo exige en body
      headers: token ? { Authorization: `Bearer ${token}` } : undefined,
    });
    setRows(prev => prev.map(r => (r.id === updated.id ? updated : r)));
    load();
  }

  async function remove(id: number) {
    const token = localStorage.getItem('token') || sessionStorage.getItem('token');
    await apiRequest<void>(`${BASE}/${id}`, {
      method: 'DELETE',
      headers: token ? { Authorization: `Bearer ${token}` } : undefined,
    });
    setRows(prev => prev.filter(r => r.id !== id));
  }

  useEffect(() => { load(); }, []);

  return { rows, loading, err, load, create, update, remove };
}
