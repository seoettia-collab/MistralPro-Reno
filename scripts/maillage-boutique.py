#!/usr/bin/env python3
"""MAILLAGE-BOUTIQUE : fil d'Ariane visible (+ BreadcrumbList JSON-LD), liens
contextuels vers la boutique (https://boutique.mistralpro-reno.fr), bloc
« Fournitures pour votre salle de bain » et lien « Boutique » dans la
navigation et le pied de page.

Idempotent : relancer `python3 scripts/maillage-boutique.py` ne modifie rien
une seconde fois. `--report out.json` écrit le détail des modifications.
Après exécution : `python3 scripts/inline-css.py` (CSS refonte inline).
"""
from html import escape, unescape
from html.parser import HTMLParser
from pathlib import Path
import json
import re
import sys
import unicodedata

ROOT = Path(__file__).resolve().parents[1]
SITE = 'https://www.mistralpro-reno.fr/'
SHOP = 'https://boutique.mistralpro-reno.fr/'

# --- Collections de la boutique (ordre = priorité : du plus précis au plus générique)
COLLECTIONS = [
    ('receveurs', 'collections/receveurs-de-douche', 'Receveurs de douche',
     r"\breceveurs?(?: de douche)?\b"),
    ('parois', 'collections/parois-de-douche', 'Parois et portes de douche',
     r"\b(?:parois? de douche|portes? de douche|douches? a l'italienne|walk-in)\b"),
    ('colonnes', 'collections/colonnes-de-douche-robinetterie', 'Colonnes de douche et robinetterie',
     r"\b(?:colonnes? de douche|robinetterie|mitigeurs?(?: thermostatiques?)?|robinets?"
     r"(?! d'arret| de coupure| general| generaux| du compteur| de purge| de vidange| d'isolement"
     r"| thermostatiques?| de radiateurs?| d'alimentation| de l'immeuble| d'eau))\b"),
    ('bati', 'collections/bati-supports-reservoirs', 'Bâti-supports et réservoirs pour WC suspendu',
     r"\b(?:bati-supports?|bati supports?|wc suspendus?|toilettes suspendues)\b"),
    ('wc', 'collections/wc-et-bidets', 'WC et bidets',
     r"\b(?:wc|toilettes|bidets?)\b(?! suspendu)"),
    ('hydro', 'collections/panneaux-de-douche-hydromassants', 'Panneaux de douche hydromassants',
     r"\b(?:hydromassage|hydromassants?|panneaux? de douche)\b"),
    ('sdb', 'collections/salle-de-bain', 'Équipements de salle de bain',
     r"\b(?:salles? de bains?|salles? d'eau)\b"),
]
# Contextes où le lien ne serait pas naturel (débouchage, robinet d'arrêt, WC sur palier…)
REJECT_BEFORE = {'wc': re.compile(r"debouch|bouche|robinet d'arret|compteur")}
REJECT_AFTER = {'wc': re.compile(r"^ sur palier")}
MAX_LINKS = 3

# --- Périmètre
REFONTE_SKIP = {'index.html', 'renovation-complete-paris.html'}
PREMIUM_BC = ['blog.html', 'contact.html', 'landing.html', 'cost_calculator.html',
              'degat-des-eaux.html', 'mentions-legales.html', 'conditions-utilisation.html']
