/** Vistas de vectores en R², R³ y del producto cruz. */

import { fmt, fmtVector, fmtAngle } from '../core/format.js';
import {
  add,
  sub,
  scale,
  dot,
  norm,
  cross,
  angleDeg,
  parallelogramArea,
} from '../core/vectors.js';
import {
  COLORS,
  readFieldValues,
  readCrossValues,
  renderScene,
  setResult,
  mathStep,
  range2,
  range3,
} from './state.js';

function normLine(vector, nombre) {
  const cuadrados = vector.map((valor) => `(${fmt(valor)})²`).join(' + ');
  const suma = vector.reduce((acc, valor) => acc + valor * valor, 0);
  return `‖${nombre}‖ = √(${cuadrados}) = √(${fmt(suma)}) = ${fmt(norm(vector))}`;
}

function dotLine(u, v) {
  const terminos = u.map((valor, i) => `(${fmt(valor)})(${fmt(v[i])})`).join(' + ');
  return `u · v = ${terminos} = ${fmt(dot(u, v))}`;
}

function angleLines(u, v) {
  const dp = dot(u, v);
  const nu = norm(u);
  const nv = norm(v);
  if (nu === 0 || nv === 0) {
    return ['El ángulo no está definido porque uno de los vectores es el vector cero.'];
  }
  const coseno = dp / (nu * nv);
  return [
    `cos θ = (u · v) / (‖u‖ ‖v‖) = ${fmt(dp)} / (${fmt(nu)} · ${fmt(nv)}) = ${fmt(coseno)}`,
    `θ = arccos(${fmt(coseno)}) = ${fmtAngle(angleDeg(u, v))}`,
  ];
}

function angleSentence(dp, angulo) {
  if (angulo === null) {
    return 'Uno de los vectores es el vector cero, así que el ángulo no está definido.';
  }
  if (Math.abs(dp) < 1e-9) {
    return 'El producto punto es <strong>0</strong>, así que los vectores son <strong>perpendiculares</strong> (θ = 90°).';
  }
  if (dp > 0) {
    return `El producto punto es <strong>positivo (${fmt(dp)})</strong>, así que el ángulo es <strong>agudo</strong> (${fmtAngle(angulo)}).`;
  }
  return `El producto punto es <strong>negativo (${fmt(dp)})</strong>, así que el ángulo es <strong>obtuso</strong> (${fmtAngle(angulo)}).`;
}

function vectorSteps2(u, v, k, suma, resta, escalado, area, angulo) {
  return [
    mathStep('Suma', [
      `u + v = (${fmt(u[0])}, ${fmt(u[1])}) + (${fmt(v[0])}, ${fmt(v[1])})`,
      `= (${fmt(u[0])} + ${fmt(v[0])}, ${fmt(u[1])} + ${fmt(v[1])}) = ${fmtVector(suma)}`,
    ]),
    mathStep('Resta', [
      `u − v = (${fmt(u[0])}, ${fmt(u[1])}) − (${fmt(v[0])}, ${fmt(v[1])})`,
      `= (${fmt(u[0])} − ${fmt(v[0])}, ${fmt(u[1])} − ${fmt(v[1])}) = ${fmtVector(resta)}`,
    ]),
    mathStep('Multiplicación por escalar', [
      `k · u = ${fmt(k)} · (${fmt(u[0])}, ${fmt(u[1])}) = ${fmtVector(escalado)}`,
    ]),
    mathStep('Normas', [normLine(u, 'u'), normLine(v, 'v'), normLine(suma, 'u + v')]),
    mathStep('Producto punto', [dotLine(u, v)]),
    mathStep('Ángulo', angleLines(u, v)),
    mathStep('Área del paralelogramo', [
      `Área = |det(u, v)| = |(${fmt(u[0])})(${fmt(v[1])}) − (${fmt(u[1])})(${fmt(v[0])})| = ${fmt(area)}`,
    ]),
  ].join('');
}

