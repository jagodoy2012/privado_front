// src/mantenimientos/pb_tipo_asignado/pages/PBTipoAsignados.tsx
import { useEffect, useMemo } from 'react';
import { usePBTipoAsignadoUI } from '../hooks/usePBTipoAsignadoUI';
import PBTipoAsignadoTable from '../component/PBTipoAsignadoTable';
import Modal from '../../../globals/component/modal/Modal';
import { TableSearch, Paginator, useTableControls } from '../../../globals';

export default function PBTipoAsignados() {
  const {
    rows, loading, err,
    open, setOpen, form, setForm, isEdit,
    onNew, onEdit, onDelete, onSubmit,
    load,
    // catálogos
    productos, tipos, categorias,
    productosIndex, tiposIndex, categoriasIndex,
  } = usePBTipoAsignadoUI();

  useEffect(() => { load({}); }, [load]);

  const { query, setQuery, page, setPage, pageSize, setPageSize } =
    useTableControls(rows, { pageSize: 10 });

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return rows;
    return rows.filter(r =>
      (productosIndex.get(r.idProductoBancario)?.toLowerCase() ?? '').includes(q) ||
      (tiposIndex.get(r.idProductoBancarioTipo)?.toLowerCase() ?? '').includes(q) ||
      (categoriasIndex.get(r.id_categoria)?.toLowerCase() ?? '').includes(q)
    );
  }, [rows, query, productosIndex, tiposIndex, categoriasIndex]);

  const total = filtered.length;
  const pages = Math.max(1, Math.ceil(total / pageSize));
  const safePage = Math.min(page, pages);
  const start = (safePage - 1) * pageSize;
  const paged = filtered.slice(start, start + pageSize);

  return (
    <>
      <div className="header-row">
        <button className="btn small primary" onClick={onNew}>Nuevo</button>
        <h1 className="page-title">Producto bancario — tipos asignados</h1>
      </div>

      <div className="toolbar">
        <TableSearch
          value={query}
          onChange={setQuery}
          placeholder="Buscar por producto, tipo o categoría…"
        />
      </div>

      {err && <div className="error" style={{ marginBottom: 12 }}>{err}</div>}

      {loading ? (
        <div>Cargando…</div>
      ) : (
        <>
          <PBTipoAsignadoTable
            rows={paged}
            productoById={productosIndex}
            tipoById={tiposIndex}
            categoriaById={categoriasIndex}
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
        title={isEdit ? 'Editar asignación' : 'Nueva asignación'}
        footer={
          <>
            <button className="btn" onClick={() => setOpen(false)}>Cancelar</button>
            <button className="btn primary" form="pbta-form" type="submit">
              {isEdit ? 'Guardar' : 'Crear'}
            </button>
          </>
        }
      >
        <form id="pbta-form" onSubmit={onSubmit} className="form">
          {/* Producto */}
          <div className="form-row">
            <label>Producto</label>
            <select
              value={form.idProductoBancario === '' ? '' : form.idProductoBancario}
              onChange={(e) =>
                setForm({ ...form, idProductoBancario: e.target.value === '' ? '' : Number(e.target.value) })
              }
              required
            >
              <option value="">Seleccione…</option>
              {productos.map(p => (
                <option key={p.id} value={p.id}>{p.titulo}</option>
              ))}
            </select>
          </div>

          {/* Tipo */}
          <div className="form-row">
            <label>Tipo</label>
            <select
              value={form.idProductoBancarioTipo === '' ? '' : form.idProductoBancarioTipo}
              onChange={(e) =>
                setForm({ ...form, idProductoBancarioTipo: e.target.value === '' ? '' : Number(e.target.value) })
              }
              required
            >
              <option value="">Seleccione…</option>
              {tipos.map(t => (
                <option key={t.id} value={t.id}>{t.titulo}</option>
              ))}
            </select>
          </div>

          {/* Categoría */}
          <div className="form-row">
            <label>Categoría</label>
            <select
              value={form.id_categoria === '' ? '' : form.id_categoria}
              onChange={(e) =>
                setForm({ ...form, id_categoria: e.target.value === '' ? '' : Number(e.target.value) })
              }
              required
            >
              <option value="">Seleccione…</option>
              {categorias.map(c => (
                <option key={c.id} value={c.id}>{c.titulo}</option>
              ))}
            </select>
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