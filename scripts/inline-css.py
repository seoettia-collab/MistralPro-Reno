#!/usr/bin/env python3
"""Inline css/refonte.css (and refonte-legacy.css) into pages that carry
<style id="refonte-css">. Run after editing those CSS files: python scripts/inline-css.py
--check exits 1 if any page is stale."""
from pathlib import Path
import re, sys
ROOT = Path(__file__).resolve().parents[1]
FF = ("@font-face{font-family:'Cormorant Garamond';font-style:normal;font-weight:300 700;font-display:swap;"
      "src:url(/fonts/refonte/cormorant-garamond-latin.woff2) format('woff2')}"
      "@font-face{font-family:'Lora';font-style:normal;font-weight:400 700;font-display:swap;"
      "src:url(/fonts/refonte/lora-latin.woff2) format('woff2')}")
TAG = re.compile(r'<style id="refonte-css"( data-legacy)?>.*?</style>', re.S)
FONTS = re.compile(r'<style id="refonte-fonts">.*?</style>', re.S)
def css(legacy):
    out = FF + (ROOT / 'css/refonte.css').read_text(encoding='utf-8').strip()
    return out + ((ROOT / 'css/refonte-legacy.css').read_text(encoding='utf-8').strip() if legacy else '')
def run(check):
    stale = []
    for p in sorted(ROOT.glob('**/*.html')):
        if any(x in p.parts for x in ('node_modules', 'seo-api', 'seo-dashboard')):
            continue
        s = p.read_text(encoding='utf-8')
        n = TAG.sub(lambda m: f'<style id="refonte-css"{m.group(1) or ""}>{css(bool(m.group(1)))}</style>', s)
        n = FONTS.sub(lambda m: f'<style id="refonte-fonts">{FF}</style>', n)
        if n != s:
            stale.append(str(p.relative_to(ROOT)))
            if not check:
                p.write_text(n, encoding='utf-8')
    if check and stale:
        print('Stale inline CSS:', ', '.join(stale)); return 1
    print(('Checked' if check else 'Updated'), len(stale) if not check else 'all', 'pages')
    return 0
if __name__ == '__main__':
    sys.exit(run('--check' in sys.argv))