function vectorSteps3(u, v, k, suma, resta, escalado, area, angulo, cruz) {
  return [
    mathStep('Suma', [
      `u + v = (${fmt(u[0])}, ${fmt(u[1])}, ${fmt(u[2])}) + (${fmt(v[0])}, ${fmt(v[1])}, ${fmt(v[2])})`,
      `= ${fmtVector(suma)}`,
    ]),
    mathStep('Resta', [
      `u − v = (${fmt(u[0])}, ${fmt(u[1])}, ${fmt(u[2])}) − (${fmt(v[0])}, ${fmt(v[1])}, ${fmt(v[2])})`,
      `= ${fmtVector(resta)}`,
    ]),
    mathStep('Multiplicación por escalar', [
      `k · u = ${fmt(k)} · (${fmt(u[0])}, ${fmt(u[1])}, ${fmt(u[2])}) = ${fmtVector(escalado)}`,
    ]),
    mathStep('Normas', [normLine(u, 'u'), normLine(v, 'v'), normLine(suma, 'u + v')]),
    mathStep('Producto punto', [dotLine(u, v)]),
    mathStep('Ángulo', angleLines(u, v)),
    mathStep('Área del paralelogramo', [
      `u × v = ${fmtVector(cruz)}`,
      `Área = ‖u × v‖ = ${fmt(area)}`,
    ]),
  ].join('');
}

export function renderVectores2() {
  const valores = readFieldValues('vectores2');
  const u = [valores.ux.toNumber(), valores.uy.toNumber()];
  const v = [valores.vx.toNumber(), valores.vy.toNumber()];
  const k = valores.k.toNumber();

  const suma = add(u, v);
  const resta = sub(u, v);
  const escalado = scale(k, u);
  const dp = dot(u, v);
  const angulo = angleDeg(u, v);
  const area = parallelogramArea(u, v);
  const nu = norm(u);
  const nv = norm(v);
  const rango = range2([[0, 0], u, v, suma, resta, escalado], 5);

  const scene = {
    vectors: [
      { v: u, color: COLORS.u, label: 'u' },
      { v, color: COLORS.v, label: 'v' },
      { v: suma, color: COLORS.sum, label: 'u + v' },
      { v: resta, color: COLORS.diff, label: 'u − v' },
      { v: escalado, color: COLORS.scalar, label: 'k·u', dashed: true },
    ],
    parallelogram: { u, v, color: COLORS.u },
    angle: angulo === null ? null : { u, v, color: COLORS.u, label: fmtAngle(angulo) },
    center: rango.center,
    halfSpan: rango.halfSpan,
    aria: `Vectores u y v en el plano, con su suma ${fmtVector(suma)}, su resta ${fmtVector(resta)} y un ángulo de ${angulo === null ? '90' : fmt(angulo, 1)} grados.`,
  };

  setResult('vectores2', {
    title: 'Producto punto y ángulo',
    value: `u · v = ${fmt(dp)}`,
    status: 'neutral',
    statusLabel: 'Operaciones en R²',
    metrics: [
      { label: '‖u‖', value: fmt(nu) },
      { label: '‖v‖', value: fmt(nv) },
      { label: 'u · v', value: fmt(dp) },
      { label: 'ángulo', value: angulo === null ? '—' : fmtAngle(angulo) },
      { label: 'área', value: fmt(area) },
      { label: '‖u + v‖', value: fmt(norm(suma)) },
    ],
    legend: [
      { kind: 'line', color: COLORS.u, label: 'u' },
      { kind: 'line', color: COLORS.v, label: 'v' },
      { kind: 'line', color: COLORS.sum, label: 'u + v' },
      { kind: 'line', color: COLORS.diff, label: 'u − v' },
      { kind: 'dash', color: COLORS.scalar, label: 'k·u' },
      { kind: 'dot', color: COLORS.u, label: 'Paralelogramo' },
    ],
    caption: 'La diagonal del paralelogramo es u + v; la otra diagonal va de v a u y equivale a u − v.',
    reading: `${angleSentence(dp, angulo)} La suma <strong>${fmtVector(
      suma,
    )}</strong> se dibuja con la regla del paralelogramo; la resta <strong>${fmtVector(
      resta,
    )}</strong> va de la punta de v a la punta de u. El área del paralelogramo es <strong>|det(u, v)| = ${fmt(
      area,
    )}</strong>.`,
    checks: [
      { ok: true, html: `<strong>u + v = ${fmtVector(suma)}</strong> componente a componente.` },
      { ok: true, html: `<strong>u − v = ${fmtVector(resta)}</strong> componente a componente.` },
      { ok: true, html: `<strong>k·u = ${fmtVector(escalado)}</strong> con k = ${fmt(k)}.` },
      { ok: true, html: `<strong>‖u‖ = ${fmt(nu)}</strong> y <strong>‖v‖ = ${fmt(nv)}</strong>.` },
      {
        ok: angulo === null ? null : true,
        html: `<strong>u · v = ${fmt(dp)}</strong>${angulo === null ? '' : ` y <strong>θ = ${fmtAngle(angulo)}</strong>`}.`,
      },
      { ok: true, html: `<strong>Área = ${fmt(area)}</strong> unidades cuadradas.` },
    ],
  });

  document.getElementById('steps-vectores2').innerHTML = vectorSteps2(
    u,
    v,
    k,
    suma,
    resta,
    escalado,
    area,
    angulo,
  );
  renderScene('vectores2', scene);
}

