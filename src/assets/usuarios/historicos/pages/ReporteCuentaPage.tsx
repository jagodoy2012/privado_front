// src/pages/reportes/pages/ReporteCuentaPage.tsx
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { api } from '../../../../lib/api';

/* ===== Tipos mínimos que usamos aquí ===== */
type CuentaRow = {
  id: number;
  id_usuario_producto: number;
  id_producto_bancario_asignado: number;
  id_moneda_tipo: number;
  disponible: number;
};

type MonedaLite = { id: number; simbolo: string; titulo?: string | null };
type ProdBancarioLite = { id: number; titulo: string };
type PBTA = {
  id: number;
  idProductoBancario: number;
  idProductoBancarioTipo: number;
  id_categoria?: number | null;
};

type TransaccionRaw = {
  id: number;
  id_producto_bancario_usuario_envia: number;
  id_producto_bancario_usuario_recibe: number;
  id_operaciones?: number;
  id_moneda_tipo?: number;
  monto: number;
  nota?: string | null;
  fecha_realizado?: string | null; // ISO
};

/* ===== Endpoints usados ===== */
const CUENTAS_URL                  = '/api/producto_bancario_usuario';
const MONEDAS_URL                  = '/api/monedatipos';
const PRODUCTOS_URL                = '/api/productobancarios';                  // catálogo
const PBTA_URL                     = '/api/producto_bancario_tipo_asignado';    // catálogo (para resolver el asignado -> producto)
const TRANSACCIONES_BY_CUENTA = (id: number) => `/api/transacciones/by-cuenta/${id}`;

