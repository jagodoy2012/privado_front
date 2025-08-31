import { useEffect, useMemo } from 'react';
import { useRemesaUI } from '../hooks/useRemesaUI';
import RemesaTable from '../componet/RemesaTable';
import Modal from '../../../globals/component/modal/Modal';
import { TableSearch, Paginator, useTableControls } from '../../../globals';

export default function Remesas() {
  const {
    rows, loading, err,
    open, setOpen, form, setForm, isEdit,
    onNew, onEdit, onDelete, onSubmit,
    load,
    monedas, monedasIndex,
  } = useRemesaUI();

  useEffect(() => { load({}); }, [load]);

  const { query, setQuery, page, setPage, pageSize, setPageSize } =
    useTableControls(rows, { pageSize: 10 });

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return rows;
    return rows.filter(r =>
      (r.nombre_remitente ?? '').toLowerCase().includes(q) ||
      (r.nombre_receptor ?? '').toLowerCase().includes(q)
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
        <h1 className="page-title">Remesas</h1>
      </div>

      <div className="toolbar">
        <TableSearch
          value={query}
          onChange={setQuery}
          placeholder="Buscar por remitente o receptor…"
        />
      </div>

      {err && <div className="error" style={{ marginBottom: 12 }}>{err}</div>}

      {loading ? (
        <div>Cargando…</div>
      ) : (
        <>
          <RemesaTable
            rows={paged}
            monedaById={monedasIndex}
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

      {/* Modal Nuevo/Editar */}
      <Modal
        open={open}
        onClose={() => setOpen(false)}
        title={isEdit ? 'Editar remesa' : 'Nueva remesa'}
        footer={
          <>
            <button className="btn" onClick={() => setOpen(false)}>Cancelar</button>
            <button className="btn primary" form="remesa-form" type="submit">
              {isEdit ? 'Guardar' : 'Crear'}
            </button>
          </>
        }
      >
        <form id="remesa-form" onSubmit={onSubmit} className="form">
          {/* Fecha opcional */}
          <div className="form-row">
            <label>Fecha de envío</label>
            <input
              type="datetime-local"
              value={form.fecha_envio ?? ''}
              onChange={(e) => setForm({ ...form, fecha_envio: e.target.value })}
            />
          </div>

          <div className="form-row">
            <label>Remitente</label>
            <input
              value={form.nombre_remitente}
              onChange={(e) => setForm({ ...form, nombre_remitente: e.target.value })}
              required
            />
          </div>

          <div className="form-row">
            <label>Receptor</label>
            <input
              value={form.nombre_receptor}
              onChange={(e) => setForm({ ...form, nombre_receptor: e.target.value })}
              required
            />
          </div>

          {/* Moneda */}
          <div className="form-row">
            <label>Moneda</label>
            <select
              value={form.id_moneda_tipo === '' ? '' : form.id_moneda_tipo}
              onChange={(e: React.ChangeEvent<HTMLSelectElement>) => {
                const v = e.target.value; // string
                setForm({
                  ...form,
                  id_moneda_tipo: v === '' ? '' : Number(v), // number | ''
                });
              }}
              required
            >
              <option value="">Seleccione…</option>
              {monedas.map(m => (
                <option key={m.id} value={m.id}>{m.titulo}</option>
              ))}
            </select>
          </div>

          {/* Monto */}
          <div className="form-row">
            <label>Monto</label>
            <input
              type="number"
              inputMode="decimal"
              min="0"
              step="0.01"
              placeholder="0.00"
              value={form.monto}
              onChange={(e) =>
                setForm({ ...form, monto: e.target.value === '' ? 0 : Number(e.target.value) })
              }
              required
            />
          </div>

          {/* Estado */}
          <div className="form-row">
            <label>Estado</label>
            <select
              value={form.estado}
              onChange={(e: React.ChangeEvent<HTMLSelectElement>) =>
                setForm({ ...form, estado: Number(e.target.value) as 0 | 1 })
              }
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