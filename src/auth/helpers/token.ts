// Decodifica un JWT (base64url) sin verificar firma (solo lectura de payload)
export function decodeJwt<T = any>(token: string): T | null {
  try {
    const [, payload] = token.split('.');
    if (!payload) return null;
    const base64 = payload.replace(/-/g, '+').replace(/_/g, '/');
    const json = decodeURIComponent(
      atob(base64)
        .split('')
        .map(c => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join('')
    );
    return JSON.parse(json) as T;
  } catch {
    return null;
  }
}

export function isTokenExpired(token: string, skewSeconds = 10): boolean {
  const payload = decodeJwt<{ exp?: number }>(token);
  if (!payload?.exp) return true; // si no hay exp, trátalo como inválido
  const now = Math.floor(Date.now() / 1000);
  return payload.exp <= now + skewSeconds;
}

export function getStoredToken(): string | null {
  return localStorage.getItem('token') || sessionStorage.getItem('token');
}

export function clearStoredToken() {
  localStorage.removeItem('token');
  sessionStorage.removeItem('token');
}