NEW_JSONLD = {
    'degat-des-eaux.html': [('Accueil', ''), ('Dégât des eaux', 'degat-des-eaux.html')],
    'mentions-legales.html': [('Accueil', ''), ('Mentions légales', 'mentions-legales.html')],
    'conditions-utilisation.html': [('Accueil', ''), ('Conditions d’utilisation', 'conditions-utilisation.html')],
}
TEXT_LINK_PAGES = [
    'services/salle-de-bain.html', 'services/plomberie.html', 'services/carrelage.html',
    'services/renovation-appartement.html', 'travaux.html',
    'plombier-paris-9.html', 'plombier-paris-12.html', 'plombier-paris-13.html', 'plombier-paris-20.html',
    'renovation-paris-5.html', 'renovation-paris-8.html', 'renovation-paris-15.html',
    'renovation-paris-16.html', 'renovation-paris-17.html', 'renovation-appartement-haussmannien-paris.html',
    'renovation-boulogne-billancourt.html', 'renovation-levallois-perret.html',
    'renovation-neuilly-sur-marne.html', 'renovation-neuilly-sur-seine.html',
    'degat-des-eaux.html', 'degat-des-eaux-paris-8.html', 'degat-des-eaux-paris-14.html',
    'degat-des-eaux-paris-17.html',
    'blog/douche-bouchee.html', 'blog/fuite-eau-que-faire.html', 'blog/degat-des-eaux-5-etapes.html',
    'blog/constat-amiable-degat-des-eaux.html',
    'blog/prix-renovation-salle-de-bain-paris-2026.html', 'blog/prix-renovation-appartement-paris-2026.html',
    'blog/renovation-plomberie-paris-17-2026.html', 'blog/renovation-maison-ile-de-france-2026.html',
]
# Bloc boutique : pages salle de bain / plomberie, et pages rénovation qui parlent de salle de bain.
BLOCK_ALWAYS = ['services/salle-de-bain.html', 'services/plomberie.html', 'services/carrelage.html',
                'plombier-paris-9.html', 'plombier-paris-12.html', 'plombier-paris-13.html',
                'plombier-paris-20.html', 'blog/douche-bouchee.html',
                'blog/prix-renovation-salle-de-bain-paris-2026.html',
                'blog/renovation-plomberie-paris-17-2026.html']
BLOCK_IF_SDB = ['services/renovation-appartement.html', 'travaux.html',
                'renovation-paris-5.html', 'renovation-paris-8.html', 'renovation-paris-15.html',
                'renovation-paris-16.html', 'renovation-paris-17.html',
                'renovation-appartement-haussmannien-paris.html', 'renovation-boulogne-billancourt.html',
                'renovation-levallois-perret.html', 'renovation-neuilly-sur-marne.html',
                'renovation-neuilly-sur-seine.html', 'blog/prix-renovation-appartement-paris-2026.html',
                'blog/renovation-maison-ile-de-france-2026.html']
NAV_SKIP = {'devis-travaux/index.html', 'estimation-projet.html', 'merci.html', 'zh/index.html',
            'renovation-complete-paris.html', 'blog/TEMPLATE.html'}

BLOCK_LINKS = [('receveurs', 'Receveurs de douche'), ('parois', 'Parois de douche'),
               ('colonnes', 'Robinetterie'), ('wc', 'WC et bidets')]
COLL = {c[0]: c for c in COLLECTIONS}


def shop_url(key):
    return SHOP + COLL[key][1]


def shop_title(key):
    return COLL[key][2] + ' – boutique Mistral Pro Reno'


def block_html(ind):
    links = ''.join(
        f'\n{ind}      <a class="btn btn-secondary" href="{shop_url(k)}" title="{escape(shop_title(k))}">{escape(label)}</a>'
        for k, label in BLOCK_LINKS)
    return (f'{ind}<section class="mpr-shop-links" aria-labelledby="mpr-shop-title">\n'
            f'{ind}  <div class="mpr-shop-links__inner">\n'
            f'{ind}    <h2 id="mpr-shop-title">Fournitures pour votre salle de bain</h2>\n'
            f'{ind}    <p>Receveurs, parois, robinetterie et sanitaires livrés à domicile partout en France.</p>\n'
            f'{ind}    <div class="mpr-shop-links__actions">{links}\n'
            f'{ind}    </div>\n'
            f'{ind}  </div>\n'
            f'{ind}</section>\n')


# --- Utilitaires
def fold(text):
    out = []
    for c in text:
        if c in '’ʼ‘':
            out.append("'")
            continue
        b = unicodedata.normalize('NFD', c)[0].lower()
        out.append(b[0] if b else c)
    return ''.join(out)


