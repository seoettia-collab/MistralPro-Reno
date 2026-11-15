#!/usr/bin/env python3
"""SEO-RENFORCEMENT, correctif : /cost_calculator.html redirige (301) vers
/estimation-projet.html. Les liens pointent donc vers le simulateur actuel,
qui reçoit le titre et la description visant « simulateur de travaux ».
"""
from pathlib import Path
import sys

ROOT = Path(__file__).resolve().parents[1]


def sub(text, old, new, f):
    if text.count(old) != 1:
        sys.exit(f'{f}: {text.count(old)} occurrence(s) de {old[:70]!r}')
    return text.replace(old, new)


def run():
    f = 'blog/prix-renovation-appartement-paris-2026.html'
    p = ROOT / f
    s = p.read_text(encoding='utf-8')
    s = sub(s, '<p>Pour un premier chiffrage poste par poste, utilisez notre <a href="/cost_calculator.html">simulateur de travaux gratuit</a>. '
               'Pour un prix ferme, demandez un <a href="/estimation-projet.html">devis gratuit</a> : il est établi après visite, surfaces mesurées. ',
            '<p>Pour un premier chiffrage, utilisez notre <a href="/estimation-projet.html">simulateur de travaux gratuit</a>. '
            'Pour un prix ferme, demandez un devis gratuit : il est établi après visite, surfaces mesurées. ', f)
    p.write_text(s, encoding='utf-8')

    f = 'services/salle-de-bain.html'
    p = ROOT / f
    s = p.read_text(encoding='utf-8')
    s = sub(s, '<a href="../cost_calculator.html">simulateur de travaux gratuit</a>',
            '<a href="../estimation-projet.html?projet=salle-de-bain">simulateur de travaux gratuit</a>', f)
    p.write_text(s, encoding='utf-8')

    f = 'estimation-projet.html'
    p = ROOT / f
    s = p.read_text(encoding='utf-8')
    s = sub(s, '<title>Estimer le prix de vos travaux à Paris et en Île-de-France</title>',
            '<title>Simulateur de travaux gratuit : prix de vos travaux à Paris</title>', f)
    s = sub(s, 'content="Calculez le budget de votre rénovation à Paris et en Île-de-France : estimation gratuite par pièce et au m². Devis sur place. 06 09 10 90 69."',
            'content="Simulateur de travaux gratuit : calculez le budget de votre rénovation à Paris et en Île-de-France, par pièce et au m². Devis sur place. 06 09 10 90 69."', f)
    p.write_text(s, encoding='utf-8')
    print('correctif appliqué')


if __name__ == '__main__':
    run()
