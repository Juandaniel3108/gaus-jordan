/**
 * Estado compartido de la interfaz: configuración de módulos, validación,
 * lectura de entradas y componentes visuales reutilizables.
 */

import { parseNumber, fracHTML } from '../core/fraction.js';
import { fmt } from '../core/format.js';
import { Plot2D } from '../viz/plot2d.js';
import { Plot3D } from '../viz/plot3d.js';

export const COLORS = {
  line1: '#e7b15a',
  line2: '#7fa8ff',
  solution: '#ff7a66',
  u: '#e7b15a',
  v: '#7fa8ff',
  sum: '#63d2bb',
  diff: '#f19582',
  scalar: '#c3a6ff',
  cross: '#ff8a72',
  w: '#8fe0c2',
};

export const PLANE_COLORS = ['#e7b15a', '#7fa8ff', '#63d2bb'];

export const STATUS_LABEL = {
  unique: 'Compatible determinado',
  infinite: 'Compatible indeterminado',
  none: 'Incompatible',
  neutral: 'Operaciones',
};

export const MODULES = {
  sistema2: {
    form: 'form-sistema2',
    fields: ['s2-a1', 's2-b1', 's2-c1', 's2-a2', 's2-b2', 's2-c2'],
    keys: ['a1', 'b1', 'c1', 'a2', 'b2', 'c2'],
    error: 'error-sistema2',
    canvas: 'canvas-sistema2',
    kind: '2d',
    equationSize: 3,
  },
  sistema3: {
    form: 'form-sistema3',
    fields: [
      's3-a1', 's3-b1', 's3-c1', 's3-d1',
      's3-a2', 's3-b2', 's3-c2', 's3-d2',
      's3-a3', 's3-b3', 's3-c3', 's3-d3',
    ],
    keys: [
      'a1', 'b1', 'c1', 'd1',
      'a2', 'b2', 'c2', 'd2',
      'a3', 'b3', 'c3', 'd3',
    ],
    error: 'error-sistema3',
    canvas: 'canvas-sistema3',
    kind: '3d',
    equationSize: 4,
  },
  vectores2: {
    form: 'form-vectores2',
    fields: ['v2-ux', 'v2-uy', 'v2-vx', 'v2-vy', 'v2-k'],
    keys: ['ux', 'uy', 'vx', 'vy', 'k'],
    error: 'error-vectores2',
    canvas: 'canvas-vectores2',
    kind: '2d',
  },
  vectores3: {
    form: 'form-vectores3',
    fields: ['v3-ux', 'v3-uy', 'v3-uz', 'v3-vx', 'v3-vy', 'v3-vz', 'v3-k'],
    keys: ['ux', 'uy', 'uz', 'vx', 'vy', 'vz', 'k'],
    error: 'error-vectores3',
    canvas: 'canvas-vectores3',
    kind: '3d',
  },
  cruz: {
    form: 'form-cruz',
    fields: ['c-ux', 'c-uy', 'c-uz', 'c-vx', 'c-vy', 'c-vz', 'c-wx', 'c-wy', 'c-wz'],
    keys: ['ux', 'uy', 'uz', 'vx', 'vy', 'vz', 'wx', 'wy', 'wz'],
    error: 'error-cruz',
    canvas: 'canvas-cruz',
    kind: '3d',
  },
};

export const plots = {};
export const lastScene = {};

export class ValidationError extends Error {
  constructor(message, inputs = []) {
    super(message);
    this.name = 'ValidationError';
    this.inputs = inputs;
  }
}

export function initPlots() {
  for (const [id, cfg] of Object.entries(MODULES)) {
    const canvas = document.getElementById(cfg.canvas);
    plots[id] = cfg.kind === '2d' ? new Plot2D(canvas) : new Plot3D(canvas);
  }
}

function inputOf(id) {
  return document.getElementById(id);
}

export function readFieldValues(id) {
  const cfg = MODULES[id];
  const values = {};
  const invalidos = [];
  let mensaje = '';

  cfg.fields.forEach((fieldId, indice) => {
    const input = inputOf(fieldId);
    const raw = input.value.trim();
    const etiqueta = input.getAttribute('aria-label') || 'campo';

    if (!raw) {
      invalidos.push(input);
      if (!mensaje) mensaje = `Completa el campo “${etiqueta}”.`;
      return;
    }

    try {
      values[cfg.keys[indice]] = parseNumber(raw);
    } catch (error) {
      invalidos.push(input);
      if (!mensaje) mensaje = `“${etiqueta}”: ${error.message}`;
    }
  });

  if (invalidos.length) throw new ValidationError(mensaje, invalidos);
  return values;
}

