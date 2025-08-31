// Lo que envía el backend (snake)
export type UsuarioTipoMenuRaw = {
  id: number;
  id_usuario_tipo: number;
  id_menu: number;
  can_view: boolean;
  include_ancestors: boolean;
  include_descendants: boolean;
  estado: number;            // 0 | 1
  fecha?: string | null;
  id_usuario?: number | null;
};

// Normalizado para el front
export type UsuarioTipoMenu = {
  id: number;
  id_usuario_tipo: number;
  id_menu: number;
  can_view: boolean;
  include_ancestors: boolean;
  include_descendants: boolean;
  estado: 0 | 1;
  fecha?: string | null;
  id_usuario?: number | null;
};

export type UsuarioTipoMenuSave = Omit<UsuarioTipoMenu, 'id'> & { id?: number };

// Catálogos
export type UsuarioTipoLite = { id: number; titulo: string };
export type MenuLite = { id: number; label: string };