def plain(html):
    return fold(unescape(re.sub(r'<[^>]+>', '', html)))


def jsonld_blocks(s):
    for m in re.finditer(r'<script type="application/ld\+json">(.*?)</script>', s, re.S):
        yield m


def breadcrumb_items(s):
    for m in jsonld_blocks(s):
        try:
            d = json.loads(m.group(1))
        except ValueError:
            continue
        nodes = d.get('@graph', [d]) if isinstance(d, dict) else d
        for n in nodes:
            if isinstance(n, dict) and n.get('@type') == 'BreadcrumbList':
                return [(unescape(i['name']), i.get('item', '')) for i in n['itemListElement']]
    return None


def breadcrumb_nav(items, extra_class='', ind=''):
    lis = []
    for k, (name, url) in enumerate(items):
        href = '/' + url[len(SITE):] if url.startswith(SITE) else url
        if k == len(items) - 1:
            lis.append(f'<li><span aria-current="page">{escape(name, quote=False)}</span></li>')
        else:
            lis.append(f'<li><a href="{escape(href)}">{escape(name, quote=False)}</a></li>')
    cls = ('mpr-breadcrumb ' + extra_class).strip()
    return f'{ind}<nav class="{cls}" aria-label="Fil d’Ariane"><ol>{"".join(lis)}</ol></nav>'


def line_indent(s, i):
    st = s.rfind('\n', 0, i) + 1
    return re.match(r'[ \t]*', s[st:]).group(0), st


# --- Analyse des textes éligibles (HTMLParser, positions exactes)
VOID = {'area', 'base', 'br', 'col', 'embed', 'hr', 'img', 'input', 'link', 'meta', 'source', 'track', 'wbr'}
BAN_TAGS = {'a', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'nav', 'header', 'footer', 'script', 'style',
            'summary', 'button', 'label', 'figcaption', 'title', 'select', 'option', 'textarea',
            'noscript', 'code', 'aside', 'form', 'table'}
BAN_CLASSES = {'hero', 'page-hero', 'article-hero', 'blog-hero', 'kicker', 'cta-card', 'article-cta',
               'actions', 'internal-link-block', 'liens-projets', 'author-box', 'mpr-shop-links',
               'mpr-breadcrumb', 'article-breadcrumb', 'toc', 'badges', 'sticky-cta', 'article-meta',
               'cta-buttons', 'article-review-date', 'night'}
BLOCK_TAGS = {'p', 'li', 'dd'}


class TextScan(HTMLParser):
    def __init__(self, src):
        super().__init__(convert_charrefs=False)
        self.src = src
        self.lines = [0]
        for m in re.finditer('\n', src):
            self.lines.append(m.end())
        self.stack = []
        self.in_main = False
        self.nodes = []  # (offset, raw_text, block_offset)
        self.feed(src)

    def off(self):
        ln, col = self.getpos()
        return self.lines[ln - 1] + col

    def handle_starttag(self, tag, attrs):
        if tag == 'main':
            self.in_main = True
        if tag in VOID:
            return
        cls = set((dict(attrs).get('class') or '').split())
        self.stack.append((tag, cls, self.off()))

    def handle_startendtag(self, tag, attrs):
        pass

    def handle_endtag(self, tag):
        if tag == 'main':
            self.in_main = False
        for k in range(len(self.stack) - 1, -1, -1):
            if self.stack[k][0] == tag:
                del self.stack[k:]
                break

    def handle_data(self, data):
        if not self.in_main or not data.strip():
            return
        block = None
        for tag, cls, o in self.stack:
            if tag in BAN_TAGS or cls & BAN_CLASSES:
                return
            if tag in BLOCK_TAGS:
                block = o
        if block is None:
            return
        o = self.off()
        assert self.src[o:o + len(data)] == data
        self.nodes.append((o, data, block))


