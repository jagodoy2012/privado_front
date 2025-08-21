export interface UsuarioTipo {
  id: number;
  titulo: string | null;
  descripcion: string | null;
  estado: number | null; // 0=inactivo, 1=activo
}