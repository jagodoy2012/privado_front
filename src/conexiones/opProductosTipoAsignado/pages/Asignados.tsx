import { useEffect, useMemo } from 'react';
import { useAsignadoUI } from '../hooks/useAsignadoUI';
import AsignadoTable from '../component/AsignadoTable';
import Modal from '../../../globals/component/modal/Modal';
import { TableSearch, Paginator, useTableControls } from '../../../globals';

export default function Asignados() {
  const {
    rows, loading, err, load,
    open, setOpen, form, setForm, isEdit,
    onNew, onEdit, onDelete, onSubmit,
    ops, pbs, opsIndex, pbsIndex,
  } = useAsignadoUI();

  useEffect(() => { load(); }, [load]);

  const { query, setQuery, page, setPage, pageSize, setPageSize } =
    useTableControls(rows, { pageSize: 10 });

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return rows;
    return rows.filter(r =>
      (opsIndex.get(r.id_operaciones)?.toLowerCase() ?? '').includes(q) ||
      (pbsIndex.get(r.id_producto_bancario)?.toLowerCase() ?? '').includes(q)
    );
  }, [rows, query, opsIndex, pbsIndex]);

  const total = filtered.length;
  const pages = Math.max(1, Math.ceil(total / pageSize));
  const safePage = Math.min(page, pages);
  const start = (safePage - 1) * pageSize;
  const paged = filtered.slice(start, start + pageSize);

  return (
    <>
      <div className="header-row">
        <button className="btn small primary" onClick={onNew}>Nuevo</button>
        <h1 className="page-title">Asignación operación ↔ producto bancario</h1>
      </div>

      <div className="toolbar">
        <TableSearch
          value={query}
          onChange={setQuery}
          placeholder="Buscar por operación o producto…"
        />
      </div>

      {err && <div className="error" style={{ marginBottom: 12 }}>{err}</div>}

      {loading ? (
        <div>Cargando…</div>
      ) : (
        <>
          <AsignadoTable
            rows={paged}
            opById={opsIndex}
            pbById={pbsIndex}
            onEdit={onEdit}
            onDelete={onDelete}
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

      <Modal
        open={open}
        onClose={() => setOpen(false)}
        title={isEdit ? 'Editar asignación' : 'Nueva asignación'}
        footer={
          <>
            <button className="btn" onClick={() => setOpen(false)}>Cancelar</button>
            <button className="btn primary" form="asignado-form" type="submit">
              {isEdit ? 'Guardar' : 'Crear'}
            </button>
          </>
        }
      >
        <form id="asignado-form" onSubmit={onSubmit} className="form">
          <div className="form-row">
            <label>Operación</label>
            <select
              value={form.id_operaciones === '' ? '' : form.id_operaciones}
              onChange={(e) => setForm({
                ...form,
                id_operaciones: e.target.value === '' ? '' : Number(e.target.value)
              })}
              required
            >
              <option value="">Seleccione…</option>
              {ops.map(o => <option key={o.id} value={o.id}>{o.titulo}</option>)}
            </select>
          </div>

          <div className="form-row">
            <label>Producto bancario</label>
            <select
              value={form.id_producto_bancario === '' ? '' : form.id_producto_bancario}
              onChange={(e) => setForm({
                ...form,
                id_producto_bancario: e.target.value === '' ? '' : Number(e.target.value)
              })}
              required
            >
              <option value="">Seleccione…</option>
              {pbs.map(p => <option key={p.id} value={p.id}>{p.titulo}</option>)}
            </select>
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