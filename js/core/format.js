/** Formato numérico consistente para toda la interfaz (coma decimal). */

export function fmt(value, digits = 3) {
  let numero = value;
  if (numero && typeof numero.toNumber === 'function') numero = numero.toNumber();
  if (typeof numero !== 'number' || !Number.isFinite(numero)) return '—';
  if (Math.abs(numero) < 10 ** -digits / 2) numero = 0;

  const redondeado = Number(numero.toFixed(digits));
  let texto = String(redondeado);
  if (texto.includes('e')) texto = numero.toFixed(digits);
  return texto.replace('.', ',').replace('-', '−');
}

export function fmtVector(vector, digits = 3) {
  return `(${vector.map((valor) => fmt(valor, digits)).join(', ')})`;
}

export function fmtSigned(value, digits = 3) {
  const numero = value && typeof value.toNumber === 'function' ? value.toNumber() : value;
  if (Math.abs(numero) < 10 ** -digits / 2) return '0';
  return `${numero > 0 ? '+' : '−'} ${fmt(Math.abs(numero), digits)}`;
}

export function fmtAngle(value) {
  return `${fmt(value, 1)}°`;
}

export function plural(cantidad, singular, plural_) {
  return cantidad === 1 ? singular : plural_;
}