def add_text_links(s):
    existing = len(re.findall(r'class="mpr-shop-link"', s))
    if existing:
        return s, []
    nodes = TextScan(s).nodes
    found = []  # (start, end, key, anchor)
    used_blocks = set()
    for key, _, _, pat in COLLECTIONS:
        if len(found) >= MAX_LINKS:
            break
        rx = re.compile(pat)
        done = False
        for off, raw, block in nodes:
            if block in used_blocks:
                continue
            f = fold(raw)
            for m in rx.finditer(f):
                a, b = off + m.start(), off + m.end()
                rej = REJECT_BEFORE.get(key)
                if rej and rej.search(plain(s[max(0, a - 400):a])[-120:]):
                    continue
                rej = REJECT_AFTER.get(key)
                if rej and rej.search(plain(s[b:b + 200])[:40]):
                    continue
                if any(not (b <= x or a >= y) for x, y, _, _ in found):
                    continue
                found.append((a, b, key, s[a:b]))
                used_blocks.add(block)
                done = True
                break
            if done:
                break
    for a, b, key, anchor in sorted(found, reverse=True):
        s = s[:a] + (f'<a class="mpr-shop-link" href="{shop_url(key)}" title="{escape(shop_title(key))}">'
                     f'{anchor}</a>') + s[b:]
    return s, [(key, anchor) for a, b, key, anchor in sorted(found)]


# --- Fil d'Ariane
def add_breadcrumb(f, s):
    if 'class="mpr-breadcrumb' in s:
        return s, 'déjà présent'
    items = breadcrumb_items(s)
    if f in NEW_JSONLD and not items:
        items = [(n, SITE + u) for n, u in NEW_JSONLD[f]]
        data = {'@context': 'https://schema.org', '@type': 'BreadcrumbList',
                'itemListElement': [{'@type': 'ListItem', 'position': k + 1, 'name': n, 'item': u}
                                    for k, (n, u) in enumerate(items)]}
        tag = ('  <script type="application/ld+json">\n'
               + json.dumps(data, ensure_ascii=False, indent=2) + '\n  </script>\n')
        i = s.index('</head>')
        s = s[:i] + tag + s[i:]
    if not items:
        return s, 'pas de BreadcrumbList'
    if 'id="refonte-css"' in s and 'refonte-legacy' not in s.split('</head>')[1][:200]:
        m = re.search(r'<main id="page-content">\n(\s*)<div class="night">\n', s)
        if not m:
            return s, 'structure inattendue'
        ind = m.group(1) + '  '
        return s[:m.end()] + breadcrumb_nav(items, 'wrap', ind) + '\n' + s[m.end():], 'ajouté'
    # refonte-legacy et premium : avant le H1 du premier bloc de main
    main = s.index('<main')
    if f == 'cost_calculator.html':
        e = s.index('>', main) + 1
        ind = '        '
        return s[:e] + '\n' + breadcrumb_nav(items, 'premium-container', ind) + s[e:], 'ajouté'
    h = s.index('<h1', main)
    ind, st = line_indent(s, h)
    light = 'mpr-breadcrumb--light' if 'linear-gradient(rgba(0,0,0' in s[main:h] else ''
    return s[:st] + breadcrumb_nav(items, light, ind) + '\n' + s[st:], 'ajouté'


def fix_jsonld_entities(s):
    def repl(m):
        body = m.group(1)
        if 'BreadcrumbList' not in body:
            return m.group(0)
        nb = body.replace('&amp;', '&').replace('&#039;', "'")
        return m.group(0).replace(body, nb)
    return re.sub(r'<script type="application/ld\+json">(.*?)</script>', repl, s, flags=re.S)


# --- Bloc boutique
def add_block(f, s):
    if 'class="mpr-shop-links"' in s:
        return s, False
    if f in BLOCK_IF_SDB:
        body = s[s.index('<main'):s.index('</main>')]
        text = fold(re.sub(r'<[^>]+>', ' ', body))
        if not re.search(r"salles? de bains?|salles? d'eau", text):
            return s, False
    main_end = s.index('</main>')
    for marker in ('<section class="cta-card"', '<section class="article-cta">', '<div class="article-cta">'):
        i = s.rfind(marker, 0, main_end)
        if i >= 0:
            ind, st = line_indent(s, i)
            return s[:st] + block_html(ind) + s[st:], True
    return s, False


