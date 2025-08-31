// layout/helper/menuTree.ts
import type { MenuItem, MenuNodeApi } from '../interfaces/menu';

export type MenuNode = MenuItem & { children: MenuNode[] };

// === NUEVO: aplanar el árbol del API al arreglo plano que ya usas ===
export function flattenMenuTree(
  nodes: MenuNodeApi[],
  parent_id: number | null = null,
  acc: MenuItem[] = []
): MenuItem[] {
  for (const n of nodes ?? []) {
    acc.push({
      id: n.id,
      parent_id,
      label: n.label,
      path: n.path ?? null,
      sort_order: n.sort_order ?? 0,
      is_active: n.is_active ?? true,
    });
    if (n.children?.length) flattenMenuTree(n.children, n.id, acc);
  }
  return acc;
}

// === Tus helpers de siempre ===
export function buildMenuTree(items: MenuItem[]): MenuNode[] {
  const byId = new Map<number, MenuNode>();
  const roots: MenuNode[] = [];

  // crear nodos sólo activos
  for (const it of items.filter(i => i.is_active)) {
    byId.set(it.id, { ...it, children: [] });
  }

  // enlazar jerarquía
  for (const node of byId.values()) {
    if (node.parent_id && byId.has(node.parent_id)) {
      byId.get(node.parent_id)!.children.push(node);
    } else {
      roots.push(node);
    }
  }

  // ordenar por sort_order
  const sortRec = (arr: MenuNode[]) => {
    arr.sort((a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0));
    for (const n of arr) sortRec(n.children);
  };
  sortRec(roots);

  return roots;
}

/** ¿Algún descendiente coincide con la ruta actual? */
export function treeHasPath(node: MenuNode, pathname: string): boolean {
  const selfMatch = node.path
    ? pathname === node.path || pathname.startsWith(node.path + '/')
    : false;

  if (selfMatch) return true;
  return node.children.some(ch => treeHasPath(ch, pathname));
}