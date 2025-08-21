import { Routes, Route, Navigate } from 'react-router-dom';
import Login from '../auth/pages/Login';

import ProtectedRoute from './ProtectedRoute';
import AppLayout from '../layout/AppLayout';

// importa tus páginas privadas
import Usuarios from '../User/pages/Usuarios';
import UsuarioTipo from '../User/usuariosTipos/pages/UsuarioTipo';
import UsuarioDireccionTipoPage from '../User/usuariosDireccion/pages/UsuarioDireccionTipoPage';
import TarjetasTipos from '../mantenimientos/tarjetasTipos/pages/TarjetasTipos';
import CuentasTiposPage from '../mantenimientos/cuentasTipos/pages/CuentasTipos';

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
        <Route index element={<Usuarios />} />
        {/* /usuarios -> página de usuarios */}
        <Route path="usuarios" element={<Usuarios />} />
          <Route path="tipos" element={<UsuarioTipo />} /> 
            <Route path="tiposDireccion" element={<UsuarioDireccionTipoPage />} /> 
            <Route path="tarjetasTipos" element={<TarjetasTipos />} /> 
            <Route path="cuentasTipos" element={<CuentasTiposPage />} /> 
            

      </Route>
       
      {/* Catch-all */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
