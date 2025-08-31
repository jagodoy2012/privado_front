// layout/Sidebar.tsx
import { NavLink, useNavigate, useLocation } from 'react-router-dom';
import { useEffect, useMemo, useState, useCallback } from 'react';
import { api } from '../lib/api';
import type { MenuItem, MenuNodeApi } from './interfaces/menu';
import { buildMenuTree, treeHasPath, flattenMenuTree, type MenuNode } from './helper/menuTree';

export default function Sidebar() {
  const navigate = useNavigate();
  const { pathname } = useLocation();

  const [loading, setLoading] = useState(true);
  const [items, setItems] = useState<MenuItem[]>([]);
  const [err, setErr] = useState<string | null>(null);
  const [openSet, setOpenSet] = useState<Set<number>>(new Set());

  // Cargar menú del tipo de usuario (el API devuelve ÁRBOL)
  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        setLoading(true);
        setErr(null);

        const idUsuarioTipo = Number(localStorage.getItem('id_usuario_tipo') ?? 0);
        if (!idUsuarioTipo) {
        console.log("id_tipo: " + idUsuarioTipo)
          setItems([]);
          return;
        }
        const resp = await api.get<MenuNodeApi[]>(`/api/menus/tipo/${idUsuarioTipo}`, {
          headers: { Accept: 'application/json, text/plain, */*' },
        });

        if (!mounted) return;

        // Adaptar árbol -> plano (para mantener tu flujo actual)
        const flat = flattenMenuTree(resp.data ?? []);
        setItems(flat);
      } catch (e: any) {
        if (!mounted) return;
        setErr(e?.message || 'No se pudo cargar el menú');
        setItems([]);
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => { mounted = false; };
  }, []);

  // Armar el árbol con tu helper (queda igual)
  const tree = useMemo<MenuNode[]>(() => buildMenuTree(items), [items]);

  // Abrir automáticamente los padres que contienen la ruta actual
  useEffect(() => {
    const next = new Set<number>();
    const visit = (node: MenuNode, ancestors: MenuNode[]) => {
      if (treeHasPath(node, pathname)) {
        for (const a of ancestors) next.add(a.id);
      }
      for (const ch of node.children) visit(ch, [...ancestors, node]);
    };
    for (const root of tree) visit(root, []);
    setOpenSet(next);
  }, [tree, pathname]);

  // Toggle abrir/cerrar
  const toggle = useCallback((id: number) => {
    setOpenSet(prev => {
      const n = new Set(prev);
      n.has(id) ? n.delete(id) : n.add(id);
      return n;
    });
  }, []);

  function logout() {
    localStorage.removeItem('token');
    sessionStorage.removeItem('token');
    delete api.defaults.headers.common.Authorization;
    navigate('/login', { replace: true });
  }

  return (
    <aside className="sidebar">
      <div className="brand">MI UMG BANK</div>

      <nav className="nav">
       

        {loading && <div style={{opacity:.7, padding:'8px 12px'}}>Cargando menú…</div>}
        {err && <div className="error" style={{margin:'8px 12px'}}>{err}</div>}

        {!loading && !err && tree.map(node => (
          <MenuBranch key={node.id} node={node} openSet={openSet} toggle={toggle} level={0} />
        ))}

       
      </nav>

      <div className="spacer" />
      <button className="logout" onClick={logout}>Cerrar sesión</button>
    </aside>
  );
}

/* ======= render recursivo ======= */
function MenuBranch({
  node, openSet, toggle, level
}: {
  node: MenuNode;
  openSet: Set<number>;
  toggle: (id: number) => void;
  level: number;
}) {
  const isOpen = openSet.has(node.id);
  const isContainer = node.path == null || node.path === '';

  if (isContainer) {
    return (
      <div className="menu-item" style={{ marginLeft: level ? 8 : 0 }}>
      <button
  type="button"
  className="link link-parent"
  aria-expanded={isOpen}
  aria-controls={`submenu-${node.id}`}
  onClick={() => toggle(node.id)}
>
  <span className="label">{node.label}</span>
  <span className={`chev ${isOpen ? 'open' : ''}`} aria-hidden>▾</span>
</button>
        <div
          id={`submenu-${node.id}`}
          className={`submenu ${isOpen ? 'open' : ''}`}
          role="group"
          aria-label={`Submenú de ${node.label}`}
        >
          {node.children.map(ch => (
            <MenuBranch key={ch.id} node={ch} openSet={openSet} toggle={toggle} level={level + 1} />
          ))}
        </div>
      </div>
    );
  }

  const to = node.path?.startsWith('/') ? node.path : `/${node.path}`;

  if (node.children.length === 0) {
    return (
      <NavLink
        to={to}
        end
        className={({isActive}) => isActive ? 'link active' : 'link'}
        style={{ marginLeft: level ? 8 : 0 }}
      >
        {node.label}
      </NavLink>
    );
  }

  return (
    <div className="menu-item" style={{ marginLeft: level ? 8 : 0 }}>
      <div className="link-parent-with-link">
        <NavLink to={to} end={false} className={({isActive}) => isActive ? 'link active' : 'link'}>
          {node.label}
        </NavLink>
        <button
          type="button"
          className="link link-parent"
          aria-expanded={isOpen}
          aria-controls={`submenu-${node.id}`}
          onClick={() => toggle(node.id)}
          style={{ marginLeft: 8 }}
        >
          <span className={`chev ${isOpen ? 'open' : ''}`} aria-hidden>▾</span>
        </button>
      </div>
      <div
        id={`submenu-${node.id}`}
        className={`submenu ${isOpen ? 'open' : ''}`}
        role="group"
        aria-label={`Submenú de ${node.label}`}
      >
        {node.children.map(ch => (
          <MenuBranch key={ch.id} node={ch} openSet={openSet} toggle={toggle} level={level + 1} />
        ))}
      </div>
    </div>
  );
}