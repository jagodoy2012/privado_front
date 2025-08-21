import { useEffect, useState } from 'react';
import { apiRequest } from '../../../lib/api';
import type { CuentaTipo } from '../interfaces/CuentaTipo';

const BASE = '/api/cuentatipos';

export function useCuentaTipo() {
  const [rows, setRows] = useState<CuentaTipo[]>([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);

  async function load() {
    try {
      setErr(null);
      setLoading(true);

      const token = localStorage.getItem('token') || sessionStorage.getItem('token');
      const data = await apiRequest<CuentaTipo[]>(BASE, {
        method: 'GET',
        headers: token ? { Authorization: `Bearer ${token}` } : undefined,
      });

      setRows(data);
    } catch (e: any) {
      setErr(e.message || 'Error al cargar tipos de cuenta');
      setRows([]);
    } finally {
      setLoading(false);
    }
  }

  async function create(body: { titulo: string; descripcion?: string; estado: number }) {
    const token = localStorage.getItem('token') || sessionStorage.getItem('token');
    const created = await apiRequest<CuentaTipo>(BASE, {
      method: 'POST',
      data: {
        ...body,
        fecha: new Date().toISOString(),
        id_usuario: 0, // ajusta si tu backend lo requiere
      },
      headers: token ? { Authorization: `Bearer ${token}` } : undefined,
    });
    setRows(prev => [created, ...prev]);
  }

  async function update(id: number, body: { titulo: string; descripcion?: string; estado: number }) {
    const token = localStorage.getItem('token') || sessionStorage.getItem('token');
    const updated = await apiRequest<CuentaTipo>(`${BASE}/${id}`, {
      method: 'PUT',
      data: {
        id,
        ...body,
        fecha: new Date().toISOString(),
        id_usuario: 0, // ajusta si tu backend lo requiere
      },
      headers: token ? { Authorization: `Bearer ${token}` } : undefined,
    });
    setRows(prev => prev.map(r => (r.id === updated.id ? updated : r)));
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
