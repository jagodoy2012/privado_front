export type MenuItemRaw = {
  id: number;
  id_padre: number | null;   // viene así en tu API
  label: string;
  path: string | null;
  sort_order: number;
  is_active: boolean;
};

export type MenuItem = {
  id: number;
  parent_id: number | null;  // normalizado para el front
  label: string;
  path: string | null;
  sort_order: number;
  is_active: boolean;
};

export type MenuSave = Omit<MenuItem, 'id'> & { id?: number };
export type Estado = 0 | 1; // por si lo usas en algún sitio