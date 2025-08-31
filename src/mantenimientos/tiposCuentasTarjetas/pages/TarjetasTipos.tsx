// pages/TarjetaTipo.tsx
import { useMemo } from 'react';
import Modal from './modal/Modal';
import EstadoPill from '../../../globals/component/EstadoPill';
import { useTarjetaTipoUI } from '../hooks/useTarjetaTipoUI';

// reutilizables globales
import { TableSearch, Paginator, useTableControls } from '../../../globals';
import type { TarjetaTipo } from '../hooks/useTarjetaTipoUI'; // ⬅️ asegura que exportes este tipo en el hook

export default function TarjetaTipoPage() {
  const {
    rows, loading, err,
    open, setOpen, form, setForm, isEdit,
    onNew, onEdit, onDelete, onSubmit,
  } = useTarjetaTipoUI();

  // ─── Controles de tabla (buscador + paginado) ─────────────────────────────
  const { query, setQuery, page, setPage, pageSize, setPageSize } =
    useTableControls(rows, { pageSize: 10 });

  const filtered = useMemo<TarjetaTipo[]>(() => {
    const q = query.trim().toLowerCase();
    if (!q) return rows;
    return rows.filter(r =>
      (r.titulo ?? '').toLowerCase().includes(q) ||
      (r.descripcion ?? '').toLowerCase().includes(q)
    );
  }, [rows, query]);

  const total = filtered.length;
  const pages = Math.max(1, Math.ceil(total / pageSize));
  const safePage = Math.min(page, pages);
  const start = (safePage - 1) * pageSize;

  const paged = useMemo<TarjetaTipo[]>(
    () => filtered.slice(start, start + pageSize),
    [filtered, start, pageSize]
  );
  // ──────────────────────────────────────────────────────────────────────────

  return (
    <>
      {/* Header: botón Nuevo + título centrado (mismas clases que UsuarioTipo) */}
      <div className="header-row">
        <button className="btn small primary" onClick={onNew}>Nuevo</button>
        <h1 className="page-title">Tipos de tarjetas y cuentas</h1>
      </div>

      {/* Buscador */}
      <div className="toolbar">
        <TableSearch
          value={query}
          onChange={setQuery}
          placeholder="Buscar por título o descripción..."
        />
      </div>

      {err && <div className="error">{err}</div>}

      {loading ? (
        <div>Cargando…</div>
      ) : (
        <>
          <div className="table-wrap">
            <table className="table">
              <thead>
                <tr>
                  <th style={{ width: 80 }}>ID</th>
                  <th>Título</th>
                  <th>Descripción</th>
                  <th style={{ width: 120 }}>Estado</th>
                  <th style={{ width: 120, textAlign: 'right' }}>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {paged.length === 0 ? (
                  <tr>
                    <td colSpan={5} style={{ textAlign: 'center', opacity: .7 }}>
                      {query ? 'No hay resultados' : 'Sin registros'}
                    </td>
                  </tr>
                ) : (
                  paged.map((r) => (
                    <tr key={r.id}>
                      <td>{r.id}</td>
                      <td>{r.titulo ?? ''}</td>
                      <td>{r.descripcion ?? ''}</td>
                      <td><EstadoPill estado={r.estado} /></td>
                      <td style={{ textAlign: 'right' }}>
                        <button className="icon-btn" title="Editar" onClick={() => onEdit(r)}>✏️</button>
                        <button className="icon-btn danger" title="Eliminar" onClick={() => onDelete(r.id)}>🗑️</button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Paginador */}
          <Paginator
            page={safePage}
            pageSize={pageSize}
            total={total}
            onPageChange={setPage}
            onPageSizeChange={setPageSize}
          />
        </>
      )}

      {/* Modal con MISMAS clases/estructura que UsuarioTipo */}
      <Modal
        open={open}
        onClose={() => setOpen(false)}
        title={isEdit ? 'Editar tipo de tarjeta' : 'Nuevo tipo de tarjeta'}
        footer={
          <>
            <button className="btn" onClick={() => setOpen(false)}>Cancelar</button>
            <button className="btn primary" form="tt-form" type="submit">
              {isEdit ? 'Guardar' : 'Crear'}
            </button>
          </>
        }
      >
        <form id="tt-form" onSubmit={onSubmit} className="form">
          <div className="form-row">
            <label>Título</label>
            <input
              value={form.titulo}
              onChange={(e) => setForm({ ...form, titulo: e.target.value })}
              required
              maxLength={150}
              placeholder="Crédito, Débito, Prepago..."
            />
          </div>
          <div className="form-row">
            <label>Descripción</label>
            <textarea
              rows={3}
              value={form.descripcion}
              onChange={(e) => setForm({ ...form, descripcion: e.target.value })}
              maxLength={250}
              placeholder="Descripción corta..."
            />
          </div>
          <div className="form-row">
            <label>Estado</label>
            <select
              value={form.estado}
              onChange={(e) => setForm({ ...form, estado: Number(e.target.value) })}
            >
              <option value={1}>Activo</option>
              <option value={0}>Inactivo</option>
            </select>
          </div>
        </form>
      </Modal>
    </>
  );
}
