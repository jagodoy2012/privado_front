// src/User/inventarios/pages/InventariosPage.tsx
import React, { useEffect, useMemo, useState } from 'react';
import Modal from '../../globals/component/modal/Modal';
import { api } from '../../lib/api';

// ===== Tipos =====
export type Inventario = {
  id: number;
  id_producto: number;
  cantidad: number;
  id_tienda: number;
  estado?: number;
  fecha_actualiza?: string;
  id_usuario_actualiza?: number;
};

export type Producto = { id: number; titulo: string; precio?: number };
export type Tienda   = { id: number; titulo: string };

// ===== Utils =====
const nowIso = () => new Date().toISOString();
const getUserId = () => Number(localStorage.getItem('id_usuario') ?? '0');

function ensureJson<T = any>(data: any): T {
  if (typeof data === 'string') {
    try { return JSON.parse(data) as T; } catch { throw new Error(data.slice(0, 200)); }
  }
  return data as T;
}

// ===== API =====
const backend = {
  async getInventarios(): Promise<Inventario[]> {
    const tryUrls = ['/api/INVENTARIOS', '/api/INVENTARIOs', '/api/INVENTARIO'];
    for (const url of tryUrls) {
      try {
        const resp = await api.get(url, { headers: { Accept: 'application/json, text/plain' } });
        return ensureJson<Inventario[]>(resp.data) ?? [];
      } catch {/* intenta siguiente */}
    }
    return [];
  },

  async getProductos(): Promise<Producto[]> {
    const resp = await api.get('/api/PRODUCTO', { headers: { Accept: 'application/json, text/plain' } });
    return ensureJson<Producto[]>(resp.data) ?? [];
  },

  async getProductoById(id: number): Promise<Producto> {
    const resp = await api.get(`/api/PRODUCTO/${id}`, { headers: { Accept: 'application/json, text/plain' } });
    return ensureJson<Producto>(resp.data);
  },

  async getTiendas(): Promise<Tienda[]> {
    const resp = await api.get('/api/TIENDAS', { headers: { Accept: 'application/json, text/plain' } });
    return ensureJson<Tienda[]>(resp.data) ?? [];
  },

  async createInventario(data: { id_producto: number; id_tienda: number; cantidad: number }) {
    const body = { ...data, estado: 1, fecha_actualiza: nowIso(), id_usuario_actualiza: 1 };
    const resp = await api.post('/api/INVENTARIOS', body, {
      headers: { 'Content-Type': 'application/json', Accept: 'application/json, text/plain' },
    });
    return ensureJson<any>(resp.data);
  },

  async updateInventario(id: number, data: { id_producto: number; id_tienda: number; cantidad: number }) {
    const body = { id, ...data, estado: 1, fecha_actualiza: nowIso(), id_usuario_actualiza: 1 };
    const resp = await api.put(`/api/INVENTARIOS/${id}`, body, {
      headers: { 'Content-Type': 'application/json', Accept: 'application/json, text/plain' },
    });
    return ensureJson<any>(resp.data);
  },

  // --- Transacciones de compras (header + detalle) ---
  async crearTransaccionCompra(payload: { id_usuario: number; id_cliente_proveedor: number; id_tienda: number; total: number }) {
    const body = {
      id_usuario: payload.id_usuario,
      id_cliente_proveedor: payload.id_cliente_proveedor,
      id_transaccion_tipo: 0,            // según tu convención
      id_transaccion_movimiento: 1,      // compras
      total: payload.total,               // 0
      fecha: nowIso(),
      id_tienda: payload.id_tienda,
      estado: 1,
      fecha_actualiza: nowIso(),
      id_usuario_actualiza: 1,
    };
    const resp = await api.post('/api/TRANSACCIONES_COMPRAS_VENTAS', body, {
      headers: { 'Content-Type': 'application/json', Accept: 'application/json, text/plain' },
    });
    return ensureJson<any>(resp.data); // debe devolver el id del header
  },

  async crearTransaccionDetalle(payload: { id_header: number; id_producto: number; cantidad: number; precio: number }) {
    const body = {
      id_transsacciones_compras_ventas: payload.id_header, // campo del swagger
      id_producto: payload.id_producto,
      cantidad: payload.cantidad,
      precio: payload.precio,            // 0
      estado: 1,
      fecha_actualiza: nowIso(),
      id_usuario_actualiza: 1,
    };
    const resp = await api.post('/api/TRANSACCION_COMPRAS_VENTAS_DETALLE', body, {
      headers: { 'Content-Type': 'application/json', Accept: 'application/json, text/plain' },
    });
    return ensureJson<any>(resp.data);
  },
};

