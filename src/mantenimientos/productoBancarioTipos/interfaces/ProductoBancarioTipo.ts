export type Estado = 0 | 1;

export type ProductoBancarioTipo = {
  id: number;
  titulo: string;
  descripcion?: string | null;
  tabla?: string | null;
  estado: Estado;
  fecha?: string | null;
  id_usuario?: number | null;
};

export type ProductoBancarioTipoSave = {
  titulo: string;
  descripcion?: string | null;
  tabla?: string | null;
  estado: Estado;
};