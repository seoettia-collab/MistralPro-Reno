#!/usr/bin/env python3
"""CHANTIERS-REELS : ajoute trois chantiers réalisés (photos et budgets fournis
par Mistral Pro Reno) à travaux.html, et des liens depuis les pages cuisine,
salle de bain et rénovation d'appartement.

Photos sources : chantiers-src/*.jpg -> images/chantiers/<nom>-{1200,640}.webp
Usage : python3 scripts/chantiers-reels.py   (Pillow requis)
"""
from pathlib import Path
from html import escape
import sys

from PIL import Image, ImageOps

ROOT = Path(__file__).resolve().parents[1]
SRC = ROOT / 'chantiers-src'
OUT = ROOT / 'images' / 'chantiers'

PHOTOS = {
    'appartement-cuisine': ('Renovation_general__38.jpg', 'Cuisine ouverte rénovée : meubles noirs, crédence bois, bar et sol en chevrons'),
    'appartement-cuisine-2': ('Renovation_general__34.jpg', 'Cuisine rénovée : sol en carreaux à motifs, spots encastrés et meubles hauts noirs'),
    'appartement-salle-eau': ('Renovation_general__43.jpg', 'Salle d’eau rénovée : douche, carrelage gris effet marbre, meuble vasque et WC'),
    'appartement-chambre': ('Renovation_general__1.jpg', 'Chambre rénovée avec placard, moulures au plafond et sol en chevrons'),
    'salle-yoga-espace': ('IMG_20200924_153733.jpg', 'Ancienne usine transformée en salle de yoga : grand espace, cloisons et parquet chêne'),
    'salle-yoga-parquet': ('IMG_20200924_153625.jpg', 'Salle de yoga terminée : parquet chêne, murs blancs, éclairage et radiateurs'),
    'salle-yoga-cloisons': ('Plaquiste_2_1.jpg', 'Chantier de la salle de yoga en cours : cloisons et plafonds en plaques de plâtre'),
    'salle-de-bain-avant': ('F_2_33.jpg', 'Salle de bain avant travaux : dépose, ossature de faux plafond et ventilation'),
    'salle-de-bain-apres': ('F_2_23.jpg', 'Salle de bain après travaux : double vasque, douche à l’italienne et carrelage effet marbre'),
}

CHANTIERS = [
    {
        'id': 'chantier-appartement-35000',
        'titre': 'Appartement : cuisine, chambre et salle d’eau',
        'budget': '35 000 €',
        'texte': 'Rénovation d’un appartement : cuisine ouverte avec bar, salle d’eau complète et chambre avec placard. '
                 'Les photos ont été prises à la fin du chantier.',
        'presta': ['Cuisine : meubles, plan de travail, crédence, carrelage décoratif au sol, spots encastrés',
                   'Salle d’eau : douche, carrelage mural et sol, meuble vasque, WC',
                   'Chambre et séjour : peinture, sol en chevrons, placard'],
        'photos': ['appartement-cuisine', 'appartement-cuisine-2', 'appartement-salle-eau', 'appartement-chambre'],
        'lien': ('/services/renovation-appartement.html', 'La rénovation d’appartement en détail →'),
    },
    {
        'id': 'chantier-salle-yoga',
        'titre': 'Une ancienne usine transformée en salle de yoga',
        'budget': '60 000 €',
        'texte': 'Transformation d’un local industriel en salle de yoga : cloisons et plafonds en plaques de plâtre, '
                 'parquet chêne, éclairage et chauffage.',
        'presta': ['Démolition et évacuation', 'Cloisons et plafonds en plaques de plâtre',
                   'Parquet chêne', 'Électricité, éclairage et radiateurs', 'Peinture'],
        'photos': ['salle-yoga-espace', 'salle-yoga-parquet', 'salle-yoga-cloisons'],
        'lien': ('/services/bureaux-commerces.html', 'Nos travaux pour les locaux professionnels →'),
    },
    {
        'id': 'chantier-appartement-60000',
        'titre': 'Rénovation d’appartement : la salle de bain avant et après',
        'budget': '60 000 € (appartement)',
        'texte': 'Rénovation d’un appartement. La salle de bain a été reprise depuis les murs : '
                 'dépose, réseaux, ventilation, faux plafond, puis douche à l’italienne et double vasque.',
        'presta': ['Dépose complète et reprise des réseaux', 'Ventilation et faux plafond',
                   'Douche à l’italienne avec pommeau de tête', 'Double vasque sur plan, carrelage grand format effet marbre'],
        'photos': ['salle-de-bain-apres', 'salle-de-bain-avant'],
        'lien': ('/services/salle-de-bain.html', 'La rénovation de salle de bain en détail →'),
    },
]


def convert():
    OUT.mkdir(parents=True, exist_ok=True)
    dims = {}
    for name, (src, _) in PHOTOS.items():
        im = ImageOps.exif_transpose(Image.open(SRC / src)).convert('RGB')
        for w in (1200, 640):
            h = round(im.height * w / im.width)
            im.resize((w, h), Image.LANCZOS).save(OUT / f'{name}-{w}.webp', 'WEBP', quality=80, method=6)
            dims[(name, w)] = h
    return dims


