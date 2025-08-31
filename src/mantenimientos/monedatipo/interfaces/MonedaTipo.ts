export type Estado = 0 | 1;

export interface MonedaTipo {
  id: number;
  titulo: string | null;
  descripcion?: string | null;
  simbolo: string | null;
  estado: Estado | null;
  fecha?: string | null;
  id_usuario?: number | null;
}

export interface MonedaTipoSave {
  titulo: string;
  descripcion?: string | null;
  simbolo: string;
  estado: Estado;
}