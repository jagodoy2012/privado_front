import type { FormEvent } from 'react';
import { EmailField, PasswordField, RememberForgot, Messages, SubmitButton } from '../components';
import { useLogin } from '../hooks/useLogin';
import '../../styles/login.css';

export default function Login() {
  const {
    correo, contrasena, showPwd, remember, loading, err, ok,
    setCorreo, setContrasena, setShowPwd, setRemember, submit
  } = useLogin();

  function onSubmit(e: FormEvent) {
    e.preventDefault();
    submit();
  }

  return (
    <main className="login-wrap">
      <form className="login-card" onSubmit={onSubmit} noValidate>
        <h1 className="login-title">Iniciar sesión</h1>
        <p className="login-sub">Accede con tus credenciales para continuar.</p>

        <EmailField value={correo} onChange={setCorreo} />
        <PasswordField
          value={contrasena}
          show={showPwd}
          onChange={setContrasena}
          onToggleShow={() => setShowPwd(v => !v)}
        />
        <RememberForgot
          remember={remember}
          onToggle={setRemember}
          onForgot={() => alert('Implementa flujo de recuperación.')}
        />

        <SubmitButton loading={loading} />
        <Messages error={err} ok={ok} />

        <p className="small">
          ¿No tienes cuenta?{' '}
          <a className="link" href="#" onClick={(e) => e.preventDefault()}>
            Regístrate
          </a>
        </p>
      </form>
    </main>
  );
}
