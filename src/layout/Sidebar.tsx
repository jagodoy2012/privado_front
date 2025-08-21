import { NavLink, useNavigate, useLocation } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { api } from '../lib/api';

export default function Sidebar() {
  const navigate = useNavigate();
  const { pathname } = useLocation();

  // abrir submenú si estás en /usuarios/*
  const [openUsuarios, setOpenUsuarios] = useState(() => pathname.startsWith('/usuarios'));
  useEffect(() => {
    if (pathname.startsWith('/usuarios')) setOpenUsuarios(true);
  }, [pathname]);
   const [openMantenimientos, setOpenMantenimientos] = useState(() => pathname.startsWith('/tarjetasTipos'));
  useEffect(() => {
    if (pathname.startsWith('/tarjetasTipos')) setOpenMantenimientos(true);
  }, [pathname]);

  function logout() {
    localStorage.removeItem('token');
    sessionStorage.removeItem('token');
    delete api.defaults.headers.common.Authorization;
    navigate('/login', { replace: true });
  }

  return (
    <aside className="sidebar">
      <div className="brand">Mi App</div>

      <nav className="nav">
        <NavLink to="/" end className={({isActive}) => isActive ? 'link active' : 'link'}>
          Dashboard
        </NavLink>

        {/* Item padre + botón para abrir/cerrar submenú */}
        <div className="menu-item">
          <button
            type="button"
            className="link link-parent"
            aria-expanded={openUsuarios}
            aria-controls="submenu-usuarios"
            onClick={() => setOpenUsuarios(v => !v)}
          >
            <span>Usuarios</span>
            <span className={`chev ${openUsuarios ? 'open' : ''}`} aria-hidden>▾</span>
          </button>

          <div
            id="submenu-usuarios"
            className={`submenu ${openUsuarios ? 'open' : ''}`}
            role="group"
            aria-label="Submenú de Usuarios"
          >
            <NavLink
              to="/usuarios"
              end
              className={({isActive}) => isActive ? 'sublink active' : 'sublink'}
            >
              Lista
            </NavLink>
            <NavLink
              to="tipos"
              className={({isActive}) => isActive ? 'sublink active' : 'sublink'}
            >
              Tipos de usuario
            </NavLink>
                       <NavLink
              to="tiposDireccion"
              className={({isActive}) => isActive ? 'sublink active' : 'sublink'}
            >
              Tipos de direcciones de usuario
            </NavLink>
            {/* más hijos si quieres:
            <NavLink to="/usuarios/nuevo" className={({isActive}) => isActive ? 'sublink active' : 'sublink'}>
              Nuevo
            </NavLink> */}
          </div>
        </div>




         {/* Item padre + botón para abrir/cerrar submenú */}
        <div className="menu-item">
          <button
            type="button"
            className="link link-parent"
            aria-expanded={openMantenimientos}
            aria-controls="submenu-mantenimientos"
            onClick={() => setOpenMantenimientos(v => !v)}
          >
            <span>Mantenimientos</span>
            <span className={`chev ${openMantenimientos ? 'open' : ''}`} aria-hidden>▾</span>
          </button>

          <div
            id="submenu-mantenimientos"
            className={`submenu ${openMantenimientos  ? 'open' : ''}`}
            role="group"
            aria-label="Submenú de Mantenimientos"
          >
            <NavLink
              to="/tarjetasTipos"
              end
              className={({isActive}) => isActive ? 'sublink active' : 'sublink'}
            >
              Tipos de tarjetas
            </NavLink>
            <NavLink
              to="cuentasTipos"
              className={({isActive}) => isActive ? 'sublink active' : 'sublink'}
            >
              Tipos de cuenta
            </NavLink>
               <NavLink
              to="monedasTipos"
              className={({isActive}) => isActive ? 'sublink active' : 'sublink'}
            >
              Tipos de monedas
            </NavLink>
               <NavLink
              to="remesa"
              className={({isActive}) => isActive ? 'sublink active' : 'sublink'}
            >
              Remesas
            </NavLink>
            <NavLink
              to="productoBancario"
              className={({isActive}) => isActive ? 'sublink active' : 'sublink'}
            >
              Producto Bancario
            </NavLink>
            <NavLink
              to="productoBancarioTipo"
              className={({isActive}) => isActive ? 'sublink active' : 'sublink'}
            >
              Tipo de producto Bancario
            </NavLink>
            <NavLink
              to="operaciones"
              className={({isActive}) => isActive ? 'sublink active' : 'sublink'}
            >
              Operaciones
            </NavLink>
            {/* más hijos si quieres:
            <NavLink to="/usuarios/nuevo" className={({isActive}) => isActive ? 'sublink active' : 'sublink'}>
              Nuevo
            </NavLink> */}
          </div>
        </div>
















        <NavLink to="/ajustes" className={({isActive}) => isActive ? 'link active' : 'link'}>
          Ajustes
        </NavLink>
      </nav>

      <div className="spacer" />
      <button className="logout" onClick={logout}>Cerrar sesión</button>
    </aside>
  );
}
