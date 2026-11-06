(function(){
'use strict';
var BASE='https://facebook-ads-backend-s20a.onrender.com/public/site-estimates';
var form=document.getElementById('identity-form'),projectForm=document.getElementById('project-form'),message=document.getElementById('project-message');
var answer=document.getElementById('question-answer');
var session=null,identity=null,selected=[],history=[],prepared=new Map(),request=null,result=null,busy=false,pdfLib=null;
var categories=[],questions=[],answers=[],questionIndex=0,view='categories',previousView='categories',previousStep='project-step',orientation=0,sessionUsed=false;
var categoryInputs=Array.from(document.querySelectorAll('input[name="project-category"]'));
var preview=(location.protocol==='file:'||/^(localhost|127\.0\.0\.1)$/.test(location.hostname))&&new URLSearchParams(location.search).has('preview');
var attribution={};['utm_source','utm_medium','utm_campaign','utm_content','campaign_id','ad_group_id','ad_id'].forEach(function(k){var v=new URLSearchParams(location.search).get(k);if(v)attribution[k]=v;});
var money=new Intl.NumberFormat('fr-FR',{style:'currency',currency:'EUR',maximumFractionDigits:0});
function node(tag,text,cls){var el=document.createElement(tag);if(text!==undefined)el.textContent=text;if(cls)el.className=cls;return el;}
function step(id){document.getElementById('page-content').setAttribute('data-step',id);['identity-step','project-step','result-step'].forEach(function(x){document.getElementById(x).hidden=x!==id;});var index=['identity-step','project-step','result-step'].indexOf(id);document.querySelectorAll('.estimate-steps li').forEach(function(li,i){if(i===index)li.setAttribute('aria-current','step');else li.removeAttribute('aria-current');});}
function locked(){return !!(request&&request.uncertain);}
function setBusy(value){
 busy=value;
 document.querySelectorAll('.estimate-panel button,.estimate-panel input,.estimate-panel textarea').forEach(function(el){el.disabled=value||locked();});
 document.getElementById('retry-request').disabled=value;
 document.getElementById('uncertain-request').hidden=!locked();
 document.getElementById('project-submit').hidden=locked()||!['description','review'].includes(view);
 document.getElementById('project-submit').textContent=value?'Préparation en cours…':view==='review'?'Envoyer mes réponses →':'Préparer mon estimation →';
 document.getElementById('question-previous').disabled=value||locked()||questionIndex===0;
 // Hidden controls must not participate in native form validation.
 message.required=view==='description'&&!locked();
}
function showView(next,focus){
 view=next;
 document.getElementById('category-screen').hidden=!(view==='categories'||view==='description'&&!history.length);
 ['description','question','review','restart'].forEach(function(name){document.getElementById(name+'-screen').hidden=view!==name;});
 document.getElementById('project-attachments').hidden=!categories.length||!['description','question','review'].includes(view);
 document.getElementById('change-categories').hidden=!history.length||view==='restart';
 document.getElementById('project-title').textContent=view==='categories'?'Quels travaux envisagez-vous ?':view==='question'?'Précisons votre projet.':view==='review'?'Un point avant de continuer.':view==='restart'?'Une nouvelle orientation.':'À vous de nous raconter.';
 document.getElementById('project-error').textContent='';
 setBusy(busy);
 if(focus){var id={categories:'project-title',description:'project-prompt',question:'active-question',review:'review-title',restart:'restart-title'}[view];document.getElementById(id).focus();}
}
function prompt(){
 if(history.length)return 'Quelles précisions souhaitez-vous ajouter à votre projet : '+categories.join(' et ')+' ?';
 if(categories.length>1)return 'Que souhaitez-vous réaliser pour ces travaux : '+categories.join(' et ')+' ?';
 return {'Salle de bain':'Que souhaitez-vous changer dans votre salle de bain ?','Cuisine':'Que souhaitez-vous changer dans votre cuisine ?','Rénovation générale':'Quels travaux souhaitez-vous réaliser dans votre logement ?','Autre projet':'Quel est votre projet de travaux ?'}[categories[0]]||'Quel est votre projet de travaux ?';
}
function updatePrompt(){document.getElementById('project-prompt').textContent=prompt();message.placeholder=categories.length===1&&categories[0]==='Salle de bain'?'Par exemple : remplacer la baignoire par une douche, refaire le carrelage…':categories.length===1&&categories[0]==='Cuisine'?'Par exemple : changer les meubles, les revêtements, déplacer un évier…':'Décrivez les travaux, les pièces concernées et vos envies avec vos mots.';}
categoryInputs.forEach(function(input){input.addEventListener('change',function(){if(busy||locked()||history.length)return;categories=categoryInputs.filter(function(el){return el.checked;}).map(function(el){return el.value;});updatePrompt();showView(categories.length?'description':'categories',false);});});
function receipt(r){if(session&&r&&r.stored===true&&r.receipt===session.session_id){var p=document.getElementById('lead-receipt');p.textContent='Votre demande est enregistrée. Notre équipe pourra reprendre votre projet avec vous.';p.hidden=false;var status=document.getElementById('status-message');status.textContent='Votre demande est enregistrée. Notre équipe peut reprendre votre projet, même si l’estimation est interrompue.';status.hidden=false;return true;}return false;}
function errorText(code){return({invalid_contact:'Vérifiez vos coordonnées et le code postal du projet en Île-de-France.',session_expired:'Votre session a expiré. Vos informations sont conservées sur cette page. Contactez notre équipe au 07 55 18 89 37 pour reprendre votre projet.',invalid_pdf:'Le PDF original n’est pas lisible ou dépasse les limites de pages. Ajoutez un PDF valide ou des photos.',document_validation_busy:'Des documents sont déjà en cours de vérification. Patientez puis réessayez.',file_not_analyzed:'Un document n’a pas pu être analysé. Retirez-le ou ajoutez ses pages en photos lisibles.',files_too_large:'Les pièces jointes dépassent les limites indiquées.',invalid_file:'Un fichier n’est pas un JPEG, PNG ou PDF valide.',generation_uncertain:'La génération n’est pas confirmée. Votre saisie et vos fichiers sont conservés. Vérifiez à nouveau exactement cette demande, ou contactez notre équipe.',daily_limit:'Le service a atteint sa capacité du jour. Notre équipe peut reprendre votre demande.',storage_capacity:'Votre demande est enregistrée. Les pièces jointes n’ont pas pu être conservées ; notre équipe peut les récupérer avec vous.',session_capacity:'L’assistant accueille déjà de nombreux projets. Contactez notre équipe au 07 55 18 89 37.',pdf_busy:'Un téléchargement est déjà en préparation. Patientez avant de réessayer.',session_limit:'Vous avez atteint la limite de cette estimation. Notre équipe peut vous accompagner.',estimate_service_unavailable:'L’assistant est momentanément indisponible. Contactez-nous au 07 55 18 89 37.'})[code]||'L’opération n’est pas confirmée. Votre saisie est conservée sur cette page.';}
function uncertain(){return Object.assign(new Error(errorText('generation_uncertain')),{code:'generation_uncertain'});}
async function call(path,body,token){var response;try{response=await fetch(BASE+path,{method:'POST',headers:Object.assign({'Content-Type':'application/json'},token?{'X-Estimate-Token':token}:{}),body:JSON.stringify(body),signal:AbortSignal.timeout(115000),credentials:'omit',redirect:'error'});}catch(e){throw uncertain();}var data;try{data=await response.json();}catch(e){throw uncertain();}if(!data||typeof data!=='object')throw uncertain();if(!response.ok){if(data.receipt)receipt(data.receipt);throw Object.assign(new Error(errorText(data.error||'generation_uncertain')),{code:data.error||'generation_uncertain'});}return data;}
form.addEventListener('submit',async function(e){e.preventDefault();if(busy||locked()||!form.reportValidity())return;var error=document.getElementById('identity-error');error.textContent='';var data=Object.fromEntries(new FormData(form));var trap=data.website||form.elements.website.value;delete data.website;data.contact_consent=form.elements.contact_consent.checked;
 if(preview){identity=data;step('project-step');showView(view,true);return;}
 if(sessionUsed&&JSON.stringify(identity)===JSON.stringify(data)){step('project-step');showView(view,true);return;}
 if(sessionUsed){error.textContent='Pour corriger vos coordonnées après le début de l’estimation, contactez notre équipe au 07 55 18 89 37.';return;}
 setBusy(true);try{if(!session||JSON.stringify(identity)!==JSON.stringify(data)){var created=await call('/sessions',{contact:data,website:trap,attribution:attribution});if(!/^[0-9a-f-]{36}$/.test(created.session_id||'')||!/^[0-9a-f]{64}$/.test(created.token||''))throw new Error('Connexion du projet non confirmée.');session=created;identity=data;request=null;}step('project-step');showView(view,true);}catch(e){error.textContent=e.message;}finally{setBusy(false);}
});
document.getElementById('edit-identity').onclick=function(){if(!busy&&!locked())step('identity-step');};
function filesList(){var list=document.getElementById('file-list');list.replaceChildren();selected.forEach(function(f){var li=node('li'),label=node('span',f.file.name+' · '+Math.ceil(f.file.size/1024)+' Ko · '+(prepared.has(f.id)?'Prêt pour l’analyse':'À analyser'));var button=node('button','Retirer');button.type='button';button.disabled=busy||locked();button.setAttribute('aria-label','Retirer '+f.file.name);button.onclick=function(){if(busy||locked())return;selected=selected.filter(function(x){return x.id!==f.id;});prepared.delete(f.id);request=null;filesList();};li.append(label,button);list.append(li);});}
document.getElementById('project-files').addEventListener('change',function(){if(busy||locked())return;var error=document.getElementById('project-error');error.textContent='';var next=selected.slice();for(var file of this.files){if(!['image/jpeg','image/png','application/pdf'].includes(file.type)){error.textContent=errorText('invalid_file');continue;}if(next.some(function(x){return x.file.name===file.name&&x.file.size===file.size&&x.file.lastModified===file.lastModified;}))continue;next.push({id:crypto.randomUUID(),file:file});}if(next.length>5||next.reduce(function(n,x){return n+x.file.size;},0)>8388608){error.textContent=errorText('files_too_large');this.value='';return;}selected=next;this.value='';request=null;filesList();});
function base64(buffer){var bytes=new Uint8Array(buffer),parts=[];for(var i=0;i<bytes.length;i+=16384)parts.push(String.fromCharCode.apply(null,bytes.subarray(i,i+16384)));return btoa(parts.join(''));}
async function photo(file){var bitmap=await createImageBitmap(file);try{var scale=Math.min(1,1400/Math.max(bitmap.width,bitmap.height)),canvas=document.createElement('canvas');canvas.width=Math.max(1,Math.round(bitmap.width*scale));canvas.height=Math.max(1,Math.round(bitmap.height*scale));var ctx=canvas.getContext('2d');ctx.fillStyle='#ffffff';ctx.fillRect(0,0,canvas.width,canvas.height);ctx.drawImage(bitmap,0,0,canvas.width,canvas.height);return{media_type:'image/jpeg',data:canvas.toDataURL('image/jpeg',.76).split(',')[1]};}finally{bitmap.close();}}
async function pdfPages(buffer){if(!pdfLib){pdfLib=await import('https://cdn.jsdelivr.net/npm/pdfjs-dist@4.10.38/build/pdf.min.mjs');pdfLib.GlobalWorkerOptions.workerSrc='https://cdn.jsdelivr.net/npm/pdfjs-dist@4.10.38/build/pdf.worker.min.mjs';}var task=pdfLib.getDocument({data:new Uint8Array(buffer.slice(0)),isEvalSupported:false,disableAutoFetch:true,disableStream:true});var pdf=await task.promise;try{if(pdf.numPages>5)throw new Error('Ce PDF contient plus de 5 pages. Ajoutez uniquement les pages utiles à votre projet.');var out=[];for(var i=1;i<=pdf.numPages;i++){var page=await pdf.getPage(i),view=page.getViewport({scale:1}),scale=Math.min(1.5,1400/Math.max(view.width,view.height)),viewport=page.getViewport({scale:scale}),canvas=document.createElement('canvas');canvas.width=Math.ceil(viewport.width);canvas.height=Math.ceil(viewport.height);await page.render({canvasContext:canvas.getContext('2d'),viewport:viewport}).promise;out.push({media_type:'image/jpeg',data:canvas.toDataURL('image/jpeg',.76).split(',')[1]});page.cleanup();}return out;}finally{await pdf.destroy();}}
async function prepareFiles(){var out=[],imageCount=0;for(var item of selected){if(!prepared.has(item.id)){var b=await item.file.arrayBuffer(),images=item.file.type==='application/pdf'?await pdfPages(b):[await photo(item.file)];prepared.set(item.id,{id:item.id,name:item.file.name,type:item.file.type,data:base64(b),page_count:images.length,images:images});}var f=prepared.get(item.id);imageCount+=f.images.length;if(imageCount>12)throw new Error('Trop de pages à analyser ensemble. Gardez au maximum 12 pages ou photos.');out.push(f);}filesList();return out;}
function render(e){var target=document.getElementById('estimate-result');target.replaceChildren();var budget=node('div',undefined,'estimate-budget');budget.append(node('strong',money.format(e.range_ttc.low)+' à '+money.format(e.range_ttc.high)),node('p','TTC indicatif · fourchette de préparation (±20 %)'));target.append(budget);var table=node('table',undefined,'estimate-table'),head=node('thead'),row=node('tr');['Travaux estimés','Quantité','Montant HT'].forEach(function(t){row.append(node('th',t));});head.append(row);table.append(head);var tbody=node('tbody');e.sections.forEach(function(s){var lot=node('tr',undefined,'estimate-section-row'),cell=node('th',s.titre);cell.colSpan=3;lot.append(cell);tbody.append(lot);s.items.forEach(function(it){var r=node('tr');r.append(node('td',it.designation),node('td',it.quantite+' '+it.unite),node('td',money.format(it._total_ht)));tbody.append(r);});});table.append(tbody);target.append(table,node('p','Total de référence : '+money.format(e.totals.total_ttc)+' TTC.'));var list=node('ul',undefined,'estimate-assumptions');e.assumptions.forEach(function(s){list.append(node('li',s));});target.append(node('h3','Hypothèses et points à confirmer'),list);if(e.questions&&e.questions.length){target.append(node('h3','Questions à confirmer'));var questions=node('ul',undefined,'estimate-assumptions');e.questions.forEach(function(q){questions.append(node('li',q));});target.append(questions);}}

function validQuestions(list){return Array.isArray(list)&&list.length>0&&list.length<=4&&list.every(function(q){return typeof q==='string'&&q.trim().length>0;});}
function showQuestion(focus){
 document.getElementById('question-counter').textContent='Question '+(questionIndex+1)+' sur '+questions.length;
 document.getElementById('active-question').textContent=questions[questionIndex];
 answer.value=answers[questionIndex]||'';
 document.getElementById('question-next').textContent=questionIndex===questions.length-1?'Vérifier mes réponses →':'Suivant →';
 showView('question',focus);
}
function saveAnswer(){answers[questionIndex]=answer.value;}
function review(focus){var list=document.getElementById('answers-review');list.replaceChildren();questions.forEach(function(q,i){list.append(node('dt',q),node('dd',answers[i]));});showView('review',focus);}
function beginQuestions(list){questions=list.slice();answers=new Array(questions.length).fill('');questionIndex=0;answer.value='';showQuestion(true);}
answer.addEventListener('input',function(){if(!busy&&!locked()&&view==='question')saveAnswer();});
document.getElementById('question-next').onclick=function(){if(busy||locked()||view!=='question')return;if(!answer.value.trim()){document.getElementById('project-error').textContent='Ajoutez une réponse ou choisissez « Je ne sais pas ».';answer.focus();return;}saveAnswer();if(questionIndex<questions.length-1){questionIndex++;showQuestion(true);}else review(true);};
document.getElementById('question-previous').onclick=function(){if(busy||locked()||view!=='question'||questionIndex===0)return;saveAnswer();questionIndex--;showQuestion(true);};
document.getElementById('question-unknown').onclick=function(){if(busy||locked()||view!=='question')return;answer.value='Je ne sais pas.';document.getElementById('question-next').onclick();};
document.getElementById('review-answers').onclick=function(){if(busy||locked()||view!=='review')return;questionIndex=0;showQuestion(true);};
function requestRestart(){if(busy||locked()||!history.length)return;previousView=view;previousStep=document.getElementById('result-step').hidden?'project-step':'result-step';step('project-step');showView('restart',true);}
document.getElementById('change-categories').onclick=requestRestart;
document.getElementById('restart-project').onclick=requestRestart;
document.getElementById('cancel-restart').onclick=function(){if(busy||locked()||view!=='restart')return;showView(previousView,false);step(previousStep);document.getElementById(previousStep==='result-step'?'continue-project':'project-title').focus();};
document.getElementById('confirm-restart').onclick=function(){
 if(busy||locked()||view!=='restart')return;
 orientation++;history=[];questions=[];answers=[];questionIndex=0;request=null;result=null;categories=[];message.value='';answer.value='';
 categoryInputs.forEach(function(input){input.checked=false;});
 document.getElementById('answers-review').replaceChildren();document.getElementById('estimate-result').replaceChildren();
 document.getElementById('project-attachments').open=false;
 updatePrompt();showView('categories',true);
};
function projectText(turn){
 var prefix='Catégories de travaux choisies : '+categories.join(' ; ')+'.';
 if(orientation)prefix='NOUVELLE ORIENTATION DU PROJET n°'+orientation+' : les catégories et informations ci-dessous remplacent le projet et les questionnaires antérieurs conservés dans cette session. Ignorez les anciennes catégories, anciennes réponses et anciennes estimations ; utilisez uniquement cette nouvelle orientation et ses précisions. Ne reprenez pas un questionnaire antérieur.\n\n'+prefix;
 return prefix+'\n\n'+history.concat(turn).join('\n\nPrécisions du visiteur :\n');
}
async function generate(retry){
 if(busy)return;
 var error=document.getElementById('project-error');error.textContent='';
 if(locked()&&!retry)return;
 if(preview){error.textContent='Aperçu de conception : aucun appel IA, envoi de demande ou téléchargement réel.';return;}
 if(!session){step('identity-step');return;}
 var turn,combined;
 if(!retry){
  if(!categories.length||!['description','review'].includes(view))return;
  if(view==='description'){
   if(!message.reportValidity()||!message.value.trim())return;
   turn=prompt()+'\nRéponse du visiteur : '+message.value.trim();
  }else{
   if(!validQuestions(questions)||answers.some(function(a){return !a.trim();})){error.textContent='Vérifiez vos réponses avant de les envoyer.';return;}
   turn='Réponses au questionnaire :\n'+questions.map(function(q,i){return 'Question : '+q+'\nRéponse : '+answers[i].trim();}).join('\n\n');
  }
  combined=projectText(turn);
  if(combined.length>18000){error.textContent='Votre projet est trop long. Résumez les dernières précisions.';return;}
 }else if(!locked())return;
 setBusy(true);
 try{
  if(!retry){var files=await prepareFiles();request={id:crypto.randomUUID(),snapshot:JSON.stringify({project:combined,files:files}),turn:turn,uncertain:false};}
  var sentRequest=request;
  var snapshot=JSON.parse(sentRequest.snapshot);
  sessionUsed=true;
  var data=await call('/sessions/'+session.session_id+'/generate',{request_id:sentRequest.id,project:snapshot.project,files:snapshot.files},session.token);
  // No local navigation/edit may replace the in-flight request.
  if(request!==sentRequest)throw uncertain();
  receipt(data.receipt);
  if(data.state==='questions'){
   if(!validQuestions(data.questions))throw uncertain();
   history.push(sentRequest.turn);message.value='';request=null;result=null;beginQuestions(data.questions);
  }else if(data.state==='estimated'&&data.estimate_id===session.session_id){
   // Render before accepting the turn so malformed responses keep their snapshot.
   render(data);history.push(sentRequest.turn);message.value='';request=null;result=data;questions=[];answers=[];answer.value='';
   document.getElementById('status-message').hidden=true;step('result-step');document.getElementById('download-pdf').focus();
  }else throw uncertain();
 }catch(e){
  if(request){if(e.code&&e.code!=='generation_uncertain')request=null;else request.uncertain=true;}
  error.textContent=e.message||errorText('generation_uncertain');
 }finally{setBusy(false);}
}
projectForm.addEventListener('submit',function(e){e.preventDefault();if(!busy&&!locked())return generate(false);});
document.getElementById('retry-request').onclick=function(){return generate(true);};
document.getElementById('continue-project').onclick=function(){
 if(busy||locked()||!result)return;
 step('project-step');
 if(validQuestions(result.questions))beginQuestions(result.questions);
 else{questions=[];answers=[];answer.value='';message.value='';updatePrompt();showView('description',true);}
};
document.getElementById('download-pdf').onclick=async function(){if(busy||!session||!result)return;var error=document.getElementById('result-error');error.textContent='';setBusy(true);try{var r=await fetch(BASE+'/sessions/'+session.session_id+'/pdf',{method:'POST',headers:{'Content-Type':'application/json','X-Estimate-Token':session.token},body:'{}',signal:AbortSignal.timeout(115000),credentials:'omit',redirect:'error'});if(!r.ok||!(r.headers.get('content-type')||'').startsWith('application/pdf'))throw new Error('Le PDF n’a pas pu être généré. Votre demande reste enregistrée.');var blob=await r.blob();if(new TextDecoder().decode(await blob.slice(0,5).arrayBuffer())!=='%PDF-')throw new Error('Le fichier reçu n’est pas un PDF valide.');var url=URL.createObjectURL(blob),a=node('a');a.href=url;a.download='estimation-mistral-pro-reno.pdf';a.click();setTimeout(function(){URL.revokeObjectURL(url);},60000);}catch(e){error.textContent=e.message||'Téléchargement non confirmé.';}finally{setBusy(false);}};
showView('categories',false);
if(preview){document.getElementById('preview-note').hidden=false;if(new URLSearchParams(location.search).get('preview')==='conversation')step('project-step');}
}());
