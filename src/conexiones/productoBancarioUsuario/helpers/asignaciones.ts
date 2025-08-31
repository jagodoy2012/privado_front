// helpers/asignaciones.ts

export type Mini = { id: number; titulo?: string };

export type AsignadoLite = {
  id: number;
  id_producto_bancario: number;
  id_producto_bancario_tipo: number;
  id_categoria: number;
};

export type AsignacionIndices = {
  asignadosById: Map<number, AsignadoLite>;
  pbById: Map<number, Mini>;
  pbtById: Map<number, Mini>;
  catById: Map<number, Mini>;
};

/** Etiqueta "Producto — Tipo / Categoría" a partir del id de asignación */
export function labelAsignacion(
  pbaId: number,
  { asignadosById, pbById, pbtById, catById }: AsignacionIndices
): string {
  const a = asignadosById.get(pbaId);
  
  if (!a) return String(pbaId);

  const pb  = pbById.get(a.id_producto_bancario)?.titulo ?? '-';
  const pbt = pbtById.get(a.id_producto_bancario_tipo)?.titulo ?? '-';
  const cat = catById.get(a.id_categoria)?.titulo ?? '-';


  return `${pb} — ${pbt} - ${cat}`;
}