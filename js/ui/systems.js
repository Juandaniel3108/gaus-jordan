/** Vistas de los módulos de sistemas lineales 2×2 y 3×3. */

import { solveLinearSystem } from '../core/gauss.js';
import { fmt, fmtVector } from '../core/format.js';
import {
  COLORS,
  PLANE_COLORS,
  readSystem,
  renderScene,
  setResult,
  stepsHTML,
  substitutionText,
  range2,
  range3,
} from './state.js';

function interceptos(linea) {
  const puntos = [];
  if (!linea.a.isZero()) puntos.push([linea.c.div(linea.a).toNumber(), 0]);
  if (!linea.b.isZero()) puntos.push([0, linea.c.div(linea.b).toNumber()]);
  return puntos;
}

function metricasBase(r) {
  return [
    {
      label: 'det A',
      value: fmt(r.det),
      tone: r.det.isZero() ? 'warn' : 'good',
    },
    { label: 'rango(A)', value: String(r.rankA) },
    {
      label: 'rango([A|b])',
      value: String(r.rankAug),
      tone: r.rankA === r.rankAug ? 'good' : 'bad',
    },
  ];
}

export function renderSistema2() {
  const { A, b } = readSystem('sistema2');
  const r = solveLinearSystem(A, b);

  const lines = A.map((fila, i) => ({
    a: fila[0],
    b: fila[1],
    c: b[i],
    color: i === 0 ? COLORS.line1 : COLORS.line2,
    dashed: r.status === 'infinite' && i === 1,
  }));

  let scene = { lines, center: [0, 0], halfSpan: 6 };
  let title = 'Solución única';
  let value = '';
  let prose = false;
  let long = false;
  let reading = '';
  let checks = [];
  let legend = [];
  let caption = '';
  let metrics = metricasBase(r);

  if (r.status === 'unique') {
    const x = r.solution[0];
    const y = r.solution[1];
    const xn = x.toNumber();
    const yn = y.toNumber();
    const halfSpan = Math.max(4.5, Math.max(Math.abs(xn), Math.abs(yn)) * 1.45 + 1);

    title = 'Solución única';
    value = `(${fmt(x)}, ${fmt(y)})`;
    scene = {
      lines,
      center: [xn, yn],
      halfSpan,
      points: [
        {
          p: [xn, yn],
          color: COLORS.solution,
          label: `(${fmt(x)}, ${fmt(y)})`,
        },
      ],
      aria: `Dos rectas que se cortan en el punto (${fmt(x)}, ${fmt(y)}).`,
    };

    reading = `Las rectas tienen pendientes distintas y se cruzan en <strong>(${fmt(x)}, ${fmt(y)})</strong>. El determinante <strong>det A = ${fmt(r.det)}</strong> es distinto de cero, así que el sistema es compatible determinado: la solución es única.`;
    caption = `Las rectas se cortan en (${fmt(x)}, ${fmt(y)}). La vista se centra en la solución.`;
    legend = [
      { kind: 'line', color: COLORS.line1, label: 'Ecuación 1' },
      { kind: 'line', color: COLORS.line2, label: 'Ecuación 2' },
      { kind: 'dot', color: COLORS.solution, label: `Solución (${fmt(x)}, ${fmt(y)})` },
    ];
    checks = [
      {
        ok: true,
        html: `<strong>det A = ${fmt(r.det)} ≠ 0</strong>: el sistema es compatible determinado.`,
      },
      ...r.verification.map((verificacion, i) => ({
        ok: verificacion.ok,
        html: `Ecuación ${i + 1}: <strong>${substitutionText(A, b, r.solution, i)}</strong>`,
      })),
      {
        ok: true,
        html: `El punto <strong>(${fmt(x)}, ${fmt(y)})</strong> pertenece a ambas rectas.`,
      },
    ];
  } else if (r.status === 'none') {
    const puntos = [...interceptos(lines[0]), ...interceptos(lines[1]), [0, 0]];
    const rango = range2(puntos, 5.5);
    title = 'Sin solución';
    value = 'Las rectas son paralelas';
    prose = true;
    scene = {
      lines,
      center: rango.center,
      halfSpan: rango.halfSpan,
      badge: { text: 'Sin intersección', color: COLORS.solution },
      aria: 'Dos rectas paralelas que no se cortan.',
    };

    reading = `Las rectas son <strong>paralelas</strong>: tienen la misma dirección y no comparten ningún punto. El determinante es 0 y el rango de la matriz aumentada es mayor que el de A, así que el sistema es incompatible.`;
    caption = 'No hay intersección: las dos rectas son paralelas.';
    legend = [
      { kind: 'line', color: COLORS.line1, label: 'Ecuación 1' },
      { kind: 'line', color: COLORS.line2, label: 'Ecuación 2' },
    ];
    checks = [
      { ok: true, html: '<strong>det A = 0</strong>: las rectas son paralelas o coincidentes.' },
      {
        ok: false,
        html: `<strong>rango(A) = ${r.rankA} ≠ rango([A|b]) = ${r.rankAug}</strong>: el sistema es incompatible.`,
      },
      {
        ok: false,
        html: `La fila ${r.inconsistentRow + 1} conduce a <strong>0 = ${fmt(
          r.echelon[r.inconsistentRow][r.n],
        )}</strong>, una contradicción.`,
      },
    ];
  } else {
    const particular = r.parametric.particular.map((valor) => valor.toNumber());
    const puntos = [...interceptos(lines[0]), ...interceptos(lines[1]), particular];
    const rango = range2(puntos, 5.5);
    title = 'Infinitas soluciones';
    value = r.parametric.text;
    long = true;
    scene = {
      lines,
      center: rango.center,
      halfSpan: rango.halfSpan,
      points: [
        {
          p: particular,
          color: COLORS.solution,
          label: 't = 0',
        },
      ],
      badge: { text: 'Rectas coincidentes', color: COLORS.line1 },
      aria: `Dos rectas coincidentes. Solución paramétrica: ${r.parametric.text}.`,
    };

    reading = `Las dos ecuaciones describen <strong>la misma recta</strong>. Todos los puntos de esa recta son solución; por eso la respuesta se escribe con un parámetro: <strong>${r.parametric.text}</strong>, donde ${r.parametric.domain}.`;
    caption = 'Las rectas coinciden: cada punto de la recta es una solución.';
    legend = [
      { kind: 'line', color: COLORS.line1, label: 'Recta solución' },
      { kind: 'dash', color: COLORS.line2, label: 'Ecuación redundante' },
      { kind: 'dot', color: COLORS.solution, label: 'Punto base (t = 0)' },
    ];
    checks = [
      { ok: true, html: '<strong>det A = 0</strong>: las ecuaciones son dependientes.' },
      {
        ok: true,
        html: `<strong>rango(A) = rango([A|b]) = ${r.rankA}</strong>: el sistema es compatible.`,
      },
      {
        ok: null,
        html: `Hay ${r.parametric.dimension} variable libre (${r.parametric.params.join(', ')}), por eso hay infinitas soluciones.`,
      },
    ];
  }

  setResult('sistema2', {
    title,
    value,
    prose,
    long,
    metrics,
    legend,
    caption,
    reading,
    checks,
    status: r.status,
  });
  document.getElementById('steps-sistema2').innerHTML = stepsHTML(r);
  renderScene('sistema2', scene);
}

