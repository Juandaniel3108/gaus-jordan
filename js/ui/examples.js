/** Datos iniciales y casos del taller para cada módulo. */

export const DEFAULTS = {
  sistema2: { a1: '2', b1: '3', c1: '12', a2: '4', b2: '-1', c2: '10' },
  sistema3: {
    a1: '2', b1: '1', c1: '-1', d1: '8',
    a2: '-3', b2: '-1', c2: '2', d2: '-11',
    a3: '-2', b3: '1', c3: '2', d3: '-3',
  },
  vectores2: { ux: '-2', uy: '1', vx: '4', vy: '3', k: '3' },
  vectores3: { ux: '1', uy: '3', uz: '-2', vx: '4', vy: '0', vz: '1', k: '2' },
  cruz: { ux: '1', uy: '3', uz: '-2', vx: '4', vy: '0', vz: '1', wx: '', wy: '', wz: '' },
};

export const PRESETS = {
  sistema2: [
    {
      label: 'Ej. 1 · única',
      status: 'unique',
      values: { a1: '2', b1: '3', c1: '12', a2: '4', b2: '-1', c2: '10' },
    },
    {
      label: 'Ej. 3 · sin solución',
      status: 'none',
      values: { a1: '3', b1: '-2', c1: '5', a2: '6', b2: '-4', c2: '7' },
    },
    {
      label: 'Ej. 4 · infinitas',
      status: 'infinite',
      values: { a1: '1', b1: '-2', c1: '4', a2: '3', b2: '-6', c2: '12' },
    },
    {
      label: 'Ej. 2 · única',
      status: 'unique',
      values: { a1: '5', b1: '2', c1: '1', a2: '3', b2: '4', c2: '-5' },
    },
  ],

  sistema3: [
    {
      label: 'Ej. 5 · única',
      status: 'unique',
      values: {
        a1: '2', b1: '1', c1: '-1', d1: '8',
        a2: '-3', b2: '-1', c2: '2', d2: '-11',
        a3: '-2', b3: '1', c3: '2', d3: '-3',
      },
    },
    {
      label: 'Ejemplo guía · (1, 2, 3)',
      status: 'unique',
      values: {
        a1: '1', b1: '1', c1: '1', d1: '6',
        a2: '2', b2: '-1', c2: '3', d2: '9',
        a3: '1', b3: '2', c3: '-1', d3: '2',
      },
    },
    {
      label: 'Ej. 7 · infinitas',
      status: 'infinite',
      values: {
        a1: '1', b1: '1', c1: '2', d1: '4',
        a2: '2', b2: '3', c2: '5', d2: '9',
        a3: '1', b3: '2', c3: '3', d3: '5',
      },
    },
    {
      label: 'Ej. 8 · incompatible',
      status: 'none',
      values: {
        a1: '1', b1: '-1', c1: '1', d1: '2',
        a2: '2', b2: '1', c2: '-1', d2: '1',
        a3: '3', b3: '0', c3: '0', d3: '5',
      },
    },
    {
      label: 'Nube · Ej. 9',
      status: 'unique',
      values: {
        a1: '2', b1: '1', c1: '1', d1: '400',
        a2: '1', b2: '2', c2: '1', d2: '350',
        a3: '1', b3: '1', c3: '2', d3: '450',
      },
    },
  ],

  vectores2: [
    {
      label: 'p y q · Ej. 10–12',
      status: 'neutral',
      values: { ux: '-2', uy: '1', vx: '4', vy: '3', k: '3' },
    },
    {
      label: 'Ángulo recto',
      status: 'neutral',
      values: { ux: '3', uy: '4', vx: '-4', vy: '3', k: '2' },
    },
    {
      label: 'Escalar negativo',
      status: 'neutral',
      values: { ux: '2', uy: '3', vx: '-1', vy: '2', k: '-1.5' },
    },
  ],

  vectores3: [
    {
      label: 'a y b · Ej. 13–14',
      status: 'neutral',
      values: { ux: '1', uy: '3', uz: '-2', vx: '4', vy: '0', vz: '1', k: '2' },
    },
    {
      label: 'a y c',
      status: 'neutral',
      values: { ux: '1', uy: '3', uz: '-2', vx: '-2', vy: '5', vz: '3', k: '3' },
    },
    {
      label: 'Perpendiculares',
      status: 'neutral',
      values: { ux: '1', uy: '0', uz: '0', vx: '0', vy: '1', vz: '0', k: '2' },
    },
  ],

  cruz: [
    {
      label: 'a × b · Ej. 15',
      status: 'neutral',
      values: { ux: '1', uy: '3', uz: '-2', vx: '4', vy: '0', vz: '1', wx: '', wy: '', wz: '' },
    },
    {
      label: 'Paralelos · Ej. 18',
      status: 'none',
      values: { ux: '2', uy: '-4', uz: '6', vx: '-1', vy: '2', vz: '-3', wx: '', wy: '', wz: '' },
    },
    {
      label: 'Triángulo PQR · Ej. 17',
      status: 'neutral',
      values: { ux: '2', uy: '1', uz: '-1', vx: '1', vy: '3', vz: '2', wx: '', wy: '', wz: '' },
    },
    {
      label: 'Volumen · Ej. 19',
      status: 'neutral',
      values: { ux: '1', uy: '2', uz: '0', vx: '0', vy: '1', vz: '3', wx: '2', wy: '0', wz: '1' },
    },
  ],
};
