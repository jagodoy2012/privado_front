// Tipos mínimos reutilizando el naming que ya vienes usando en el proyecto

export type Estado = 0 | 1;

export type MonedaLite = {
  id: number;
  titulo?: string | null;
  simbolo?: string | null;
};

export type ProductoBancario = {
  id: number;
  titulo: string;
};

export type PBTipoAsignado = {
  id: number;
  idProductoBancario: number;        // nombre en tu swagger (producto_bancario_tipo_asignado)
  idProductoBancarioTipo: number;
  id_categoria?: number | null;
  estado: Estado;
};

export type Cuenta = {
  id: number;
  id_usuario_producto: number;
  id_producto_bancario_asignado: number;
  id_moneda_tipo: number;
  disponible: number;
};

export type TransaccionRaw = {
  id: number;
  id_producto_bancario_usuario_envia: number;
  id_producto_bancario_usuario_recibe: number;
  id_operaciones?: number;
  id_moneda_tipo?: number;
  monto: number;
  fecha_realizado?: string | null;  // ISO
    fecha?: string | null;           

  comentario?: string | null;
};

// Fila “vista” en la tabla
export type TransaccionVista = {
  id: number;
  fecha: string;
  titulo: string;
  debe: number;
  haber: number;
};