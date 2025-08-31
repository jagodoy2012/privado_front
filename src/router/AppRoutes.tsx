import { Routes, Route, Navigate } from 'react-router-dom';
import Login from '../auth/pages/Login';

import ProtectedRoute from './ProtectedRoute';
import AppLayout from '../layout/AppLayout';

// importa tus páginas privadas
import Usuarios from '../User/pages/Usuarios';
import UsuarioTipo from '../User/usuariosTipos/pages/UsuarioTipo';
import UsuarioDireccionTipoPage from '../User/usuariosDireccion/pages/UsuarioDireccionTipoPage';
import TarjetasTipos from '../mantenimientos/tiposCuentasTarjetas/pages/TarjetasTipos';
import CuentasTiposPage from '../mantenimientos/cuentasTipos/pages/CuentasTipos';
import MonedaTipos from '../mantenimientos/monedatipo/pages/MonedaTipos';
import ProductoBancarioTipos from '../mantenimientos/productoBancarioTipos/pages/ProductoBancarioTipos';
import Operaciones from '../mantenimientos/operaciones/pages/Operaciones';
import ProductoBancarios from '../mantenimientos/productoBancario/pages/ProductoBancarios';
import Remesas from '../mantenimientos/remesas/pages/Remesas';
import MonedaTipoCambioApis from '../mantenimientos/monedatipocambioapis/pages/MonedaTipoCambioApis';
import Asignados from '../conexiones/opProductosTipoAsignado/pages/Asignados';
import PBTipoAsignados from '../conexiones/productoBancarioTipoAsignado/pages/PBTipoAsignados';
import ProductoBancarioUsuarios from '../conexiones/productoBancarioUsuario/pages/ProductoBancarioUsuario';
import MenusPage from '../mantenimientos/menu/pages/Menus';
import UsuarioTipoMenusPage from '../User/usuariotipomenu/pages/UsuarioTipoMenus';
import CuentaOperacionesPage from '../assets/usuarios/cuentas/pages/CuentaOperaciones';
import TarjetaPagosPage from '../assets/usuarios/tarjetas/pages/TarjetaPagosPage';
import RemesasPage from '../assets/usuarios/remesas/pages/RemesasPage';
import ReporteCuentaPage from '../assets/usuarios/historicos/pages/ReporteCuentaPage';

export default function AppRoutes() {
  return (
    <Routes>
      {/* Pública */}
      <Route path="/login" element={<Login />} />

      {/* Privadas: usan el layout con sidebar */}
      <Route
        path="/"
        element={
          <ProtectedRoute>
            <AppLayout />
          </ProtectedRoute>
        }
      >
        {/* / -> Dashboard */}
        <Route index element={(() => {
        const paginaInicio = localStorage.getItem("id_usuario_tipo"); 
        if (paginaInicio === "2") {
          return <Usuarios />;
        } else {
          return <Usuarios />; // default
        }
      })()} />
        {/* /usuarios -> página de usuarios */} 
        <Route path="usuarios" element={<Usuarios />} />
          <Route path="tipos" element={<UsuarioTipo />} /> 
            <Route path="tiposDireccion" element={<UsuarioDireccionTipoPage />} /> 
            <Route path="tarjetasTipos" element={<TarjetasTipos />} /> 
            <Route path="cuentasTipos" element={<CuentasTiposPage />} /> 
            <Route path="monedasTipos" element={<MonedaTipos />} /> 
            <Route path="productoBancarioTipo" element={<ProductoBancarioTipos />} /> 
            <Route path="operaciones" element={<Operaciones />} /> 
            <Route path="productoBancario" element={<ProductoBancarios />} /> 
            <Route path="remesa" element={<Remesas />} /> 
            <Route path="monedasTiposApi" element={<MonedaTipoCambioApis />} /> 
            <Route path="operacioensProducto" element={<Asignados />} /> 
            <Route path="ProductoBancarioAsig" element={<PBTipoAsignados />} /> 
            <Route path="ProductoBancarioAsigUsu" element={<ProductoBancarioUsuarios />} /> 
            <Route path="menus" element={<MenusPage />} /> 
            <Route path="usuarioTipoMenu" element={<UsuarioTipoMenusPage />} /> 
            <Route path="cuentaOperaciones" element={<CuentaOperacionesPage />} /> 
            <Route path="tarjetaPagos" element={<TarjetaPagosPage />} /> 
            <Route path="remesaUsuario" element={<RemesasPage />} /> 
            <Route path="reporte" element={<ReporteCuentaPage />} /> 

            

            
            
            
            

      </Route>
       
      {/* Catch-all */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
