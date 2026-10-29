"""Builds the outlined brand SVGs (app icon layers, splash logo) from the design handoff.

The handoff SVGs set "৳" and the wordmark as live Anek text (handoff README, deviation 12).
This shapes the text with HarfBuzz (Bengali conjuncts and vowel signs need real shaping)
and replaces it with paths, so the PNG renders never depend on installed fonts.

Usage: python scripts/outline-brand.py <AnekBangla[wdth,wght].ttf> <AnekLatin[wdth,wght].ttf> <outDir>
Needs: fonttools, uharfbuzz.
"""
import io
import os
import sys

import uharfbuzz as hb
from fontTools.pens.svgPathPen import SVGPathPen
from fontTools.pens.transformPen import TransformPen
from fontTools.ttLib import TTFont
from fontTools.varLib import instancer

bn_path, en_path, out = sys.argv[1:4]
os.makedirs(out, exist_ok=True)
_cache = {}


def instance(path, wght, wdth):
    key = (path, wght, wdth)
    if key not in _cache:
        f = instancer.instantiateVariableFont(TTFont(path), {'wght': wght, 'wdth': wdth})
        buf = io.BytesIO()
        f.save(buf)
        _cache[key] = (f, buf.getvalue())
    return _cache[key]


def text_path(text, path, size, x, y, wght=800, wdth=100):
    """SVG path data for `text` centred on x with its baseline at y."""
    font, data = instance(path, wght, wdth)
    upm = font['head'].unitsPerEm
    hb_font = hb.Font(hb.Face(data))
    buf = hb.Buffer()
    buf.add_str(text)
    buf.guess_segment_properties()
    hb.shape(hb_font, buf)
    order = font.getGlyphOrder()
    glyphs = font.getGlyphSet()
    scale = size / upm
    total = sum(p.x_advance for p in buf.glyph_positions)
    pen_x = x - total * scale / 2
    d = []
    for info, pos in zip(buf.glyph_infos, buf.glyph_positions):
        svg = SVGPathPen(glyphs)
        gx = pen_x + pos.x_offset * scale
        gy = y - pos.y_offset * scale
        glyphs[order[info.codepoint]].draw(TransformPen(svg, (scale, 0, 0, -scale, gx, gy)))
        d.append(svg.getCommands())
        pen_x += pos.x_advance * scale
    return ' '.join(d)


AURORA = ('<defs><linearGradient id="a" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#2EE6D0"/>'
          '<stop offset="0.52" stop-color="#A78BFA"/><stop offset="1" stop-color="#FF5C9A"/></linearGradient></defs>')

files = {
    'ios-1024.svg': (
        '<svg xmlns="http://www.w3.org/2000/svg" width="1024" height="1024" viewBox="0 0 100 100">' + AURORA +
        '<rect width="100" height="100" fill="#120F2E"/>'
        '<circle cx="50" cy="50" r="34" fill="none" stroke="url(#a)" stroke-width="13" stroke-linecap="round" stroke-dasharray="7.8 5.55" opacity="0.16"/>'
        '<circle cx="50" cy="50" r="34" fill="none" stroke="url(#a)" stroke-width="6.5" stroke-linecap="round" stroke-dasharray="7.8 5.55"/>'
        f'<path fill="#F4F2FF" d="{text_path("৳", bn_path, 46, 50, 64)}"/></svg>'),
    'android-foreground.svg': (
        '<svg xmlns="http://www.w3.org/2000/svg" width="432" height="432" viewBox="0 0 108 108">' + AURORA +
        '<circle cx="54" cy="54" r="25" fill="none" stroke="url(#a)" stroke-width="5" stroke-linecap="round" stroke-dasharray="5.8 4.02"/>'
        f'<path fill="#F4F2FF" d="{text_path("৳", bn_path, 34, 54, 65)}"/></svg>'),
    'android-monochrome.svg': (
        '<svg xmlns="http://www.w3.org/2000/svg" width="432" height="432" viewBox="0 0 108 108">'
        '<circle cx="54" cy="54" r="25" fill="none" stroke="#FFFFFF" stroke-width="5" stroke-linecap="round" stroke-dasharray="5.8 4.02"/>'
        f'<path fill="#FFFFFF" d="{text_path("৳", bn_path, 34, 54, 65)}"/></svg>'),
    # Splash logo: stitched aurora ring around the কিস্তি wordmark (Expanded ExtraBold, §11.5).
    'splash-logo.svg': (
        '<svg xmlns="http://www.w3.org/2000/svg" width="260" height="260" viewBox="0 0 260 260">' + AURORA +
        '<circle cx="130" cy="130" r="112" fill="none" stroke="#2C2760" stroke-width="1"/>'
        '<circle cx="130" cy="130" r="112" fill="none" stroke="url(#a)" stroke-width="18" stroke-linecap="round" stroke-dasharray="8.5 11.04" opacity="0.14"/>'
        '<circle cx="130" cy="130" r="112" fill="none" stroke="url(#a)" stroke-width="7" stroke-linecap="round" stroke-dasharray="8.5 11.04"/>'
        f'<path fill="#F4F2FF" d="{text_path("কিস্তি", bn_path, 58, 130, 138, 800, 125)}"/>'
        f'<path fill="#B7B2E0" d="{text_path("Kisti", en_path, 26, 130, 174, 800, 125)}"/></svg>'),
}
for name, svg in files.items():
    with open(os.path.join(out, name), 'w') as fh:
        fh.write(svg)
    print(name, len(svg))