# --- Navigation et pied de page
NAV_LINK = f'<a href="{SHOP}">Boutique</a>'


def add_nav_footer(f, s):
    if f in NAV_SKIP:
        return s, []
    done = []
    if SHOP not in s.split('</header>')[0]:
        # Refonte : <nav class="site-nav">
        n = re.sub(r'(<nav class="site-nav"[^>]*>.*?)(\n(\s*)<a href="#contact">Contact</a>)',
                   lambda m: m.group(1) + m.group(2) + '\n' + m.group(3)
                   + f'<a href="{SHOP}" class="nav-boutique">Boutique</a>', s, count=1, flags=re.S)
        if n == s:  # premium
            n = re.sub(r'(<ul class="premium-nav-links"[^>]*>.*?)(</ul>)',
                       lambda m: m.group(1) + f'<li>{NAV_LINK}</li>' + m.group(2), s, count=1, flags=re.S)
        if n == s:  # ancien gabarit (contact, landing)
            n = re.sub(r'(<ul class="nav-links">.*?)(\n(\s*)</ul>)',
                       lambda m: m.group(1) + '\n' + m.group(3) + f'  <li><a href="{SHOP}">BOUTIQUE</a></li>'
                       + m.group(2), s, count=1, flags=re.S)
        if n != s:
            done.append('nav')
            s = n
    foot = s.rfind('<footer')
    if foot >= 0 and SHOP not in s[foot:]:
        tail = s[foot:]
        n = re.sub(r'(<h2>(?:Plan du site|Explorer)</h2><ul>.*?)(<li><a href="/zh/"|</ul>)',
                   lambda m: m.group(1) + f'<li>{NAV_LINK}</li>' + m.group(2), tail, count=1, flags=re.S)
        if n == tail:
            n = tail.replace('style="color: var(--yellow);">Mentions légales</a>',
                             'style="color: var(--yellow);">Mentions légales</a> | '
                             f'<a href="{SHOP}" style="color: var(--yellow);">Boutique</a>', 1)
        if n != tail:
            done.append('footer')
            s = s[:foot] + n
    return s, done


def pages():
    out = []
    for p in sorted(ROOT.glob('**/*.html')):
        rel = p.relative_to(ROOT).as_posix()
        if re.match(r'(node_modules|seo-api|seo-dashboard)/', rel) or rel.startswith('googled'):
            continue
        out.append(rel)
    return out


def run(report_path=None):
    report = {}
    for f in pages():
        p = ROOT / f
        s0 = s = p.read_text(encoding='utf-8')
        r = {}
        s = fix_jsonld_entities(s)
        is_refonte = 'id="refonte-css"' in s
        if (is_refonte and f not in REFONTE_SKIP) or f in PREMIUM_BC:
            s, r['breadcrumb'] = add_breadcrumb(f, s)
        if f in TEXT_LINK_PAGES:
            s, r['shop_links'] = add_text_links(s)
        if f in BLOCK_ALWAYS or f in BLOCK_IF_SDB:
            s, r['shop_block'] = add_block(f, s)
        s, r['nav_footer'] = add_nav_footer(f, s)
        r['jsonld_fixed'] = fix_jsonld_entities(s0) != s0
        if s != s0:
            p.write_text(s, encoding='utf-8')
            r['modified'] = True
        report[f] = r
    if report_path:
        Path(report_path).write_text(json.dumps(report, ensure_ascii=False, indent=1), encoding='utf-8')
    print('maillage-boutique :', sum(1 for r in report.values() if r.get('modified')), 'fichier(s) modifié(s)')


if __name__ == '__main__':
    rp = sys.argv[sys.argv.index('--report') + 1] if '--report' in sys.argv else None
    run(rp)
