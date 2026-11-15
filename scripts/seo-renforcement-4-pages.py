#!/usr/bin/env python3
"""SEO-RENFORCEMENT : titres, descriptions, textes et liens internes de 4 pages
proches de la première page Google (données Search Console, 18/10 → 13/11/2026).
Chaque remplacement doit trouver son texte exactement une fois ; sinon arrêt.
"""
from pathlib import Path
import sys

ROOT = Path(__file__).resolve().parents[1]


def sub(text, old, new, f):
    n = text.count(old)
    if n != 1:
        sys.exit(f'{f}: {n} occurrence(s) de {old[:70]!r}')
    return text.replace(old, new)


def head(f, s, title_old, title_new, desc_old, desc_new, extra_title_old=None):
    s = sub(s, f'<title>{title_old}</title>', f'<title>{title_new}</title>', f)
    s = sub(s, f'<meta property="og:title" content="{extra_title_old or title_old}">',
            f'<meta property="og:title" content="{title_new}">', f)
    s = sub(s, f'<meta name="twitter:title" content="{extra_title_old or title_old}">',
            f'<meta name="twitter:title" content="{title_new}">', f)
    s = sub(s, f'<meta name="description" content="{desc_old}"', f'<meta name="description" content="{desc_new}"', f)
    s = sub(s, f'<meta property="og:description" content="{desc_old}">',
            f'<meta property="og:description" content="{desc_new}">', f)
    s = sub(s, f'<meta name="twitter:description" content="{desc_old}">',
            f'<meta name="twitter:description" content="{desc_new}">', f)
    return s


EDITS = {}

# 1. Article prix rénovation appartement Paris
def blog(f, s):
    s = head(f, s,
             'Prix Rénovation Appartement Paris 2026 : Tarifs &amp; Devis',
             'Prix rénovation appartement Paris 2026 : coût au m² et devis',
             'Prix rénovation appartement Paris 2026 ✓ Tarifs au m² ✓ Devis gratuit ✓ Guide complet des coûts par MistralPro. Demandez votre devis !',
             'Prix d’une rénovation d’appartement à Paris en 2026 : 800 à 2 500 €/m² selon les travaux, coût par poste (cuisine, salle de bain, électricité), devis gratuit.')
    s = sub(s, '<h1>Prix Rénovation Appartement Paris 2026 : Guide Complet des Tarifs</h1>',
            '<h1>Prix d’une rénovation d’appartement à Paris en 2026 : coût au m² et par poste</h1>', f)
    s = sub(s, '"dateModified": "2026-11-01"', '"dateModified": "2026-11-15"', f)
    s = sub(s, '<p>Les appartements haussmanniens nécessitent',
            '<p>Les <a href="/renovation-appartement-haussmannien-paris.html">appartements haussmanniens</a> nécessitent', f)
    s = sub(s, '<p>La cuisine représente généralement 25 à 30% du budget total, soit 8 000€ à 25 000€ pour une cuisine parisienne équipée. La salle de bain coûte entre 6 000€ et 18 000€ selon la surface et les équipements choisis. Les travaux d&#039;électricité selon',
            '<p>La <a href="/services/cuisine.html">cuisine</a> représente généralement 25 à 30% du budget total, soit 8 000€ à 25 000€ pour une cuisine parisienne équipée. La <a href="/blog/prix-renovation-salle-de-bain-paris-2026.html">salle de bain</a> coûte entre 6 000€ et 18 000€ selon la surface et les équipements choisis. Les travaux d&#039;<a href="/services/electricite.html">électricité</a> selon', f)
    s = sub(s, 'tandis que la plomberie varie de 60€ à 100€/m². La peinture et les revêtements représentent 40€ à 80€/m². L&#039;isolation, devenue',
            'tandis que la <a href="/services/plomberie.html">plomberie</a> varie de 60€ à 100€/m². La <a href="/services/peinture.html">peinture</a> et les revêtements représentent 40€ à 80€/m². L&#039;<a href="/services/isolation.html">isolation</a>, devenue', f)
    s = sub(s, '        <h3>Rénovation par type d&#039;appartement parisien</h3>',
            '        <h3>Estimer le coût de votre rénovation</h3>\n'
            '        <p>Pour un premier chiffrage poste par poste, utilisez notre <a href="/cost_calculator.html">simulateur de travaux gratuit</a>. '
            'Pour un prix ferme, demandez un <a href="/estimation-projet.html">devis gratuit</a> : il est établi après visite, surfaces mesurées. '
            'Nous rénovons des appartements dans tout Paris, notamment à <a href="/renovation-paris-8.html">Paris 8e</a>, '
            '<a href="/renovation-paris-15.html">Paris 15e</a>, <a href="/renovation-paris-16.html">Paris 16e</a> et '
            '<a href="/renovation-paris-17.html">Paris 17e</a>. Voir aussi notre page <a href="/services/renovation-appartement.html">rénovation d’appartement</a>.</p>\n\n'
            '        <h3>Rénovation par type d&#039;appartement parisien</h3>', f)
    return s


