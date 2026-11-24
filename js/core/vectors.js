/**
 * Operaciones vectoriales en R² y R³.
 * Trabajan con arreglos numéricos; la interfaz se encarga del formato.
 */

export function add(u, v) {
  return u.map((valor, i) => valor + v[i]);
}

export function sub(u, v) {
  return u.map((valor, i) => valor - v[i]);
}

export function scale(k, u) {
  return u.map((valor) => k * valor);
}

export function dot(u, v) {
  return u.reduce((acc, valor, i) => acc + valor * v[i], 0);
}

export function norm(u) {
  return Math.sqrt(dot(u, u));
}

export function distance(u, v) {
  return norm(sub(u, v));
}

export function cross(u, v) {
  if (u.length !== 3 || v.length !== 3) {
    throw new Error('El producto cruz solo está definido en R³.');
  }
  return [
    u[1] * v[2] - u[2] * v[1],
    u[2] * v[0] - u[0] * v[2],
    u[0] * v[1] - u[1] * v[0],
  ];
}

/** Ángulo entre dos vectores no nulos, en grados. */
export function angleDeg(u, v) {
  const nu = norm(u);
  const nv = norm(v);
  if (nu === 0 || nv === 0) return null;
  const coseno = Math.min(1, Math.max(-1, dot(u, v) / (nu * nv)));
  return (Math.acos(coseno) * 180) / Math.PI;
}

export function isParallel(u, v, epsilon = 1e-9) {
  return norm(cross(u, v)) < epsilon;
}

export function isZero(u, epsilon = 1e-9) {
  return norm(u) < epsilon;
}

/** Área del paralelogramo generado por u y v (en R² o R³). */
export function parallelogramArea(u, v) {
  if (u.length === 2 && v.length === 2) {
    return Math.abs(u[0] * v[1] - u[1] * v[0]);
  }
  return norm(cross(u, v));
}

/** Área del triángulo de vértices P, Q, R. */
export function triangleArea(p, q, r) {
  return 0.5 * norm(cross(sub(q, p), sub(r, p)));
}

/** Volumen del paralelepípedo |(u × v) · w|. */
export function parallelepipedVolume(u, v, w) {
  return Math.abs(dot(cross(u, v), w));
}

/** Proyección de u sobre v. */
export function projection(u, v) {
  const denominador = dot(v, v);
  if (denominador === 0) return u.map(() => 0);
  return scale(dot(u, v) / denominador, v);
}

export function unit(u) {
  const n = norm(u);
  if (n === 0) return u.map(() => 0);
  return scale(1 / n, u);
}

export function isPerpendicular(u, v, epsilon = 1e-9) {
  return Math.abs(dot(u, v)) < epsilon;
}

export function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}