/* ===== Util ===== */
const nf = new Intl.NumberFormat('es-ES', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

function yyyymmdd(d = new Date()) {
  const p = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
}

/* Para Excel simple (CSV que Excel abre bien) */
function exportCSV(filename: string, rows: Array<Record<string, any>>) {
  if (!rows.length) return;
  const headers = Object.keys(rows[0]);
  const esc = (v: any) => {
    if (v == null) return '';
    const s = String(v);
    return /[",\n;]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
  };
  const csv =
    headers.join(';') +
    '\n' +
    rows.map(r => headers.map(h => esc(r[h])).join(';')).join('\n');

  const blob = new Blob(['\ufeff' + csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

/* PDF básico: abre una ventana imprimible con la tabla */
function exportPrintHTML(title: string, htmlTable: string) {
  const win = window.open('', '_blank', 'width=1024,height=768');
  if (!win) return;
  win.document.write(`
    <html>
      <head>
        <meta charset="utf-8" />
        <title>${title}</title>
        <style>
          body{font-family:system-ui,-apple-system,Segoe UI,Roboto,Ubuntu,'Helvetica Neue',sans-serif;padding:16px}
          h1{font-size:18px;margin:0 0 8px}
          .meta{font-size:12px;margin-bottom:12px;opacity:.85}
          table{width:100%;border-collapse:collapse;font-size:12px}
          th,td{border:1px solid #ccc;padding:6px;text-align:left}
          td.num,th.num{text-align:right}
        </style>
      </head>
      <body>
        ${htmlTable}
      </body>
    </html>
  `);
  win.document.close();
  win.focus();
  win.print();
}

export default function ReporteCuentaPage() {
  const idUsuario = Number(localStorage.getItem('id_usuario') ?? 0);

  /* ====== Estado ====== */
  const [cuentas, setCuentas] = useState<CuentaRow[]>([]);
  const [monedas, setMonedas] = useState<MonedaLite[]>([]);
  const [productos, setProductos] = useState<ProdBancarioLite[]>([]);
  const [asignados, setAsignados] = useState<PBTA[]>([]);

  const [selCuenta, setSelCuenta] = useState<number | ''>('');
  const [desde, setDesde] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() - 30);
    return yyyymmdd(d);
  });
  const [hasta, setHasta] = useState(yyyymmdd());

  const [rows, setRows] = useState<TransaccionRaw[]>([]);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  /* ===== Catálogos + cuentas por usuario ===== */
  const loadCatalogs = useCallback(async () => {
    try {
      const [monR, prodR, asgR] = await Promise.all([
        api.get<MonedaLite[]>(MONEDAS_URL),
        api.get<ProdBancarioLite[]>(PRODUCTOS_URL),
        api.get<PBTA[]>(PBTA_URL),
      ]);
      setMonedas(monR.data ?? []);
      setProductos(prodR.data ?? []);
      setAsignados(asgR.data ?? []);
    } catch {
      setMonedas([]); setProductos([]); setAsignados([]);
    }
  }, []);

  const loadCuentas = useCallback(async () => {
    setErr(null);
    try {
      // Preferimos un endpoint con filtro por usuario.
      // Si tu backend no filtra por query, trae todo y filtramos en FE.
      const { data } = await api.get<CuentaRow[]>(
        `${CUENTAS_URL}?id_usuario_producto=${idUsuario}`
      );
      const lista = (data ?? []).filter((c: { id_usuario_producto: number; }) => c.id_usuario_producto === idUsuario);
      setCuentas(lista);
      if (lista[0]) setSelCuenta(lista[0].id);
    } catch (e: any) {
      setErr(e?.message || 'No se pudieron cargar las cuentas');
      setCuentas([]);
    }
  }, [idUsuario]);

  useEffect(() => { loadCatalogs(); }, [loadCatalogs]);
  useEffect(() => { loadCuentas(); }, [loadCuentas]);

  /* ===== Índices / helpers ===== */
  const monedaIdx = useMemo(() => new Map(monedas.map(m => [m.id, m] as const)), [monedas]);
  const productosIdx = useMemo(() => new Map(productos.map(p => [p.id, p.titulo] as const)), [productos]);
  const pbtaIdx = useMemo(() => new Map(asignados.map(a => [a.id, a] as const)), [asignados]);

  const cuentaVista = useMemo(() => {
    if (!selCuenta) return null;
    const c = cuentas.find(x => x.id === Number(selCuenta));
    if (!c) return null;
    const asg = pbtaIdx.get(c.id_producto_bancario_asignado || -1) || null;
    const tituloProd = asg ? (productosIdx.get(asg.idProductoBancario) ?? `Producto #${asg.idProductoBancario}`) : '—';
    const mon = monedaIdx.get(c.id_moneda_tipo);
    const simbolo = mon?.simbolo ?? '';
    return {
      ...c,
      tituloProd,
      simbolo,
    };
  }, [selCuenta, cuentas, pbtaIdx, productosIdx, monedaIdx]);

  /* ===== Cargar transacciones (Generar) ===== */
  const generar = useCallback(async () => {
    if (!selCuenta) return;
    setLoading(true);
    setErr(null);
    try {
      const { data } = await api.get<TransaccionRaw[]>(TRANSACCIONES_BY_CUENTA(Number(selCuenta)), {
        headers: { Accept: 'application/json, text/plain, */*' },
      });
      setRows(data ?? []);
    } catch (e: any) {
      setErr(e?.message || 'No se pudo generar el reporte');
      setRows([]);
    } finally {
      setLoading(false);
    }
  }, [selCuenta]);

  /* ===== Vista de filas (debe/haber) ===== */
  type Vista = {
    id: number;
    fecha: string;
    titulo: string;
    debe: number;
    haber: number;
    nota?: string;
  };

  const vistas = useMemo<Vista[]>(() => {
    if (!selCuenta) return [];
    const dIni = new Date(`${desde}T00:00:00`);
    const dFin = new Date(`${hasta}T23:59:59`);

    const filtradas = (rows ?? []).filter(t => {
      const f = new Date(t.fecha_realizado ?? (t as any).fecha ?? '');
      return !Number.isNaN(f.getTime()) && f >= dIni && f <= dFin;
    });

    const cuentaId = Number(selCuenta);

    return filtradas.map(t => {
      const f = (t.fecha_realizado ?? '').slice(0, 10) || '';
      const esDebe  = t.id_producto_bancario_usuario_envia  === cuentaId;
      const esHaber = t.id_producto_bancario_usuario_recibe === cuentaId;

      let titulo = '';
      if (esDebe)  titulo = `Envío a #${t.id_producto_bancario_usuario_recibe}`;
      if (esHaber) titulo = `Recibo de #${t.id_producto_bancario_usuario_envia}`;

      return {
        id: t.id,
        fecha: f,
        titulo,
        debe:  esDebe  ? Number(t.monto) : 0,
        haber: esHaber ? Number(t.monto) : 0,
        nota: t.nota ?? '',
      };
    });
  }, [rows, selCuenta, desde, hasta]);

  /* ===== Paginación ===== */
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  useEffect(() => setPage(1), [selCuenta, desde, hasta, rows.length]);

  const totalPages = Math.max(1, Math.ceil(vistas.length / pageSize));
  const safePage = Math.min(page, totalPages);
  const start = (safePage - 1) * pageSize;
  const paged = vistas.slice(start, start + pageSize);

  /* ===== Totales ===== */
  const totales = useMemo(() => {
    return vistas.reduce(
      (acc, r) => {
        acc.debe += Number(r.debe) || 0;
        acc.haber += Number(r.haber) || 0;
        return acc;
      },
      { debe: 0, haber: 0 }
    );
  }, [vistas]);

  /* ===== Exportar ===== */
  const onExportExcel = () => {
    if (!cuentaVista) return;
    const meta = {
      Cuenta: `#${cuentaVista.id} — ${cuentaVista.tituloProd}`,
      Moneda: cuentaVista.simbolo || '',
      Desde: desde,
      Hasta: hasta,
      Generado: yyyymmdd(),
    };

    const data = vistas.map(v => ({
      Fecha: v.fecha,
      Descripción: v.titulo,
      Comentario: v.nota ?? '',
      Debe: v.debe,
      Haber: v.haber,
    }));

    // Una hoja “plana”: primero metadatos en filas, luego una fila vacía, luego encabezados + datos
    const rows: Record<string, any>[] = [];
    Object.entries(meta).forEach(([k, val]) => rows.push({ Campo: k, Valor: val }));
    rows.push({}); // separador
    if (data.length) {
      rows.push(Object.keys(data[0]).reduce((a, k) => ({ ...a, [k]: k }), {}));
      data.forEach(r => rows.push(r));
    }
    rows.push({});
    rows.push({ Totales: '', Debe: totales.debe, Haber: totales.haber });

    exportCSV(`reporte_cuenta_${cuentaVista.id}_${desde}_${hasta}.csv`, rows);
  };

  const onExportPDF = () => {
    if (!cuentaVista) return;
    const tHead = `
      <tr>
        <th>Fecha</th>
        <th>Descripción</th>
        <th>Comentario</th>
        <th class="num">Debe</th>
        <th class="num">Haber</th>
      </tr>
    `;
    const tRows = vistas.map(v => `
      <tr>
        <td>${v.fecha}</td>
        <td>${v.titulo}</td>
        <td>${v.nota ?? ''}</td>
        <td class="num">${nf.format(v.debe)}</td>
        <td class="num">${nf.format(v.haber)}</td>
      </tr>
    `).join('');

    const html = `
      <h1>Reporte de cuenta</h1>
      <div class="meta">
        <div><strong>Cuenta:</strong> #${cuentaVista.id} — ${cuentaVista.tituloProd}</div>
        <div><strong>Moneda:</strong> ${cuentaVista.simbolo || '—'}</div>
        <div><strong>Periodo:</strong> ${desde} a ${hasta}</div>
        <div><strong>Generado:</strong> ${yyyymmdd()}</div>
      </div>
      <table>
        <thead>${tHead}</thead>
        <tbody>${tRows}</tbody>
        <tfoot>
          <tr>
            <th colspan="3" style="text-align:right">Totales</th>
            <th class="num">${nf.format(totales.debe)}</th>
            <th class="num">${nf.format(totales.haber)}</th>
          </tr>
        </tfoot>
      </table>
    `;
    exportPrintHTML('Reporte de cuenta', html);
  };

  return (
    <>
      <div className="header-row">
        <h1 className="page-title">Reporte de cuenta</h1>
      </div>

      {/* Si no quieres mostrar errores en rojo, comenta la línea siguiente */}
      {/* {err && <div className="error" style={{ marginBottom: 12 }}>{err}</div>} */}
      {loading && <div style={{ opacity: .7, marginBottom: 12 }}>Cargando…</div>}

      <div className="card" style={{ padding: 12, marginBottom: 12 }}>
        <div className="form" style={{ display: 'grid', gridTemplateColumns: '1.2fr 0.6fr 0.6fr auto auto', gap: 12 }}>
          {/* Cuenta */}
          <div className="form-row">
            <label>Cuenta</label>
            <select
              value={selCuenta === '' ? '' : String(selCuenta)}
              onChange={e => setSelCuenta(e.currentTarget.value === '' ? '' : Number(e.currentTarget.value))}
            >
              <option value="">Seleccione…</option>
              {cuentas.map(c => {
                const asg = pbtaIdx.get(c.id_producto_bancario_asignado || -1) || null;
                const tituloProd = asg ? (productosIdx.get(asg.idProductoBancario) ?? `Producto #${asg.idProductoBancario}`) : '—';
                const simbolo = monedaIdx.get(c.id_moneda_tipo)?.simbolo || '';
                return (
                  <option key={c.id} value={c.id}>
                    {`#${c.id} — ${simbolo}${nf.format(Number(c.disponible ?? 0))} — ${tituloProd}`}
                  </option>
                );
              })}
            </select>
          </div>

          {/* Fechas */}
          <div className="form-row">
            <label>Desde</label>
            <input type="date" value={desde} onChange={e => setDesde(e.currentTarget.value)} />
          </div>
          <div className="form-row">
            <label>Hasta</label>
            <input type="date" value={hasta} onChange={e => setHasta(e.currentTarget.value)} />
          </div>

          {/* Acciones */}
          <div className="form-row" style={{ alignSelf: 'end' }}>
            <button className="btn primary" onClick={generar} disabled={!selCuenta || loading}>
              Generar
            </button>
          </div>
          <div className="form-row" style={{ alignSelf: 'end', display: 'flex', gap: 8 }}>
            <button className="btn" onClick={onExportExcel} disabled={!vistas.length}>Exportar Excel</button>
            <button className="btn" onClick={onExportPDF}   disabled={!vistas.length}>Exportar PDF</button>
          </div>
        </div>
      </div>

      {/* Tabla */}
      <div className="table-wrap">
        <table className="table">
          <thead>
            <tr>
              <th style={{ width: 130 }}>Fecha</th>
              <th>Descripción</th>
              <th>Comentario</th>
              <th style={{ width: 140 }}>Debe</th>
              <th style={{ width: 140 }}>Haber</th>
            </tr>
          </thead>
          <tbody>
            {paged.length === 0 ? (
              <tr><td colSpan={5} style={{ opacity: .7 }}>Sin movimientos…</td></tr>
            ) : paged.map(r => (
              <tr key={r.id}>
                <td>{r.fecha}</td>
                <td>{r.titulo}</td>
                <td>{r.nota ?? ''}</td>
                <td className="num">{r.debe ? nf.format(r.debe) : ''}</td>
                <td className="num">{r.haber ? nf.format(r.haber) : ''}</td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr>
              <th colSpan={3} style={{ textAlign: 'right' }}>Totales (filtrados)</th>
              <th className="num">{nf.format(totales.debe)}</th>
              <th className="num">{nf.format(totales.haber)}</th>
            </tr>
          </tfoot>
        </table>
      </div>

      {/* Paginación */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 8 }}>
        <div style={{ opacity: .7, fontSize: 12 }}>
          Página {safePage} de {totalPages}
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button className="btn small" onClick={() => setPage(p => Math.max(1, p - 1))} disabled={safePage <= 1}>
            « Anterior
          </button>
          <button className="btn small" onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={safePage >= totalPages}>
            Siguiente »
          </button>
          <select
            className="input"
            value={String(pageSize)}
            onChange={e => setPageSize(Number(e.currentTarget.value))}
            style={{ width: 90 }}
            title="Filas por página"
          >
            {[10, 20, 50].map(n => <option key={n} value={n}>{n}/pág</option>)}
          </select>
        </div>
      </div>
    </>
  );
}