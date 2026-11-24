import test from 'node:test';
import assert from 'node:assert/strict';

import { Frac, parseNumber } from '../js/core/fraction.js';
import { solveLinearSystem, determinant } from '../js/core/gauss.js';
import {
  add,
  sub,
  scale,
  dot,
  norm,
  cross,
  angleDeg,
  triangleArea,
  parallelepipedVolume,
  parallelogramArea,
} from '../js/core/vectors.js';

const S = (A, b) =>
  solveLinearSystem(
    A.map((fila) => fila.map((valor) => parseNumber(String(valor)))),
    b.map((valor) => parseNumber(String(valor))),
  );

const cerca = (a, b, epsilon = 1e-9) =>
  assert.ok(Math.abs(a - b) < epsilon, `${a} no está cerca de ${b}`);

const solucion = (resultado) => resultado.solution.map((valor) => valor.toNumber());

test('parseNumber acepta enteros, decimales, comas y fracciones', () => {
  assert.equal(parseNumber('3').toNumber(), 3);
  assert.equal(parseNumber('−2,5').toNumber(), -2.5);
  assert.equal(parseNumber('-1/4').toNumber(), -0.25);
  assert.equal(parseNumber('.75').toNumber(), 0.75);
  assert.throws(() => parseNumber('2x'), /no es un número/);
  assert.throws(() => parseNumber('1/0'), /denominador/);
});

test('CP1 · ejercicio 1: sistema 2×2 con solución única', () => {
  const r = S(
    [
      [2, 3],
      [4, -1],
    ],
    [12, 10],
  );
  assert.equal(r.status, 'unique');
  assert.deepEqual(solucion(r), [3, 2]);
  assert.equal(r.det.toNumber(), -14);
  assert.ok(r.verification.every((v) => v.ok));
});

test('CP1 · ejercicio 3: sistema 2×2 sin solución', () => {
  const r = S(
    [
      [3, -2],
      [6, -4],
    ],
    [5, 7],
  );
  assert.equal(r.status, 'none');
  assert.equal(r.rankA, 1);
  assert.equal(r.rankAug, 2);
  assert.equal(r.det.toNumber(), 0);
});

test('CP1 · ejercicio 4: sistema 2×2 con infinitas soluciones', () => {
  const r = S(
    [
      [1, -2],
      [3, -6],
    ],
    [4, 12],
  );
  assert.equal(r.status, 'infinite');
  assert.equal(r.parametric.text, 'x = 4 + 2t, y = t');
  assert.equal(r.parametric.domain, 't ∈ ℝ');
});

test('CP2 · ejercicio 5: sistema 3×3 con solución única', () => {
  const r = S(
    [
      [2, 1, -1],
      [-3, -1, 2],
      [-2, 1, 2],
    ],
    [8, -11, -3],
  );
  assert.equal(r.status, 'unique');
  assert.deepEqual(solucion(r), [2, 3, -1]);
  assert.equal(r.det.toNumber(), -1);
});

test('CP2 · ejercicio 6: sistema 3×3 con solución única', () => {
  const r = S(
    [
      [1, 2, -1],
      [3, -1, 2],
      [2, 3, 1],
    ],
    [3, 5, 10],
  );
  assert.equal(r.status, 'unique');
  assert.deepEqual(solucion(r), [1, 2, 2]);
});

test('Ejemplo guía 3×3: solución (1, 2, 3)', () => {
  const r = S(
    [
      [1, 1, 1],
      [2, -1, 3],
      [1, 2, -1],
    ],
    [6, 9, 2],
  );
  assert.equal(r.status, 'unique');
  assert.deepEqual(solucion(r), [1, 2, 3]);
  assert.ok(r.verification.every((v) => v.ok));
});