def img(name, dims, big, ind):
    alt = escape(PHOTOS[name][1])
    if big:
        return (f'{ind}<img src="/images/chantiers/{name}-1200.webp" srcset="/images/chantiers/{name}-640.webp 640w, '
                f'/images/chantiers/{name}-1200.webp 1200w" sizes="(max-width: 760px) 92vw, 50vw" alt="{alt}" '
                f'width="1200" height="{dims[(name, 1200)]}" loading="lazy" decoding="async">')
    return (f'{ind}<img src="/images/chantiers/{name}-640.webp" alt="{alt}" width="640" height="{dims[(name, 640)]}" '
            f'loading="lazy" decoding="async" style="width:100%;height:auto;display:block">')


def section(dims):
    out = ['    <section class="wrap section" id="chantiers-reels" aria-labelledby="t-chantiers-reels">',
           '      <h2 id="t-chantiers-reels">Nos chantiers réalisés</h2>',
           '      <p class="muted">Trois chantiers menés par nos équipes, avec leurs photos et le budget réel des travaux.</p>',
           '    </section>']
    for k, c in enumerate(CHANTIERS):
        inv = ' projet-inverse' if k % 2 else ''
        first, rest = c['photos'][0], c['photos'][1:]
        lis = ''.join(f'\n          <li>{escape(p, quote=False)}</li>' for p in c['presta'])
        gal = '\n'.join(f'          <figure style="margin:0">\n{img(p, dims, False, "            ")}\n          </figure>' for p in rest)
        out += [
            '    <hr class="hr">',
            f'    <section class="projet{inv}" id="{c["id"]}" aria-labelledby="t-{c["id"]}">',
            f'      <figure class="plate">\n{img(first, dims, True, "        ")}\n      </figure>',
            '      <div>',
            f'        <h2 id="t-{c["id"]}">{escape(c["titre"], quote=False)}</h2>',
            f'        <p class="muted">{escape(c["texte"], quote=False)}</p>',
            f'        <p><strong>Budget des travaux : {c["budget"]}</strong></p>',
            f'        <ul class="presta">{lis}\n        </ul>',
            f'        <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(140px,1fr));gap:10px;margin:18px 0">\n{gal}\n        </div>',
            '        <div class="actions"><a class="btn btn-primary" href="/estimation-projet.html">Demander un devis gratuit</a>'
            f'<a class="btn btn-ghost" href="tel:0609109069" data-location="travaux_{c["id"]}">06 09 10 90 69</a></div>',
            f'        <p><a href="{c["lien"][0]}">{escape(c["lien"][1], quote=False)}</a></p>',
            '      </div>',
            '    </section>',
        ]
    return '\n'.join(out) + '\n'


def sub(text, old, new, f):
    if text.count(old) != 1:
        sys.exit(f'{f}: {text.count(old)} occurrence(s) de {old[:70]!r}')
    return text.replace(old, new)


def run():
    dims = convert()
    f = 'travaux.html'
    p = ROOT / f
    s = p.read_text(encoding='utf-8')
    anchor = '    <hr class="hr">\n    <hr class="hr">\n    <section class="section" aria-labelledby="social-title"'
    s = sub(s, anchor, '    <hr class="hr">\n' + section(dims) + '    <hr class="hr">\n    <section class="section" aria-labelledby="social-title"', f)
    p.write_text(s, encoding='utf-8')

    links = {
        'services/cuisine.html': ('ou utilisez notre <a href="../estimation-projet.html?projet=cuisine">calculateur</a>.</p>',
                                  '<p>Exemple réel : <a href="../travaux.html#chantier-appartement-35000">un appartement rénové pour 35 000 €, cuisine comprise</a>, avec les photos du chantier.</p>'),
        'services/salle-de-bain.html': ('Seul le devis établi après visite engage sur un prix.</p>',
                                        '<p>Exemples réels : <a href="../travaux.html#chantier-appartement-60000">une salle de bain avant et après travaux</a> et <a href="../travaux.html#chantier-appartement-35000">une salle d’eau dans un appartement rénové pour 35 000 €</a>.</p>'),
        'services/renovation-appartement.html': ('préparez une première enveloppe avec notre <a href="../estimation-projet.html?projet=appartement">assistant d\'estimation</a>.</p>',
                                                 '<p>Exemples réels : <a href="../travaux.html#chantier-appartement-35000">un appartement rénové pour 35 000 €</a> (cuisine, chambre, salle d’eau) et <a href="../travaux.html#chantier-appartement-60000">un appartement rénové pour 60 000 €</a>.</p>'),
    }
    for f, (after, para) in links.items():
        p = ROOT / f
        s = p.read_text(encoding='utf-8')
        s = sub(s, after, after + '\n          ' + para, f)
        p.write_text(s, encoding='utf-8')
    print('chantiers ajoutés')


if __name__ == '__main__':
    run()