export function renderVectores3() {
  const valores = readFieldValues('vectores3');
  const u = [valores.ux.toNumber(), valores.uy.toNumber(), valores.uz.toNumber()];
  const v = [valores.vx.toNumber(), valores.vy.toNumber(), valores.vz.toNumber()];
  const k = valores.k.toNumber();

  const suma = add(u, v);
  const resta = sub(u, v);
  const escalado = scale(k, u);
  const dp = dot(u, v);
  const angulo = angleDeg(u, v);
  const cruz = cross(u, v);
  const area = norm(cruz);
  const nu = norm(u);
  const nv = norm(v);
  const rango = range3([[0, 0, 0], u, v, suma, resta, escalado], 4);

  const scene = {
    range: rango,
    cameraZoom: 1.55,
    vectors: [
      { v: u, color: COLORS.u, label: 'u' },
      { v, color: COLORS.v, label: 'v' },
      { v: suma, color: COLORS.sum, label: 'u + v' },
      { v: resta, color: COLORS.diff, label: 'u − v' },
      { v: escalado, color: COLORS.scalar, label: 'k·u', dashed: true },
    ],
    parallelogram: { u, v, color: COLORS.u },
    badge:
      angulo === null
        ? { text: 'Ángulo no definido', color: COLORS.v }
        : { text: `θ = ${fmtAngle(angulo)}`, color: COLORS.u },
    aria: `Vectores u, v, su suma y su resta en el espacio. Producto punto ${fmt(dp)}.`,
  };

  setResult('vectores3', {
    title: 'Producto punto y ángulo',
    value: `u · v = ${fmt(dp)}`,
    status: 'neutral',
    statusLabel: 'Operaciones en R³',
    metrics: [
      { label: '‖u‖', value: fmt(nu) },
      { label: '‖v‖', value: fmt(nv) },
      { label: 'u · v', value: fmt(dp) },
      { label: 'ángulo', value: angulo === null ? '—' : fmtAngle(angulo) },
      { label: '‖u×v‖', value: fmt(area) },
      { label: '‖u + v‖', value: fmt(norm(suma)) },
    ],
    legend: [
      { kind: 'line', color: COLORS.u, label: 'u' },
      { kind: 'line', color: COLORS.v, label: 'v' },
      { kind: 'line', color: COLORS.sum, label: 'u + v' },
      { kind: 'line', color: COLORS.diff, label: 'u − v' },
      { kind: 'dash', color: COLORS.scalar, label: 'k·u' },
      { kind: 'dot', color: COLORS.u, label: 'Paralelogramo' },
    ],
    caption: 'Arrastra para orbitar · rueda para acercar · doble clic para reiniciar.',
    reading: `${angleSentence(dp, angulo)} La suma <strong>${fmtVector(
      suma,
    )}</strong> es la diagonal del paralelogramo. El área de ese paralelogramo es <strong>‖u × v‖ = ${fmt(
      area,
    )}</strong>, calculada con el producto cruz.`,
    checks: [
      { ok: true, html: `<strong>u + v = ${fmtVector(suma)}</strong>.` },
      { ok: true, html: `<strong>u − v = ${fmtVector(resta)}</strong>.` },
      { ok: true, html: `<strong>k·u = ${fmtVector(escalado)}</strong> con k = ${fmt(k)}.` },
      { ok: true, html: `<strong>‖u‖ = ${fmt(nu)}</strong> y <strong>‖v‖ = ${fmt(nv)}</strong>.` },
      {
        ok: angulo === null ? null : true,
        html: `<strong>u · v = ${fmt(dp)}</strong>${angulo === null ? '' : ` y <strong>θ = ${fmtAngle(angulo)}</strong>`}.`,
      },
      { ok: true, html: `<strong>Área = ‖u × v‖ = ${fmt(area)}</strong>.` },
    ],
  });

  document.getElementById('steps-vectores3').innerHTML = vectorSteps3(
    u,
    v,
    k,
    suma,
    resta,
    escalado,
    area,
    angulo,
    cruz,
  );
  renderScene('vectores3', scene);
}

