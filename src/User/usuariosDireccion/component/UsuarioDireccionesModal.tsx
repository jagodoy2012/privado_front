import { useState } from 'react';
import Modal from '../../../globals/component/modal/Modal';
import { useUsuarioDirecciones } from '../hooks/useUsuarioDirecciones';

type Props = {
  userId: number;
  open: boolean;
  onClose: () => void;
};

export default function UsuarioDireccionesModal({ userId, open, onClose }: Props) {
  const {
    // datos
    rows, loading, err,
    tipos, deps, muns, zonas,
    // selects en cascada
    depId, setDepId, munId, setMunId, zonaId, setZonaId,
    // formulario
    form, setForm,
    // helpers para pintar
    tiposIndex,        // Record<number, string>
    zonaLabelById,     // Record<number, string>
    // acciones
    create, remove, resetGeo,
  } = useUsuarioDirecciones(userId);

  // mostrar/ocultar formulario
  const [showForm, setShowForm] = useState(false);

  function onNew() {
    setShowForm(true);
    setForm({ direccion: '', id_tipo: 0 });
    resetGeo(); // limpia dpto/mun/zon
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    await create();
    setShowForm(false);
  }

  function onCancel() {
    setShowForm(false);
  }

  return (
    <Modal open={open} onClose={onClose} title="Direcciones del usuario" wide>
      {/* Errores */}
      {err && <div className="error" style={{ marginBottom: 12 }}>{err}</div>}

      {/* Botón Nuevo - se oculta si el form está abierto */}
      {!showForm && (
        <button className="btn primary" onClick={onNew} style={{ marginBottom: 12 }}>
          Nueva dirección
        </button>
      )}

      {/* Formulario - se muestra solo si showForm=true */}
      {showForm && (
        <form onSubmit={onSubmit} className="form" style={{ marginBottom: 16 }}>
          <div className="form-row">
            <label>Dirección</label>
            <input
              value={form.direccion}
              onChange={(e) => setForm({ ...form, direccion: e.target.value })}
              required
            />
          </div>

          <div className="form-row">
            <label>Tipo</label>
            <select
              value={form.id_tipo || ''}
              onChange={(e) => setForm({ ...form, id_tipo: Number(e.target.value) || 0 })}
              required
            >
              <option value="">Seleccione…</option>
              {tipos.map(t => <option key={t.id} value={t.id}>{t.titulo}</option>)}
            </select>
          </div>

          <div className="form-row">
            <label>Departamento</label>
            <select
              value={depId === '' ? '' : depId}
              onChange={(e) => setDepId(e.target.value === '' ? '' : Number(e.target.value))}
            >
              <option value="">Seleccione…</option>
              {deps.map(d => <option key={d.id} value={d.id}>{d.titulo}</option>)}
            </select>
          </div>

          <div className="form-row">
            <label>Municipio</label>
            <select
              value={munId === '' ? '' : munId}
              onChange={(e) => setMunId(e.target.value === '' ? '' : Number(e.target.value))}
              disabled={depId === ''}
            >
              <option value="">Seleccione…</option>
              {muns.map(m => <option key={m.id} value={m.id}>{m.titulo}</option>)}
            </select>
          </div>

          <div className="form-row">
            <label>Zona</label>
            <select
              value={zonaId === '' ? '' : zonaId}
              onChange={(e) => setZonaId(e.target.value === '' ? '' : Number(e.target.value))}
              disabled={munId === ''}
            >
              <option value="">Seleccione…</option>
              {zonas.map(z => <option key={z.id} value={z.id}>{z.titulo}</option>)}
            </select>
          </div>

          <div className="form-actions">
            <button type="button" className="btn" onClick={onCancel}>Cancelar</button>
            <button type="submit" className="btn primary">Crear</button>
          </div>
        </form>
      )}

      {/* Tabla */}
      <div className="table-wrap">
        <table className="table">
          <thead>
            <tr>
              <th>ID</th>
              <th>Dirección</th>
              <th>Tipo</th>
              <th>Depto/Mun/Zona</th>
              <th style={{ width: 120, textAlign: 'right' }}>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 ? (
              <tr>
                <td colSpan={5} style={{ textAlign: 'center', opacity: .7 }}>
                  {loading ? 'Cargando…' : 'Sin direcciones'}
                </td>
              </tr>
            ) : rows.map(r => (
              <tr key={r.id}>
                <td>{r.id}</td>
                <td>{r.direccion}</td>

                {/* título del tipo por id */}
                <td>{tiposIndex[Number(r.id_usuario_direccion_tipo)] ?? r.id_usuario_direccion_tipo}</td>

                {/* label compuesto "Depto / Municipio / Zona" */}
                <td>{zonaLabelById[Number(r.id_zona)] ?? ''}</td>

                <td style={{ textAlign: 'right' }}>
                  <button className="icon-btn danger" onClick={() => remove(r.id)}>🗑️</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Modal>
  );
}
