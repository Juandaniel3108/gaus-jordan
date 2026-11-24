/**
 * Lienzo 3D propio sobre Canvas 2D.
 * Proyecta un cubo, planos recortados, rectas, vectores y puntos con una
 * cámara orbital. No necesita Three.js ni conexión a internet.
 */

const C = {
  bgTop: '#0e1d1a',
  bgBottom: '#081311',
  cube: 'rgba(136, 172, 162, 0.18)',
  cubeStrong: 'rgba(136, 172, 162, 0.3)',
  axis: 'rgba(196, 216, 210, 0.6)',
  text: '#d8e5e0',
  muted: '#78908b',
  paper: '#f4f7f3',
};

function withAlpha(hex, alpha) {
  const limpio = hex.replace('#', '');
  const r = parseInt(limpio.slice(0, 2), 16);
  const g = parseInt(limpio.slice(2, 4), 16);
  const b = parseInt(limpio.slice(4, 6), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

function norm3(v) {
  return Math.hypot(v[0], v[1], v[2]);
}

function cross3(a, b) {
  return [
    a[1] * b[2] - a[2] * b[1],
    a[2] * b[0] - a[0] * b[2],
    a[0] * b[1] - a[1] * b[0],
  ];
}

function unit3(v) {
  const n = norm3(v);
  if (n < 1e-12) return [0, 0, 0];
  return [v[0] / n, v[1] / n, v[2] / n];
}

const ESQUINAS = [
  [-1, -1, -1],
  [1, -1, -1],
  [1, 1, -1],
  [-1, 1, -1],
  [-1, -1, 1],
  [1, -1, 1],
  [1, 1, 1],
  [-1, 1, 1],
];

const ARISTAS = [
  [0, 1], [1, 2], [2, 3], [3, 0],
  [4, 5], [5, 6], [6, 7], [7, 4],
  [0, 4], [1, 5], [2, 6], [3, 7],
];

function poligonoPlano(plano) {
  const n = [plano.a, plano.b, plano.c];
  if (norm3(n) < 1e-12) return null;

  const d = plano.d;
  const puntos = [];
  const eps = 1e-7;

  const agregar = (p) => {
    if (!puntos.some((q) => Math.hypot(q[0] - p[0], q[1] - p[1], q[2] - p[2]) < 1e-6)) {
      puntos.push(p);
    }
  };

  for (const [i, j] of ARISTAS) {
    const p1 = ESQUINAS[i];
    const p2 = ESQUINAS[j];
    const f1 = n[0] * p1[0] + n[1] * p1[1] + n[2] * p1[2] - d;
    const f2 = n[0] * p2[0] + n[1] * p2[1] + n[2] * p2[2] - d;
    if (Math.abs(f1) < eps) agregar([...p1]);
    if (Math.abs(f2) < eps) agregar([...p2]);
    if (f1 * f2 < 0) {
      const t = f1 / (f1 - f2);
      agregar([
        p1[0] + (p2[0] - p1[0]) * t,
        p1[1] + (p2[1] - p1[1]) * t,
        p1[2] + (p2[2] - p1[2]) * t,
      ]);
    }
  }

  if (puntos.length < 3) return null;

  const centro = puntos
    .reduce((acc, p) => [acc[0] + p[0], acc[1] + p[1], acc[2] + p[2]], [0, 0, 0])
    .map((v) => v / puntos.length);

  const referencia = Math.abs(n[0]) < 0.9 ? [1, 0, 0] : [0, 1, 0];
  const e1 = unit3(cross3(n, referencia));
  const e2 = unit3(cross3(n, e1));

  puntos.sort((p, q) => {
    const a = Math.atan2(
      (p[0] - centro[0]) * e2[0] + (p[1] - centro[1]) * e2[1] + (p[2] - centro[2]) * e2[2],
      (p[0] - centro[0]) * e1[0] + (p[1] - centro[1]) * e1[1] + (p[2] - centro[2]) * e1[2],
    );
    const b = Math.atan2(
      (q[0] - centro[0]) * e2[0] + (q[1] - centro[1]) * e2[1] + (q[2] - centro[2]) * e2[2],
      (q[0] - centro[0]) * e1[0] + (q[1] - centro[1]) * e1[1] + (q[2] - centro[2]) * e1[2],
    );
    return a - b;
  });

  return { puntos, centro };
}

function recortarRectaCubo(punto, direccion) {
  let tmin = -Infinity;
  let tmax = Infinity;
  for (let i = 0; i < 3; i += 1) {
    if (Math.abs(direccion[i]) < 1e-9) {
      if (punto[i] < -1 || punto[i] > 1) return null;
      continue;
    }
    const t1 = (-1 - punto[i]) / direccion[i];
    const t2 = (1 - punto[i]) / direccion[i];
    tmin = Math.max(tmin, Math.min(t1, t2));
    tmax = Math.min(tmax, Math.max(t1, t2));
    if (tmin > tmax) return null;
  }
  if (!Number.isFinite(tmin) || !Number.isFinite(tmax) || tmax - tmin < 1e-7) return null;
  return [
    [punto[0] + direccion[0] * tmin, punto[1] + direccion[1] * tmin, punto[2] + direccion[2] * tmin],
    [punto[0] + direccion[0] * tmax, punto[1] + direccion[1] * tmax, punto[2] + direccion[2] * tmax],
  ];
}

export class Plot3D {
  constructor(canvas) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.scene = null;
    this.yaw = -0.72;
    this.pitch = 0.34;
    this.zoom = 1;
    this.arrastrando = false;
    this.ultimo = null;

    this.observer = new ResizeObserver(() => this.draw());
    this.observer.observe(canvas);

    canvas.addEventListener('pointerdown', (evento) => {
      if (evento.button !== 0) return;
      this.arrastrando = true;
      this.ultimo = [evento.clientX, evento.clientY];
      canvas.setPointerCapture(evento.pointerId);
      canvas.style.cursor = 'grabbing';
    });

    canvas.addEventListener('pointermove', (evento) => {
      if (!this.arrastrando || !this.ultimo) return;
      const dx = evento.clientX - this.ultimo[0];
      const dy = evento.clientY - this.ultimo[1];
      this.ultimo = [evento.clientX, evento.clientY];
      this.yaw += dx * 0.008;
      this.pitch = Math.max(-1.15, Math.min(1.15, this.pitch + dy * 0.008));
      this.draw();
    });

    const soltar = (evento) => {
      this.arrastrando = false;
      this.ultimo = null;
      canvas.style.cursor = 'grab';
      if (canvas.hasPointerCapture?.(evento.pointerId)) canvas.releasePointerCapture(evento.pointerId);
    };
    canvas.addEventListener('pointerup', soltar);
    canvas.addEventListener('pointercancel', soltar);

    canvas.addEventListener(
      'wheel',
      (evento) => {
        evento.preventDefault();
        this.zoom = Math.max(0.6, Math.min(2.1, this.zoom * Math.exp(-evento.deltaY * 0.0012)));
        this.draw();
      },
      { passive: false },
    );

    canvas.addEventListener('dblclick', () => this.resetView());

    canvas.addEventListener('keydown', (evento) => {
      const paso = 0.12;
      if (evento.key === 'ArrowLeft') this.yaw -= paso;
      else if (evento.key === 'ArrowRight') this.yaw += paso;
      else if (evento.key === 'ArrowUp') this.pitch = Math.min(1.15, this.pitch + paso);
      else if (evento.key === 'ArrowDown') this.pitch = Math.max(-1.15, this.pitch - paso);
      else if (evento.key === '+' || evento.key === '=') this.zoom = Math.min(2.1, this.zoom * 1.08);
      else if (evento.key === '-') this.zoom = Math.max(0.6, this.zoom / 1.08);
      else if (evento.key === 'Home') this.resetView();
      else return;
      evento.preventDefault();
      this.draw();
    });

    canvas.style.cursor = 'grab';
  }

  resetView() {
    this.yaw = -0.72;
    this.pitch = 0.34;
    this.zoom = 1;
    this.draw();
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

    const rango = Math.max(0.5, scene.range || 6);
    const cy = Math.cos(this.yaw);
    const sy = Math.sin(this.yaw);
    const cp = Math.cos(this.pitch);
    const sp = Math.sin(this.pitch);
    const foco = Math.min(ancho, alto) * 1.2 * this.zoom * (scene.cameraZoom || 1);
    const centroX = ancho / 2;
    const centroY = alto / 2 + Math.min(ancho, alto) * 0.04;

    const proyectar = (p) => {
      const x = p[0] / rango;
      const y = p[1] / rango;
      const z = p[2] / rango;
      const x1 = x * cy - y * sy;
      const y1 = x * sy + y * cy;
      const y2 = y1 * cp - z * sp;
      const z2 = y1 * sp + z * cp;
      const profundidad = y2 + 4.3;
      const escala = foco / Math.max(0.4, profundidad);
      return {
        x: centroX + x1 * escala,
        y: centroY - z2 * escala,
        depth: profundidad,
        visible: profundidad > 0.1,
      };
    };

    // Cubo de referencia
    ctx.save();
    ctx.strokeStyle = C.cube;
    ctx.lineWidth = 1;
    ctx.setLineDash([3, 5]);
    for (const [i, j] of ARISTAS) {
      const p1 = proyectar(ESQUINAS[i].map((v) => v * rango));
      const p2 = proyectar(ESQUINAS[j].map((v) => v * rango));
      ctx.beginPath();
      ctx.moveTo(p1.x, p1.y);
      ctx.lineTo(p2.x, p2.y);
      ctx.stroke();
    }
    ctx.restore();

    // Ejes
    const ejes = [
      { v: [1, 0, 0], color: '#ef8b74', label: 'x' },
      { v: [0, 1, 0], color: '#7fd6b8', label: 'y' },
      { v: [0, 0, 1], color: '#8fb0ff', label: 'z' },
    ];
    for (const eje of ejes) {
      const origen = proyectar([0, 0, 0]);
      const punta = proyectar(eje.v.map((v) => v * rango * 1.04));
      this.lineaConPunta(ctx, origen, punta, eje.color, 1.3, true);
      ctx.font = 'italic 13px "Iowan Old Style", Georgia, serif';
      ctx.fillStyle = eje.color;
      ctx.textAlign = 'left';
      ctx.textBaseline = 'middle';
      ctx.fillText(eje.label, punta.x + 7, punta.y - 3);
    }

    const capas = [];

    // Planos recortados contra el cubo
    for (const plano of scene.planes || []) {
      const poligono = poligonoPlano({
        a: plano.a,
        b: plano.b,
        c: plano.c,
        d: plano.d / rango,
      });
      if (!poligono) continue;

      const puntos = poligono.puntos.map((p) => proyectar(p.map((v) => v * rango)));
      const profundidad =
        puntos.reduce((acc, p) => acc + p.depth, 0) / Math.max(1, puntos.length);
      capas.push({
        tipo: 'plano',
        profundidad,
        puntos,
        color: plano.color,
        etiqueta: plano.label,
        centro: poligono.centro,
      });
    }

    // Paralelogramo generado por dos vectores
    if (scene.parallelogram) {
      const { u, v, color } = scene.parallelogram;
      const puntos = [
        [0, 0, 0],
        u,
        [u[0] + v[0], u[1] + v[1], u[2] + v[2]],
        v,
      ].map((p) => proyectar(p));
      capas.push({
        tipo: 'paralelogramo',
        profundidad: puntos.reduce((acc, p) => acc + p.depth, 0) / 4 - 0.02,
        puntos,
        color,
      });
    }

    // Triángulo (producto cruz / áreas)
    if (scene.triangle) {
      const { points, color } = scene.triangle;
      const puntos = points.map((p) => proyectar(p));
      capas.push({
        tipo: 'triangulo',
        profundidad: puntos.reduce((acc, p) => acc + p.depth, 0) / 3 - 0.02,
        puntos,
        color,
      });
    }

    capas.sort((a, b) => b.profundidad - a.profundidad);

    for (const capa of capas) {
      if (capa.tipo === 'plano') {
        ctx.beginPath();
        ctx.moveTo(capa.puntos[0].x, capa.puntos[0].y);
        for (let i = 1; i < capa.puntos.length; i += 1) {
          ctx.lineTo(capa.puntos[i].x, capa.puntos[i].y);
        }
        ctx.closePath();
        ctx.fillStyle = withAlpha(capa.color, 0.14);
        ctx.fill();
        ctx.strokeStyle = withAlpha(capa.color, 0.62);
        ctx.lineWidth = 1.2;
        ctx.stroke();

        if (capa.etiqueta) {
          const centro = proyectar(capa.centro.map((v) => v * rango));
          ctx.save();
          ctx.font = '600 11px "Avenir Next", "Segoe UI", sans-serif';
          ctx.fillStyle = withAlpha(capa.color, 0.95);
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillText(capa.etiqueta, centro.x, centro.y);
          ctx.restore();
        }
      } else {
        ctx.beginPath();
        ctx.moveTo(capa.puntos[0].x, capa.puntos[0].y);
        for (let i = 1; i < capa.puntos.length; i += 1) {
          ctx.lineTo(capa.puntos[i].x, capa.puntos[i].y);
        }
        ctx.closePath();
        ctx.fillStyle = withAlpha(capa.color, 0.1);
        ctx.fill();
        ctx.strokeStyle = withAlpha(capa.color, 0.4);
        ctx.lineWidth = 1;
        ctx.setLineDash([4, 5]);
        ctx.stroke();
        ctx.setLineDash([]);
      }
    }

    // Recta solución
    if (scene.line) {
      const punto = scene.line.point.map((v) => v / rango);
      const direccion = scene.line.direction.map((v) => v / rango);
      const segmento = recortarRectaCubo(punto, direccion);
      if (segmento) {
        const p1 = proyectar(segmento[0].map((v) => v * rango));
        const p2 = proyectar(segmento[1].map((v) => v * rango));
        ctx.save();
        ctx.strokeStyle = scene.line.color;
        ctx.lineWidth = 3;
        ctx.lineCap = 'round';
        ctx.shadowColor = withAlpha(scene.line.color, 0.55);
        ctx.shadowBlur = 12;
        ctx.beginPath();
        ctx.moveTo(p1.x, p1.y);
        ctx.lineTo(p2.x, p2.y);
        ctx.stroke();
        ctx.restore();
        this.pildora(
          ctx,
          scene.line.label || 'recta solución',
          (p1.x + p2.x) / 2 + 10,
          (p1.y + p2.y) / 2 - 14,
          scene.line.color,
        );
      }
    }

    // Vectores
    for (const vector of scene.vectors || []) {
      const desde = vector.from || [0, 0, 0];
      const hasta = [desde[0] + vector.v[0], desde[1] + vector.v[1], desde[2] + vector.v[2]];
      const p1 = proyectar(desde);
      const p2 = proyectar(hasta);
      this.lineaConPunta(ctx, p1, p2, vector.color, vector.width || 2.4, false, vector.dashed);
      if (vector.label) {
        const dx = p2.x - p1.x;
        const dy = p2.y - p1.y;
        const largo = Math.hypot(dx, dy) || 1;
        this.pildora(
          ctx,
          vector.label,
          p2.x + (dx / largo) * 18,
          p2.y + (dy / largo) * 18,
          vector.color,
        );
      }
    }

    // Punto solución
    if (scene.point) {
      const p = proyectar(scene.point.p);
      ctx.save();
      const halo = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, 26);
      halo.addColorStop(0, withAlpha(scene.point.color, 0.5));
      halo.addColorStop(1, withAlpha(scene.point.color, 0));
      ctx.fillStyle = halo;
      ctx.beginPath();
      ctx.arc(p.x, p.y, 26, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = scene.point.color;
      ctx.beginPath();
      ctx.arc(p.x, p.y, 5.5, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.arc(p.x, p.y, 2.2, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();

      if (scene.point.label) {
        this.pildora(ctx, scene.point.label, p.x + 14, p.y - 16, scene.point.color);
      }
    }

    if (scene.badge) {
      ctx.save();
      ctx.font = '600 11px "Avenir Next", "Segoe UI", sans-serif';
      const anchoTexto = ctx.measureText(scene.badge.text).width + 20;
      ctx.fillStyle = withAlpha(scene.badge.color, 0.12);
      ctx.strokeStyle = withAlpha(scene.badge.color, 0.35);
      ctx.beginPath();
      ctx.roundRect(16, 16, anchoTexto, 26, 3);
      ctx.fill();
      ctx.stroke();
      ctx.fillStyle = scene.badge.color;
      ctx.textAlign = 'left';
      ctx.textBaseline = 'middle';
      ctx.fillText(scene.badge.text, 26, 29.5);
      ctx.restore();
    }
  }

  lineaConPunta(ctx, p1, p2, color, grosor, esEje = false, dashed = false) {
    const dx = p2.x - p1.x;
    const dy = p2.y - p1.y;
    const largo = Math.hypot(dx, dy);
    if (largo < 1) return;

    const angulo = Math.atan2(dy, dx);
    const cabeza = esEje ? 7 : 10;

    ctx.save();
    ctx.strokeStyle = color;
    ctx.fillStyle = color;
    ctx.lineWidth = grosor;
    ctx.lineCap = 'round';
    if (dashed) ctx.setLineDash([6, 6]);
    ctx.beginPath();
    ctx.moveTo(p1.x, p1.y);
    ctx.lineTo(p2.x - Math.cos(angulo) * cabeza * 0.7, p2.y - Math.sin(angulo) * cabeza * 0.7);
    ctx.stroke();

    if (!dashed) {
      ctx.setLineDash([]);
      const bx = p2.x - Math.cos(angulo) * cabeza;
      const by = p2.y - Math.sin(angulo) * cabeza;
      ctx.beginPath();
      ctx.moveTo(p2.x, p2.y);
      ctx.lineTo(
        bx + Math.cos(angulo + Math.PI / 2) * cabeza * 0.42,
        by + Math.sin(angulo + Math.PI / 2) * cabeza * 0.42,
      );
      ctx.lineTo(
        bx + Math.cos(angulo - Math.PI / 2) * cabeza * 0.42,
        by + Math.sin(angulo - Math.PI / 2) * cabeza * 0.42,
      );
      ctx.closePath();
      ctx.fill();
    }
    ctx.restore();
  }

  pildora(ctx, texto, x, y, color) {
    ctx.save();
    ctx.font = '600 11px "Avenir Next", "Segoe UI", sans-serif';
    const ancho = ctx.measureText(texto).width + 16;
    const alto = 23;
    const limite = this.canvas.getBoundingClientRect().width - 8;
    let izquierda = x;
    if (izquierda + ancho > limite) izquierda = limite - ancho;
    if (izquierda < 6) izquierda = 6;
    let arriba = y - alto / 2;
    if (arriba < 6) arriba = 6;

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
    ctx.fillText(texto, izquierda + ancho / 2, arriba + alto / 2 + 0.5);
    ctx.restore();
  }

  destroy() {
    this.observer.disconnect();
  }
}
