import React, { useEffect, useMemo } from 'react';
import {
  useProductoBancarioUsuarioUI,
  type MonedaLite,
  type UsuarioLite
} from '../hooks/useProductoBancarioUsuarioUI';
import { labelAsignacion, type AsignadoLite } from '../helpers/asignaciones';
import Table from '../component/ProductoBancarioUsuarioTable';
import Modal from '../../../globals/component/modal/Modal';
import { TableSearch, Paginator, useTableControls } from '../../../globals';

export default function ProductoBancarioUsuarioPage() {
  const {
    rows, loading, err, load,
    open, setOpen, form, setForm, isEdit,
    onNew, onEdit, onDelete, onSubmit,
    usuarios, usuariosIndex,
    monedas,  monedasIndex,
    asignados, asignacionIdx,
    loadCatalogs,                // 👈 lo expones desde el hook UI
  } = useProductoBancarioUsuarioUI();

  // 1) Cargar catálogos SOLO una vez al montar
  useEffect(() => {
    loadCatalogs();
  }, [loadCatalogs]);

  // 2) Cuando haya catálogos, cargar filas (no dependas de la referencia de `load`)
  useEffect(() => {
    const ready =
      usuarios.length > 0 ||
      asignados.length > 0 ||
      monedas.length > 0;
    if (ready) {
      // ajusta a tu tamaño preferido
      load({ page: 1, pageSize: 50 });
    }
  // depende SOLO de tamaños, no de `load`
  }, [usuarios.length, asignados.length, monedas.length, load]);

  // buscador + paginado
  const { query, setQuery, page, setPage, pageSize, setPageSize } =
    useTableControls(rows, { pageSize: 10 });

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return rows;
    return rows.filter(r => {
      const u = usuariosIndex.get(r.id_usuario_producto);
      const uTxt = `${u?.nombres ?? ''} ${u?.apellidos ?? ''}`.trim().toLowerCase();
      const asig = labelAsignacion(r.id_producto_bancario_asignado, asignacionIdx).toLowerCase();
      return uTxt.includes(q) || asig.includes(q);
    });
  }, [rows, query, usuariosIndex, asignacionIdx]);

  const total    = filtered.length;
  const pages    = Math.max(1, Math.ceil(total / pageSize));
  const safePage = Math.min(page, pages);
  const start    = (safePage - 1) * pageSize;
  const paged    = filtered.slice(start, start + pageSize);

  return (
    <>
      <div className="header-row">
        <button className="btn small primary" onClick={onNew}>Nuevo</button>
        <h1 className="page-title">Producto bancario — usuarios</h1>
      </div>

      <div className="toolbar">
        <TableSearch
          value={query}
          onChange={setQuery}
          placeholder="Buscar por usuario o asignación…"
        />
      </div>

      {err && <div className="error" style={{ marginBottom: 12 }}>{err}</div>}

      {loading ? (
        <div>Cargando…</div>
      ) : (
        <>
          <Table
            rows={paged}
            usuarioById={usuariosIndex}
            monedaById={monedasIndex}
            asignacionIdx={asignacionIdx}
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
        title={isEdit ? 'Editar relación' : 'Nueva relación'}
        footer={
          <>
            <button className="btn" onClick={() => setOpen(false)}>Cancelar</button>
            <button className="btn primary" form="pb-usuario-form" type="submit">
              {isEdit ? 'Guardar' : 'Crear'}
            </button>
          </>
        }
      >
        <form id="pb-usuario-form" onSubmit={onSubmit} className="form">
          {/* Usuario */}
          <div className="form-row">
            <label>Usuario</label>
            <select
              value={form.id_usuario_producto === 0 ? '' : form.id_usuario_producto}
              onChange={(e) => setForm({
                ...form,
                id_usuario_producto: e.currentTarget.value === '' ? 0 : Number(e.currentTarget.value)
              })}
              required
            >
              <option value="">Seleccione…</option>
              {usuarios.map((u: UsuarioLite) => (
                <option key={u.id} value={u.id}>
                  {`${u.nombres} ${u.apellidos}`.trim()}
                </option>
              ))}
            </select>
          </div>

          {/* Asignación */}
          <div className="form-row">
            <label>Asignación</label>
            <select
              value={form.id_producto_bancario_asignado === 0 ? '' : form.id_producto_bancario_asignado}
              onChange={(e) => setForm({
                ...form,
                id_producto_bancario_asignado: e.currentTarget.value === '' ? 0 : Number(e.currentTarget.value)
              })}
              required
            >
              <option value="">Seleccione…</option>
              {asignados.map((a: AsignadoLite) => (
                <option key={a.id} value={a.id}>
                  {labelAsignacion(a.id, asignacionIdx)}
                </option>
              ))}
            </select>
          </div>

          {/* Moneda */}
          <div className="form-row">
            <label>Moneda</label>
            <select
              value={form.id_moneda_tipo === 0 ? '' : form.id_moneda_tipo}
              onChange={(e) => setForm({
                ...form,
                id_moneda_tipo: e.currentTarget.value === '' ? 0 : Number(e.currentTarget.value)
              })}
              required
            >
              <option value="">Seleccione…</option>
              {monedas.map((m: MonedaLite) => (
                <option key={m.id} value={m.id}>
                  {m.simbolo || m.titulo || m.id}
                </option>
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
              value={Number.isFinite(form.monto) ? form.monto : 0}
              onChange={(e) => setForm({
                ...form,
                monto: e.currentTarget.value === '' ? 0 : Number(e.currentTarget.value)
              })}
              required
            />
          </div>

          {/* Disponible */}
          <div className="form-row">
            <label>Disponible</label>
            <input
              type="number"
              inputMode="decimal"
              min="0"
              step="0.01"
              placeholder="0.00"
              value={Number.isFinite(form.disponible) ? form.disponible : 0}
              onChange={(e) => setForm({
                ...form,
                disponible: e.currentTarget.value === '' ? 0 : Number(e.currentTarget.value)
              })}
              required
            />
          </div>

          {/* Último corte */}
          <div className="form-row">
            <label>Último corte</label>
            <input
              type="date"
              value={(form.fecha_ultimo_corte ?? '').slice(0, 10)}
              onChange={(e) => setForm({ ...form, fecha_ultimo_corte: e.currentTarget.value })}
            />
          </div>

          {/* Estado */}
          <div className="form-row">
            <label>Estado</label>
            <select
              value={form.estado}
              onChange={(e) => setForm({ ...form, estado: Number(e.currentTarget.value) as 0 | 1 })}
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