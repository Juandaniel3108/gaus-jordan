/**
 * Lienzo 2D en Canvas: rectas, vectores, paralelogramos y puntos solución.
 * Sin dependencias externas; se adapta al tamaño del contenedor y a pantallas HiDPI.
 */

import { fmt } from '../core/format.js';

const C = {
  bgTop: '#0e1d1a',
  bgBottom: '#0a1513',
  gridMinor: 'rgba(120, 160, 150, 0.07)',
  grid: 'rgba(120, 160, 150, 0.16)',
  axis: 'rgba(184, 206, 199, 0.55)',
  axisStrong: 'rgba(214, 230, 224, 0.75)',
  text: '#d8e5e0',
  muted: '#7e9690',
  paper: '#f4f7f3',
};

function niceStep(raw) {
  if (!Number.isFinite(raw) || raw <= 0) return 1;
  const exponente = Math.floor(Math.log10(raw));
  const base = raw / 10 ** exponente;
  const factor = base <= 1 ? 1 : base <= 2 ? 2 : base <= 5 ? 5 : 10;
  return factor * 10 ** exponente;
}

function decimalsFor(step) {
  if (step >= 1) return 0;
  return Math.min(4, Math.max(1, Math.ceil(-Math.log10(step))));
}

function withAlpha(hex, alpha) {
  const limpio = hex.replace('#', '');
  const r = parseInt(limpio.slice(0, 2), 16);
  const g = parseInt(limpio.slice(2, 4), 16);
  const b = parseInt(limpio.slice(4, 6), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

function clipLineToRect(a, b, c, rect) {
  const eps = 1e-9;
  if (Math.abs(a) < eps && Math.abs(b) < eps) return [];

  const norma = a * a + b * b;
  const p0 = [(a * c) / norma, (b * c) / norma];
  const d = [-b, a];
  const candidatos = [];

  const agregar = (t) => {
    const x = p0[0] + d[0] * t;
    const y = p0[1] + d[1] * t;
    if (
      x >= rect.xmin - eps &&
      x <= rect.xmax + eps &&
      y >= rect.ymin - eps &&
      y <= rect.ymax + eps
    ) {
      candidatos.push([x, y]);
    }
  };

  if (Math.abs(d[0]) > eps) {
    agregar((rect.xmin - p0[0]) / d[0]);
    agregar((rect.xmax - p0[0]) / d[0]);
  }
  if (Math.abs(d[1]) > eps) {
    agregar((rect.ymin - p0[1]) / d[1]);
    agregar((rect.ymax - p0[1]) / d[1]);
  }

  const unicos = [];
  for (const punto of candidatos) {
    if (!unicos.some((otro) => Math.hypot(otro[0] - punto[0], otro[1] - punto[1]) < 1e-7)) {
      unicos.push(punto);
    }
  }
  if (unicos.length < 2) return [];
  unicos.sort((p, q) => Math.hypot(q[0] - p0[0], q[1] - p0[1]) - Math.hypot(p[0] - p0[0], p[1] - p0[1]));
  return [unicos[0], unicos[unicos.length - 1]];
}

export class Plot2D {
  constructor(canvas) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.scene = null;
    this.observer = new ResizeObserver(() => this.draw());
    this.observer.observe(canvas);
  }

  render(scene) {
    this.scene = scene;
    this.draw();
  }

  draw() {
    const scene = this.scene;
    if (!scene) return;

    const rect = this.canvas.getBoundingClientRect();
    const ancho = Math.round(rect.width);
    const alto = Math.round(rect.height);
    if (ancho < 2 || alto < 2) return;

    const dpr = Math.min(2, window.devicePixelRatio || 1);
    if (this.canvas.width !== Math.round(ancho * dpr) || this.canvas.height !== Math.round(alto * dpr)) {
      this.canvas.width = Math.round(ancho * dpr);
      this.canvas.height = Math.round(alto * dpr);
    }

    const ctx = this.ctx;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, ancho, alto);

    const fondo = ctx.createLinearGradient(0, 0, ancho, alto);
    fondo.addColorStop(0, C.bgTop);
    fondo.addColorStop(1, C.bgBottom);
    ctx.fillStyle = fondo;
    ctx.fillRect(0, 0, ancho, alto);

    const margen = { left: 54, right: 26, top: 24, bottom: 44 };
    const plot = {
      x: margen.left,
      y: margen.top,
      w: Math.max(10, ancho - margen.left - margen.right),
      h: Math.max(10, alto - margen.top - margen.bottom),
    };

    const centro = scene.center || [0, 0];
    const medio = Math.max(0.5, scene.halfSpan || 6);
    const escala = Math.min(plot.w, plot.h) / (2 * medio);

    const xmin = centro[0] - plot.w / (2 * escala);
    const xmax = centro[0] + plot.w / (2 * escala);
    const ymin = centro[1] - plot.h / (2 * escala);
    const ymax = centro[1] + plot.h / (2 * escala);

    const X = (x) => plot.x + (x - xmin) * escala;
    const Y = (y) => plot.y + (ymax - y) * escala;

    const mundo = { xmin, xmax, ymin, ymax };
    const paso = niceStep(Math.max(xmax - xmin, ymax - ymin) / 8);
    const pasoMenor = paso / 5;
    const decimales = decimalsFor(paso);

    // Rejilla menor
    ctx.lineWidth = 1;
    ctx.strokeStyle = C.gridMinor;
    ctx.beginPath();
    for (let x = Math.ceil(xmin / pasoMenor) * pasoMenor; x <= xmax; x += pasoMenor) {
      const px = Math.round(X(x)) + 0.5;
      ctx.moveTo(px, plot.y);
      ctx.lineTo(px, plot.y + plot.h);
    }
    for (let y = Math.ceil(ymin / pasoMenor) * pasoMenor; y <= ymax; y += pasoMenor) {
      const py = Math.round(Y(y)) + 0.5;
      ctx.moveTo(plot.x, py);
      ctx.lineTo(plot.x + plot.w, py);
    }
    ctx.stroke();

    // Rejilla mayor y etiquetas
    ctx.strokeStyle = C.grid;
    ctx.beginPath();
    for (let x = Math.ceil(xmin / paso) * paso; x <= xmax; x += paso) {
      const px = Math.round(X(x)) + 0.5;
      ctx.moveTo(px, plot.y);
      ctx.lineTo(px, plot.y + plot.h);
    }
    for (let y = Math.ceil(ymin / paso) * paso; y <= ymax; y += paso) {
      const py = Math.round(Y(y)) + 0.5;
      ctx.moveTo(plot.x, py);
      ctx.lineTo(plot.x + plot.w, py);
    }
    ctx.stroke();

    ctx.font = '11px "SF Mono", "Menlo", monospace';
    ctx.fillStyle = C.muted;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'top';
    for (let x = Math.ceil(xmin / paso) * paso; x <= xmax; x += paso) {
      if (Math.abs(x) < paso / 100) continue;
      const px = X(x);
      if (px < plot.x + 12 || px > plot.x + plot.w - 12) continue;
      ctx.fillText(fmt(x, decimales), px, plot.y + plot.h + 9);
    }
    ctx.textAlign = 'right';
    ctx.textBaseline = 'middle';
    for (let y = Math.ceil(ymin / paso) * paso; y <= ymax; y += paso) {
      if (Math.abs(y) < paso / 100) continue;
      const py = Y(y);
      if (py < plot.y + 10 || py > plot.y + plot.h - 10) continue;
      ctx.fillText(fmt(y, decimales), plot.x - 10, py);
    }

    // Ejes
    ctx.strokeStyle = C.axis;
    ctx.fillStyle = C.axis;
    ctx.lineWidth = 1.2;
    if (ymin <= 0 && ymax >= 0) {
      const py = Math.round(Y(0)) + 0.5;
      ctx.beginPath();
      ctx.moveTo(plot.x, py);
      ctx.lineTo(plot.x + plot.w - 4, py);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(plot.x + plot.w, py);
      ctx.lineTo(plot.x + plot.w - 9, py - 4);
      ctx.lineTo(plot.x + plot.w - 9, py + 4);
      ctx.closePath();
      ctx.fill();
      ctx.font = 'italic 13px "Iowan Old Style", Georgia, serif';
      ctx.fillStyle = C.axisStrong;
      ctx.textAlign = 'right';
      ctx.textBaseline = 'bottom';
      ctx.fillText('x', plot.x + plot.w - 2, py - 7);
    }
    if (xmin <= 0 && xmax >= 0) {
      const px = Math.round(X(0)) + 0.5;
      ctx.beginPath();
      ctx.moveTo(px, plot.y + plot.h);
      ctx.lineTo(px, plot.y + 4);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(px, plot.y);
      ctx.lineTo(px - 4, plot.y + 9);
      ctx.lineTo(px + 4, plot.y + 9);
      ctx.closePath();
      ctx.fill();
      ctx.font = 'italic 13px "Iowan Old Style", Georgia, serif';
      ctx.fillStyle = C.axisStrong;
      ctx.textAlign = 'left';
      ctx.textBaseline = 'top';
      ctx.fillText('y', px + 8, plot.y - 2);
    }
    if (xmin <= 0 && xmax >= 0 && ymin <= 0 && ymax >= 0) {
      ctx.font = '10px "SF Mono", "Menlo", monospace';
      ctx.fillStyle = C.muted;
      ctx.textAlign = 'right';
      ctx.textBaseline = 'top';
      ctx.fillText('0', X(0) - 7, Y(0) + 7);
    }

    // Paralelogramo
    if (scene.parallelogram) {
      const { u, v, color } = scene.parallelogram;
      const puntos = [
        [0, 0],
        [u[0], u[1]],
        [u[0] + v[0], u[1] + v[1]],
        [v[0], v[1]],
      ].map(([x, y]) => [X(x), Y(y)]);

      ctx.beginPath();
      ctx.moveTo(...puntos[0]);
      for (let i = 1; i < puntos.length; i += 1) ctx.lineTo(...puntos[i]);
      ctx.closePath();
      ctx.fillStyle = withAlpha(color || '#e7b15a', 0.11);
      ctx.fill();
      ctx.strokeStyle = withAlpha(color || '#e7b15a', 0.35);
      ctx.setLineDash([4, 5]);
      ctx.lineWidth = 1;
      ctx.stroke();
      ctx.setLineDash([]);
    }

    // Rectas
    for (const linea of scene.lines || []) {
      const segmento = clipLineToRect(linea.a, linea.b, linea.c, mundo);
      if (!segmento.length) continue;
      const [p1, p2] = segmento;
      ctx.save();
      ctx.strokeStyle = linea.color;
      ctx.lineWidth = 2.2;
      ctx.lineCap = 'round';
      if (linea.dashed) ctx.setLineDash([7, 6]);
      ctx.shadowColor = withAlpha(linea.color, 0.45);
      ctx.shadowBlur = 9;
      ctx.beginPath();
      ctx.moveTo(X(p1[0]), Y(p1[1]));
      ctx.lineTo(X(p2[0]), Y(p2[1]));
      ctx.stroke();
      ctx.restore();
    }

    // Ángulo entre vectores
    if (scene.angle) {
      this.drawAngle(ctx, scene.angle, X, Y);
    }

    // Vectores
    for (const vector of scene.vectors || []) {
      const desde = vector.from || [0, 0];
      const hasta = [desde[0] + vector.v[0], desde[1] + vector.v[1]];
      this.drawArrow(
        ctx,
        [X(desde[0]), Y(desde[1])],
        [X(hasta[0]), Y(hasta[1])],
        vector.color,
        vector.label,
        { dashed: vector.dashed, width: vector.width || 2.2 },
      );
    }

    // Puntos
    for (const punto of scene.points || []) {
      this.drawPoint(ctx, X(punto.p[0]), Y(punto.p[1]), punto.color, punto.label);
    }

    // Aviso en la esquina
    if (scene.badge) {
      this.drawBadge(ctx, scene.badge.text, scene.badge.color, plot.x + 10, plot.y + 10);
    }
  }

  drawArrow(ctx, desde, hasta, color, label, opciones = {}) {
    const [x1, y1] = desde;
    const [x2, y2] = hasta;
    const dx = x2 - x1;
    const dy = y2 - y1;
    const largo = Math.hypot(dx, dy);

    ctx.save();
    ctx.strokeStyle = color;
    ctx.fillStyle = color;
    ctx.lineWidth = opciones.width || 2.2;
    ctx.lineCap = 'round';
    ctx.shadowColor = withAlpha(color, 0.4);
    ctx.shadowBlur = 7;
    if (opciones.dashed) ctx.setLineDash([6, 6]);

    if (largo < 2) {
      ctx.beginPath();
      ctx.arc(x1, y1, 4, 0, Math.PI * 2);
      ctx.fill();
    } else {
      const angulo = Math.atan2(dy, dx);
      const cabeza = Math.min(11, largo * 0.35);
      const baseX = x2 - Math.cos(angulo) * cabeza;
      const baseY = y2 - Math.sin(angulo) * cabeza;

      ctx.beginPath();
      ctx.moveTo(x1, y1);
      ctx.lineTo(baseX, baseY);
      ctx.stroke();

      ctx.setLineDash([]);
      ctx.beginPath();
      ctx.moveTo(x2, y2);
      ctx.lineTo(
        baseX + Math.cos(angulo + Math.PI / 2) * cabeza * 0.42,
        baseY + Math.sin(angulo + Math.PI / 2) * cabeza * 0.42,
      );
      ctx.lineTo(
        baseX + Math.cos(angulo - Math.PI / 2) * cabeza * 0.42,
        baseY + Math.sin(angulo - Math.PI / 2) * cabeza * 0.42,
      );
      ctx.closePath();
      ctx.fill();
    }
    ctx.restore();

    if (label) {
      const separacion = 16;
      const angulo = Math.atan2(dy, dx);
      this.drawPill(
        ctx,
        label,
        x2 + Math.cos(angulo) * separacion,
        y2 + Math.sin(angulo) * separacion,
        color,
      );
    }
  }

  drawPoint(ctx, x, y, color, label) {
    ctx.save();
    const halo = ctx.createRadialGradient(x, y, 0, x, y, 24);
    halo.addColorStop(0, withAlpha(color, 0.45));
    halo.addColorStop(1, withAlpha(color, 0));
    ctx.fillStyle = halo;
    ctx.beginPath();
    ctx.arc(x, y, 24, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.arc(x, y, 5, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(x, y, 2, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();

    if (label) {
      this.drawPill(ctx, label, x + 12, y - 14, color);
    }
  }

  drawPill(ctx, text, x, y, color) {
    ctx.save();
    ctx.font = '600 12px "Avenir Next", "Segoe UI", sans-serif';
    const ancho = ctx.measureText(text).width + 16;
    const alto = 24;
    let izquierda = x;
    let arriba = y - alto / 2;
    const limite = this.canvas.getBoundingClientRect().width - 8;
    if (izquierda + ancho > limite) izquierda = limite - ancho;
    if (izquierda < 6) izquierda = 6;

    ctx.fillStyle = 'rgba(9, 20, 18, 0.88)';
    ctx.strokeStyle = withAlpha(color, 0.55);
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.roundRect(izquierda, arriba, ancho, alto, 4);
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = C.paper;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(text, izquierda + ancho / 2, arriba + alto / 2 + 0.5);
    ctx.restore();
  }

  drawBadge(ctx, text, color, x, y) {
    ctx.save();
    ctx.font = '600 11px "Avenir Next", "Segoe UI", sans-serif';
    const ancho = ctx.measureText(text).width + 20;
    ctx.fillStyle = withAlpha(color, 0.12);
    ctx.strokeStyle = withAlpha(color, 0.35);
    ctx.beginPath();
    ctx.roundRect(x, y, ancho, 26, 3);
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = color;
    ctx.textAlign = 'left';
    ctx.textBaseline = 'middle';
    ctx.fillText(text, x + 10, y + 13.5);
    ctx.restore();
  }

  drawAngle(ctx, angle, X, Y) {
    const { u, v, color, label } = angle;
    const origen = [X(0), Y(0)];
    const a1 = Math.atan2(Y(u[1]) - origen[1], X(u[0]) - origen[0]);
    const a2 = Math.atan2(Y(v[1]) - origen[1], X(v[0]) - origen[0]);
    let delta = a2 - a1;
    while (delta > Math.PI) delta -= Math.PI * 2;
    while (delta < -Math.PI) delta += Math.PI * 2;

    const radio = 38;
    ctx.save();
    ctx.strokeStyle = withAlpha(color, 0.7);
    ctx.fillStyle = withAlpha(color, 0.9);
    ctx.lineWidth = 1.2;
    ctx.setLineDash([3, 4]);
    ctx.beginPath();
    ctx.arc(origen[0], origen[1], radio, a1, a1 + delta, delta < 0);
    ctx.stroke();
    ctx.setLineDash([]);

    if (label) {
      const medio = a1 + delta / 2;
      this.drawPill(
        ctx,
        label,
        origen[0] + Math.cos(medio) * (radio + 24),
        origen[1] + Math.sin(medio) * (radio + 24),
        color,
      );
    }
    ctx.restore();
  }

  destroy() {
    this.observer.disconnect();
  }
}
