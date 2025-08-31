import { useEffect, useMemo } from 'react';
import { useMonedaTipoCambioApiUI } from '../hooks/useMonedaTipoCambioApiIU';
import MonedaTipoCambioApiTable from '../component/MonedaTipoCambioApiTable';
import Modal from '../../../globals/component/modal/Modal';
import { TableSearch, Paginator, useTableControls } from '../../../globals';

export default function MonedaTipoCambioApis() {
  const {
    rows, loading, err, total,
    open, setOpen, form, setForm, isEdit,
    onNew, onEdit, onDelete, onSubmit,
    load,
    monedas, monedasIndex,
  } = useMonedaTipoCambioApiUI();

  // carga inicial
  useEffect(() => { load({}); }, [load]);

  // buscador + paginado (local)
  const { query, setQuery, page, setPage, pageSize, setPageSize } =
    useTableControls(rows, { pageSize: 10 });

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return rows;
    return rows.filter(r =>
      (r.url ?? '').toLowerCase().includes(q) ||
      String(r.id_moneda_tipo ?? '').includes(q)
    );
  }, [rows, query]);

  const totalFiltered = filtered.length;
  const pages = Math.max(1, Math.ceil(totalFiltered / pageSize));
  const safePage = Math.min(page, pages);
  const start = (safePage - 1) * pageSize;
  const paged = filtered.slice(start, start + pageSize);

  return (
    <>
      <div className="header-row">
        <button className="btn small primary" onClick={onNew}>Nuevo</button>
        <h1 className="page-title">APIs de tipo de cambio</h1>
      </div>

      <div className="toolbar">
        <TableSearch
          value={query}
          onChange={setQuery}
          placeholder="Buscar por URL o id de moneda…"
        />
      </div>

      {err && <div className="error" style={{ marginBottom: 12 }}>{err}</div>}

      {loading ? (
        <div>Cargando…</div>
      ) : (
        <>
          <MonedaTipoCambioApiTable
            rows={paged}
            monedaById={monedasIndex}
            onEdit={onEdit}
            onDelete={onDelete}
          />
          <Paginator
            page={safePage}
            pageSize={pageSize}
            total={totalFiltered}
            onPageChange={setPage}
            onPageSizeChange={setPageSize}
          />
        </>
      )}

      {/* Modal Nuevo/Editar */}
      <Modal
        open={open}
        onClose={() => setOpen(false)}
        title={isEdit ? 'Editar API de tipo de cambio' : 'Nueva API de tipo de cambio'}
        footer={
          <>
            <button className="btn" onClick={() => setOpen(false)}>Cancelar</button>
            <button className="btn primary" form="mtcapi-form" type="submit">
              {isEdit ? 'Guardar' : 'Crear'}
            </button>
          </>
        }
      >
        <form id="mtcapi-form" onSubmit={onSubmit} className="form">
          {/* Moneda (muestra título, guarda id) */}
          <div className="form-row">
            <label>Moneda</label>
            <select
              value={form.id_moneda_tipo === '' ? '' : form.id_moneda_tipo}
              onChange={(e) =>
                setForm({
                  ...form,
                  id_moneda_tipo: e.target.value === '' ? '' : Number(e.target.value),
                })
              }
              required
            >
              <option value="">Seleccione…</option>
              {monedas.map(m => (
                <option key={m.id} value={m.id}>{m.titulo}</option>
              ))}
            </select>
          </div>

          {/* URL de la API */}
          <div className="form-row">
            <label>URL</label>
            <input
              value={form.url}
              onChange={(e) => setForm({ ...form, url: e.target.value })}
              placeholder="https://..."
              required
            />
          </div>

          {/* Estado */}
          <div className="form-row">
            <label>Estado</label>
            <select
              value={form.estado}
              onChange={(e) => setForm({ ...form, estado: Number(e.target.value) as 0 | 1 })}
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