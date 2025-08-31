// src/User/productoBancarioTipos/pages/ProductoBancarioTipos.tsx
import { useEffect, useMemo } from 'react';
import { useProductoBancarioTipoUI } from '../hooks/useProductoBancarioTipoUI';
import ProductoBancarioTipoTable from '../component/ProductoBancarioTipoTable';
import Modal from '../../../globals/component/modal/Modal';

// reutilizables globales
import { TableSearch, Paginator, useTableControls } from '../../../globals';

export default function ProductoBancarioTipos() {
  const {
    rows, loading, err,
    open, setOpen, form, setForm, isEdit,
    onNew, onEdit, onDelete, onSubmit,
    load, // 👈 importante para cargar/recargar
  } = useProductoBancarioTipoUI();

  // Cargar al montar (paginado local: pedimos un size amplio)
  useEffect(() => {
    load({ search: '', page: 1, pageSize: 1000, estado: '' });
  }, [load]);

  // buscador + paginado en el front
  const { query, setQuery, page, setPage, pageSize, setPageSize } =
    useTableControls(rows, { pageSize: 10 });

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return rows;
    return rows.filter(r =>
      (r.titulo ?? '').toLowerCase().includes(q) ||
      (r.descripcion ?? '').toLowerCase().includes(q) ||
      (r.tabla ?? '').toLowerCase().includes(q)
    );
  }, [rows, query]);

  const total = filtered.length;
  const pages = Math.max(1, Math.ceil(total / pageSize));
  const safePage = Math.min(page, pages);
  const start = (safePage - 1) * pageSize;
  const paged = filtered.slice(start, start + pageSize);

  return (
    <>
      <div className="header-row">
        <button className="btn small primary" onClick={onNew}>Nuevo</button>
        <h1 className="page-title">Tipos de producto bancario</h1>
      </div>

      <div className="toolbar">
        <TableSearch
          value={query}
          onChange={setQuery}
          placeholder="Buscar por título, descripción o tabla…"
        />
      </div>

      {err && <div className="error" style={{ marginBottom: 12 }}>{err}</div>}

      {loading ? (
        <div>Cargando…</div>
      ) : (
        <>
          <ProductoBancarioTipoTable rows={paged} onEdit={onEdit} onDelete={onDelete} />

          <Paginator
            page={safePage}
            pageSize={pageSize}
            total={total}
            onPageChange={setPage}
            onPageSizeChange={setPageSize}
          />
        </>
      )}

      {/* Modal Nuevo/Editar */}
      <Modal
        open={open}
        onClose={() => setOpen(false)}
        title={isEdit ? 'Editar tipo de producto' : 'Nuevo tipo de producto'}
        footer={
          <>
            <button className="btn" onClick={() => setOpen(false)}>Cancelar</button>
            <button className="btn primary" form="pbt-form" type="submit">
              {isEdit ? 'Guardar' : 'Crear'}
            </button>
          </>
        }
      >
        <form id="pbt-form" onSubmit={onSubmit} className="form">
          <div className="form-row">
            <label>Título</label>
            <input
              value={form.titulo}
              onChange={(e) => setForm({ ...form, titulo: e.target.value })}
              required maxLength={150}
            />
          </div>
          <div className="form-row">
            <label>Descripción</label>
            <textarea
              rows={3}
              value={form.descripcion}
              onChange={(e) => setForm({ ...form, descripcion: e.target.value })}
              maxLength={250}
            />
          </div>
          <div className="form-row">
            <label>Tabla</label>
            <input
              value={form.tabla}
              onChange={(e) => setForm({ ...form, tabla: e.target.value })}
              maxLength={100}
              placeholder="Ej: CUENTA, TARJETA, etc."
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