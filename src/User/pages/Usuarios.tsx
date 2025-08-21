// User/pages/Usuarios.tsx
import { useMemo, useState } from 'react';
import { useUsuariosUI } from '../hooks/useUsuariosUI';
import UsuariosTable from '../component/UsuariosTable';
import UsuarioDireccionesModal from '../usuariosDireccion/component/UsuarioDireccionesModal';

// reutilizables globales
import { TableSearch, Paginator, useTableControls } from '../../globals';

export default function Usuarios() {
  const {
    rows, tipos, loading, err,
    open, setOpen, form, setForm, isEdit,
    onNew, onEdit, onDelete, onSubmit,
  } = useUsuariosUI();

  // índice id → título para "Tipo Usuario"
  const tiposIndex = useMemo(
    () => new Map<number, string>(tipos.map(t => [t.id, t.titulo])),
    [tipos]
  );

  // controles de búsqueda/paginación
  const {
    query, setQuery, page, setPage, pageSize, setPageSize
  } = useTableControls(rows, { pageSize: 10 });

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return rows;
    return rows.filter(u =>
      (u.nombres ?? '').toLowerCase().includes(q) ||
      (u.apellidos ?? '').toLowerCase().includes(q) ||
      (u.correo ?? '').toLowerCase().includes(q) ||
      (u.telefono ?? '').toLowerCase().includes(q)
    );
  }, [rows, query]);

  const total = filtered.length;
  const pages = Math.max(1, Math.ceil(total / pageSize));
  const safePage = Math.min(page, pages);
  const start = (safePage - 1) * pageSize;
  const paged = filtered.slice(start, start + pageSize);

  // Modal Direcciones
  const [dirOpen, setDirOpen] = useState(false);
  const [dirUserId, setDirUserId] = useState<number | null>(null);
  function onDirecciones(u: { id: number }) {
    setDirUserId(u.id);
    setDirOpen(true);
  }

  return (
    <>
      {/* Cabecera */}
      <div className="header-row">
        <button className="btn small primary" onClick={onNew}>Nuevo</button>
        <h1 className="page-title">Usuarios</h1>
      </div>

      {/* Buscador */}
      <div className="toolbar">
        <TableSearch
          value={query}
          onChange={setQuery}
          placeholder="Buscar por nombres, apellidos, correo o teléfono…"
        />
      </div>

      {err && <div className="error" style={{ marginBottom: 12 }}>{err}</div>}

      {loading ? (
        <div>Cargando…</div>
      ) : (
        <>
          <UsuariosTable
            rows={paged}
            tiposIndex={tiposIndex}
            onEdit={onEdit}
            onDelete={onDelete}
            onDirecciones={onDirecciones}
          />

          <Paginator
            page={safePage}
            pageSize={pageSize}
            total={total}
            onPageChange={setPage}
            onPageSizeChange={setPageSize}
          />
        </>
      )}

      {/* Modal de Direcciones */}
      {dirUserId != null && (
        <UsuarioDireccionesModal
          userId={dirUserId}
          open={dirOpen}
          onClose={() => setDirOpen(false)}
        />
      )}

      {/* Modal Nuevo/Editar Usuario */}
      {open && (
        <div className="modal-overlay">
          <div className="modal">
            <div className="modal-header">
              <h2>{isEdit ? 'Editar usuario' : 'Nuevo usuario'}</h2>
            </div>

            <form id="usr-form" onSubmit={onSubmit} className="form">
              <div className="form-row">
                <label>Nombres</label>
                <input
                  value={form.nombres}
                  onChange={(e)=>setForm({...form, nombres:e.target.value})}
                  required
                  maxLength={150}
                />
              </div>

              <div className="form-row">
                <label>Apellidos</label>
                <input
                  value={form.apellidos}
                  onChange={(e)=>setForm({...form, apellidos:e.target.value})}
                  required
                  maxLength={150}
                />
              </div>

              <div className="form-row">
                <label>Teléfono</label>
                <input
                  value={form.telefono}
                  onChange={(e)=>setForm({...form, telefono:e.target.value})}
                  maxLength={20}
                />
              </div>

              <div className="form-row">
                <label>Fecha de nacimiento</label>
                <input
                  type="date"
                  value={form.fecha_nacimiento}
                  onChange={(e)=>setForm({...form, fecha_nacimiento:e.target.value})}
                />
              </div>

              <div className="form-row">
                <label>Correo</label>
                <input
                  type="email"
                  value={form.correo}
                  onChange={(e)=>setForm({...form, correo:e.target.value})}
                  required
                  maxLength={150}
                />
              </div>

              <div className="form-row">
                <label>Tipo de usuario</label>
                <select
                  value={form.id_usuario_tipo}
                  onChange={(e)=>setForm({...form, id_usuario_tipo:Number(e.target.value)})}
                  required
                >
                  <option value={0} disabled>Seleccione…</option>
                  {tipos.map(t => (
                    <option key={t.id} value={t.id}>{t.titulo}</option>
                  ))}
                </select>
              </div>

              <div className="form-row">
                <label>Estado</label>
                <select
                  value={form.estado}
                  onChange={(e)=>setForm({...form, estado:Number(e.target.value)})}
                >
                  <option value={1}>Activo</option>
                  <option value={0}>Inactivo</option>
                </select>
              </div>

              <div className="modal-footer">
                <button type="button" className="btn" onClick={() => setOpen(false)}>
                  Cancelar
                </button>
                <button className="btn primary" type="submit">
                  {isEdit ? 'Guardar' : 'Crear'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
