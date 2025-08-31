export type Estado = 0 | 1;

export type Asignado = {
  id: number;
  id_operaciones: number;
  id_producto_bancario: number;
  estado: Estado;
  fecha?: string | null;
  id_usuario?: number | null;
};

export type AsignadoSave = {
  id_operaciones: number;
  id_producto_bancario: number;
  estado: Estado;
};

export type Operacion = { id: number; titulo: string };
export type ProductoBancario = { id: number; titulo: string };