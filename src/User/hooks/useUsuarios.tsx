import { useEffect, useState } from 'react';
import { apiRequest } from '../../lib/api';
import { type Usuario } from "../interfaces/Usuario";

export function useUsuarios() {
  const [rows, setRows] = useState<Usuario[]>([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      try {
        setErr(null);
        setLoading(true);
        const data = await apiRequest<Usuario[]>('/api/usuarios', { method: 'GET' });
        setRows(data);
      } catch (e: any) {
        setErr(e.message || 'Error al cargar usuarios');
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  return { rows, loading, err };
}
