#!/usr/bin/env python3
"""Recorta una hoja de personajes sobre fondo blanco en sprites con transparencia.

Uso:
    python3 scripts/sprites/cut_sheet.py HOJA.png nombre1 nombre2 ... [--out DIR] [--height PX]
        [--cut "x,y x,y ..."]

- El fondo se detecta rellenando desde los bordes los píxeles casi blancos, así que
  el blanco *dentro* de un personaje (una túnica, un ojo) se conserva mientras su
  contorno esté cerrado.
- El borde suavizado se vuelve semitransparente y se le quita el blanco mezclado
  (sin halo claro sobre fondos oscuros).
- Cada personaje es un componente conexo grande; los trozos pequeños sueltos
  (chispas, hojas) se unen al personaje más cercano. Se asignan de izquierda a
  derecha a los nombres dados.
- Si dos personajes se tocan, `--cut` traza una línea (polilínea de arriba abajo,
  en píxeles de la hoja) que los separa. Se puede repetir.
- Cada recorte solo conserva su personaje: lo que asome de un vecino se borra.
- Salida: DIR/<nombre>.webp con la altura indicada (por defecto 420 px).

Necesita Pillow y numpy.
"""
import argparse
import sys
from collections import deque
from pathlib import Path

import numpy as np
from PIL import Image

NEAR_WHITE_MIN = 206  # canal mínimo para considerar un píxel «fondo claro»
NEAR_WHITE_SPREAD = 40  # diferencia máxima entre canales (sin color)


def background_mask(rgb):
    """Píxeles casi blancos conectados con el borde de la imagen."""
    mn = rgb.min(axis=2)
    spread = rgb.max(axis=2).astype(int) - mn
    light = (mn >= NEAR_WHITE_MIN) & (spread <= NEAR_WHITE_SPREAD)
    bg = np.zeros_like(light)
    bg[0, :] = light[0, :]
    bg[-1, :] = light[-1, :]
    bg[:, 0] = light[:, 0]
    bg[:, -1] = light[:, -1]
    while True:
        grown = bg.copy()
        grown[1:, :] |= bg[:-1, :]
        grown[:-1, :] |= bg[1:, :]
        grown[:, 1:] |= bg[:, :-1]
        grown[:, :-1] |= bg[:, 1:]
        grown &= light
        if np.array_equal(grown, bg):
            return bg
        bg = grown


def enclosed_holes(rgb, bg, min_area=40):
    """Huecos de fondo encerrados (p. ej. entre un bastón y el cuerpo).

    Son zonas casi blancas no conectadas con el borde cuyo color es blanco puro y
    uniforme, como el fondo. Las telas o pelajes claros tienen sombreado y no
    llegan a ese blanco medio, así que se conservan.
    """
    mn = rgb.min(axis=2)
    spread = rgb.max(axis=2).astype(int) - mn
    light = (mn >= 236) & (spread <= 22) & ~bg
    labels, comps = label_components(light, scale=1)
    holes = np.zeros_like(bg)
    for c in comps:
        if c['area'] < min_area:
            continue
        region = labels == c['label']
        if mn[region].mean() >= 249:
            holes |= region
    return dilate(holes, 1) & (mn >= 200)


def dilate(mask, steps=1):
    out = mask.copy()
    for _ in range(steps):
        m = out.copy()
        m[1:, :] |= out[:-1, :]
        m[:-1, :] |= out[1:, :]
        m[:, 1:] |= out[:, :-1]
        m[:, :-1] |= out[:, 1:]
        out = m
    return out


def to_rgba(rgb, bg):
    """Alfa del sujeto con bordes suaves y sin blanco mezclado en el contorno."""
    h, w, _ = rgb.shape
    alpha = np.where(bg, 0.0, 1.0)
    # Banda de 2 px del sujeto junto al fondo: opacidad según lo lejos que estén del blanco.
    edge = dilate(bg, 2) & ~bg
    f = rgb.astype(float)
    darkness = (255.0 - f.min(axis=2)) / 255.0
    a_edge = np.clip(darkness / 0.55, 0.0, 1.0)
    alpha[edge] = a_edge[edge]
    # Descontaminación: C = a*F + (1-a)*255  =>  F = (C - (1-a)*255) / a
    a3 = alpha[..., None]
    safe = np.where(a3 > 0.02, a3, 1.0)
    fg = np.where(edge[..., None], (f - (1.0 - a3) * 255.0) / safe, f)
    fg = np.clip(fg, 0, 255)
    rgba = np.dstack([fg, alpha * 255.0]).round().astype(np.uint8)
    rgba[alpha <= 0.02] = 0
    return rgba


def seam_mask(shape, polyline, width=2):
    """Máscara de una polilínea casi vertical (para separar personajes que se tocan)."""
    h, w = shape
    pts = sorted(polyline, key=lambda p: p[1])
    if pts[0][1] > 0:
        pts.insert(0, (pts[0][0], 0))
    if pts[-1][1] < h - 1:
        pts.append((pts[-1][0], h - 1))
    ys = np.arange(h)
    xs = np.interp(ys, [p[1] for p in pts], [p[0] for p in pts])
    seam = np.zeros(shape, dtype=bool)
    for y, x in zip(ys, xs.round().astype(int)):
        seam[y, max(0, x - width): min(w, x + width + 1)] = True
    return seam