// ===== Página =====
export default function InventariosPage() {
  const [rows, setRows] = useState<Inventario[]>([]);
  const [productos, setProductos] = useState<Record<number, Producto>>({});
  const [tiendas,   setTiendas]   = useState<Record<number, Tienda>>({});
  const [loading, setLoading] = useState(true);
  const [err, setErr]         = useState<string | null>(null);

  // Modal Compras
  const [openBuy, setOpenBuy] = useState(false);
  const [prodId, setProdId] = useState('');
  const [tiendaId, setTiendaId] = useState('');
  const [cantidad, setCantidad] = useState<number>(1);
  const [foundProd, setFoundProd] = useState<Producto | null>(null);
  const [foundTienda, setFoundTienda] = useState<Tienda | null>(null);
  const [buyErr, setBuyErr] = useState<string | null>(null);
  const [buyLoading, setBuyLoading] = useState(false);

  // Carga inicial
  useEffect(() => {
    (async () => {
      try {
        setLoading(true);
        const [inv, prods, tnds] = await Promise.all([
          backend.getInventarios(),
          backend.getProductos(),
          backend.getTiendas(),
        ]);
        setRows(inv);
        setProductos(Object.fromEntries(prods.map(p => [p.id, p])));
        setTiendas(Object.fromEntries(tnds.map(t => [t.id, t])));
      } catch (e: any) {
        setErr(e?.message || 'No se pudo cargar inventarios');
      } finally { setLoading(false); }
    })();
  }, []);

  const view = useMemo(() => rows.map(r => ({
    ...r,
    productoTitulo: productos[r.id_producto]?.titulo ?? `#${r.id_producto}`,
    tiendaTitulo:   tiendas[r.id_tienda]?.titulo   ?? `#${r.id_tienda}`,
  })), [rows, productos, tiendas]);

  async function reload() {
    try {
      const inv = await backend.getInventarios();
      setRows(inv);
    } catch (e: any) { setErr(e.message); }
  }

  // Buscar por ID en modal
  async function buscarProductoPorId() {
    try {
      setBuyErr(null); setBuyLoading(true);
      const p = await backend.getProductoById(Number(prodId));
      setFoundProd(p);
    } catch (e: any) {
      setBuyErr(e.message); setFoundProd(null);
    } finally { setBuyLoading(false); }
  }
  function buscarTiendaPorId() {
    setBuyErr(null);
    const id = Number(tiendaId);
    const t = tiendas[id];
    if (!t) { setBuyErr('Tienda no encontrada en catálogo'); setFoundTienda(null); }
    else setFoundTienda(t);
  }

  // Crear/actualizar inventario + crear transacción (header + detalle)
  async function confirmarCompra() {
    let ok = false; // éxito global
    try {
      setBuyErr(null); setBuyLoading(true);

      const pid = Number(prodId);
      const tid = Number(tiendaId);
      const qty = Number(cantidad);
      if (!pid || !tid || !qty || qty <= 0) throw new Error('Producto, tienda y cantidad son requeridos');

      const existente = rows.find(r => r.id_producto === pid && r.id_tienda === tid);

      if (existente) {
        const nuevaCantidad = existente.cantidad + qty;
        await backend.updateInventario(existente.id, { id_producto: pid, id_tienda: tid, cantidad: nuevaCantidad });
        // Optimista UI
        setRows(prev => prev.map(r => (r.id === existente.id ? { ...r, cantidad: nuevaCantidad, fecha_actualiza: nowIso() } : r)));
      } else {
        const created = await backend.createInventario({ id_producto: pid, id_tienda: tid, cantidad: qty });
        const newId = created?.id ?? created?.id_inventario ?? Math.floor(Math.random() * 1e9);
        setRows(prev => [...prev, { id: newId, id_producto: pid, id_tienda: tid, cantidad: qty, estado: 1, fecha_actualiza: nowIso(), id_usuario_actualiza: 1 }]);
      }

      // === Crear transacción de compra ===
      const userId = getUserId();
      const header = await backend.crearTransaccionCompra({
        id_usuario: userId,
        id_cliente_proveedor: userId, // mismo que id_usuario (como indicaste)
        id_tienda: tid,
        total: 0,
      });
      const headerId = header?.id ?? header?.id_transaccion ?? header?.id_transacciones_compras_ventas;
      if (!headerId) throw new Error('La transacción no devolvió ID');

      await backend.crearTransaccionDetalle({
        id_header: headerId,
        id_producto: pid,
        cantidad: qty,
        precio: 0,
      });

      ok = true;
    } catch (e: any) {
      setBuyErr(e.message ?? 'Error');
    } finally {
      setBuyLoading(false);
      if (ok) {
        // limpiar + cerrar
        setProdId(''); setTiendaId(''); setCantidad(1);
        setFoundProd(null); setFoundTienda(null);
        setOpenBuy(false);
        // refresco en background
        reload().catch(() => {});
      }
    }
     setProdId('');
      setTiendaId('');
      setCantidad(1);
      setFoundProd(null);
      setFoundTienda(null);
      setOpenBuy(false);

      // refresco silencioso en background (no bloquea el cierre)
      reload().catch(() => {});
  }

  return (
    <div className="page">
      <div className="header-row">
        <button className="btn primary" onClick={() => setOpenBuy(true)}>Compras</button>
        <h1 className="page-title">Inventarios</h1>
      </div>

      {err && <div className="error" style={{ marginBottom: 12 }}>{err}</div>}

      {loading ? (
        <div>Cargando…</div>
      ) : (
        <div className="table-wrap">
          <table className="table">
            <thead>
              <tr>
                <th style={{ width: 80 }}>ID</th>
                <th>Producto</th>
                <th style={{ width: 140 }}>Cantidad</th>
                <th>Tienda</th>
              </tr>
            </thead>
            <tbody>
              {view.length === 0 ? (
                <tr><td colSpan={4} style={{ textAlign: 'center', opacity: .7 }}>Sin registros</td></tr>
              ) : view.map(r => (
                <tr key={r.id}>
                  <td>{r.id}</td>
                  <td>{r.productoTitulo}</td>
                  <td>{r.cantidad}</td>
                  <td>{r.tiendaTitulo}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Modal Compras */}
      <Modal
        open={openBuy}
        onClose={() => setOpenBuy(false)}
        title="Nueva compra a inventario"
        footer={
          <>
            <button className="btn" onClick={() => setOpenBuy(false)}>Cancelar</button>
            <button className="btn primary" onClick={confirmarCompra} disabled={buyLoading || !prodId || !tiendaId || cantidad <= 0}>
              {buyLoading ? 'Guardando…' : 'Confirmar'}
            </button>
          </>
        }
      >
        <div className="form">
          <div className="grid two">
            <div className="form-row">
              <label>ID Producto</label>
              <div className="form-row inline">
                <input value={prodId} onChange={(e) => setProdId(e.target.value)} placeholder="Ej. 10023" />
                <button className="btn" onClick={buscarProductoPorId} disabled={buyLoading || !prodId}>
                  {buyLoading ? '…' : 'Buscar'}
                </button>
              </div>
              {foundProd && <div className="muted">{foundProd.titulo}</div>}
            </div>

            <div className="form-row">
              <label>ID Tienda</label>
              <div className="form-row inline">
                <input value={tiendaId} onChange={(e) => setTiendaId(e.target.value)} placeholder="Ej. 1" />
                <button className="btn" onClick={buscarTiendaPorId} disabled={!tiendaId}>Buscar</button>
              </div>
              {foundTienda && <div className="muted">{foundTienda.titulo}</div>}
            </div>

            <div className="form-row" style={{ maxWidth: 220 }}>
              <label>Cantidad</label>
              <input type="number" min={1} value={cantidad} onChange={(e) => setCantidad(Number(e.target.value))} />
            </div>
          </div>

          {buyErr && <div className="error" style={{ marginTop: 8 }}>{buyErr}</div>}
        </div>
      </Modal>
    </div>
  );
}