export interface UsuarioDireccionTipo {
  id: number;
  titulo: string | null;
  descripcion: string | null;
  estado: number | null; // 0 inactivo, 1 activo
}