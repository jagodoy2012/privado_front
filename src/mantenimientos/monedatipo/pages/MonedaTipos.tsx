// src/User/monedaTipos/pages/MonedaTipos.tsx
import { useMemo } from 'react';
import { useMonedaTipoUI } from '../hooks/useMonedaTipoUI';
import MonedaTipoTable from '../component/MonedaTipoTable';
import Modal from '../../../globals/component/modal/Modal';

// reutilizables globales
import { TableSearch, Paginator, useTableControls } from '../../../globals';

export default function MonedaTipos() {
  const {
    rows, loading, err,
    open, setOpen, form, setForm, isEdit,
    onNew, onEdit, onDelete, onSubmit,
  } = useMonedaTipoUI();

  // buscador + paginado
  const { query, setQuery, page, setPage, pageSize, setPageSize } =
    useTableControls(rows, { pageSize: 10 });

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return rows;
    return rows.filter(r =>
      (r.titulo ?? '').toLowerCase().includes(q) ||
      (r.descripcion ?? '').toLowerCase().includes(q) ||
      (r.simbolo ?? '').toLowerCase().includes(q)
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
        <h1 className="page-title">Tipos de moneda</h1>
      </div>

      <div className="toolbar">
        <TableSearch
          value={query}
          onChange={setQuery}
          placeholder="Buscar por título, símbolo o descripción…"
        />
      </div>

      {err && <div className="error" style={{ marginBottom: 12 }}>{err}</div>}

      {loading ? (
        <div>Cargando…</div>
      ) : (
        <>
          <MonedaTipoTable rows={paged} onEdit={onEdit} onDelete={onDelete} />

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
        title={isEdit ? 'Editar tipo de moneda' : 'Nuevo tipo de moneda'}
        footer={
          <>
            <button className="btn" onClick={() => setOpen(false)}>Cancelar</button>
            <button className="btn primary" form="mt-form" type="submit">
              {isEdit ? 'Guardar' : 'Crear'}
            </button>
          </>
        }
      >
        <form id="mt-form" onSubmit={onSubmit} className="form">
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
            <label>Símbolo</label>
            <input
              value={form.simbolo}
              onChange={(e) => setForm({ ...form, simbolo: e.target.value })}
              required maxLength={10}
              placeholder="Ej: $, Q, €"
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