export type Estado = 0 | 1;

export type Operacion = {
  id: number;
  titulo: string;
  descripcion?: string | null;
  estado: Estado;
  fecha?: string | null;
  id_usuario?: number | null;
};

export type OperacionSave = {
  titulo: string;
  descripcion?: string | null;
  estado: Estado;
};