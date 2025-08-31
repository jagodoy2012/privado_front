export type Estado = 0 | 1;

export type ProductoBancario = {
  id: number;
  titulo: string;
  descripcion?: string | null;
  estado: Estado;
  fecha?: string | null;
  id_usuario?: number | null;
};

export type ProductoBancarioSave = {
  titulo: string;
  descripcion?: string | null;
  estado: Estado;
};