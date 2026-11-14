/* CONVERSION-PARIS-01 : parcours en 3 étapes, demande enregistrée et confirmée avant tout succès ou calcul IA. */
(function(){
'use strict';
var BASE='https://facebook-ads-backend-s20a.onrender.com/public/site-estimates';
var F=window.MPRFlow;if(!F)return;
var $=function(id){return document.getElementById(id);};
var form=$('estimate-form'),search=location.search,zone=F.zone(search),testMode=F.isTest(search),attribution=F.attribution(search);
var preview=(location.protocol==='file:'||/^(localhost|127\.0\.0\.1)$/.test(location.hostname))&&F.params(search).preview!==undefined;
var state={travaux:[],surface:'',pieces:[],nature:'',demarrage:'',details:'',postal_code:''},step=1,maxStep=1,busy=false,pending=null,done=false,selected=[],prepared=new Map(),pdfLib=null,estimate=null,leadProject='';
var money=new Intl.NumberFormat('fr-FR',{style:'currency',currency:'EUR',maximumFractionDigits:0});
var KEY='mpr-estimate-v10';
function store(v){try{if(v)sessionStorage.setItem(KEY,JSON.stringify(v));else sessionStorage.removeItem(KEY);}catch(e){}}
function stored(){try{return JSON.parse(sessionStorage.getItem(KEY)||'null');}catch(e){return null;}}
/* Mesure : GA4 est chargé en différé par la page ; la conversion n'est envoyée qu'après reçu serveur confirmé. */
window.dataLayer=window.dataLayer||[];if(typeof window.gtag!=='function')window.gtag=function(){window.dataLayer.push(arguments);};
function track(name,params){try{window.gtag('event',testMode&&name==='generate_lead'?'generate_lead_test':name,Object.assign({parcours:zone,test_request:testMode?1:0},params||{}));}catch(e){}}
function node(tag,text,cls){var el=document.createElement(tag);if(text!==undefined)el.textContent=text;if(cls)el.className=cls;return el;}
function contact(){var c={};['first_name','last_name','phone','email','address','postal_code','city'].forEach(function(k){c[k]=String(form.elements[k].value||'');});return c;}
function full(){return Object.assign({},state,{details:$('project-details').value,postal_code:form.elements.project_postal_code.value,contact:contact()});}
/* Présentation campagne Paris */
if(zone==='paris'){$('page-content').setAttribute('data-zone','paris');$('intro-eyebrow').textContent='Paris intra-muros';$('intro-title').textContent='Votre rénovation à Paris';$('intro-lead').textContent='Une première fourchette de budget et un rappel rapide pour votre chantier à Paris.';$('zone-note').hidden=false;$('intro-trust').textContent='Paris 1er au 20e · 7j/7 de 8h à 20h';form.elements.project_postal_code.placeholder='Ex. 75017';}
if(testMode)$('test-note').hidden=false;
/* Réponses rapides */
document.querySelectorAll('[data-group]').forEach(function(group){var key=group.getAttribute('data-group'),multi=group.getAttribute('data-multi')==='true';
 group.querySelectorAll('.mpr-chip').forEach(function(chip){chip.addEventListener('click',function(){if(busy||done)return;var v=chip.getAttribute('data-value');if(multi)state[key]=F.toggle(state[key],v,true);else state[key]=state[key]===v?'':v;paint(group,key);$('error-'+key).textContent='';refresh();});});});
function paint(group,key){group.querySelectorAll('.mpr-chip').forEach(function(chip){var v=chip.getAttribute('data-value'),on=Array.isArray(state[key])?state[key].indexOf(v)>=0:state[key]===v;chip.setAttribute('aria-pressed',String(on));});}
function showErrors(errors,stepNo){var ids={1:['travaux','project_postal_code','surface'],2:['pieces','nature','demarrage'],3:['first_name','last_name','phone','email','address','postal_code','city']}[stepNo];ids.forEach(function(k){var el=$('error-'+k);if(el)el.textContent=errors[k==='project_postal_code'?'postal_code':k]||'';});var first=ids.find(function(k){return errors[k==='project_postal_code'?'postal_code':k];});if(first){var target=form.elements[first]||document.querySelector('#group-'+first+' .mpr-chip');if(target&&target.focus)target.focus();}}
function showStep(n,focus){step=n;maxStep=Math.max(maxStep,n);[1,2,3,4].forEach(function(i){$('step-'+i).hidden=i!==n;});form.hidden=n===4;$('page-content').setAttribute('data-step',String(n));document.querySelectorAll('.estimate-steps li').forEach(function(li,i){if(i===Math.min(n,3)-1)li.setAttribute('aria-current','step');else li.removeAttribute('aria-current');});
 if(focus){var t={1:'panel-title',2:'step-2-title',3:'step-3-title',4:'done-title'}[n];$(t).focus();window.scrollTo({top:Math.max(0,$('page-content').getBoundingClientRect().top+window.scrollY-12),behavior:'smooth'});}
 track('estimation_step_view',{step:n});refresh();}
function next(n){var s=full(),errors=F.stepErrors(n-1,s,zone);showErrors(errors,n-1);if(Object.keys(errors).length){track('estimation_step_error',{step:n-1,fields:Object.keys(errors).join(',')});return;}
 if(n===3){if(!form.elements.postal_code.value)form.elements.postal_code.value=s.postal_code;if(!form.elements.city.value)form.elements.city.value=F.cityFor(s.postal_code);}
 track('estimation_step_complete',{step:n-1});showStep(n,true);}
document.querySelectorAll('[data-next]').forEach(function(b){b.addEventListener('click',function(){if(!busy)next(Number(b.getAttribute('data-next')));});});
document.querySelectorAll('[data-prev]').forEach(function(b){b.addEventListener('click',function(){if(!busy)showStep(Number(b.getAttribute('data-prev')),true);});});
function filled(s){var c=s.contact;return ['first_name','last_name','phone','email','address','postal_code','city'].every(function(k){return c[k].trim().length>0;})&&!Object.keys(F.stepErrors(1,s,zone)).length&&!Object.keys(F.stepErrors(2,s,zone)).length;}
function refresh(){var ok=filled(full()),lock=busy||!!pending&&pending.uncertain;$('callback-submit').disabled=!ok||busy;$('estimate-submit').disabled=!ok||busy;$('callback-submit').hidden=$('estimate-submit').hidden=lock;$('ready-hint').textContent=busy?'Enregistrement de votre demande…':ok?'Votre demande est prête à être envoyée.':'Complétez vos coordonnées pour envoyer votre demande.';$('uncertain-request').hidden=!(pending&&pending.uncertain);$('retry-request').disabled=busy;
 form.querySelectorAll('input,textarea,.mpr-chip,[data-prev],[data-next]').forEach(function(el){if(el.name!=='website')el.disabled=busy||!!(pending&&pending.uncertain);});}
form.addEventListener('input',function(e){var n=e.target.name;if(n&&$('error-'+n))$('error-'+n).textContent='';if(n==='project_postal_code')$('error-project_postal_code').textContent='';refresh();});
form.addEventListener('change',refresh);
form.addEventListener('focusout',function(e){if(step!==3||!e.target.name||!e.target.value)return;var errors=F.stepErrors(3,full(),zone),k=e.target.name;if($('error-'+k))$('error-'+k).textContent=errors[k]||'';if(k==='postal_code'&&!errors.postal_code&&!form.elements.city.value)form.elements.city.value=F.cityFor(e.target.value);});
/* Pièces jointes (facultatives) */
function filesList(){var list=$('file-list');list.replaceChildren();selected.forEach(function(f){var li=node('li'),b=node('button','Retirer');li.append(node('span',f.file.name+' · '+Math.ceil(f.file.size/1024)+' Ko'));b.type='button';b.setAttribute('aria-label','Retirer '+f.file.name);b.onclick=function(){if(busy)return;selected=selected.filter(function(x){return x.id!==f.id;});prepared.delete(f.id);filesList();};li.append(b);list.append(li);});}
$('project-files').addEventListener('change',function(){var err=$('error-files'),next=selected.slice();err.textContent='';for(var file of this.files){if(['image/jpeg','image/png','application/pdf'].indexOf(file.type)<0){err.textContent=F.errorText('invalid_file');continue;}if(next.some(function(x){return x.file.name===file.name&&x.file.size===file.size;}))continue;next.push({id:crypto.randomUUID(),file:file});}if(next.length>5||next.reduce(function(n,x){return n+x.file.size;},0)>8388608){err.textContent=F.errorText('files_too_large');this.value='';return;}selected=next;this.value='';filesList();});
function base64(buffer){var bytes=new Uint8Array(buffer),parts=[];for(var i=0;i<bytes.length;i+=16384)parts.push(String.fromCharCode.apply(null,bytes.subarray(i,i+16384)));return btoa(parts.join(''));}
async function photo(file){var bitmap=await createImageBitmap(file);try{var scale=Math.min(1,1400/Math.max(bitmap.width,bitmap.height)),c=document.createElement('canvas');c.width=Math.max(1,Math.round(bitmap.width*scale));c.height=Math.max(1,Math.round(bitmap.height*scale));var ctx=c.getContext('2d');ctx.fillStyle='#fff';ctx.fillRect(0,0,c.width,c.height);ctx.drawImage(bitmap,0,0,c.width,c.height);return{media_type:'image/jpeg',data:c.toDataURL('image/jpeg',.76).split(',')[1]};}finally{bitmap.close();}}
async function pdfPages(buffer){if(!pdfLib){pdfLib=await import('https://cdn.jsdelivr.net/npm/pdfjs-dist@4.10.38/build/pdf.min.mjs');pdfLib.GlobalWorkerOptions.workerSrc='https://cdn.jsdelivr.net/npm/pdfjs-dist@4.10.38/build/pdf.worker.min.mjs';}var pdf=await pdfLib.getDocument({data:new Uint8Array(buffer.slice(0)),isEvalSupported:false,disableAutoFetch:true,disableStream:true}).promise;try{if(pdf.numPages>5)throw Object.assign(new Error('Ce PDF contient plus de 5 pages. Gardez uniquement les pages utiles.'),{code:'local'});var out=[];for(var i=1;i<=pdf.numPages;i++){var page=await pdf.getPage(i),v=page.getViewport({scale:1}),vp=page.getViewport({scale:Math.min(1.5,1400/Math.max(v.width,v.height))}),c=document.createElement('canvas');c.width=Math.ceil(vp.width);c.height=Math.ceil(vp.height);await page.render({canvasContext:c.getContext('2d'),viewport:vp}).promise;out.push({media_type:'image/jpeg',data:c.toDataURL('image/jpeg',.76).split(',')[1]});page.cleanup();}return out;}finally{await pdf.destroy();}}
async function prepareFiles(){var out=[];for(var item of selected){if(!prepared.has(item.id)){var b=await item.file.arrayBuffer(),images=item.file.type==='application/pdf'?await pdfPages(b):[await photo(item.file)];prepared.set(item.id,{id:item.id,name:item.file.name,type:item.file.type,data:base64(b),page_count:images.length,images:images});}out.push(prepared.get(item.id));}return out;}
/* Réseau */
function uncertain(){return Object.assign(new Error(F.errorText('')),{code:'uncertain'});}
async function call(path,body,token){var r;try{r=await fetch(BASE+path,{method:'POST',headers:Object.assign({'Content-Type':'application/json'},token?{'X-Estimate-Token':token}:{}),body:JSON.stringify(body),signal:AbortSignal.timeout(115000),credentials:'omit',redirect:'error'});}catch(e){throw uncertain();}var data;try{data=await r.json();}catch(e){throw uncertain();}if(!data||typeof data!=='object')throw uncertain();if(!r.ok){var code=data.error||'';throw Object.assign(new Error(F.errorText(code)),{code:r.status>=500||code==='generation_uncertain'||!code?'uncertain':code,receipt:data.receipt||null});}return data;}
async function submit(mode){
 if(busy||done&&mode!=='estimate')return;
 var s=full(),err=$('submit-error');err.textContent='';
 if(!pending){var errors=F.stepErrors(3,s,zone);showErrors(errors,3);if(!F.ready(s,zone)){if(Object.keys(errors).length)return;for(var n=1;n<=2;n++)if(Object.keys(F.stepErrors(n,s,zone)).length){showStep(n,true);showErrors(F.stepErrors(n,s,zone),n);return;}return;}
  pending={mode:mode,contact:F.contactPayload(s.contact),answers:F.answers(s),website:form.elements.website.value||'',uncertain:false};}
 if(preview){err.textContent='Aperçu : aucun envoi réel.';pending=null;return;}
 busy=true;refresh();track('estimation_submit',{lead_type:pending.mode});
 try{
  var fp=F.fingerprint(pending.contact),saved=stored(),session=saved&&saved.fp===fp&&saved.session_id?saved:null;
  if(!session){var created=await call('/sessions',{contact:pending.contact,website:pending.website,attribution:attribution,zone:zone==='paris'?'paris':undefined,test:testMode||undefined});
   if(!/^[0-9a-f-]{36}$/.test(created.session_id||'')||!/^[0-9a-f]{64}$/.test(created.token||''))throw uncertain();session={fp:fp,session_id:created.session_id,token:created.token};store(session);}
  var files=await prepareFiles();
  var lead=await call('/sessions/'+session.session_id+'/lead',{answers:pending.answers,files:files,callback:pending.mode==='callback'},session.token);
  if(!F.confirmed(session,lead.receipt))throw uncertain();
  session.receipt=lead.receipt.receipt;store(session);leadProject=lead.project;var mode0=pending.mode;pending=null;done=true;
  track('generate_lead',{lead_type:mode0,duplicate:lead.receipt.duplicate?1:0,files:lead.receipt.files_stored||0});
  showDone(session,s,mode0,lead.receipt);
  if(mode0==='estimate')await runEstimate(session,files);
 }catch(e){
  if(e.code==='uncertain'){if(pending)pending.uncertain=true;err.textContent='';track('estimation_error',{code:'uncertain'});}
  else{if(pending)pending=null;var map={paris_only:'postal_code',city_mismatch:'city',invalid_postal_code:'postal_code',invalid_contact:'phone'}[e.code];if(map&&$('error-'+map))$('error-'+map).textContent=e.message;else err.textContent=e.message;if(e.code==='session_expired')store(null);track('estimation_error',{code:e.code||'unknown'});}
 }finally{busy=false;refresh();}
}
form.addEventListener('submit',function(e){e.preventDefault();submit('callback');});
$('estimate-submit').addEventListener('click',function(){submit('estimate');});
$('retry-request').addEventListener('click',function(){if(pending)submit(pending.mode);});
function showDone(session,s,mode,receipt){var ref=session.session_id.slice(0,8).toUpperCase();$('lead-receipt').textContent='Demande enregistrée — référence '+ref+(receipt.files_stored?' · '+receipt.files_stored+' pièce(s) jointe(s) reçue(s)':'')+'.';$('done-phone').textContent=s.contact.phone.trim();
 var dl=$('done-summary');dl.replaceChildren();[['Travaux',s.travaux.join(', ')],['Pièces',s.pieces.join(', ')],['Nature',s.nature],['Surface',s.surface],['Démarrage',s.demarrage],['Chantier',s.contact.address.trim()+', '+s.contact.postal_code.trim()+' '+s.contact.city.trim()]].forEach(function(p){dl.append(node('dt',p[0]),node('dd',p[1]));});
 $('estimate-zone').hidden=false;$('ask-estimate').hidden=mode==='estimate';showStep(4,true);}
$('ask-estimate').addEventListener('click',function(){var saved=stored();if(busy||!saved||!saved.receipt)return;$('ask-estimate').hidden=true;busy=true;prepareFiles().then(function(files){busy=false;return runEstimate(saved,files);}).catch(function(){busy=false;$('result-error').textContent='Estimation indisponible pour le moment. Votre demande est bien enregistrée : nous vous rappelons.';});});
async function runEstimate(session,files){var progress=$('estimate-progress'),error=$('result-error');error.textContent='';progress.hidden=false;busy=true;
 try{if(!session.request_id){session.request_id=crypto.randomUUID();store(session);}
  var data=await call('/sessions/'+session.session_id+'/generate',{request_id:session.request_id,project:leadProject||'Demande enregistrée',files:files},session.token);
  if(data.state==='estimated'&&data.estimate_id===session.session_id){estimate=data;render(data);$('download-pdf').hidden=false;track('estimation_result',{result:'estimated'});}
  else if(data.state==='questions'&&Array.isArray(data.questions)){var t=$('estimate-result');t.replaceChildren(node('p','Pour chiffrer précisément, nous devons d’abord confirmer ces points avec vous lors de notre rappel :'));var ul=node('ul',undefined,'estimate-assumptions');data.questions.forEach(function(q){ul.append(node('li',q));});t.append(ul);track('estimation_result',{result:'questions'});}
  else throw uncertain();
 }catch(e){error.textContent='Estimation indisponible pour le moment. Votre demande est bien enregistrée : nous vous rappelons avec une estimation.';track('estimation_result',{result:'failed',code:e.code||''});}
 finally{progress.hidden=true;busy=false;}}
function render(e){var t=$('estimate-result');t.replaceChildren();var b=node('div',undefined,'estimate-budget');b.append(node('strong',money.format(e.range_ttc.low)+' à '+money.format(e.range_ttc.high)),node('p','TTC indicatif · fourchette de préparation (±20 %)'));t.append(b);var table=node('table',undefined,'estimate-table'),head=node('thead'),row=node('tr');['Travaux estimés','Quantité','Montant HT'].forEach(function(x){row.append(node('th',x));});head.append(row);table.append(head);var tb=node('tbody');e.sections.forEach(function(s){var lot=node('tr',undefined,'estimate-section-row'),c=node('th',s.titre);c.colSpan=3;lot.append(c);tb.append(lot);s.items.forEach(function(it){var r=node('tr');r.append(node('td',it.designation),node('td',it.quantite+' '+it.unite),node('td',money.format(it._total_ht)));tb.append(r);});});table.append(tb);t.append(table);if(e.assumptions&&e.assumptions.length){var l=node('ul',undefined,'estimate-assumptions');e.assumptions.forEach(function(x){l.append(node('li',x));});t.append(node('h3','Hypothèses et points à confirmer'),l);}}
$('download-pdf').addEventListener('click',async function(){var saved=stored();if(busy||!saved||!estimate)return;var error=$('result-error');error.textContent='';busy=true;this.disabled=true;
 try{var r=await fetch(BASE+'/sessions/'+saved.session_id+'/pdf',{method:'POST',headers:{'Content-Type':'application/json','X-Estimate-Token':saved.token},body:'{}',signal:AbortSignal.timeout(115000),credentials:'omit',redirect:'error'});if(!r.ok||!(r.headers.get('content-type')||'').startsWith('application/pdf'))throw new Error('Le PDF n’a pas pu être généré. Votre demande reste enregistrée.');var blob=await r.blob();if(new TextDecoder().decode(await blob.slice(0,5).arrayBuffer())!=='%PDF-')throw new Error('Le fichier reçu n’est pas un PDF valide.');
  var url=URL.createObjectURL(blob),a=node('a');a.href=url;a.download='estimation-mistral-pro-reno.pdf';document.body.append(a);a.click();a.remove();
  /* Navigateur intégré Facebook/Instagram : le téléchargement peut être bloqué, on propose l'ouverture directe. */
  if(/FBAN|FBAV|Instagram/i.test(navigator.userAgent)){var open=node('a','Ouvrir le PDF','estimate-button secondary');open.href=url;open.target='_blank';open.rel='noopener';$('download-pdf').after(open);}
  setTimeout(function(){URL.revokeObjectURL(url);},300000);track('estimation_pdf',{});}
 catch(e){error.textContent=e.message||'Téléchargement non confirmé.';}finally{busy=false;this.disabled=false;}});
/* Abandon : dernière étape vue, envoyé une fois à la sortie si aucune demande confirmée. */
var abandonSent=false;window.addEventListener('pagehide',function(){if(done||abandonSent||maxStep<1)return;abandonSent=true;track('estimation_abandon',{step:step,max_step:maxStep,transport_type:'beacon'});});
/* Choix de la page d'accueil (?projet=) */
var landing={'salle-de-bain':'Salle de bain','cuisine':'Cuisine','appartement':'Rénovation complète','maison':'Rénovation complète'}[F.params(search).projet];
if(landing){state.travaux=[landing];paint(document.getElementById('group-travaux'),'travaux');}
showStep(1,false);
}());
