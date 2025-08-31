import React, { useEffect, useMemo } from 'react';
import { TableSearch, Paginator, useTableControls } from '../../../globals';
import Modal from '../../../globals/component/modal/Modal';
import { useUsuarioTipoMenuUI } from '../hooks/useUsuarioTipoMenuUI';

export default function UsuarioTipoMenusPage() {
  const {
    rows, total, loading, err, load,
    open, setOpen, isEdit, form, setForm,
    onNew, onEdit, onDelete, onSubmit,
    usuarioTipos, menus, ustIndex, menIndex,
  } = useUsuarioTipoMenuUI();

  useEffect(() => { load({ search: '', page: 1, pageSize: 10, estado: '' }); }, [load]);

  const { query, setQuery, page, setPage, pageSize, setPageSize } = useTableControls(rows, { pageSize: 10 });

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return rows;
    return rows.filter(r =>
      (ustIndex.get(r.id_usuario_tipo)?.titulo ?? '').toLowerCase().includes(q) ||
      (menIndex.get(r.id_menu)?.label ?? '').toLowerCase().includes(q)
    );
  }, [rows, query, ustIndex, menIndex]);

  const safePage  = Math.min(page, Math.max(1, Math.ceil(filtered.length / pageSize)));
  const start     = (safePage - 1) * pageSize;
  const paged     = filtered.slice(start, start + pageSize);

  return (
    <>
      <div className="header-row">
        <button className="btn small primary" onClick={onNew}>Nuevo</button>
        <h1 className="page-title">Permisos de Menú por Tipo de Usuario</h1>
      </div>

      <div className="toolbar">
        <TableSearch
          value={query}
          onChange={setQuery}
          placeholder="Buscar por tipo de usuario o menú…"
        />
      </div>

      {err && <div className="error" style={{ marginBottom: 12 }}>{err}</div>}

      {loading ? (
        <div>Cargando…</div>
      ) : (
        <>
          <UsuarioTipoMenuTable
            rows={paged}
            ustIndex={ustIndex}
            menIndex={menIndex}
            onEdit={onEdit}
            onDelete={onDelete}
          />
          <Paginator
            page={safePage}
            pageSize={pageSize}
            total={filtered.length}
            onPageChange={setPage}
            onPageSizeChange={setPageSize}
          />
        </>
      )}

      <Modal
        open={open}
        onClose={() => setOpen(false)}
        title={isEdit ? 'Editar permiso' : 'Nuevo permiso'}
        footer={
          <>
            <button className="btn" onClick={() => setOpen(false)}>Cancelar</button>
            <button className="btn primary" form="ust-menu-form" type="submit">
              {isEdit ? 'Guardar' : 'Crear'}
            </button>
          </>
        }
      >
        <form id="ust-menu-form" className="form" onSubmit={onSubmit}>
          {/* Tipo de usuario */}
          <div className="form-row">
            <label>Tipo de usuario</label>
            <select
              value={form.id_usuario_tipo || ''}
              onChange={(e) =>
                setForm({ ...form, id_usuario_tipo: e.currentTarget.value === '' ? 0 : Number(e.currentTarget.value) })
              }
              required
            >
              <option value="">Seleccione…</option>
              {usuarioTipos.map(u => (
                <option key={u.id} value={u.id}>{u.titulo}</option>
              ))}
            </select>
          </div>

          {/* Menú */}
          <div className="form-row">
            <label>Menú</label>
            <select
              value={form.id_menu || ''}
              onChange={(e) =>
                setForm({ ...form, id_menu: e.currentTarget.value === '' ? 0 : Number(e.currentTarget.value) })
              }
              required
            >
              <option value="">Seleccione…</option>
              {menus.map(m => (
                <option key={m.id} value={m.id}>{m.label}</option>
              ))}
            </select>
          </div>

          {/* Ver / Padres / Hijos */}
          <div className="form-row">
            <label>Ver</label>
            <select
              value={form.can_view ? '1' : '0'}
              onChange={(e) => setForm({ ...form, can_view: e.currentTarget.value === '1' })}
            >
              <option value="1">Sí</option>
              <option value="0">No</option>
            </select>
          </div>

          <div className="form-row">
            <label>Padres</label>
            <select
              value={form.include_ancestors ? '1' : '0'}
              onChange={(e) => setForm({ ...form, include_ancestors: e.currentTarget.value === '1' })}
            >
              <option value="1">Sí</option>
              <option value="0">No</option>
            </select>
          </div>

          <div className="form-row">
            <label>Hijos</label>
            <select
              value={form.include_descendants ? '1' : '0'}
              onChange={(e) => setForm({ ...form, include_descendants: e.currentTarget.value === '1' })}
            >
              <option value="1">Sí</option>
              <option value="0">No</option>
            </select>
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

import UsuarioTipoMenuTable from '../component/UsuarioTipoMenuTable';