// layout/interfaces/menu.ts
export type MenuItem = {
  id: number;
  parent_id: number | null;
  label: string;
  path: string | null;     // null => nodo contenedor
  sort_order: number;
  is_active: boolean;
};

// Opcional: tipa la respuesta del API (árbol con children)
export type MenuNodeApi = Omit<MenuItem, 'parent_id'> & {
  children?: MenuNodeApi[];
};