/** Lee un sistema y rechaza ecuaciones sin coeficientes (RF6). */
export function readSystem(id) {
  const cfg = MODULES[id];
  const values = readFieldValues(id);
  const tam = cfg.equationSize;
  const ecuaciones = cfg.fields.length / tam;

  for (let g = 0; g < ecuaciones; g += 1) {
    const inicio = g * tam;
    const coefKeys = cfg.keys.slice(inicio, inicio + tam - 1);
    if (coefKeys.every((key) => values[key].isZero())) {
      const inputs = cfg.fields.slice(inicio, inicio + tam - 1).map(inputOf);
      throw new ValidationError(
        `La ecuación ${g + 1} no tiene coeficientes. Escribe al menos uno distinto de cero.`,
        inputs,
      );
    }
  }

  const A = [];
  const b = [];
  for (let g = 0; g < ecuaciones; g += 1) {
    const inicio = g * tam;
    A.push(cfg.keys.slice(inicio, inicio + tam - 1).map((key) => values[key]));
    b.push(values[cfg.keys[inicio + tam - 1]]);
  }

  return { A, b, values };
}

export function readCrossValues() {
  const uIds = ['c-ux', 'c-uy', 'c-uz'];
  const vIds = ['c-vx', 'c-vy', 'c-vz'];
  const wIds = ['c-wx', 'c-wy', 'c-wz'];

  const leer = (fieldId) => {
    const input = inputOf(fieldId);
    const raw = input.value.trim();
    const etiqueta = input.getAttribute('aria-label') || 'campo';
    if (!raw) throw new ValidationError(`Completa el campo “${etiqueta}”.`, [input]);
    try {
      return parseNumber(raw);
    } catch (error) {
      throw new ValidationError(`“${etiqueta}”: ${error.message}`, [input]);
    }
  };

  const u = uIds.map(leer);
  const v = vIds.map(leer);
  const wRaw = wIds.map((fieldId) => inputOf(fieldId).value.trim());

  let w = null;
  if (wRaw.some((raw) => raw !== '')) {
    if (wRaw.some((raw) => raw === '')) {
      const faltantes = wIds.filter((_, i) => wRaw[i] === '').map(inputOf);
      throw new ValidationError(
        'Completa las tres componentes de w o deja las tres vacías.',
        faltantes,
      );
    }
    w = wRaw.map((raw, i) => {
      try {
        return parseNumber(raw);
      } catch (error) {
        throw new ValidationError(`“${inputOf(wIds[i]).getAttribute('aria-label')}”: ${error.message}`, [inputOf(wIds[i])]);
      }
    });
  }

  return { u, v, w };
}

export function loadValues(id, values) {
  const cfg = MODULES[id];
  cfg.fields.forEach((fieldId, indice) => {
    const input = inputOf(fieldId);
    const valor = values[cfg.keys[indice]];
    input.value = valor === undefined || valor === null ? '' : String(valor);
    input.removeAttribute('aria-invalid');
  });
  updatePreview(id);
  clearError(id);
}

function previewEquation(fieldIds, variables) {
  const valores = fieldIds.map((fieldId) => {
    const raw = inputOf(fieldId).value.trim();
    if (!raw) return null;
    try {
      return parseNumber(raw);
    } catch {
      return undefined;
    }
  });

  if (valores.some((valor) => valor === undefined)) return '—';
  if (valores.some((valor) => valor === null)) return 'Completa los coeficientes';

  const terminos = [];
  for (let i = 0; i < variables.length; i += 1) {
    const coef = valores[i];
    if (coef.isZero()) continue;
    const abs = coef.abs();
    const cuerpo = abs.equals(1)
      ? variables[i]
      : `${abs.d === 1 ? abs.toText() : `(${abs.toText()})`}${variables[i]}`;
    terminos.push({ signo: coef.isNegative() ? -1 : 1, cuerpo });
  }

  const izquierda =
    terminos.length === 0
      ? '0'
      : terminos
          .map((termino, i) =>
            i === 0
              ? `${termino.signo < 0 ? '−' : ''}${termino.cuerpo}`
              : `${termino.signo < 0 ? ' − ' : ' + '}${termino.cuerpo}`,
          )
          .join('');

  return `${izquierda} = ${valores[valores.length - 1].toText()}`;
}

