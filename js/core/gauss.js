/**
 * Eliminación de Gauss con aritmética exacta.
 *
 * solveLinearSystem(A, b) devuelve, además de la solución, la traza completa
 * del procedimiento: matriz aumentada, operaciones de fila, forma escalonada,
 * sustitución regresiva, clasificación y solución paramétrica cuando hace falta.
 */

import { Frac } from './fraction.js';

export const VAR_NAMES = ['x', 'y', 'z', 'w'];

const cero = () => Frac.zero;
const uno = () => Frac.one;

function cloneMatrix(matrix) {
  return matrix.map((fila) => fila.map((valor) => Frac.of(valor)));
}

function filaEsCero(fila, columnas) {
  for (let j = 0; j < columnas; j += 1) {
    if (!fila[j].isZero()) return false;
  }
  return true;
}

/** Coeficiente listo para escribir junto a una variable: 2x, −x, (1/2)x. */
function coeficienteTexto(coef) {
  const f = Frac.of(coef);
  const magnitud = f.abs().toText();
  return f.d === 1 ? magnitud : `(${magnitud})`;
}

function terminoTexto(coef, variable) {
  const f = Frac.of(coef);
  const mag = f.abs();
  if (mag.equals(1)) return variable;
  return `${coeficienteTexto(mag)}${variable}`;
}

/** Escribe una fila como ecuación: 2x + y − z = 8. */
export function rowEquationText(fila, columnas) {
  const partes = [];
  for (let j = 0; j < columnas; j += 1) {
    const coef = fila[j];
    if (coef.isZero()) continue;
    const cuerpo = terminoTexto(coef, VAR_NAMES[j] || `x${j + 1}`);
    if (partes.length === 0) {
      partes.push(`${coef.isNegative() ? '−' : ''}${cuerpo}`);
    } else {
      partes.push(`${coef.isNegative() ? ' − ' : ' + '}${cuerpo}`);
    }
  }
  if (partes.length === 0) partes.push('0');
  return `${partes.join('')} = ${Frac.of(fila[columnas]).toText()}`;
}

/** Texto de una operación elemental de fila. */
export function rowOperationLabel(destino, fuente, factor) {
  const f = Frac.of(factor);
  const fila = `R${destino + 1}`;
  const otra = `R${fuente + 1}`;

  if (f.equals(1)) return `${fila} ← ${fila} − ${otra}`;
  if (f.equals(-1)) return `${fila} ← ${fila} + ${otra}`;
  if (f.isNegative()) {
    return `${fila} ← ${fila} + ${coeficienteTexto(f.abs())}${otra}`;
  }
  return `${fila} ← ${fila} − ${coeficienteTexto(f)}${otra}`;
}

/** Determinante exacto por eliminación (solo matrices cuadradas). */
export function determinant(A) {
  const n = A.length;
  if (!n || A.some((fila) => fila.length !== n)) return null;

  const M = cloneMatrix(A);
  let det = uno();
  let signo = 1;

  for (let k = 0; k < n; k += 1) {
    let pivote = k;
    while (pivote < n && M[pivote][k].isZero()) pivote += 1;
    if (pivote === n) return Frac.zero;

    if (pivote !== k) {
      [M[k], M[pivote]] = [M[pivote], M[k]];
      signo *= -1;
    }

    det = det.times(M[k][k]);

    for (let i = k + 1; i < n; i += 1) {
      if (M[i][k].isZero()) continue;
      const factor = M[i][k].div(M[k][k]);
      M[i] = M[i].map((valor, j) => valor.minus(factor.times(M[k][j])));
    }
  }

  return signo === 1 ? det : det.neg();
}

function formaEscalonadaReducida(aug, pivotes, n) {
  const M = cloneMatrix(aug);
  const pasos = [];

  for (let i = pivotes.length - 1; i >= 0; i -= 1) {
    const col = pivotes[i];
    if (!M[i][col].equals(1)) {
      const pivote = M[i][col];
      const inverso = Frac.one.div(pivote);
      M[i] = M[i].map((valor) => valor.div(pivote));
      const factor =
        inverso.equals(-1) ? '−' : `(${inverso.toText()})`;
      pasos.push({
        op: `R${i + 1} ← ${factor}R${i + 1}`,
        matrix: cloneMatrix(M),
        note: 'Se normaliza el pivote para leer la solución.',
      });
    }

    for (let fila = i - 1; fila >= 0; fila -= 1) {
      if (M[fila][col].isZero()) continue;
      const factor = M[fila][col];
      M[fila] = M[fila].map((valor, j) => valor.minus(factor.times(M[i][j])));
      pasos.push({
        op: rowOperationLabel(fila, i, factor),
        matrix: cloneMatrix(M),
        note: 'Se hace cero por encima del pivote.',
      });
    }
  }

  return { matrix: M, steps: pasos };
}

