// src/User/remesas/helpers/codigos.ts
export function generarCodigoUnicoNoRepetido(
  existentes: Iterable<string>,
  prefijo = 'PG'
): string {
  const set = new Set(existentes);

  for (let i = 0; i < 5000; i++) {
    let bloque: string;

    // Tipado compatible incluso si no tienes "dom" en tsconfig
    const g: any = (globalThis ?? window ?? {}) as any;
    if (g.crypto && typeof g.crypto.getRandomValues === 'function') {
      const buf = new Uint32Array(2);
      g.crypto.getRandomValues(buf);
      bloque =
        (buf[0] >>> 0).toString(36).slice(0, 4).toUpperCase() +
        (buf[1] >>> 0).toString(36).slice(0, 4).toUpperCase();
    } else {
      // Fallback sin WebCrypto
      bloque =
        Math.random().toString(36).slice(2, 6).toUpperCase() +
        Date.now().toString(36).slice(-4).toUpperCase();
    }

    const codigo = `${prefijo}${bloque}`;
    if (!set.has(codigo)) return codigo;
  }

  throw new Error('No se pudo generar un código único para no_pago');
}