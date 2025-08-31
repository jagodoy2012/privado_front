import React, { useEffect, useMemo } from 'react';
import { TableSearch, Paginator, useTableControls } from '../../../globals';
import Modal from '../../../globals/component/modal/Modal';
import { useMenuUI } from '../hooks/useMenuUI';
import MenuTable from '../component/MenuTable';
import type { MenuItem } from '../interfaces/menu';

export default function MenusPage() {
  const {
    rows, /* total no lo usamos para el paginado client-side */ loading, err, load,
    open, setOpen, isEdit, form, setForm,
    onNew, onEdit, onDelete, onSubmit,
    byId,
  } = useMenuUI();

  // carga inicial
  useEffect(() => { load({ search: '', page: 1, pageSize: 10, active: '' }); }, [load]);

  // buscador + paginado (client-side)
  const { query, setQuery, page, setPage, pageSize, setPageSize } =
    useTableControls(rows, { pageSize: 10 });

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    let data = rows.slice();

    if (q) {
      data = data.filter(r =>
        (r.label ?? '').toLowerCase().includes(q) ||
        (r.path ?? '').toLowerCase().includes(q)
      );
    }

    // ordenar por sort_order si existe
    data.sort((a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0));
    return data;
  }, [rows, query]);

  // paginación
  const total    = filtered.length;
  const pages    = Math.max(1, Math.ceil(total / pageSize));
  const safePage = Math.min(page, pages);
  const start    = (safePage - 1) * pageSize;
  const end      = Math.min(start + pageSize, total);
  const paged    = filtered.slice(start, end);

  return (
    <>
      <div className="header-row">
        <button className="btn small primary" onClick={onNew}>Nuevo</button>
        <h1 className="page-title">Menús</h1>
      </div>

      <div className="toolbar">
        <TableSearch
          value={query}
          onChange={setQuery}
          placeholder="Buscar por etiqueta o path…"
        />
      </div>

      {err && <div className="error" style={{ marginBottom: 12 }}>{err}</div>}

      {loading ? (
        <div>Cargando…</div>
      ) : (
        <>
          <MenuTable rows={paged} byId={byId} onEdit={onEdit} onDelete={onDelete} />

          <Paginator
            page={safePage}
            pageSize={pageSize}
            total={total}                     
            onPageChange={setPage}
            onPageSizeChange={(n) => {        
              setPageSize(n);
              setPage(1);
            }}
          />
        </>
      )}

      <Modal
        open={open}
        onClose={() => setOpen(false)}
        title={isEdit ? 'Editar menú' : 'Nuevo menú'}
        footer={
          <>
            <button className="btn" onClick={() => setOpen(false)}>Cancelar</button>
            <button className="btn primary" form="menu-form" type="submit">
              {isEdit ? 'Guardar' : 'Crear'}
            </button>
          </>
        }
      >
        <form id="menu-form" className="form" onSubmit={onSubmit}>
          <div className="form-row">
            <label>Etiqueta</label>
            <input
              value={form.label}
              onChange={(e) => setForm({ ...form, label: e.currentTarget.value })}
              required
            />
          </div>

          <div className="form-row">
            <label>Path</label>
            <input
              value={form.path ?? ''}
              onChange={(e) => setForm({ ...form, path: e.currentTarget.value || null })}
              placeholder="/ruta o vacío si es contenedor"
            />
          </div>

          <div className="form-row">
            <label>Padre</label>
            <select
              value={form.parent_id ?? ''}
              onChange={(e) =>
                setForm({
                  ...form,
                  parent_id: e.currentTarget.value === '' ? null : Number(e.currentTarget.value),
                })
              }
            >
              <option value="">(raíz)</option>
              {rows
                .slice()
                .sort((a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0))
                .map((r: MenuItem) => (
                  <option key={r.id} value={r.id}>{r.label}</option>
                ))}
            </select>
          </div>

          <div className="form-row">
            <label>Orden</label>
            <input
              type="number"
              inputMode="numeric"
              min={0}
              step={1}
              value={Number.isFinite(form.sort_order) ? form.sort_order : 0}
              onChange={(e) =>
                setForm({ ...form, sort_order: Number(e.currentTarget.value) })
              }
              required
            />
          </div>

          <div className="form-row">
            <label>Estado</label>
            <select
              value={form.is_active ? '1' : '0'}
              onChange={(e) => setForm({ ...form, is_active: e.currentTarget.value === '1' })}
            >
              <option value="1">Activo</option>
              <option value="0">Inactivo</option>
            </select>
          </div>
        </form>
      </Modal>
    </>
  );
}