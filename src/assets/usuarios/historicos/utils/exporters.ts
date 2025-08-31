// src/utils/exporters.ts
import { utils, writeFile, type WorkBook } from "xlsx";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

export type ReportRow = {
  fecha: string;   // "YYYY-MM-DD"
  titulo: string;  // descripción corta
  debe: number;    // en número
  haber: number;   // en número
};

export type ReportMeta = {
  cuentaId: number | string;
  cuentaTitulo?: string;       // opcional (ej. "Cuenta #16")
  moneda?: string;             // ej. "Q", "$", "€"
  desde: string;               // "YYYY-MM-DD"
  hasta: string;               // "YYYY-MM-DD"
  generadoPor?: string;        // opcional
};

function totales(rows: ReportRow[]) {
  return rows.reduce(
    (acc, r) => {
      acc.debe  += Number(r.debe)  || 0;
      acc.haber += Number(r.haber) || 0;
      return acc;
    },
    { debe: 0, haber: 0 }
  );
}

function todayyyyymmdd() {
  const d = new Date();
  const p = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}${p(d.getMonth() + 1)}${p(d.getDate())}`;
}

/* ------------------------- Excel ------------------------- */
export function exportReporteExcel(rows: ReportRow[], meta: ReportMeta) {
  const { debe, haber } = totales(rows as any);

  // Encabezado y metadatos
  const aoa: (string | number)[][] = [
    ["Reporte de cuenta"],
    [""],
    ["Cuenta", meta.cuentaTitulo || `#${meta.cuentaId}`],
    ["Moneda", meta.moneda || "—"],
    ["Rango", `${meta.desde} a ${meta.hasta}`],
    ["Generado", meta.generadoPor || ""],
    [""],
    ["Fecha", "Descripción", "Debe", "Haber"],
  ];

  // Filas
  rows.forEach((r) => {
    aoa.push([r.fecha, r.titulo, r.debe, r.haber]);
  });

  // Totales
  aoa.push(["", "Totales", debe, haber]);

  const ws = utils.aoa_to_sheet(aoa);
  // Formatos básicos
  const range = utils.decode_range(ws["!ref"] || "A1:D1");
  for (let R = 0; R <= range.e.r; R++) {
    for (let C = 0; C <= range.e.c; C++) {
      const cellRef = utils.encode_cell({ r: R, c: C });
      const cell = ws[cellRef];
      if (!cell) continue;
      if (C >= 2 && R >= 7) {
        // columnas Debe/Haber (desde fila 8: índice base 1) -> 2 decimales
        cell.z = "0.00";
      }
    }
  }

  const wb: WorkBook = utils.book_new();
  utils.book_append_sheet(wb, ws, "Reporte");
  writeFile(wb, `reporte_cuenta_${meta.cuentaId}_${todayyyyymmdd()}.xlsx`);
}

/* ------------------------- PDF ------------------------- */
export function exportReportePDF(rows: ReportRow[], meta: ReportMeta) {
  const doc = new jsPDF({ unit: "pt", format: "a4" }); // 595x842 aprox.
  const marginX = 40;
  const lineH = 16;

  const { debe, haber } = totales(rows as any);

  // Título
  doc.setFont("helvetica", "bold");
  doc.setFontSize(16);
  doc.text("Reporte de cuenta", marginX, 40);

  // Meta
  doc.setFont("helvetica", "normal");
  doc.setFontSize(11);
  const metaLines = [
    `Cuenta: ${meta.cuentaTitulo || `#${meta.cuentaId}`}`,
    `Moneda: ${meta.moneda || "—"}`,
    `Rango: ${meta.desde} a ${meta.hasta}`,
    meta.generadoPor ? `Generado por: ${meta.generadoPor}` : "",
  ].filter(Boolean);

  metaLines.forEach((txt, i) => {
    doc.text(txt, marginX, 65 + i * lineH);
  });

  // Tabla
  const body = rows.map((r) => [
    r.fecha || "",
    r.titulo || "",
    (Number(r.debe) || 0).toFixed(2),
    (Number(r.haber) || 0).toFixed(2),
  ]);

  autoTable(doc, {
    startY: 65 + metaLines.length * lineH + 10,
    head: [["Fecha", "Descripción", "Debe", "Haber"]],
    body,
    styles: { fontSize: 10 },
    headStyles: { fillColor: [25, 118, 210] },
    foot: [["", "Totales", debe.toFixed(2), haber.toFixed(2)]],
    footStyles: { fillColor: [230, 230, 230] },
    margin: { left: marginX, right: marginX },
  });

  doc.save(`reporte_cuenta_${meta.cuentaId}_${todayyyyymmdd()}.pdf`);
}