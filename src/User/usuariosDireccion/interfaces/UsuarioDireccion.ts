export interface UsuarioDireccion {
  id: number;
  direccion: string | null;
  id_zona: number | null;
  id_usuario_direccion_tipo: number | null;
  estado: number | null;          // 0 inactivo, 1 activo
  id_usuario: number | null;
}
