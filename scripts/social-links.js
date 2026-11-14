#!/usr/bin/env node
'use strict';
// SOCIAL-01 : liens Facebook / Instagram (SVG inline, sans librairie ni widget) dans en-têtes, pieds de page, sameAs et générateurs.
// Idempotent : relancer `node scripts/social-links.js` après une fusion (ex. #26) remet les liens sans conflit manuel.
const FB='https://www.facebook.com/profile.php?id=61587951641785',IG='https://www.instagram.com/mistral_pro_reno/';
const SVG={
 fb:'<svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true" focusable="false"><path fill="currentColor" d="M13.5 21v-7.5h2.5l.4-3h-2.9V8.6c0-.9.3-1.5 1.5-1.5h1.5V4.4c-.3 0-1.2-.1-2.2-.1-2.2 0-3.7 1.3-3.7 3.8v2.4H8v3h2.6V21h2.9z"/></svg>',
 ig:'<svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true" focusable="false"><rect x="3.5" y="3.5" width="17" height="17" rx="5" fill="none" stroke="currentColor" stroke-width="1.8"/><circle cx="12" cy="12" r="4" fill="none" stroke="currentColor" stroke-width="1.8"/><circle cx="17.2" cy="6.8" r="1.1" fill="currentColor"/></svg>'
};
const A='display:inline-flex;align-items:center;justify-content:center;width:44px;height:44px;color:inherit';
function icon(href,label,svg){return '<a href="'+href+'" target="_blank" rel="noopener" aria-label="'+label+' (nouvel onglet)" style="'+A+'">'+svg+'</a>';}
const ICONS=icon(FB,'Mistral Pro Reno sur Facebook',SVG.fb)+icon(IG,'Mistral Pro Reno sur Instagram',SVG.ig);
const HEADER=cls=>'<span class="social-links'+(cls?' '+cls:'')+'" data-social="header" style="display:inline-flex;align-items:center;gap:2px">'+ICONS+'</span>';
const FOOTER=extra=>'<div class="social-links" data-social="footer" style="display:flex;flex-wrap:wrap;align-items:center;gap:4px 8px;'+(extra||'')+'"><span style="font-size:14px">Suivez nos chantiers</span>'+ICONS+'</div>';
function btn(href,label,svg,name){return '<a class="btn" href="'+href+'" target="_blank" rel="noopener" aria-label="'+label+' (nouvel onglet)" style="display:inline-flex;align-items:center;gap:10px">'+svg+name+'</a>';}
const BLOCK=ind=>[ '<hr class="hr">',
 '<section class="section" aria-labelledby="social-title" data-social="block">',
 '  <p class="kicker">Suivez nos chantiers</p>',
 '  <h2 id="social-title" class="h2" style="margin-bottom:16px;max-width:24ch">Nos rénovations en images</h2>',
 '  <p class="muted" style="max-width:52ch;margin:0 0 28px">Photos de chantiers, avant et après : retrouvez nos réalisations à Paris et en Île-de-France sur nos réseaux.</p>',
 '  <div class="actions" style="margin:0">'+btn(FB,'Mistral Pro Reno sur Facebook',SVG.fb,'Facebook')+btn(IG,'Mistral Pro Reno sur Instagram',SVG.ig,'Instagram')+'</div>',
 '</section>'].map(l=>ind+l).join('\n')+'\n';