function expresionSimbolica(constante, terminos) {
  const partes = [];
  if (!constante.isZero() || terminos.length === 0) {
    partes.push({
      signo: constante.isNegative() ? -1 : 1,
      texto: constante.abs().toText(),
    });
  }

  for (const { coef, variable } of terminos) {
    if (coef.isZero()) continue;
    const mag = coef.abs();
    const cuerpo = mag.equals(1) ? variable : `${coeficienteTexto(mag)}${variable}`;
    partes.push({ signo: coef.isNegative() ? -1 : 1, texto: cuerpo });
  }

  if (partes.length === 0) return '0';

  return partes
    .map((parte, indice) => {
      if (indice === 0) return `${parte.signo < 0 ? '−' : ''}${parte.texto}`;
      return `${parte.signo < 0 ? ' − ' : ' + '}${parte.texto}`;
    })
    .join('');
}

function solucionParametrica(rref, pivotes, n) {
  const libres = [];
  for (let col = 0; col < n; col += 1) {
    if (!pivotes.includes(col)) libres.push(col);
  }

  const nombresParametros = ['t', 's', 'r', 'q'];
  const parametros = libres.map((_, indice) => nombresParametros[indice] || `t${indice + 1}`);
  const parametroPorColumna = new Map(libres.map((col, indice) => [col, parametros[indice]]));

  const lineas = [];
  const particular = Array.from({ length: n }, () => Frac.zero);
  const direcciones = [];

  for (let i = 0; i < pivotes.length; i += 1) {
    particular[pivotes[i]] = rref[i][n];
  }

  for (const col of libres) {
    const direccion = Array.from({ length: n }, () => Frac.zero);
    direccion[col] = uno();
    for (let i = 0; i < pivotes.length; i += 1) {
      direccion[pivotes[i]] = rref[i][col].neg();
    }
    direcciones.push(direccion);
  }

  for (let variable = 0; variable < n; variable += 1) {
    const nombre = VAR_NAMES[variable] || `x${variable + 1}`;
    if (parametroPorColumna.has(variable)) {
      lineas.push({
        variable: nombre,
        expr: parametroPorColumna.get(variable),
        libre: true,
      });
      continue;
    }

    const fila = pivotes.indexOf(variable);
    const terminos = libres.map((col) => ({
      coef: rref[fila][col].neg(),
      variable: parametroPorColumna.get(col),
    }));

    lineas.push({
      variable: nombre,
      expr: expresionSimbolica(rref[fila][n], terminos),
      libre: false,
    });
  }

  const texto = lineas.map((linea) => `${linea.variable} = ${linea.expr}`).join(', ');
  const dominio =
    parametros.length === 1
      ? `${parametros[0]} ∈ ℝ`
      : `${parametros.slice(0, -1).join(', ')} y ${parametros[parametros.length - 1]} ∈ ℝ`;

  return {
    params: parametros,
    freeColumns: libres,
    lines: lineas,
    particular,
    directions: direcciones,
    dimension: libres.length,
    text: texto,
    domain: dominio,
  };
}

function filaSustituida(fila, col, n, valores) {
  const partes = [];
  for (let j = col; j < n; j += 1) {
    const coef = fila[j];
    if (j > col && coef.isZero()) continue;

    if (j === col) {
      const cuerpo = terminoTexto(coef, VAR_NAMES[j] || `x${j + 1}`);
      partes.push(`${coef.isNegative() ? '−' : ''}${cuerpo}`);
      continue;
    }

    const valor = valores[j];
    if (!valor || valor.isZero()) continue;
    const producto = coef.times(valor);
    const cuerpo =
      coef.abs().equals(1) ? valor.toText() : `${coeficienteTexto(coef.abs())}(${valor.toText()})`;
    partes.push(`${producto.isNegative() ? ' − ' : ' + '}${cuerpo}`);
  }

  if (partes.length === 0) partes.push('0');
  return `${partes.join('')} = ${fila[n].toText()}`;
}

function sustitucionRegresiva(aug, pivotes, n) {
  const x = Array.from({ length: n }, () => Frac.zero);
  const pasos = [];

  for (let i = pivotes.length - 1; i >= 0; i -= 1) {
    const col = pivotes[i];
    let ladoDerecho = aug[i][n];
    for (let j = col + 1; j < n; j += 1) {
      ladoDerecho = ladoDerecho.minus(aug[i][j].times(x[j]));
    }
    x[col] = ladoDerecho.div(aug[i][col]);

    pasos.push({
      variable: VAR_NAMES[col] || `x${col + 1}`,
      equation: rowEquationText(aug[i], n),
      substituted: filaSustituida(aug[i], col, n, x),
      result: `${VAR_NAMES[col] || `x${col + 1}`} = ${x[col].toText()}`,
      value: x[col],
    });
  }

  return { values: x, steps: pasos };
}

/**
 * Resuelve A·x = b y describe todo el proceso.
 * @param {Array<Array<Frac|number>>} A coeficientes
 * @param {Array<Frac|number>} b términos independientes
 */
