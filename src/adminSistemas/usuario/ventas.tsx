// src/User/facturacion/pages/FacturacionPage.tsx
import React, { useMemo, useState } from 'react';
import Modal from '../../globals/component/modal/Modal';
import { api } from '../../lib/api';

// ==================
// Tipos
// ==================
export type Cliente = { id?: number; nombres: string; apellidos: string; correo: string };
export type ProductoAPI = { id: number; titulo: string; precio: number };
export type ItemCarrito = { producto: { id: number; nombre: string }; cantidad: number; precioUnitario: number };

// ==================
// Utils
// ==================
const currency = new Intl.NumberFormat('es-GT', { style: 'currency', currency: 'GTQ' });
const nowIso = () => new Date().toISOString();
const vendedorId = () => Number(localStorage.getItem('id_usuario') ?? '0');

// Intenta parsear data que puede venir como string (text/plain)
function ensureJson<T = any>(data: any): T {
  if (typeof data === 'string') {
    try { return JSON.parse(data) as T; } catch { throw new Error(data.slice(0, 140)); }
  }
  return data as T;
}

// ==================
// API (usa tu axios "api")
// ==================
const backend = {
  async buscarUsuarios(q: string): Promise<Cliente[]> {
    const resp = await api.get('/api/usuarios/buscar', {
      params: { q, estado: 1, skip: 0, take: 50 },
      headers: { Accept: 'application/json, text/plain' },
    });
    const list = ensureJson<any[]>(resp.data) ?? [];
    return list.map((u) => ({ id: u.id ?? u.id_usuario ?? u.usuario_id, nombres: u.nombres ?? '', apellidos: u.apellidos ?? '', correo: u.correo ?? '' }));
  },
  async crearUsuarioMinimo(payload: { nombres: string; apellidos: string; correo: string }): Promise<Cliente> {
    const body = { ...payload, contrasena: '', id_usuario_tipo: 0, estado: 1, fecha: nowIso(), id_usuario: 1, telefono: '', fecha_nacimiento: nowIso() };
    const resp = await api.post('/api/USUARIOS', body, { headers: { 'Content-Type': 'application/json', Accept: 'application/json, text/plain' } });
    const u = ensureJson<any>(resp.data);
    return { id: u.id ?? u.id_usuario ?? u.usuario_id, nombres: u.nombres, apellidos: u.apellidos, correo: u.correo };
  },
  async getProductoById(id: number): Promise<ProductoAPI> {
    const resp = await api.get(`/api/PRODUCTO/${id}`, { headers: { Accept: 'application/json, text/plain' } });
    return ensureJson<ProductoAPI>(resp.data);
  },
  async crearHeader(payload: { id_usuario: number; id_cliente_proveedor: number; total: number }) {
    const body = { id_usuario: payload.id_usuario, id_cliente_proveedor: payload.id_cliente_proveedor, id_transaccion_tipo: 0, id_transaccion_movimiento: 0, total: payload.total, fecha: nowIso(), id_tienda: 0, estado: 1, fecha_actualiza: nowIso(), id_usuario_actualiza: 1 };
    const resp = await api.post('/api/TRANSACCIONES_COMPRAS_VENTAS', body, { headers: { 'Content-Type': 'application/json', Accept: 'application/json, text/plain' } });
    return ensureJson<any>(resp.data); // debe traer id del header
  },
  async crearDetalle(payload: { id_header: number; id_producto: number; cantidad: number; precio: number }) {
    const body = { id_transsacciones_compras_ventas: payload.id_header, id_producto: payload.id_producto, cantidad: payload.cantidad, precio: payload.precio, estado: 1, fecha_actualiza: nowIso(), id_usuario_actualiza: 1 };
    const resp = await api.post('/api/TRANSACCION_COMPRAS_VENTAS_DETALLE', body, { headers: { 'Content-Type': 'application/json', Accept: 'application/json, text/plain' } });
    return ensureJson<any>(resp.data);
  },
};

