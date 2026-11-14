/* CONVERSION-PARIS-01 : logique du parcours d'estimation (sans DOM, sans réseau). Testée sous Node. */
(function(root){
'use strict';
var UNKNOWN='Je ne sais pas';
var PARIS_CP=/^750(0[1-9]|1\d|20)$|^75116$/,IDF_CP=/^(75|77|78|91|92|93|94|95)\d{3}$/;
var CHOICES={
 travaux:['Rénovation complète','Salle de bain','Cuisine','Peinture','Autres travaux',UNKNOWN],
 surface:['Moins de 20 m²','20 à 40 m²','40 à 70 m²','70 à 100 m²','Plus de 100 m²',UNKNOWN],
 pieces:['Séjour','Chambre(s)','Cuisine','Salle de bain','WC','Entrée / couloir','Tout le logement',UNKNOWN],
 nature:['Rénovation lourde (démolition, réseaux)','Rafraîchissement (peinture, sols)','Remplacement d’équipements',UNKNOWN],
 demarrage:['Dès que possible','Dans 1 à 3 mois','Dans 3 à 6 mois','Plus tard',UNKNOWN]
};
var EXCLUSIVE=[UNKNOWN,'Tout le logement'];
var ATTRIBUTION=['utm_source','utm_medium','utm_campaign','utm_content','utm_term','campaign_id','ad_group_id','ad_id','fbclid'];
function params(search){var out={};String(search||'').replace(/^\?/,'').split('&').forEach(function(p){if(!p)return;var i=p.indexOf('='),k=decodeURIComponent((i<0?p:p.slice(0,i)).replace(/\+/g,' ')),v=i<0?'':decodeURIComponent(p.slice(i+1).replace(/\+/g,' '));if(!(k in out))out[k]=v;});return out;}
function attribution(search){var q=params(search),out={};ATTRIBUTION.forEach(function(k){var v=String(q[k]||'').trim();if(v)out[k]=v.slice(0,k==='fbclid'?500:150);});return out;}
function zone(search){var q=params(search);if(String(q.zone||'').toLowerCase()==='paris')return 'paris';return /paris/i.test(q.utm_campaign||'')?'paris':'idf';}
function isTest(search){var q=params(search);return q.test==='1'||q.test==='true';}
function normCity(s){return String(s||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/[^a-z0-9]+/g,' ').trim();}
function postalError(cp,z){cp=String(cp||'').trim();if(!/^\d{5}$/.test(cp))return 'Indiquez le code postal du chantier (5 chiffres).';if(z==='paris')return PARIS_CP.test(cp)?'':'Ce parcours concerne Paris intra-muros : 75001 à 75020 ou 75116. Pour l’Île-de-France, appelez le 06 09 10 90 69.';if(!IDF_CP.test(cp))return 'Nous intervenons à Paris et en Île-de-France (75, 77, 78, 91, 92, 93, 94, 95).';if(cp.slice(0,2)==='75'&&!PARIS_CP.test(cp))return 'Ce code postal parisien n’existe pas (75001 à 75020 ou 75116).';return '';}
function cityError(cp,city){var c=normCity(city),paris=/^paris\b/.test(c);if(!c)return 'Indiquez la ville du chantier.';if(String(cp).slice(0,2)==='75'){if(!paris)return 'Le code postal '+cp+' correspond à Paris : indiquez « Paris ».';var m=c.match(/^paris (\d{1,2})(?:e|er|eme)?\b/);if(m){var n=Number(m[1]),ok=n===16?['75016','75116']:['750'+(n<10?'0':'')+n];if(ok.indexOf(String(cp))<0)return 'La ville « '+city.trim()+' » ne correspond pas au code postal '+cp+'.';}}else if(paris)return 'Paris correspond à un code postal 75001 à 75020 ou 75116.';return '';}
function cityFor(cp){return String(cp||'').slice(0,2)==='75'&&PARIS_CP.test(cp)?'Paris':'';}
function toggle(list,value,multi){list=Array.isArray(list)?list.slice():[];if(!multi)return [value];var i=list.indexOf(value);if(i>=0){list.splice(i,1);return list;}if(EXCLUSIVE.indexOf(value)>=0)return [value];return list.filter(function(v){return EXCLUSIVE.indexOf(v)<0;}).concat(value);}
function phoneOk(p){p=String(p||'').replace(/[\s().-]/g,'');return /^(?:0[1-9]\d{8}|\+33[1-9]\d{8}|0033[1-9]\d{8})$/.test(p);}
function emailOk(e){return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(e||'').trim());}
function stepErrors(step,s,z){var e={};
 if(step===1){if(!s.travaux.length)e.travaux='Choisissez au moins un type de travaux (ou « Je ne sais pas »).';var pe=postalError(s.postal_code,z);if(pe)e.postal_code=pe;if(!s.surface)e.surface='Choisissez une surface approximative (ou « Je ne sais pas »).';}
 if(step===2){if(!s.pieces.length)e.pieces='Choisissez les pièces concernées (ou « Je ne sais pas »).';if(!s.nature)e.nature='Choisissez la nature des travaux (ou « Je ne sais pas »).';if(!s.demarrage)e.demarrage='Choisissez un démarrage souhaité (ou « Je ne sais pas »).';}
 if(step===3){var c=s.contact;if(!c.first_name.trim())e.first_name='Indiquez votre prénom.';if(!c.last_name.trim())e.last_name='Indiquez votre nom.';if(!phoneOk(c.phone))e.phone='Téléphone français à 10 chiffres, ex. 06 12 34 56 78.';if(!emailOk(c.email))e.email='Adresse e-mail invalide.';if(!c.address.trim())e.address='Indiquez l’adresse du chantier.';var pe2=postalError(c.postal_code,z);if(pe2)e.postal_code=pe2;else{var ce=cityError(c.postal_code,c.city);if(ce)e.city=ce;}}
 return e;}
function ready(s,z){return [1,2,3].every(function(n){return !Object.keys(stepErrors(n,s,z)).length;});}
function answers(s){return{travaux:s.travaux.slice(),pieces:s.pieces.slice(),nature:s.nature,surface:s.surface,demarrage:s.demarrage,details:String(s.details||'').trim()};}
function contactPayload(c){var out={};['first_name','last_name','phone','email','address','postal_code','city'].forEach(function(k){out[k]=String(c[k]||'').trim();});return out;}
function confirmed(session,receipt){return !!(session&&receipt&&receipt.stored===true&&receipt.receipt===session.session_id);}
function fingerprint(c){return JSON.stringify([c.first_name,c.last_name,c.phone,c.email,c.address,c.postal_code,c.city].map(function(v){return String(v||'').trim().toLowerCase();}));}
var ERRORS={paris_only:'Ce parcours concerne Paris intra-muros (75001 à 75020 ou 75116).',city_mismatch:'La ville ne correspond pas au code postal du chantier.',invalid_postal_code:'Code postal du chantier invalide.',invalid_contact:'Vérifiez vos coordonnées : téléphone français, e-mail valide, code postal en Île-de-France.',answers_required:'Il manque une réponse sur vos travaux.',session_expired:'Votre session a expiré. Rechargez la page ou appelez le 06 09 10 90 69.',files_too_large:'Les pièces jointes dépassent 5 fichiers ou 8 Mo.',invalid_file:'Un fichier n’est pas un JPEG, PNG ou PDF valide.',file_not_analyzed:'Un PDF n’a pas pu être lu. Retirez-le ou ajoutez des photos.',invalid_pdf:'Un PDF n’a pas pu être lu. Retirez-le ou ajoutez des photos.',session_capacity:'Le service est très sollicité. Appelez-nous au 06 09 10 90 69.',estimate_service_unavailable:'Le service est momentanément indisponible. Appelez-nous au 06 09 10 90 69.',too_many_requests:'Trop de tentatives. Appelez-nous au 06 09 10 90 69.',service_busy:'Le service est très sollicité, réessayez dans un instant.'};
function errorText(code){return ERRORS[code]||'L’enregistrement n’est pas confirmé. Vos informations restent sur cette page : réessayez, ou appelez le 06 09 10 90 69.';}
var api={UNKNOWN:UNKNOWN,CHOICES:CHOICES,ATTRIBUTION:ATTRIBUTION,params:params,attribution:attribution,zone:zone,isTest:isTest,postalError:postalError,cityError:cityError,cityFor:cityFor,toggle:toggle,phoneOk:phoneOk,emailOk:emailOk,stepErrors:stepErrors,ready:ready,answers:answers,contactPayload:contactPayload,confirmed:confirmed,fingerprint:fingerprint,errorText:errorText};
root.MPRFlow=api;
if(typeof module==='object'&&module.exports)module.exports=api;
}(typeof window==='object'?window:globalThis));