export function updatePreview(id) {
  const cfg = MODULES[id];
  if (!cfg.equationSize) return;

  const variables = ['x', 'y', 'z'];
  const ecuaciones = cfg.fields.length / cfg.equationSize;
  for (let g = 0; g < ecuaciones; g += 1) {
    const inicio = g * cfg.equationSize;
    const fieldIds = cfg.fields.slice(inicio, inicio + cfg.equationSize);
    const el = document.querySelector(`[data-preview="${id}-${g + 1}"]`);
    if (el) {
      el.textContent = previewEquation(
        fieldIds,
        variables.slice(0, cfg.equationSize - 1),
      );
    }
  }
}

export function clearError(id) {
  const cfg = MODULES[id];
  const error = document.getElementById(cfg.error);
  if (error) {
    error.hidden = true;
    error.textContent = '';
  }
  cfg.fields.forEach((fieldId) => inputOf(fieldId)?.removeAttribute('aria-invalid'));
}

export function setError(id, message, inputs = [], opciones = {}) {
  const cfg = MODULES[id];
  const error = document.getElementById(cfg.error);
  cfg.fields.forEach((fieldId) => inputOf(fieldId)?.removeAttribute('aria-invalid'));
  inputs.forEach((input) => input.setAttribute('aria-invalid', 'true'));

  if (error) {
    error.hidden = false;
    error.textContent = message;
  }
  if (!opciones.silent && inputs[0]) {
    inputs[0].focus({ preventScroll: true });
  }
}

export function statusLabel(status) {
  return STATUS_LABEL[status] || STATUS_LABEL.neutral;
}

export function metricsHTML(items) {
  return items
    .map(
      (item) =>
        `<div class="metric"${item.tone ? ` data-tone="${item.tone}"` : ''}><span class="metric-label">${item.label}</span><span class="metric-value">${item.value}</span></div>`,
    )
    .join('');
}

export function legendHTML(items) {
  return items
    .map((item) => {
      let marca;
      if (item.kind === 'dot') {
        marca = `<span class="legend-dot" style="background:${item.color}"></span>`;
      } else if (item.kind === 'dash') {
        marca = `<span class="legend-dash" style="color:${item.color}"></span>`;
      } else {
        marca = `<span class="legend-line" style="background:${item.color}"></span>`;
      }
      return `<span class="legend-item">${marca}${item.label}</span>`;
    })
    .join('');
}

export function checksHTML(items) {
  return items
    .map((item) => {
      let marca;
      if (item.ok === true) marca = '<span class="tick">✓</span>';
      else if (item.ok === false) marca = '<span class="cross">✕</span>';
      else marca = '<span class="neutral">·</span>';
      return `<div class="check-row">${marca}<span>${item.html}</span></div>`;
    })
    .join('');
}

export function setResult(id, data) {
  const title = document.getElementById(`result-title-${id}`);
  const value = document.getElementById(`result-value-${id}`);
  const metrics = document.getElementById(`metrics-${id}`);
  const legend = document.getElementById(`legend-${id}`);
  const caption = document.getElementById(`caption-${id}`);
  const reading = document.getElementById(`reading-${id}`);
  const check = document.getElementById(`check-${id}`);

  title.textContent = data.title;
  value.textContent = data.value;
  value.classList.toggle('is-prose', Boolean(data.prose));
  value.classList.toggle(
    'is-long',
    !data.prose && (data.long === true || data.value.length > 30),
  );

  metrics.innerHTML = metricsHTML(data.metrics || []);
  legend.innerHTML = legendHTML(data.legend || []);
  if (caption) caption.textContent = data.caption || '';

  reading.innerHTML = `<span class="status-line" data-status="${data.status}">${data.statusLabel || statusLabel(data.status)}</span><br>${data.reading}`;
  check.innerHTML = checksHTML(data.checks || []);

  const stage = document.querySelector(`#panel-${id} .stage`);
  if (stage) {
    stage.classList.remove('is-updated');
    void stage.offsetWidth;
    stage.classList.add('is-updated');
  }
}

export function renderScene(id, scene) {
  lastScene[id] = scene;
  if (scene.aria) {
    document.getElementById(MODULES[id].canvas).setAttribute('aria-label', scene.aria);
  }
  plots[id].render(scene);
}

