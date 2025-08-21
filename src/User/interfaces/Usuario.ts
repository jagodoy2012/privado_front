export interface Usuario {
  id: number;
  nombres: string | null;
  apellidos: string | null;
  telefono: string | null;
  fecha_nacimiento: string | null;
  correo: string | null;
  id_usuario_tipo: number | null;
  estado: number | null; // 0 inactivo, 1 activo
}