test('CP2 · ejercicio 7: sistema 3×3 con infinitas soluciones', () => {
  const r = S(
    [
      [1, 1, 2],
      [2, 3, 5],
      [1, 2, 3],
    ],
    [4, 9, 5],
  );
  assert.equal(r.status, 'infinite');
  assert.equal(r.parametric.dimension, 1);
  assert.equal(r.parametric.text, 'x = 3 − t, y = 1 − t, z = t');
  assert.equal(r.parametric.domain, 't ∈ ℝ');
});

test('CP3 · ejercicio 8: sistema 3×3 incompatible', () => {
  const r = S(
    [
      [1, -1, 1],
      [2, 1, -1],
      [3, 0, 0],
    ],
    [2, 1, 5],
  );
  assert.equal(r.status, 'none');
  assert.equal(r.rankA, 2);
  assert.equal(r.rankAug, 3);
  assert.ok(r.inconsistentRow >= 0);
});

test('Ejercicio 9: contenedores en la nube (100, 50, 150)', () => {
  const r = S(
    [
      [2, 1, 1],
      [1, 2, 1],
      [1, 1, 2],
    ],
    [400, 350, 450],
  );
  assert.equal(r.status, 'unique');
  assert.deepEqual(solucion(r), [100, 50, 150]);
  assert.equal(r.det.toNumber(), 4);
});

test('Determinante exacto de una matriz 3×3', () => {
  const A = [
    [1, 2, 3],
    [0, 1, 4],
    [5, 6, 0],
  ].map((fila) => fila.map((v) => new Frac(v, 1)));
  assert.equal(determinant(A).toNumber(), 1);
});

test('CP4 · ejercicios 10 y 13: suma y resta de vectores', () => {
  const p = [-2, 1];
  const q = [4, 3];
  assert.deepEqual(add(p, q), [2, 4]);
  assert.deepEqual(sub(p, q), [-6, -2]);
  assert.deepEqual(scale(3, p), [-6, 3]);

  const a = [1, 3, -2];
  const b = [4, 0, 1];
  assert.deepEqual(add(a, b), [5, 3, -1]);
  assert.deepEqual(sub(a, b), [-3, 3, -3]);
  assert.deepEqual(sub(b, a), [3, -3, 3]);
});

test('Ejercicios 11 y 12: norma, producto punto y ángulo', () => {
  const p = [-2, 1];
  const q = [4, 3];
  cerca(norm(add(p, q)), Math.sqrt(20));
  assert.equal(dot(p, q), -5);
  const angulo = angleDeg(p, q);
  assert.ok(angulo > 90 && angulo < 180);
  cerca(angulo, 116.56505117707799);
});

test('CP5 · ejercicio 15: producto cruz y perpendicularidad', () => {
  const a = [1, 3, -2];
  const b = [4, 0, 1];
  const c = cross(a, b);
  assert.deepEqual(c, [3, -9, -12]);
  assert.equal(dot(c, a), 0);
  assert.equal(dot(c, b), 0);
  cerca(parallelogramArea(a, b), Math.sqrt(234));
  assert.deepEqual(cross(b, a), [-3, 9, 12]);
});

test('CP5 · ejercicio 18: producto cruz de vectores paralelos', () => {
  const c = cross([2, -4, 6], [-1, 2, -3]);
  assert.deepEqual(c, [0, 0, 0]);
  cerca(norm(c), 0);
});

test('Ejercicio 17: área del triángulo PQR', () => {
  cerca(triangleArea([1, 0, 2], [3, 1, 1], [2, 3, 4]), Math.sqrt(75) / 2);
});

test('Ejercicio 19: volumen del paralelepípedo', () => {
  cerca(parallelepipedVolume([1, 2, 0], [0, 1, 3], [2, 0, 1]), 13);
});

test('Una ecuación sin coeficientes se detecta como fila 0 = k', () => {
  const r = S(
    [
      [1, 1],
      [0, 0],
    ],
    [2, 3],
  );
  assert.equal(r.status, 'none');
  assert.equal(r.inconsistentRow, 1);
});
