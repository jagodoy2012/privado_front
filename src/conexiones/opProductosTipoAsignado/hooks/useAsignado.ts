import { useCallback, useMemo, useState } from 'react';
import { api } from '../../../lib/api';
import type {
  Asignado, AsignadoSave, Estado,
  Operacion, ProductoBancario
} from '../interfaces/Asignado';

// ⬇️ Ajusta el casing exacto de tus endpoints si usan MAYÚSCULAS
const BASE_URL = '/api/OPERACIONES_PRODUCTO_BANCARIO_TIPO_ASIGNADO';
const OPS_URL  = '/api/operaciones';
const PB_URL   = '/api/productobancarios';

export function useAsignado() {
  const [rows, setRows] = useState<Asignado[]>([]);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const [ops, setOps] = useState<Operacion[]>([]);
  const [pbs, setPbs] = useState<ProductoBancario[]>([]);

  const load = useCallback(async () => {
    setLoading(true);
    setErr(null);
    try {
      const [r1, rOps, rPbs] = await Promise.all([
        api.get<Asignado[]>(BASE_URL, { headers: { Accept: 'application/json, text/plain, */*' } }),
        api.get<Operacion[]>(OPS_URL, { headers: { Accept: 'application/json, text/plain, */*' } }),
        api.get<ProductoBancario[]>(PB_URL, { headers: { Accept: 'application/json, text/plain, */*' } }),
      ]);
      setRows(r1.data ?? []);
      setOps(rOps.data ?? []);
      setPbs(rPbs.data ?? []);
    } catch (e: any) {
      setErr(e?.message || 'No se recibió respuesta del servidor');
      setRows([]);
    } finally {
      setLoading(false);
    }
  }, []);

  const create = useCallback(async (data: AsignadoSave) => {
    await api.post(BASE_URL, data, { headers: { Accept: 'application/json, text/plain, */*' } });
    await load();
  }, [load]);

  const update = useCallback(async (id: number, data: AsignadoSave) => {
    await api.put(`${BASE_URL}/${id}`, { id, ...data }, { headers: { Accept: 'application/json, text/plain, */*' } });
    await load();
  }, [load]);

  const remove = useCallback(async (id: number) => {
    await api.delete(`${BASE_URL}/${id}`, { headers: { Accept: 'application/json, text/plain, */*' } });
    await load();
  }, [load]);

  const opsIndex = useMemo(() => new Map(ops.map(o => [o.id, o.titulo])), [ops]);
  const pbsIndex = useMemo(() => new Map(pbs.map(p => [p.id, p.titulo])), [pbs]);

  return { rows, loading, err, load, create, update, remove, ops, pbs, opsIndex, pbsIndex };
}