export function matrixHTML(matrix, augmented = true) {
  const columnas = matrix[0].length;
  const filas = matrix
    .map(
      (fila) =>
        `<tr>${fila
          .map(
            (valor, j) =>
              `<td class="${augmented && j === columnas - 1 ? 'aug' : ''}">${fracHTML(valor)}</td>`,
          )
          .join('')}</tr>`,
    )
    .join('');

  const texto = matrix
    .map((fila) => fila.map((valor) => valor.toText()).join(' '))
    .join('; ');
  const tipo = augmented
    ? `Matriz aumentada de ${matrix.length} por ${columnas}`
    : `Matriz de ${matrix.length} por ${columnas}`;

  return `<div class="matrix" role="img" aria-label="${tipo}: ${texto}"><table><tbody>${filas}</tbody></table></div>`;
}

export function mathStep(title, lines, note = '') {
  return `<div class="step"><div class="step-op">${title}</div>${
    note ? `<p class="step-note">${note}</p>` : ''
  }<div class="development">${lines
    .map((line) => `<div class="line">${line}</div>`)
    .join('')}</div></div>`;
}

export function substitutionText(A, b, x, fila) {
  const terminos = [];
  A[fila].forEach((coef, j) => {
    if (coef.isZero()) return;
    const signo = coef.isNegative() ? '−' : terminos.length ? '+' : '';
    const abs = coef.abs();
    const coefTexto = abs.equals(1) ? '' : fmt(abs);
    terminos.push(`${signo}${coefTexto}(${fmt(x[j])})`);
  });
  return `${terminos.join(' ') || '0'} = ${fmt(b[fila])}`;
}

export function stepsHTML(r) {
  const partes = r.steps.map(
    (step) =>
      `<div class="step"><div class="step-op">${step.op}</div>${
        step.note ? `<p class="step-note">${step.note}</p>` : ''
      }${matrixHTML(step.matrix, true)}</div>`,
  );

  if (r.backSubstitution && r.backSubstitution.length) {
    partes.push(
      `<div class="step"><div class="step-op">Sustitución regresiva</div><div class="substitution">${r.backSubstitution
        .map(
          (paso) =>
            `<div class="sub-row"><span class="sub-eq">${paso.substituted}</span><span class="sub-arrow">⇒</span><span class="sub-result">${paso.result}</span></div>`,
        )
        .join('')}</div></div>`,
    );
  }

  if (r.status === 'infinite' && r.parametric) {
    partes.push(
      `<div class="step"><div class="step-op">Solución paramétrica</div><p class="step-note">Las variables libres se expresan con ${r.parametric.params.join(', ')}.</p><div class="substitution">${r.parametric.lines
        .map(
          (linea) =>
            `<div class="sub-row"><span class="sub-eq">${linea.variable}</span><span class="sub-arrow">=</span><span class="sub-result">${linea.expr}</span>${
              linea.libre ? '<span class="matrix-caption">variable libre</span>' : ''
            }</div>`,
        )
        .join('')}</div><p class="matrix-caption">${r.parametric.domain}</p></div>`,
    );
  }

  if (r.status === 'none') {
    partes.push(
      `<div class="step"><div class="step-op">Conclusión</div><p class="step-note">La fila ${r.inconsistentRow + 1} de la forma escalonada equivale a 0 = ${fmt(
        r.echelon[r.inconsistentRow][r.n],
      )}. Es una contradicción, así que el sistema no tiene solución.</p></div>`,
    );
  }

  return partes.join('');
}

export function range2(points, minimo = 5) {
  const finitos = points.filter((p) => p.every((valor) => Number.isFinite(valor)));
  if (!finitos.length) return { center: [0, 0], halfSpan: minimo };

  let minX = Infinity;
  let maxX = -Infinity;
  let minY = Infinity;
  let maxY = -Infinity;
  for (const [x, y] of finitos) {
    minX = Math.min(minX, x);
    maxX = Math.max(maxX, x);
    minY = Math.min(minY, y);
    maxY = Math.max(maxY, y);
  }

  return {
    center: [(minX + maxX) / 2, (minY + maxY) / 2],
    halfSpan: Math.max(minimo, ((maxX - minX) / 2) * 1.28 + 0.8, ((maxY - minY) / 2) * 1.28 + 0.8),
  };
}

export function range3(points, minimo = 4) {
  let maximo = 0;
  for (const punto of points) {
    for (const valor of punto) {
      if (Number.isFinite(valor)) maximo = Math.max(maximo, Math.abs(valor));
    }
  }
  return Math.max(minimo, maximo * 1.3 + 0.8);
}
