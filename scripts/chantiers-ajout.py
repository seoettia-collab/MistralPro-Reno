#!/usr/bin/env python3
"""CHANTIERS-REELS (ajout) : trois photos de chantier avec l'équipe (accord des
personnes photographiées), ajoutées aux galeries salle de yoga et extension.
Photos sources : chantiers-src/*.jpg -> images/chantiers/<nom>-{1200,640}.webp
"""
from pathlib import Path
from html import escape
import sys

from PIL import Image, ImageOps

ROOT = Path(__file__).resolve().parents[1]
SRC = ROOT / 'chantiers-src'
OUT = ROOT / 'images' / 'chantiers'

# nom : (fichier, texte alternatif, recadrage haut-bas en fraction de hauteur ou None, galerie après)
PHOTOS = [
    ('salle-yoga-demolition', 'sale_de_yoga_35.jpg', 'Salle de yoga, début du chantier : démolition des anciens plafonds de l’usine',
     0.70, 'salle-yoga-cloisons'),
    ('extension-charpente', '20220809_121310.jpg', 'Extension en cours : pose de la charpente bois par l’équipe',
     None, 'extension-fondations'),
    ('extension-terrassement', '20220613_105355.jpg', 'Extension, terrassement : démolition de l’ancienne dalle au marteau-piqueur',
     None, 'extension-charpente'),
]


def sub(text, old, new, f):
    if text.count(old) != 1:
        sys.exit(f'{f}: {text.count(old)} occurrence(s) de {old[:70]!r}')
    return text.replace(old, new)


def run():
    f = 'travaux.html'
    p = ROOT / f
    s = p.read_text(encoding='utf-8')
    for name, src, alt, crop, after in PHOTOS:
        im = ImageOps.exif_transpose(Image.open(SRC / src)).convert('RGB')
        if crop:
            im = im.crop((0, 0, im.width, round(im.height * crop)))
        h640 = 0
        for w in (1200, 640):
            h = round(im.height * w / im.width)
            im.resize((w, h), Image.LANCZOS).save(OUT / f'{name}-{w}.webp', 'WEBP', quality=80, method=6)
            if w == 640:
                h640 = h
        i = s.index(f'/images/chantiers/{after}-640.webp')
        end = s.index('</figure>', i) + len('</figure>')
        fig = ('\n          <figure style="margin:0">\n'
               f'            <img src="/images/chantiers/{name}-640.webp" alt="{escape(alt)}" width="640" height="{h640}" '
               'loading="lazy" decoding="async" style="width:100%;height:auto;aspect-ratio:4/3;object-fit:cover;display:block">\n'
               '          </figure>')
        s = s[:end] + fig + s[end:]
    p.write_text(s, encoding='utf-8')
    print('photos ajoutées')


if __name__ == '__main__':
    run()