const SKIP=/^(googled[0-9a-f]+\.html|seo-dashboard\/|estimation-projet\.html|devis-travaux\/|merci\.html|node_modules\/)/;
function lineStart(s,i){return s.lastIndexOf('\n',i-1)+1;}
function indentAt(s,i){const st=lineStart(s,i);return s.slice(st).match(/^[ \t]*/)[0];}
function insertBeforeLine(s,i,text){const st=lineStart(s,i);return s.slice(0,st)+indentAt(s,i)+text+'\n'+s.slice(st);}
function insertAfterLine(s,i,text){let e=s.indexOf('\n',i);if(e<0)e=s.length;return s.slice(0,e+1)+indentAt(s,i)+text+'\n'+s.slice(e+1);}
function block(s,open,close){const a=s.search(open);if(a<0)return null;const b=s.indexOf(close,a);return b<0?null:{a,b};}
function sameAs(s){return s.replace(/("sameAs"\s*:\s*\[)(\s*)"https:\/\/www\.facebook\.com\/profile\.php\?id=61587951641785"(?![^\]]*instagram\.com)/g,(m,head,ws)=>head+ws+'"'+FB+'",'+(ws.includes('\n')?ws:(ws||''))+'"'+IG+'"');}
function header(s){
 if(s.includes('data-social="header"'))return s;const h=block(s,/<header\b/,'</header>');if(!h)return s;const part=s.slice(h.a,h.b);
 if(/^<header class="premium-header"/.test(part)){const i=part.indexOf('<a class="premium-header-phone"'),j=i>=0?i:part.indexOf('<button class="premium-menu-button"');if(j<0)return s;return s.slice(0,h.a+j)+HEADER('premium-social')+s.slice(h.a+j);}
 let k=part.lastIndexOf('</nav>');if(/^<header class="site-header"/.test(part)){if(k<0)k=part.length;return insertBeforeLine(s,h.a+k,HEADER());}
 const ci=part.indexOf('<div class="contact-info">');if(ci>=0)return insertAfterLine(s,h.a+ci,'  '+HEADER());
 const mail=part.indexOf('mailto:contact@');if(mail>=0)return insertAfterLine(s,h.a+mail,HEADER());
 const d=part.lastIndexOf('</div>');if(d>=0)return insertBeforeLine(s,h.a+d,'  '+HEADER());
 return insertBeforeLine(s,h.b,HEADER());
}
function footer(s){
 if(s.includes('data-social="footer"'))return s;const f=block(s,/<footer\b/,'</footer>');if(!f)return s;const part=s.slice(f.a,f.b);
 const pb=part.indexOf('premium-footer-bottom');if(pb>=0)return insertBeforeLine(s,f.a+pb,FOOTER('grid-column:1/-1;margin-top:8px'));
 const bp=part.indexOf('class="big-phone"');if(bp>=0)return insertAfterLine(s,f.a+bp,FOOTER('margin-top:24px'));
 const fb=part.indexOf('class="footer-bottom"');if(fb>=0)return insertBeforeLine(s,f.a+fb,FOOTER('margin-top:16px'));
 const d=part.lastIndexOf('</div>');if(d>=0)return insertBeforeLine(s,f.a+d,'  '+FOOTER('justify-content:center;margin-top:12px'));
 return insertBeforeLine(s,f.b,FOOTER('justify-content:center;padding:12px'));
}
function homeBlock(s,file){
 if(s.includes('data-social="block"'))return s;
 const marker=file==='index.html'?'<section class="cta-card" aria-labelledby="cta-title">':file==='travaux.html'?'<section class="cta-card" style="margin-top:96px"':null;
 if(!marker)return s;const i=s.indexOf(marker);if(i<0)return s;const st=lineStart(s,i);return s.slice(0,st)+BLOCK(indentAt(s,i))+s.slice(st);
}
function transform(file,s){
 if(SKIP.test(file))return file==='merci.html'?sameAs(s):s;
 if(file.endsWith('.js'))return footer(header(s));
 return homeBlock(footer(header(sameAs(s))),file);
}
const GENERATORS=['seo-api/routes/contentGen.js','seo-api/services/publisher.js','seo-api/services/seoExecutor.js'];
module.exports={FB,IG,transform,GENERATORS,SKIP};
if(require.main===module){
 const fs=require('node:fs'),path=require('node:path'),root=path.resolve(__dirname,'..');let changed=0;
 const walk=d=>fs.readdirSync(path.join(root,d),{withFileTypes:true}).flatMap(e=>{const p=d?d+'/'+e.name:e.name;if(e.isDirectory())return /^(node_modules|\.git|seo-api|images|fonts|css|js)$/.test(e.name)?[]:walk(p);return e.name.endsWith('.html')?[p]:[];});
 for(const f of walk('').concat(GENERATORS)){const p=path.join(root,f),a=fs.readFileSync(p,'utf8'),b=transform(f,a);if(a!==b){fs.writeFileSync(p,b);changed++;}}
 console.log('social-links : '+changed+' fichier(s) mis à jour');
}
