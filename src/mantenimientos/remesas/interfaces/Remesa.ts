export type Estado = 0 | 1;


export type Remesa = {
  id: number;
  // id_producto_bancario_usuario: number; // (se usa internamente pero no se muestra)
  fecha_envio: string | null;              // ISO o null
  nombre_remitente: string;
  nombre_receptor: string;
  id_moneda_tipo: number;                  // <- SIEMPRE number en el modelo
  monto: number;                           // número decimal
  no_pago: string;                         // código único autogenerado
  estado: Estado;
  fecha?: string | null;
  id_usuario?: number | null;
};

export type RemesaSave = {
  fecha_envio?: string | null;
  nombre_remitente: string;
  nombre_receptor: string;
  id_moneda_tipo: number;                  // <- number (convertimos en el onSubmit)
  monto: number;
  no_pago: string;
  estado: Estado;
};

export type MonedaTipo = { id: number; titulo: string };