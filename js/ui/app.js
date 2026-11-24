/** Arranque de la aplicación: pestañas, casos de ejemplo y eventos. */

import { DEFAULTS, PRESETS } from './examples.js';
import {
  MODULES,
  ValidationError,
  initPlots,
  loadValues,
  updatePreview,
  clearError,
  setError,
  plots,
  lastScene,
} from './state.js';
import { renderSistema2, renderSistema3 } from './systems.js';
import { renderVectores2, renderVectores3, renderCruz } from './vector-views.js';

const TABS = Array.from(document.querySelectorAll('[role="tab"]'));
const PANELS = Array.from(document.querySelectorAll('[role="tabpanel"]'));

const RENDERERS = {
  sistema2: renderSistema2,
  sistema3: renderSistema3,
  vectores2: renderVectores2,
  vectores3: renderVectores3,
  cruz: renderCruz,
};

function activateModule(id, { updateHash = true, focusTab = false } = {}) {
  if (!MODULES[id]) return;

  TABS.forEach((tab) => {
    const activa = tab.dataset.module === id;
    tab.setAttribute('aria-selected', String(activa));
    tab.tabIndex = activa ? 0 : -1;
    if (activa && focusTab) tab.focus();
  });

  PANELS.forEach((panel) => {
    panel.hidden = panel.id !== `panel-${id}`;
  });

  if (updateHash) {
    try {
      history.replaceState(null, '', `#${id}`);
    } catch {
      // file:// puede bloquear replaceState; la aplicación sigue funcionando.
    }
  }

  requestAnimationFrame(() => {
    if (lastScene[id]) plots[id].render(lastScene[id]);
  });
}

function handleError(id, error, options) {
  if (error instanceof ValidationError) {
    setError(id, error.message, error.inputs, { silent: options.silent });
    return;
  }
  console.error(error);
  setError(
    id,
    'No se pudo calcular el resultado. Revisa los datos e inténtalo de nuevo.',
    [],
    { silent: options.silent },
  );
}

function runModule(id, options = {}) {
  clearError(id);
  try {
    RENDERERS[id]();
  } catch (error) {
    handleError(id, error, options);
  }
}

function initTabs() {
  TABS.forEach((tab, indice) => {
    tab.addEventListener('click', () => activateModule(tab.dataset.module));

    tab.addEventListener('keydown', (evento) => {
      let destino = null;
      if (evento.key === 'ArrowRight' || evento.key === 'ArrowDown') {
        destino = (indice + 1) % TABS.length;
      } else if (evento.key === 'ArrowLeft' || evento.key === 'ArrowUp') {
        destino = (indice - 1 + TABS.length) % TABS.length;
      } else if (evento.key === 'Home') {
        destino = 0;
      } else if (evento.key === 'End') {
        destino = TABS.length - 1;
      }

      if (destino !== null) {
        evento.preventDefault();
        activateModule(TABS[destino].dataset.module, { focusTab: true });
      }
    });
  });
}

function initExamples() {
  document.querySelectorAll('[data-examples]').forEach((contenedor) => {
    const id = contenedor.dataset.examples;
    const presets = PRESETS[id] || [];
    contenedor.innerHTML = presets
      .map(
        (preset, indice) =>
          `<button type="button" class="chip" data-status="${preset.status}" data-preset="${indice}">${preset.label}</button>`,
      )
      .join('');

    contenedor.addEventListener('click', (evento) => {
      const boton = evento.target.closest('[data-preset]');
      if (!boton) return;
      const preset = presets[Number(boton.dataset.preset)];
      if (!preset) return;
      loadValues(id, preset.values);
      runModule(id);
    });
  });
}

function descargar(id) {
  const canvas = document.getElementById(MODULES[id].canvas);
  canvas.toBlob((blob) => {
    if (!blob) return;
    const url = URL.createObjectURL(blob);
    const enlace = document.createElement('a');
    enlace.href = url;
    enlace.download = `algebra-visual-${id}.png`;
    document.body.appendChild(enlace);
    enlace.click();
    enlace.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }, 'image/png');
}

function initEvents() {
  Object.keys(MODULES).forEach((id) => {
    const cfg = MODULES[id];
    const form = document.getElementById(cfg.form);
    if (form) {
      form.addEventListener('submit', (evento) => {
        evento.preventDefault();
        runModule(id);
      });
    }
  });

  document.querySelectorAll('input').forEach((input) => {
    input.addEventListener('input', () => {
      input.removeAttribute('aria-invalid');
      const panel = input.closest('.module-panel');
      if (panel) updatePreview(panel.id.replace('panel-', ''));
    });
  });

  document.querySelectorAll('[data-reset]').forEach((boton) => {
    boton.addEventListener('click', () => {
      const id = boton.dataset.reset;
      loadValues(id, DEFAULTS[id]);
      runModule(id);
    });
  });

  document.querySelectorAll('[data-reset-view]').forEach((boton) => {
    boton.addEventListener('click', () => {
      const plot = plots[boton.dataset.resetView];
      if (plot && typeof plot.resetView === 'function') plot.resetView();
    });
  });

  document.querySelectorAll('[data-download]').forEach((boton) => {
    boton.addEventListener('click', () => descargar(boton.dataset.download));
  });

  window.addEventListener('hashchange', () => {
    const id = location.hash.slice(1);
    if (MODULES[id]) activateModule(id, { updateHash: false });
  });
}

function init() {
  initPlots();
  initTabs();
  initExamples();
  initEvents();

  Object.keys(MODULES).forEach((id) => loadValues(id, DEFAULTS[id]));
  Object.keys(MODULES).forEach((id) => runModule(id, { silent: true }));

  document
    .querySelectorAll('[id^="result-value-"]')
    .forEach((el) => el.setAttribute('aria-live', 'polite'));

  const hash = location.hash.slice(1);
  activateModule(MODULES[hash] ? hash : 'sistema2', { updateHash: false });
}

init();
