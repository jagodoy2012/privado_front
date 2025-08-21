import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import '../styles/layout.css'; // estilos globales
import '../styles/usuarios.css'
import '../styles/usuarioTipo.css'
import '../styles/globals.css';
import '../styles/Modal.css';


export default function AppLayout() {
  return (
    <div className="app-shell">
      <Sidebar />
      <main className="app-content">
        <Outlet />
      </main>
    </div>
  );
}