# 2. Dégât des eaux
def dde(f, s):
    s = head(f, s,
             'Rénovation après dégât des eaux à Paris | Mistral Pro Reno',
             'Dégât des eaux Paris : urgence, réparation et remise en état',
             'Rénovation après dégât des eaux à Paris : recherche de fuite, assèchement, réparation de plafond et peinture. Devis détaillé pour l’assurance.',
             'Dégât des eaux à Paris : recherche de fuite, réparation, assèchement, remise en état des plafonds et murs. Devis détaillé pour l’assurance. 7j/7, 8 h – 20 h.')
    s = sub(s, '<h1 style="color: white;">Rénovation après dégât des eaux à Paris</h1>',
            '<h1 style="color: white;">Dégât des eaux à Paris : réparation et remise en état</h1>', f)
    s = sub(s, '"name": "Rénovation après dégât des eaux à Paris",',
            '"name": "Réparation et remise en état après dégât des eaux à Paris",', f)
    s = sub(s, '''        <section style="padding: 60px 20px;">
            <div class="container">
                <h2 style="text-align: center; margin-bottom: 50px; font-size: 32px;">Nos interventions après un dégât des eaux</h2>''',
            '''        <section style="padding: 60px 20px 0;" aria-labelledby="urgence-dde">
            <div class="container" style="max-width:900px">
                <h2 id="urgence-dde">Urgence dégât des eaux à Paris</h2>
                <p>Une fuite est en cours ? Appelez le <a href="tel:0609109069">06 09 10 90 69</a> : nous répondons tous les jours, du lundi au dimanche, de 8 h à 20 h. En attendant, coupez l’arrivée d’eau, mettez hors tension les pièces mouillées et prévenez le voisin du dessus ou le syndic si l’eau vient d’ailleurs.</p>
                <p>Les bons réflexes sont détaillés dans nos guides <a href="/blog/fuite-eau-que-faire.html">fuite d’eau : que faire</a> et <a href="/blog/degat-des-eaux-5-etapes.html">les 5 étapes après un dégât des eaux</a>. La réparation de la fuite relève de nos <a href="/services/plomberie.html">plombiers à Paris</a> ; la remise en état des murs et plafonds suit après séchage.</p>
            </div>
        </section>

        <section style="padding: 60px 20px;">
            <div class="container">
                <h2 style="text-align: center; margin-bottom: 50px; font-size: 32px;">Réparation des dégâts des eaux : nos interventions</h2>''', f)
    return s


# 3. Simulateur
def calc(f, s):
    s = head(f, s,
             'Simulateur travaux gratuit à Paris : estimation et devis',
             'Simulateur de travaux gratuit : coût de rénovation à Paris',
             'Estimez vos travaux à Paris et en Île-de-France : salle de bain, peinture, électricité et rénovation. Quantités, budget HT/TTC et estimation PDF gratuite.',
             'Simulateur de travaux gratuit : estimez le coût de votre rénovation à Paris et en Île-de-France, poste par poste, en HT et TTC, avec estimation PDF.')
    s = sub(s, '<p>Préparez votre projet avec nos pages <a href="/services/salle-de-bain.html">rénovation de salle de bain</a>, <a href="/services/renovation-appartement.html">rénovation d’appartement</a> et <a href="/services/peinture.html">travaux de peinture</a>.</p>',
            '<p>Préparez votre projet avec nos pages <a href="/services/salle-de-bain.html">rénovation de salle de bain</a>, <a href="/services/renovation-appartement.html">rénovation d’appartement</a> et <a href="/services/peinture.html">travaux de peinture</a>.</p>\n'
            '          <p>Pour comparer votre simulation à des ordres de grandeur, lisez nos guides de prix : <a href="/blog/prix-renovation-appartement-paris-2026.html">prix d’une rénovation d’appartement à Paris</a>, <a href="/blog/prix-renovation-salle-de-bain-paris-2026.html">prix d’une salle de bain à Paris</a>, <a href="/blog/renovation-electricite-paris-2026.html">rénovation électrique</a> et <a href="/blog/prix-ouverture-mur-porteur.html">ouverture d’un mur porteur</a>. Après un sinistre, voir notre page <a href="/degat-des-eaux.html">dégât des eaux à Paris</a>.</p>', f)
    return s


# 4. Salle de bain
def sdb(f, s):
    s = head(f, s,
             'Entreprise de rénovation de salle de bain à Paris',
             'Rénovation salle de bain Paris : entreprise et devis gratuit',
             'Entreprise de rénovation de salle de bain à Paris : douche à l’italienne, plomberie, étanchéité, carrelage. Devis gratuit, 06 09 10 90 69.',
             'Rénovation de salle de bain à Paris : douche à l’italienne, plomberie, étanchéité, carrelage. Un seul interlocuteur, devis gratuit au 06 09 10 90 69.')
    s = sub(s, 'ou préparez une enveloppe avec notre <a href="../estimation-projet.html?projet=salle-de-bain">calculateur</a>.',
            'ou préparez une enveloppe avec notre <a href="../cost_calculator.html">simulateur de travaux gratuit</a>.', f)
    return s


def sitemap(f, s):
    if 'cost_calculator.html' in s:
        return s
    return sub(s, '''  <url>
    <loc>https://www.mistralpro-reno.fr/estimation-projet.html</loc>''',
               '''  <url>
    <loc>https://www.mistralpro-reno.fr/cost_calculator.html</loc>
  </url>
  <url>
    <loc>https://www.mistralpro-reno.fr/estimation-projet.html</loc>''', f)


JOBS = [('blog/prix-renovation-appartement-paris-2026.html', blog), ('degat-des-eaux.html', dde),
        ('cost_calculator.html', calc), ('services/salle-de-bain.html', sdb), ('sitemap.xml', sitemap)]

if __name__ == '__main__':
    for f, fn in JOBS:
        p = ROOT / f
        s0 = p.read_text(encoding='utf-8')
        s = fn(f, s0)
        p.write_text(s, encoding='utf-8')
        print('modifié :', f)
