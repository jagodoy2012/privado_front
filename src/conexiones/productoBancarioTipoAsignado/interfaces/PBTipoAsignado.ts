// Tipos compartidos mínimos para los combos (solo lo que usamos)
export type Estado = 0 | 1;

export type ProductoBancarioLite = { id: number; titulo: string };
export type ProductoBancarioTipoLite = { id: number; titulo: string };
export type TipoCuentaTarjetaLite = { id: number; titulo: string };

// Registro principal
export type PBTipoAsignado = {
  id: number;
  idProductoBancario: number;
  idProductoBancarioTipo: number;
  id_categoria: number;                      // 👈 NUEVO
  estado: Estado;
  fecha?: string | null;
  idUsuario?: number | null;
};

// Body de creación/edición
export type PBTipoAsignadoSave = {
  idProductoBancario: number;
  idProductoBancarioTipo: number;
  id_categoria: number;                      // 👈 NUEVO
  estado: Estado;
};