function signedTerm(valor, sufijo, primero) {
  const magnitud = fmt(Math.abs(valor));
  const clase = sufijo === 'i' ? 'i' : sufijo === 'j' ? 'j' : 'k';
  if (primero) {
    return `${valor < 0 ? '−' : ''}${magnitud}<span class="${clase}">${sufijo}</span>`;
  }
  return `${valor < 0 ? '−' : '+'} ${magnitud}<span class="${clase}">${sufijo}</span>`;
}

function crossSteps(u, v, c, w, volumen) {
  const iInterior = u[1] * v[2] - u[2] * v[1];
  const jInterior = u[0] * v[2] - u[2] * v[0];
  const kInterior = u[0] * v[1] - u[1] * v[0];
  const norma = norm(c);

  const determinante = mathStep(
    'Determinante 3×3',
    [
      `| <span class="i">i</span>  <span class="j">j</span>  <span class="k">k</span> |`,
      `| ${fmt(u[0])}  ${fmt(u[1])}  ${fmt(u[2])} |`,
      `| ${fmt(v[0])}  ${fmt(v[1])}  ${fmt(v[2])} |`,
    ],
    'La primera fila son los vectores unitarios; las otras dos, las componentes de u y v.',
  );

  const desarrollo = mathStep(
    'Desarrollo por la primera fila',
    [
      `= (u₂v₃ − u₃v₂)<span class="i">i</span> − (u₁v₃ − u₃v₁)<span class="j">j</span> + (u₁v₂ − u₂v₁)<span class="k">k</span>`,
      `= [(${fmt(u[1])})(${fmt(v[2])}) − (${fmt(u[2])})(${fmt(v[1])})]<span class="i">i</span> − [(${fmt(u[0])})(${fmt(v[2])}) − (${fmt(u[2])})(${fmt(v[0])})]<span class="j">j</span> + [(${fmt(u[0])})(${fmt(v[1])}) − (${fmt(u[1])})(${fmt(v[0])})]<span class="k">k</span>`,
      `= (${fmt(iInterior)})<span class="i">i</span> − (${fmt(jInterior)})<span class="j">j</span> + (${fmt(kInterior)})<span class="k">k</span>`,
      `<strong>= ${signedTerm(c[0], 'i', true)} ${signedTerm(c[1], 'j', false)} ${signedTerm(
        c[2],
        'k',
        false,
      )} = ${fmtVector(c)}</strong>`,
    ],
    'No olvides el signo menos del componente j: es el error más frecuente.',
  );

  const perpendicular = mathStep('Verificación de perpendicularidad', [
    `(u × v) · u = (${fmt(c[0])})(${fmt(u[0])}) + (${fmt(c[1])})(${fmt(u[1])}) + (${fmt(
      c[2],
    )})(${fmt(u[2])}) = ${fmt(dot(c, u))}`,
    `(u × v) · v = (${fmt(c[0])})(${fmt(v[0])}) + (${fmt(c[1])})(${fmt(v[1])}) + (${fmt(
      c[2],
    )})(${fmt(v[2])}) = ${fmt(dot(c, v))}`,
  ]);

  const areas = mathStep('Áreas', [
    `‖u × v‖ = √((${fmt(c[0])})² + (${fmt(c[1])})² + (${fmt(c[2])})²) = ${fmt(norma)}`,
    `Área del paralelogramo = ‖u × v‖ = ${fmt(norma)}`,
    `Área del triángulo = ½‖u × v‖ = ${fmt(norma / 2)}`,
  ]);

  const volumenPaso =
    w && volumen !== null
      ? mathStep('Volumen del paralelepípedo', [
          `(u × v) · w = (${fmt(c[0])})(${fmt(w[0])}) + (${fmt(c[1])})(${fmt(w[1])}) + (${fmt(
            c[2],
          )})(${fmt(w[2])}) = ${fmt(dot(c, w))}`,
          `Volumen = |(u × v) · w| = ${fmt(volumen)}`,
        ])
      : '';

  return determinante + desarrollo + perpendicular + areas + volumenPaso;
}

