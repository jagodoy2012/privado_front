// hooks/useLogin.ts
import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { apiRequest, api } from '../../lib/api';
import type { LoginResponse } from '../interface/LoginResponse';


export function useLogin() {
  const [correo, setCorreo] = useState('');
  const [contrasena, setContrasena] = useState('');
  const [showPwd, setShowPwd] = useState(false);
  const [remember, setRemember] = useState(false);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [ok, setOk] = useState<string | null>(null);

  const navigate = useNavigate();
  const location = useLocation();

  async function submit() {
    setErr(null);
    setOk(null);

    if (!correo.trim() || !contrasena.trim()) {
      setErr('Ingresa correo y contraseña.');
      return;
    }

    setLoading(true);
    try {
      const data = await apiRequest<LoginResponse>('/api/usuarios/login', {
        method: 'POST',
        data: { correo, contrasena },
      });

      // guarda token
      if (remember) localStorage.setItem('token', data.token);
      else sessionStorage.setItem('token', data.token);

      // setea Authorization para próximas llamadas
      api.defaults.headers.common.Authorization = `Bearer ${data.token}`;

      setOk(`¡Bienvenido, ${data.nombres}!`);

      // redirige al destino original o al dashboard
      const to = (location.state as any)?.from?.pathname ?? '/';
      navigate(to, { replace: true });
    } catch (e: any) {
      setErr(e.message || 'Error desconocido al iniciar sesión.');
    } finally {
      setLoading(false);
    }
  }

  return {
    correo, contrasena, showPwd, remember, loading, err, ok,
    setCorreo, setContrasena, setShowPwd, setRemember,
    submit,
  };
}
