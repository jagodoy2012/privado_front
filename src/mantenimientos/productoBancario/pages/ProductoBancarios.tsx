import { useEffect, useMemo } from 'react';
import { useProductoBancarioUI } from '../hooks/useProductoBancarioUI';
import ProductoBancarioTable from '../component/ProductoBancarioTable';
import Modal from '../../../globals/component/modal/Modal';
import { TableSearch, Paginator, useTableControls } from '../../../globals';

export default function ProductoBancarios() {
  const {
    rows, loading, err,
    open, setOpen, form, setForm, isEdit,
    onNew, onEdit, onDelete, onSubmit,
    load,                   // 👈 lo usamos para el `useEffect`
  } = useProductoBancarioUI();

  // carga inicial
  useEffect(() => { load({}); }, [load]);

  // buscador + paginado en la UI
  const { query, setQuery, page, setPage, pageSize, setPageSize } =
    useTableControls(rows, { pageSize: 10 });

  const filtered = useMemo(() => {
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
  const paged = filtered.slice(start, start + pageSize);

  return (
    <>
      <div className="header-row">
        <button className="btn small primary" onClick={onNew}>Nuevo</button>
        <h1 className="page-title">Producto bancario</h1>
      </div>

      <div className="toolbar">
        <TableSearch
          value={query}
          onChange={setQuery}
          placeholder="Buscar por título o descripción…"
        />
      </div>

      {err && <div className="error" style={{ marginBottom: 12 }}>{err}</div>}

      {loading ? (
        <div>Cargando…</div>
      ) : (
        <>
          <ProductoBancarioTable rows={paged} onEdit={onEdit} onDelete={onDelete} />
          <Paginator
            page={safePage}
            pageSize={pageSize}
            total={total}
            onPageChange={setPage}
            onPageSizeChange={setPageSize}
          />
        </>
      )}

      <Modal
        open={open}
        onClose={() => setOpen(false)}
        title={isEdit ? 'Editar producto bancario' : 'Nuevo producto bancario'}
        footer={
          <>
            <button className="btn" onClick={() => setOpen(false)}>Cancelar</button>
            <button className="btn primary" form="pb-form" type="submit">
              {isEdit ? 'Guardar' : 'Crear'}
            </button>
          </>
        }
      >
        <form id="pb-form" onSubmit={onSubmit} className="form">
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