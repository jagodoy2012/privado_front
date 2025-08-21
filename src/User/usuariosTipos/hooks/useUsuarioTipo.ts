import { useEffect, useState } from 'react';
import { apiRequest } from '../../../lib/api';
import type { UsuarioTipo } from '../interfaces/UsuarioTipo';

// Ajusta el path EXACTO según tu Swagger:
// Ej: '/api/usuario-tipo' o '/api/usuarios-tipo' o '/api/UsuarioTipo'
const BASE = '/api/usuario_tipo';



export function useUsuarioTipo() {
  const [rows, setRows] = useState<UsuarioTipo[]>([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);

  async function load() {
    try {
      setErr(null);
      setLoading(true);

      // ✅ usa apiRequest (tu instancia + interceptor)
      //    y además FORZAMOS el header por si el interceptor no corriera.
      const token = localStorage.getItem('token') || sessionStorage.getItem('token');
      const data = await apiRequest<UsuarioTipo[]>(BASE, {
        method: 'GET',
        headers: token ? { Authorization: `Bearer ${token}` } : undefined,
      });

      setRows(data);
    } catch (e: any) {
      setErr(e.message || 'Error al cargar tipos de usuario');
      setRows([]);
    } finally {
      setLoading(false);
    }
  }

  async function create(body: { titulo: string; descripcion?: string; estado: number }) {
    const token = localStorage.getItem('token') || sessionStorage.getItem('token');
    const created = await apiRequest<UsuarioTipo>(BASE, {
      method: 'POST',
      data: body,
      headers: token ? { Authorization: `Bearer ${token}` } : undefined,
    });
    setRows(prev => [created, ...prev]);
  }

async function update(
  id: number,
  body: { titulo: string; descripcion?: string; estado: number }
) {
  const token =
    localStorage.getItem('token') || sessionStorage.getItem('token');

  const updated = await apiRequest<UsuarioTipo>(`${BASE}/${id}`, {
    method: 'PUT',
    data: {
      id,              // 👈 obligatorio en body
      ...body,
      fecha: new Date().toISOString(), // 👈 si tu API requiere fecha
      id_usuario: 0,   // 👈 revisa si el backend lo pide (puede ser el usuario logueado)
    },
    headers: token ? { Authorization: `Bearer ${token}` } : undefined,
  });

  setRows(prev => prev.map(r => (r.id === updated.id ? updated : r)));
    await load(); // 👈 vuelve a pedir la lista (asegúrate de exportar load() desde el hook)

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