// ==================
// Page (archivo único)
// ==================
export default function FacturacionPage() {
  // Cliente & modales
  const [cliente, setCliente] = useState<Cliente | null>(null);
  const [openCliente, setOpenCliente] = useState(false);
  const [openProductos, setOpenProductos] = useState(false);

  // Buscador de usuarios
  const [qUser, setQUser] = useState('');
  const [resultUsers, setResultUsers] = useState<Cliente[]>([]);
  const [formUser, setFormUser] = useState<Cliente>({ nombres: '', apellidos: '', correo: '' });
  const [loadingUser, setLoadingUser] = useState(false);
  const [errUser, setErrUser] = useState<string | null>(null);

  // Productos & carrito
  const [prodId, setProdId] = useState('');
  const [prodFound, setProdFound] = useState<ProductoAPI | null>(null);
  const [cantidad, setCantidad] = useState(1);
  const [items, setItems] = useState<ItemCarrito[]>([]);
  const [loadingProd, setLoadingProd] = useState(false);
  const [errProd, setErrProd] = useState<string | null>(null);

  // Notifs
  const [err, setErr] = useState<string | null>(null);
  const [ok, setOk] = useState<string | null>(null);

  const subtotal = useMemo(() => items.reduce((a, i) => a + i.cantidad * i.precioUnitario, 0), [items]);
  const iva = useMemo(() => +(subtotal * 0.12).toFixed(2), [subtotal]);
  const total = useMemo(() => +(subtotal + iva).toFixed(2), [subtotal, iva]);

  // --- acciones cliente ---
  async function buscarUsuarios() {
    try { setLoadingUser(true); setErrUser(null); setResultUsers(await backend.buscarUsuarios(qUser.trim())); }
    catch (e: any) { setErrUser(e.message); setResultUsers([]); }
    finally { setLoadingUser(false); }
  }
  async function guardarOSeleccionarCliente() {
    try {
      setLoadingUser(true); setErrUser(null);
      let c = formUser;
      if (!c.id) {
        if (!c.nombres || !c.apellidos || !c.correo) throw new Error('Complete nombres, apellidos y correo');
        c = await backend.crearUsuarioMinimo({ nombres: c.nombres, apellidos: c.apellidos, correo: c.correo });
      }
      setCliente(c);
      setOpenCliente(false);
    } catch (e: any) { setErrUser(e.message); } finally { setLoadingUser(false); }
  }

  // --- acciones productos ---
  async function buscarProducto() {
    try { setLoadingProd(true); setErrProd(null); setProdFound(await backend.getProductoById(Number(prodId))); }
    catch (e: any) { setErrProd(e.message); setProdFound(null); }
    finally { setLoadingProd(false); }
  }
  function agregarItem() {
    if (!prodFound || cantidad <= 0) return;
    setItems((prev) => {
      const idx = prev.findIndex((x) => x.producto.id === prodFound.id);
      if (idx >= 0) { const copy = [...prev]; copy[idx] = { ...copy[idx], cantidad: copy[idx].cantidad + cantidad }; return copy; }
      return [...prev, { producto: { id: prodFound.id, nombre: prodFound.titulo }, cantidad, precioUnitario: prodFound.precio }];
    });
    setCantidad(1); setProdId(''); setProdFound(null);
  }
  function quitarItem(id: number) { setItems((prev) => prev.filter((x) => x.producto.id !== id)); }

  // --- facturar ---
  async function facturar() {
    try {
      setErr(null); setOk(null);
      if (!cliente?.id) throw new Error('Seleccione o cree un cliente');
      if (items.length === 0) throw new Error('Agregue productos');
      const header = await backend.crearHeader({ id_usuario: vendedorId(), id_cliente_proveedor: cliente.id!, total });
      const headerId = header.id ?? header.id_transaccion ?? header.id_transacciones_compras_ventas;
      if (!headerId) throw new Error('El encabezado no devolvió ID');
      for (const it of items) await backend.crearDetalle({ id_header: headerId, id_producto: it.producto.id, cantidad: it.cantidad, precio: it.precioUnitario });
      setCliente(null); setItems([]); setOk(`✅ Transacción creada (ID ${headerId})`);
    } catch (e: any) { setErr(e.message ?? 'Error'); }
  }

  // ==================
  // UI
  // ==================
  return (
    <div className="page">
      <div className="header-row">
        <div className="btn-group">
          <button className="btn primary" onClick={() => setOpenCliente(true)}>1) Cliente</button>
          <button className="btn" onClick={() => setOpenProductos(true)} disabled={!cliente}>2) Productos</button>
        </div>
        <h1 className="page-title">Facturación</h1>
      </div>

      <div className="grid two">
        <div>
          <div className="card">
            <div className="card-title">Cliente</div>
            {cliente ? (
              <div className="kv">
                <div><span>Nombre</span><b>{cliente.nombres} {cliente.apellidos}</b></div>
                <div><span>Correo</span><b>{cliente.correo}</b></div>
              </div>
            ) : (
              <div className="muted">Aún no hay cliente seleccionado.</div>
            )}
            <div style={{ marginTop: 8 }}>
              <button className="btn" onClick={() => setOpenCliente(true)}>Cambiar / Seleccionar</button>
            </div>
          </div>

          <div className="card">
            <div className="card-title">Carrito</div>
            {items.length === 0 ? (
              <div className="muted">Vacío</div>
            ) : (
              <div className="table-wrap">
                <table className="table">
                  <thead>
                    <tr><th>Producto</th><th style={{ width: 90 }}>Cant.</th><th style={{ width: 120 }}>Precio</th><th style={{ width: 120 }}>Subtotal</th><th style={{ width: 60 }}></th></tr>
                  </thead>
                  <tbody>
                    {items.map((i) => (
                      <tr key={i.producto.id}>
                        <td>{i.producto.nombre}</td>
                        <td>{i.cantidad}</td>
                        <td>{currency.format(i.precioUnitario)}</td>
                        <td>{currency.format(i.cantidad * i.precioUnitario)}</td>
                        <td style={{ textAlign: 'right' }}>
                          <button className="icon-btn danger" onClick={() => quitarItem(i.producto.id)}>🗑️</button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
            <div style={{ marginTop: 8 }}>
              <button className="btn" onClick={() => setOpenProductos(true)} disabled={!cliente}>Agregar producto</button>
            </div>
          </div>
        </div>

        <div>
          <div className="card">
            <div className="card-title">Resumen</div>
            <div className="kv">
              <div><span>Vendedor</span><b>#{vendedorId()}</b></div>
              <div><span>Subtotal</span><b>{currency.format(subtotal)}</b></div>
              <div><span>IVA (12%)</span><b>{currency.format(iva)}</b></div>
              <div className="total"><span>Total</span><b>{currency.format(total)}</b></div>
            </div>
            <button className="btn primary w-full" onClick={facturar} disabled={!cliente || items.length === 0}>Comprar / Facturar</button>
            {err && <div className="error" style={{ marginTop: 8 }}>{err}</div>}
            {ok && <div className="success" style={{ marginTop: 8 }}>{ok}</div>}
          </div>
        </div>
      </div>

      {/* Modal Cliente */}
      <Modal
        open={openCliente}
        onClose={() => setOpenCliente(false)}
        title="Cliente (Usuarios)"
        footer={
          <>
            <button className="btn" onClick={() => setOpenCliente(false)}>Cancelar</button>
            <button className="btn primary" onClick={guardarOSeleccionarCliente} disabled={loadingUser}>
              {loadingUser ? 'Guardando…' : 'Siguiente: Productos →'}
            </button>
          </>
        }
      >
        <div className="form">
          <div className="form-row inline">
            <div className="grow">
              <label>Buscar</label>
              <input placeholder="Nombre o apellido" value={qUser} onChange={(e) => setQUser(e.target.value)} />
            </div>
            <button className="btn" onClick={buscarUsuarios} disabled={loadingUser}>
              {loadingUser ? 'Buscando…' : 'Buscar'}
            </button>
          </div>
          {errUser && <div className="error">{errUser}</div>}
          {resultUsers.length > 0 && (
            <div className="list border" style={{ maxHeight: 200, overflow: 'auto', marginBottom: 8 }}>
              {resultUsers.map((u) => (
                <button key={(u.id ?? `${u.nombres}-${u.apellidos}`)} className={`list-item${formUser.id === u.id ? ' selected' : ''}`} onClick={() => setFormUser(u)}>
                  <div className="title">{u.nombres} {u.apellidos}</div>
                  <div className="sub">{u.correo}</div>
                </button>
              ))}
            </div>
          )}
          <div className="grid two">
            <div className="form-row">
              <label>Nombres</label>
              <input value={formUser.nombres} onChange={(e) => setFormUser((f) => ({ ...f, nombres: e.target.value }))} />
            </div>
            <div className="form-row">
              <label>Apellidos</label>
              <input value={formUser.apellidos} onChange={(e) => setFormUser((f) => ({ ...f, apellidos: e.target.value }))} />
            </div>
            <div className="form-row" style={{ gridColumn: '1 / -1' }}>
              <label>Correo</label>
              <input type="email" value={formUser.correo} onChange={(e) => setFormUser((f) => ({ ...f, correo: e.target.value }))} />
            </div>
          </div>
        </div>
      </Modal>

      {/* Modal Productos */}
      <Modal
        open={openProductos}
        onClose={() => setOpenProductos(false)}
        title="Productos (por código / ID)"
        footer={
          <>
            <button className="btn" onClick={() => setOpenProductos(false)}>Cerrar</button>
            <button className="btn primary" onClick={agregarItem} disabled={!prodFound || cantidad <= 0}>Agregar al carrito</button>
          </>
        }
      >
        <div className="form">
          <div className="form-row inline">
            <div className="grow">
              <label>Código / ID</label>
              <input placeholder="Ej. 10023" value={prodId} onChange={(e) => setProdId(e.target.value)} />
            </div>
            <button className="btn" onClick={buscarProducto} disabled={loadingProd || !prodId}>
              {loadingProd ? 'Buscando…' : 'Buscar'}
            </button>
          </div>
          {errProd && <div className="error">{errProd}</div>}
          {prodFound && (
            <div className="card soft" style={{ marginTop: 8 }}>
              <div className="title" style={{ marginBottom: 6 }}>{prodFound.titulo}</div>
              <div className="muted" style={{ marginBottom: 8 }}>Precio: {currency.format(prodFound.precio)}</div>
              <div className="form-row" style={{ maxWidth: 200 }}>
                <label>Cantidad</label>
                <input type="number" min={1} value={cantidad} onChange={(e) => setCantidad(Number(e.target.value))} />
              </div>
            </div>
          )}
        </div>
      </Modal>
    </div>
  );
}