def label_components(mask, scale=2):
    """Etiqueta componentes conexos (8 vecinos) sobre la máscara reducida `scale` veces."""
    h, w = mask.shape
    hs, ws = h // scale, w // scale
    small = mask[: hs * scale, : ws * scale].reshape(hs, scale, ws, scale).all(axis=(1, 3))
    labels = np.zeros((hs, ws), dtype=np.int32)
    comps = []
    for y0, x0 in zip(*np.nonzero(small)):
        if labels[y0, x0]:
            continue
        lab = len(comps) + 1
        labels[y0, x0] = lab
        q = deque([(y0, x0)])
        area = 0
        x1 = x2 = x0
        y1 = y2 = y0
        while q:
            y, x = q.popleft()
            area += 1
            if x < x1: x1 = x
            if x > x2: x2 = x
            if y < y1: y1 = y
            if y > y2: y2 = y
            for dy in (-1, 0, 1):
                ny = y + dy
                if ny < 0 or ny >= hs:
                    continue
                for dx in (-1, 0, 1):
                    nx = x + dx
                    if 0 <= nx < ws and small[ny, nx] and not labels[ny, nx]:
                        labels[ny, nx] = lab
                        q.append((ny, nx))
        comps.append({'label': lab, 'area': area, 'box': [x1 * scale, y1 * scale, (x2 + 1) * scale, (y2 + 1) * scale]})
    full = np.zeros(mask.shape, dtype=np.int32)
    full[: hs * scale, : ws * scale] = np.repeat(np.repeat(labels, scale, axis=0), scale, axis=1)
    return full, comps


def group_characters(comps, count):
    """Los `count` componentes mayores son personajes; los demás se unen al más cercano."""
    comps = sorted(comps, key=lambda c: -c['area'])
    if len(comps) < count:
        raise SystemExit(f'Se esperaban {count} personajes y solo hay {len(comps)} zonas. Usa --cut.')
    main = [{'labels': [c['label']], 'box': list(c['box'])} for c in comps[:count]]
    for c in comps[count:]:
        cx = (c['box'][0] + c['box'][2]) / 2
        cy = (c['box'][1] + c['box'][3]) / 2

        def dist(m):
            bx0, by0, bx1, by1 = m['box']
            dx = max(bx0 - cx, 0, cx - bx1)
            dy = max(by0 - cy, 0, cy - by1)
            return dx * dx + dy * dy

        target = min(main, key=dist)
        target['labels'].append(c['label'])
        b = target['box']
        target['box'] = [min(b[0], c['box'][0]), min(b[1], c['box'][1]), max(b[2], c['box'][2]), max(b[3], c['box'][3])]
    return sorted(main, key=lambda m: (m['box'][0] + m['box'][2]) / 2)


def parse_cut(text):
    return [tuple(float(v) for v in p.split(',')) for p in text.split()]


def main():
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument('sheet')
    ap.add_argument('names', nargs='+')
    ap.add_argument('--out', default='src/assets/sprites')
    ap.add_argument('--height', type=int, default=420)
    ap.add_argument('--cut', action='append', default=[], help='polilínea "x,y x,y ..." que separa dos personajes')
    ap.add_argument('--min-area', type=int, default=6, help='área mínima (en celdas de 2 px) de un trozo suelto')
    args = ap.parse_args()

    rgb = np.asarray(Image.open(args.sheet).convert('RGB'))
    bg = background_mask(rgb)
    bg |= enclosed_holes(rgb, bg)
    rgba = to_rgba(rgb, bg)
    alpha = rgba[..., 3]
    solid = alpha > 40
    for cut in args.cut:
        solid &= ~seam_mask(solid.shape, parse_cut(cut))
    labels, comps = label_components(solid)
    comps = [c for c in comps if c['area'] >= args.min_area]
    chars = group_characters(comps, len(args.names))

    out = Path(args.out)
    out.mkdir(parents=True, exist_ok=True)
    h, w = bg.shape
    for i, (name, ch) in enumerate(zip(args.names, chars)):
        own = np.isin(labels, ch['labels'])
        others = np.isin(labels, [l for j, c in enumerate(chars) if j != i for l in c['labels']])
        # Incluye el borde suave de su contorno, pero nunca píxeles de otro personaje.
        keep = dilate(own, 3) & ~others
        x0, y0, x1, y1 = ch['box']
        pad = 8
        box = (max(0, x0 - pad), max(0, y0 - pad), min(w, x1 + pad), min(h, y1 + pad))
        part = rgba.copy()
        part[~keep] = 0
        img = Image.fromarray(part).crop(box)
        bbox = img.getchannel('A').point(lambda v: 255 if v > 8 else 0).getbbox()
        if bbox:
            img = img.crop(bbox)
        ratio = args.height / img.height
        if ratio < 1:
            img = img.resize((max(1, round(img.width * ratio)), args.height), Image.LANCZOS)
        path = out / f'{name}.webp'
        img.save(path, 'WEBP', quality=90, method=6)
        print(f'{path}  {img.width}x{img.height}  ({path.stat().st_size // 1024} KB)')


if __name__ == '__main__':
    sys.exit(main())