export function renderCruz() {
  const { u: uFrac, v: vFrac, w: wFrac } = readCrossValues();
  const u = uFrac.map((valor) => valor.toNumber());
  const v = vFrac.map((valor) => valor.toNumber());
  const w = wFrac ? wFrac.map((valor) => valor.toNumber()) : null;

  const c = cross(u, v);
  const norma = norm(c);
  const areaTriangulo = norma / 2;
  const volumen = w ? Math.abs(dot(c, w)) : null;
  const paralelos = norma < 1e-9;

  const puntos = [[0, 0, 0], u, v, c];
  if (w) puntos.push(w);
  const rango = range3(puntos, 4);

  const scene = {
    range: rango,
    cameraZoom: 1.42,
    vectors: [
      { v: u, color: COLORS.u, label: 'u' },
      { v, color: COLORS.v, label: 'v' },
      { v: c, color: COLORS.cross, label: 'u × v', width: 3 },
      ...(w ? [{ v: w, color: COLORS.w, label: 'w', dashed: true }] : []),
    ],
    parallelogram: { u, v, color: COLORS.u },
    badge: paralelos
      ? { text: 'Vectores paralelos', color: COLORS.cross }
      : { text: 'Perpendicular a u y v', color: COLORS.cross },
    aria: `Vectores u y v, el paralelogramo que generan y el vector u cruz v igual a ${fmtVector(
      c,
    )}.`,
  };

  const legend = [
    { kind: 'line', color: COLORS.u, label: 'u' },
    { kind: 'line', color: COLORS.v, label: 'v' },
    { kind: 'line', color: COLORS.cross, label: 'u × v' },
    ...(w ? [{ kind: 'dash', color: COLORS.w, label: 'w' }] : []),
    { kind: 'dot', color: COLORS.u, label: 'Paralelogramo' },
  ];

  const checks = [
    {
      ok: Math.abs(dot(c, u)) < 1e-9,
      html: `<strong>(u × v) · u = ${fmt(dot(c, u))}</strong>: perpendicular a u.`,
    },
    {
      ok: Math.abs(dot(c, v)) < 1e-9,
      html: `<strong>(u × v) · v = ${fmt(dot(c, v))}</strong>: perpendicular a v.`,
    },
    {
      ok: true,
      html: `<strong>v × u = ${fmtVector(cross(v, u))} = −(u × v)</strong>: invertir el orden cambia el sentido.`,
    },
    {
      ok: true,
      html: `<strong>Área del paralelogramo = ‖u × v‖ = ${fmt(norma)}</strong>.`,
    },
    {
      ok: true,
      html: `<strong>Área del triángulo = ½‖u × v‖ = ${fmt(areaTriangulo)}</strong>.`,
    },
  ];

  if (w) {
    checks.push({
      ok: true,
      html: `<strong>Volumen = |(u × v) · w| = ${fmt(volumen)}</strong>.`,
    });
  }

  if (paralelos) {
    checks.unshift({
      ok: null,
      html: 'u y v son paralelos: el producto cruz es el vector cero.',
    });
  }

  let reading;
  if (paralelos) {
    reading = `Los vectores son <strong>paralelos</strong> (o uno de ellos es el vector cero). Por eso <strong>u × v = (0, 0, 0)</strong>: no hay una dirección perpendicular única y el paralelogramo se degenera en un segmento, con área 0.`;
  } else {
    reading = `El vector <strong>u × v = ${fmtVector(
      c,
    )}</strong> es <strong>perpendicular</strong> a u y a v: los dos productos punto dan 0. Su norma <strong>‖u × v‖ = ${fmt(
      norma,
    )}</strong> es el área del paralelogramo; el triángulo formado por u y v tiene la mitad, <strong>${fmt(
      areaTriangulo,
    )}</strong>. La dirección sigue la regla de la mano derecha.`;
  }
  if (w) {
    reading += ` El volumen del paralelepípedo generado por u, v y w es <strong>|(u × v) · w| = ${fmt(
      volumen,
    )}</strong>.`;
  }

  setResult('cruz', {
    title: 'Producto vectorial',
    value: `u × v = ${fmtVector(c)}`,
    long: true,
    status: 'neutral',
    statusLabel: paralelos ? 'Producto cruz nulo' : 'Producto cruz',
    metrics: [
      { label: '‖u × v‖', value: fmt(norma), tone: paralelos ? 'warn' : undefined },
      { label: 'área paralelogramo', value: fmt(norma) },
      { label: 'área triángulo', value: fmt(areaTriangulo) },
      {
        label: '(u×v) · u',
        value: fmt(dot(c, u)),
        tone: Math.abs(dot(c, u)) < 1e-9 ? 'good' : 'bad',
      },
      {
        label: '(u×v) · v',
        value: fmt(dot(c, v)),
        tone: Math.abs(dot(c, v)) < 1e-9 ? 'good' : 'bad',
      },
      ...(w ? [{ label: 'volumen', value: fmt(volumen) }] : []),
    ],
    legend,
    caption: 'Arrastra para orbitar · rueda para acercar · doble clic para reiniciar.',
    reading,
    checks,
  });

  document.getElementById('steps-cruz').innerHTML = crossSteps(u, v, c, w, volumen);
  renderScene('cruz', scene);
}
