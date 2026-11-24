/**
 * Aritmética exacta con fracciones.
 *
 * Toda la lógica de Gauss trabaja con objetos Frac en lugar de números de
 * punto flotante. Así los pasos del procedimiento se muestran con valores
 * exactos (1/3, −5/2, …) y no aparecen artefactos como 0.333333333333.
 */

function mcd(a, b) {
  a = Math.abs(a);
  b = Math.abs(b);
  while (b) {
    const t = b;
    b = a % b;
    a = t;
  }
  return a || 1;
}

export class Frac {
  constructor(n = 0, d = 1) {
    if (!Number.isInteger(n) || !Number.isInteger(d)) {
      throw new Error('Frac solo acepta enteros en el numerador y el denominador.');
    }
    if (d === 0) throw new Error('No se puede dividir entre cero.');

    if (d < 0) {
      n = -n;
      d = -d;
    }
    const g = mcd(n, d);
    this.n = n / g;
    this.d = d / g;
  }

  static of(value) {
    if (value instanceof Frac) return value;
    if (typeof value === 'number') {
      if (!Number.isFinite(value)) throw new Error('El número no es válido.');
      return parseNumber(String(value));
    }
    return parseNumber(value);
  }

  static get zero() {
    return new Frac(0, 1);
  }

  static get one() {
    return new Frac(1, 1);
  }

  plus(other) {
    const o = Frac.of(other);
    return new Frac(this.n * o.d + o.n * this.d, this.d * o.d);
  }

  minus(other) {
    const o = Frac.of(other);
    return new Frac(this.n * o.d - o.n * this.d, this.d * o.d);
  }

  times(other) {
    const o = Frac.of(other);
    return new Frac(this.n * o.n, this.d * o.d);
  }

  div(other) {
    const o = Frac.of(other);
    if (o.n === 0) throw new Error('No se puede dividir entre cero.');
    return new Frac(this.n * o.d, this.d * o.n);
  }

  neg() {
    return new Frac(-this.n, this.d);
  }

  abs() {
    return new Frac(Math.abs(this.n), this.d);
  }

  isZero() {
    return this.n === 0;
  }

  isNegative() {
    return this.n < 0;
  }

  equals(other) {
    const o = Frac.of(other);
    return this.n === o.n && this.d === o.d;
  }

  compare(other) {
    const o = Frac.of(other);
    return this.n * o.d - o.n * this.d;
  }

  toNumber() {
    return this.n / this.d;
  }

  toString() {
    return this.d === 1 ? String(this.n) : `${this.n}/${this.d}`;
  }

  /** Representación para texto en español: signo menos tipográfico. */
  toText() {
    return this.toString().replace('-', '−');
  }
}

/**
 * Convierte lo que escribe una persona en una fracción exacta.
 * Acepta enteros, decimales con punto o coma, signos y fracciones a/b.
 */
export function parseNumber(raw) {
  if (raw instanceof Frac) return raw;
  if (raw === null || raw === undefined) throw new Error('Escribe un número.');

  const original = String(raw).trim();
  if (!original) throw new Error('Escribe un número.');

  const s = original
    .replace(/\u2212/g, '-')
    .replace(/\u00a0/g, '')
    .replace(/\s+/g, '')
    .replace(',', '.');

  const fraction = s.match(/^([+-]?\d+)\/([+-]?\d+)$/);
  if (fraction) {
    const d = Number(fraction[2]);
    if (d === 0) throw new Error('El denominador no puede ser cero.');
    return new Frac(Number(fraction[1]), d);
  }

  if (!/^[+-]?(\d+(\.\d*)?|\.\d+)([eE][+-]?\d+)?$/.test(s)) {
    throw new Error(`“${original}” no es un número válido.`);
  }

  const [mantissa, expPart] = s.split(/[eE]/);
  const exponent = Number(expPart || 0);
  let sign = 1;
  let body = mantissa;
  if (body.startsWith('-')) {
    sign = -1;
    body = body.slice(1);
  } else if (body.startsWith('+')) {
    body = body.slice(1);
  }

  const [entera, decimales = ''] = body.split('.');
  const digitos = `${entera}${decimales}`.replace(/^0+(?=\d)/, '') || '0';

  let numerador = sign * Number(digitos);
  let denominador = 10 ** decimales.length;

  if (exponent > 0) numerador *= 10 ** exponent;
  if (exponent < 0) denominador *= 10 ** -exponent;

  return new Frac(numerador, denominador);
}

/** Texto limpio para mostrar una fracción en línea. */
export function fracText(value) {
  return Frac.of(value).toText();
}

/** HTML de una fracción apilada, con la línea de división. */
export function fracHTML(value) {
  const f = Frac.of(value);
  if (f.d === 1) return `<span class="num">${f.toText()}</span>`;
  return `<span class="frac"><span class="num">${f.n.toString().replace('-', '−')}</span><span class="den">${f.d}</span></span>`;
}