export function renderSistema3() {
  const { A, b } = readSystem('sistema3');
  const r = solveLinearSystem(A, b);

  const planes = A.map((fila, i) => ({
    a: fila[0].toNumber(),
    b: fila[1].toNumber(),
    c: fila[2].toNumber(),
    d: b[i].toNumber(),
    color: PLANE_COLORS[i],
    label: `π${i + 1}`,
  }));

  let scene = {
    planes,
    range: 6,
    aria: 'Escena 3D con los tres planos del sistema.',
  };
  let title = 'Solución única';
  let value = '';
  let prose = false;
  let long = false;
  let reading = '';
  let checks = [];
  let legend = planes.map((plano) => ({
    kind: 'dot',
    color: plano.color,
    label: plano.label,
  }));
  const caption = 'Arrastra para orbitar · rueda para acercar · doble clic para reiniciar.';
  const metrics = metricasBase(r);

  if (r.status === 'unique') {
    const punto = r.solution.map((valor) => valor.toNumber());
    const rango = range3([punto], 5);
    scene = {
      planes,
      range: rango,
      point: {
        p: punto,
        color: COLORS.solution,
        label: fmtVector(r.solution),
      },
      badge: { text: 'Punto común', color: COLORS.solution },
      aria: `Tres planos que se cortan en el punto ${fmtVector(r.solution)}.`,
    };

    value = fmtVector(r.solution);
    reading = `Los tres planos se cortan en el punto <strong>${fmtVector(
      r.solution,
    )}</strong>. Como <strong>det A = ${fmt(r.det)} ≠ 0</strong>, el sistema es compatible determinado y la solución es única.`;
    legend = [
      ...planes.map((plano) => ({ kind: 'dot', color: plano.color, label: plano.label })),
      { kind: 'dot', color: COLORS.solution, label: `Solución ${fmtVector(r.solution)}` },
    ];
    checks = [
      {
        ok: true,
        html: `<strong>det A = ${fmt(r.det)} ≠ 0</strong>: los tres planos no son paralelos ni dependientes.`,
      },
      ...r.verification.map((verificacion, i) => ({
        ok: verificacion.ok,
        html: `Ecuación ${i + 1}: <strong>${substitutionText(A, b, r.solution, i)}</strong>`,
      })),
      {
        ok: true,
        html: `El punto <strong>${fmtVector(r.solution)}</strong> pertenece a los tres planos.`,
      },
    ];
  } else if (r.status === 'none') {
    title = 'Sin solución';
    value = 'No hay punto común';
    prose = true;
    scene = {
      planes,
      range: 6,
      badge: { text: 'Sin punto común', color: COLORS.solution },
      aria: 'Tres planos sin un punto de intersección común.',
    };

    reading = `No existe un punto común a los tres planos. La fila ${r.inconsistentRow + 1} de la matriz aumentada conduce a <strong>0 = ${fmt(
      r.echelon[r.inconsistentRow][r.n],
    )}</strong>, una contradicción. El rango de A es menor que el de [A|b], así que el sistema es incompatible.`;
    checks = [
      { ok: true, html: '<strong>det A = 0</strong>: los planos son dependientes o paralelos.' },
      {
        ok: false,
        html: `<strong>rango(A) = ${r.rankA} ≠ rango([A|b]) = ${r.rankAug}</strong>: no hay solución.`,
      },
      {
        ok: false,
        html: `La fila ${r.inconsistentRow + 1} equivale a <strong>0 = ${fmt(
          r.echelon[r.inconsistentRow][r.n],
        )}</strong>.`,
      },
    ];
  } else {
    const particular = r.parametric.particular.map((valor) => valor.toNumber());
    const direcciones = r.parametric.directions.map((direccion) =>
      direccion.map((valor) => valor.toNumber()),
    );
    const rango = range3([particular], 5);
    const esRecta = direcciones.length === 1;

    title = 'Infinitas soluciones';
    value = r.parametric.text;
    long = true;
    scene = {
      planes,
      range: rango,
      ...(esRecta
        ? {
            line: {
              point: particular,
              direction: direcciones[0],
              color: COLORS.solution,
              label: 'recta solución',
            },
          }
        : {
            point: {
              p: particular,
              color: COLORS.solution,
              label: 'punto de la familia',
            },
          }),
      badge: {
        text: esRecta ? 'Recta común' : 'Plano de soluciones',
        color: COLORS.solution,
      },
      aria: `Tres planos con infinitas soluciones. Solución paramétrica: ${r.parametric.text}.`,
    };

    reading = esRecta
      ? `Los planos comparten <strong>una recta</strong>. El rango de A coincide con el de [A|b] pero es menor que 3, así que hay una variable libre y la solución se escribe con un parámetro: <strong>${r.parametric.text}</strong>, donde ${r.parametric.domain}.`
      : `Los planos comparten <strong>un plano completo</strong> de soluciones. Hay ${r.parametric.dimension} variables libres, por eso la respuesta es paramétrica: <strong>${r.parametric.text}</strong>, donde ${r.parametric.domain}.`;

    legend = [
      ...planes.map((plano) => ({ kind: 'dot', color: plano.color, label: plano.label })),
      {
        kind: esRecta ? 'line' : 'dot',
        color: COLORS.solution,
        label: esRecta ? 'Recta solución' : 'Familia de soluciones',
      },
    ];
    checks = [
      { ok: true, html: '<strong>det A = 0</strong>: los planos son dependientes.' },
      {
        ok: true,
        html: `<strong>rango(A) = rango([A|b]) = ${r.rankA} &lt; 3</strong>: el sistema es compatible.`,
      },
      {
        ok: null,
        html: `Variables libres: <strong>${r.parametric.params.join(', ')}</strong>. La solución tiene ${r.parametric.dimension} parámetro${
          r.parametric.dimension === 1 ? '' : 's'
        }.`,
      },
    ];
  }

  setResult('sistema3', {
    title,
    value,
    prose,
    long,
    metrics,
    legend,
    caption,
    reading,
    checks,
    status: r.status,
  });
  document.getElementById('steps-sistema3').innerHTML = stepsHTML(r);
  renderScene('sistema3', scene);
}
