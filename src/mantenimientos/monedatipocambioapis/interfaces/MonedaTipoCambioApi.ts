// src/User/monedaTipoCambioApi/interfaces/MonedaTipoCambioApi.ts
export type Estado = 0 | 1;

export type MonedaTipoCambioApi = {
  id: number;
  id_moneda_tipo: number;
  url: string;
  estado: Estado;
  fecha?: string | null;
  id_usuario?: number | null;
};

export type MonedaTipoCambioApiSave = {
  id_moneda_tipo: number;   // guardamos el ID
  url: string;
  estado: Estado;
};

// Para el combo / título de moneda
export type MonedaTipo = { id: number; titulo: string };