export function solveLinearSystem(A, b) {
  if (!Array.isArray(A) || A.length === 0) {
    throw new Error('La matriz de coeficientes está vacía.');
  }
  const n = A[0].length;
  if (!n) throw new Error('El sistema no tiene variables.');
  if (A.some((fila) => fila.length !== n)) {
    throw new Error('Todas las filas deben tener la misma cantidad de coeficientes.');
  }
  if (!Array.isArray(b) || b.length !== A.length) {
    throw new Error('Cada ecuación necesita su término independiente.');
  }

  const m = A.length;
  const aug = A.map((fila, i) => [...fila.map((v) => Frac.of(v)), Frac.of(b[i])]);
  const inicial = cloneMatrix(aug);
  const steps = [
    {
      op: 'Matriz aumentada',
      matrix: cloneMatrix(aug),
      note: 'Cada fila es una ecuación; la última columna son los términos independientes.',
    },
  ];

  let filaPivote = 0;
  const pivotes = [];

  for (let col = 0; col < n && filaPivote < m; col += 1) {
    let pivote = -1;
    for (let i = filaPivote; i < m; i += 1) {
      if (!aug[i][col].isZero()) {
        pivote = i;
        break;
      }
    }
    if (pivote === -1) continue;

    if (pivote !== filaPivote) {
      [aug[filaPivote], aug[pivote]] = [aug[pivote], aug[filaPivote]];
      steps.push({
        op: `R${filaPivote + 1} ↔ R${pivote + 1}`,
        matrix: cloneMatrix(aug),
        note: 'El pivote era cero: se intercambian las filas.',
      });
    }

    for (let i = filaPivote + 1; i < m; i += 1) {
      if (aug[i][col].isZero()) continue;
      const factor = aug[i][col].div(aug[filaPivote][col]);
      aug[i] = aug[i].map((valor, j) => valor.minus(factor.times(aug[filaPivote][j])));
      steps.push({
        op: rowOperationLabel(i, filaPivote, factor),
        matrix: cloneMatrix(aug),
        note: 'Se hace cero debajo del pivote.',
      });
    }

    pivotes.push(col);
    filaPivote += 1;
  }

  const rangoA = pivotes.length;
  let filaContradiccion = -1;
  for (let i = 0; i < m; i += 1) {
    if (filaEsCero(aug[i], n) && !aug[i][n].isZero()) {
      filaContradiccion = i;
      break;
    }
  }

  const esCuadrada = m === n;
  const det = esCuadrada ? determinant(A) : null;
  const echelon = cloneMatrix(aug);
  const base = {
    n,
    m,
    pivotes,
    rankA: rangoA,
    rankAug: rangoA + (filaContradiccion >= 0 ? 1 : 0),
    det,
    steps,
    echelon,
    initial: inicial,
    inconsistentRow: filaContradiccion,
  };

  if (filaContradiccion >= 0) {
    const k = aug[filaContradiccion][n].toText();
    steps.push({
      op: 'Fila contradictoria',
      matrix: cloneMatrix(aug),
      note: `La fila ${filaContradiccion + 1} equivale a 0 = ${k}, que es imposible.`,
    });
    return {
      ...base,
      status: 'none',
      classification: 'Incompatible',
      solution: null,
      backSubstitution: [],
      message: `No existe solución: la fila ${filaContradiccion + 1} conduce a 0 = ${k}.`,
    };
  }

  if (rangoA === n) {
    const { values, steps: pasosAtras } = sustitucionRegresiva(aug, pivotes, n);
    const verificacion = A.map((fila, i) => {
      const izquierda = fila.reduce(
        (acc, coef, j) => acc.plus(Frac.of(coef).times(values[j])),
        Frac.zero,
      );
      return {
        row: i + 1,
        left: izquierda,
        right: Frac.of(b[i]),
        ok: izquierda.equals(Frac.of(b[i])),
      };
    });

    return {
      ...base,
      status: 'unique',
      classification: 'Compatible determinado',
      solution: values,
      backSubstitution: pasosAtras,
      verification: verificacion,
      message: 'Compatible determinado: el sistema tiene una única solución.',
    };
  }

  const rref = formaEscalonadaReducida(aug, pivotes, n);
  if (rref.steps.length > 0) {
    steps.push(...rref.steps);
  } else {
    steps.push({
      op: 'Forma escalonada reducida',
      matrix: cloneMatrix(rref.matrix),
      note: 'La matriz ya está en forma escalonada reducida.',
    });
  }

  const parametrica = solucionParametrica(rref.matrix, pivotes, n);

  return {
    ...base,
    status: 'infinite',
    classification: 'Compatible indeterminado',
    solution: null,
    parametric: parametrica,
    rref: rref.matrix,
    backSubstitution: [],
    message: `Compatible indeterminado: hay ${parametrica.dimension} variable${
      parametrica.dimension === 1 ? ' libre' : 's libres'
    } y, por tanto, infinitas soluciones.`,
  };
}
