(function(){
'use strict';
var BASE='https://facebook-ads-backend-s20a.onrender.com/public/site-estimates';
var engine=window.MPRQuestionnaire;
if(!engine)return;
var form=document.getElementById('identity-form'),projectForm=document.getElementById('project-form'),message=document.getElementById('project-message'),answer=document.getElementById('question-answer');
var session=null,identity=null,selected=[],history=[],acceptedQA=[],prepared=new Map(),request=null,result=null,busy=false,pdfLib=null;
var categories=[],manualCategories=false,localAnswers={},localQueue=[],localIndex=0,questions=[],answers=[],questionIndex=0;
var view='entry',resumeView='local',reviewMode='local',previousView='entry',orientation=0,sessionUsed=false,editingOrientation=false,entrySummarized=false;
var debounce=null,categoryKey='',lastChoiceAt=0,refinement='',entrySignature=null,autofillTimer=null,autofillTicks=0;
var categoryInputs=Array.from(document.querySelectorAll('input[name="project-category"]'));
var contactNames=['first_name','last_name','phone','email','address','postal_code','city'];
var preview=(location.protocol==='file:'||/^(localhost|127\.0\.0\.1)$/.test(location.hostname))&&new URLSearchParams(location.search).has('preview');
var attribution={};['utm_source','utm_medium','utm_campaign','utm_content','campaign_id','ad_group_id','ad_id'].forEach(function(k){var v=new URLSearchParams(location.search).get(k);if(v)attribution[k]=v;});
var money=new Intl.NumberFormat('fr-FR',{style:'currency',currency:'EUR',maximumFractionDigits:0});
function node(tag,text,cls){var el=document.createElement(tag);if(text!==undefined)el.textContent=text;if(cls)el.className=cls;return el;}
function locked(){return !!(request&&request.uncertain);}
function contact(){var data={};contactNames.forEach(function(name){data[name]=String(form.elements[name].value||'').trim();});return data;}
function contactValid(data){
 if(!contactNames.every(function(name){return data[name].length>0;} ))return false;
 var phone=data.phone.replace(/[\s().-]/g,'');
 if(!/^(?:0[1-9]\d{8}|\+33[1-9]\d{8}|0033[1-9]\d{8})$/.test(phone))return false;
 if(!/^(75|77|78|91|92|93|94|95)\d{3}$/.test(data.postal_code)||!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email))return false;
 return contactNames.every(function(name){var input=form.elements[name];return typeof input.checkValidity!=='function'||input.checkValidity();});
}
function entryValid(){return contactValid(sessionUsed?identity:contact())&&!!(categories.length||message.value.trim());}
function trades(){return categories.length?categories:['Autre projet'];}
function currentLocal(){return localQueue[localIndex];}
function localDone(){return localQueue.length>0&&localQueue.every(function(q){return engine.answered(q,localAnswers[q.id]);});}
function syncControls(){
 document.querySelectorAll('.estimate-panel button,.estimate-panel input,.estimate-panel textarea').forEach(function(el){el.disabled=busy||locked();});
 contactNames.concat(['website']).forEach(function(name){form.elements[name].disabled=busy||locked()||sessionUsed;});
 message.disabled=busy||locked()||sessionUsed&&!editingOrientation;
 categoryInputs.forEach(function(el){el.disabled=busy||locked()||sessionUsed&&!editingOrientation;});
 var retry=document.getElementById('retry-request');retry.disabled=busy;retry.hidden=!!(request&&request.phase==='session');
 document.getElementById('uncertain-request').hidden=!locked();
 document.getElementById('uncertain-copy').textContent=request&&request.phase==='session'?'La connexion de votre projet n’est pas confirmée. Vos informations et fichiers sont conservés. Aucun nouvel envoi n’est lancé. Contactez notre équipe au 07 55 18 89 37 pour reprendre cette demande.':'La réponse du service n’est pas confirmée. Vos informations et fichiers sont conservés. La modification du projet est suspendue ; vous pouvez vérifier à nouveau exactement la même demande.';
 document.getElementById('project-submit').hidden=locked()||view!=='review';
 document.getElementById('project-submit').textContent=busy?'Préparation en cours…':'Obtenir mon estimation →';
 document.getElementById('question-previous').disabled=busy||locked()||questionIndex===0;
 // Local/AI fields are validated only when their own visible action is used.
 message.required=false;answer.required=false;
}
function setBusy(value){busy=value;syncControls();}
function showView(next,focus){
 view=next;var isResult=view==='result';
 document.getElementById('identity-step').hidden=isResult;
 document.getElementById('project-step').hidden=view==='entry'||isResult;
 document.getElementById('result-step').hidden=!isResult;
 document.getElementById('page-content').setAttribute('data-step',isResult?'result-step':entrySummarized&&view!=='entry'?'project-step':'identity-step');
 ['local','question','review','restart','refine'].forEach(function(name){document.getElementById(name+'-screen').hidden=view!==name;});
 document.getElementById('project-attachments').hidden=!['local','question','review','refine'].includes(view);
 document.getElementById('change-categories').hidden=!sessionUsed||view==='restart';
 document.getElementById('project-title').textContent=view==='local'?'Vos travaux':view==='review'?'Votre estimation':view==='restart'?'Une nouvelle orientation.':'Précisons votre projet.';
 document.querySelectorAll('.estimate-steps li').forEach(function(li,i){if(i===(isResult?2:view==='entry'?0:1))li.setAttribute('aria-current','step');else li.removeAttribute('aria-current');});
 document.getElementById('project-error').textContent='';syncControls();
 if(focus){var id={local:'local-question',question:'active-question',review:'review-title',restart:'restart-title',refine:'refine-label',entry:'panel-title',result:'download-pdf'}[view];document.getElementById(id).focus();}
}
function summary(){var data=sessionUsed?identity:contact();document.getElementById('entry-summary').textContent=entrySummarized?(categories.join(' / ')||'Votre projet')+' · '+data.first_name+' '+data.last_name+' · '+data.city+' — Voir les informations':'Votre projet et vos coordonnées';}
function reconcile(){var old=currentLocal(),id=old&&old.id;localAnswers=engine.prune(trades(),localAnswers);localQueue=engine.queue(trades(),localAnswers);var found=localQueue.findIndex(function(q){return q.id===id;});localIndex=found>=0?found:Math.max(0,localQueue.findIndex(function(q){return !engine.answered(q,localAnswers[q.id]);}));}
function inputSignature(){return JSON.stringify({contact:contact(),project:message.value,categories:categoryInputs.filter(function(input){return input.checked;}).map(function(input){return input.value;}),manual:manualCategories});}
function evaluateEntry(){
 if(busy||locked()||sessionUsed&&!editingOrientation)return;
 var signature=inputSignature();if(signature===entrySignature)return;
 if(!manualCategories){categories=engine.detect(message.value);categoryInputs.forEach(function(input){input.checked=categories.includes(input.value);});}
 var detected=document.getElementById('category-detection');detected.hidden=!categories.length&&!manualCategories;detected.textContent=manualCategories?(categories.length?'Votre choix : '+categories.join(' / ')+'.':''):'Repéré dans votre texte : '+categories.join(' / ')+'.';
 entrySignature=inputSignature();
 var nextKey=JSON.stringify(categories),changed=nextKey!==categoryKey;
 if(changed||!localQueue.length){reconcile();categoryKey=nextKey;}
 summary();
 var eligible=entryValid();
 if(!eligible){if(['local','review'].includes(view)){resumeView=view;showView('entry',false);}return;}
 if(view==='entry'){if(resumeView==='review'&&localDone()){reviewMode='local';renderReview(false);}else showLocal(false);}
 else if(view==='local'&&changed)showLocal(false);
 else if(view==='review'){if(!localDone()){localIndex=Math.max(0,localQueue.findIndex(function(q){return !engine.answered(q,localAnswers[q.id]);}));showLocal(false);}else renderReview(false);}
}
function scheduleEntry(){if(debounce!==null)clearTimeout(debounce);debounce=setTimeout(function(){debounce=null;evaluateEntry();},300);}
form.addEventListener('input',scheduleEntry);
form.addEventListener('change',evaluateEntry);
form.addEventListener('focusout',evaluateEntry);
function watchAutofill(){if(autofillTimer!==null)clearInterval(autofillTimer);autofillTicks=0;evaluateEntry();autofillTimer=setInterval(function(){evaluateEntry();autofillTicks++;if(autofillTicks>=75){clearInterval(autofillTimer);autofillTimer=null;}},800);}
form.addEventListener('focusin',watchAutofill);
window.addEventListener('pageshow',watchAutofill);
form.addEventListener('submit',function(e){e.preventDefault();evaluateEntry();});
categoryInputs.forEach(function(input){input.addEventListener('change',function(){if(busy||locked()||sessionUsed&&!editingOrientation)return;manualCategories=true;categories=categoryInputs.filter(function(el){return el.checked;}).map(function(el){return el.value;});evaluateEntry();});});
document.getElementById('edit-identity').onclick=function(){if(busy||locked())return;document.getElementById('entry-details').open=true;if(sessionUsed)document.getElementById('identity-error').textContent='Pour corriger vos coordonnées après le début de l’estimation, contactez notre équipe au 07 55 18 89 37.';document.getElementById('panel-title').focus();};
function summarizeEntry(){if(entrySummarized)return;entrySummarized=true;document.getElementById('entry-details').open=false;summary();}
function acceptAdvance(){var now=Date.now();if(now-lastChoiceAt<300)return false;lastChoiceAt=now;return true;}
function showLocal(focus){
 var q=currentLocal();if(!q)return;var options=document.getElementById('local-options');options.replaceChildren();
 document.getElementById('local-counter').textContent=(categories.length?q.trade:'Votre projet')+' · Question '+(localIndex+1)+' sur '+localQueue.length;
 document.getElementById('local-question').textContent=q.label;
 q.options.forEach(function(o){var button=node('button',o.label,'estimate-local-choice');button.type='button';button.setAttribute('aria-pressed',q.type==='multi'?String(Array.isArray(localAnswers[q.id])&&localAnswers[q.id].includes(o.value)):String(localAnswers[q.id]===o.value));button.onclick=function(){
  if(busy||locked()||view!=='local'||!currentLocal()||currentLocal().id!==q.id)return;
  if(q.type==='single'){if(!acceptAdvance())return;localAnswers[q.id]=o.value;advanceLocal(q.id);}
  else{var values=Array.isArray(localAnswers[q.id])?localAnswers[q.id].slice():[];if(values.includes(o.value))values=values.filter(function(v){return v!==o.value;});else{if(['none','keep','whole'].includes(o.value))values=[];else values=values.filter(function(v){return !['none','keep','whole'].includes(v);});values.push(o.value);}localAnswers[q.id]=values;reconcile();showLocal(false);}
 };options.append(button);});
 var number=document.getElementById('local-value'),text=document.getElementById('local-text');number.hidden=q.type!=='number';text.hidden=q.type!=='text';document.getElementById('local-value-label').hidden=q.type!=='number';number.placeholder=localAnswers[q.id]===engine.UNKNOWN?'Je ne sais pas (réponse conservée)':'Ex. 6';text.placeholder=localAnswers[q.id]===engine.UNKNOWN?'Je ne sais pas (réponse conservée)':'Votre réponse…';number.value=q.type==='number'&&localAnswers[q.id]!==engine.UNKNOWN?localAnswers[q.id]||'':'';text.value=q.type==='text'&&localAnswers[q.id]!==engine.UNKNOWN?localAnswers[q.id]||'':'';
 document.getElementById('local-next').hidden=q.type==='single';showView('local',focus);
}
function saveLocalDraft(edited){var q=currentLocal();if(!q)return;var input=q.type==='number'?document.getElementById('local-value'):q.type==='text'?document.getElementById('local-text'):null;if(input&&(edited||input.value!==''||localAnswers[q.id]!==engine.UNKNOWN))localAnswers[q.id]=input.value;}
function advanceLocal(id){reconcile();var index=localQueue.findIndex(function(q){return q.id===id;});summarizeEntry();if(index<localQueue.length-1){localIndex=index+1;showLocal(true);}else{reviewMode='local';renderReview(true);}}
document.getElementById('local-next').onclick=function(){if(busy||locked()||view!=='local')return;var now=Date.now();if(now-lastChoiceAt<300)return;saveLocalDraft();var q=currentLocal();if(!engine.answered(q,localAnswers[q.id])){document.getElementById('project-error').textContent='Ajoutez une réponse valide ou choisissez « Je ne sais pas ».';return;}if(acceptAdvance())advanceLocal(q.id);};
document.getElementById('local-unknown').onclick=function(){if(busy||locked()||view!=='local'||!acceptAdvance())return;var q=currentLocal();localAnswers[q.id]=engine.UNKNOWN;advanceLocal(q.id);};
document.getElementById('local-previous').onclick=function(){if(busy||locked()||view!=='local')return;saveLocalDraft();if(localIndex>0){localIndex--;showLocal(true);}else{document.getElementById('entry-details').open=true;document.getElementById('panel-title').focus();}};
document.getElementById('local-value').addEventListener('input',function(){if(!busy&&!locked()&&view==='local')saveLocalDraft(true);});
document.getElementById('local-text').addEventListener('input',function(){if(!busy&&!locked()&&view==='local')saveLocalDraft(true);});
function localQA(){return localQueue.filter(function(q){return engine.answered(q,localAnswers[q.id]);}).map(function(q){return{question:q.label,answer:engine.format(q,localAnswers[q.id]),trade:q.trade};});}
function renderReview(focus){
 var data=sessionUsed?identity:contact();document.getElementById('review-contact').textContent=data.first_name+' '+data.last_name+' · '+data.phone+' · '+data.email+' · '+data.address+', '+data.postal_code+' '+data.city;
 document.getElementById('review-categories').textContent=categories.length?'Catégories : '+categories.join(' / '):'Catégorie à préciser (projet décrit librement).';
 document.getElementById('review-description').textContent=message.value.trim()||'Projet indiqué par les catégories choisies.';
 var list=document.getElementById('answers-review');list.replaceChildren();localQA().concat(acceptedQA,reviewMode==='ai'?questions.map(function(q,i){return{question:q,answer:answers[i]};}):reviewMode==='refine'?[{question:'Précision complémentaire',answer:refinement}]:[]).forEach(function(item){list.append(node('dt',(item.trade?item.trade+' — ':'')+item.question),node('dd',item.answer));});
 var files=document.getElementById('review-files');files.replaceChildren();if(!selected.length)files.append(node('li','Aucune pièce jointe.'));selected.forEach(function(item){files.append(node('li',item.file.name));});
 showView('review',focus);
}
document.getElementById('review-answers').onclick=function(){if(busy||locked()||view!=='review')return;if(reviewMode==='ai'){questionIndex=0;showQuestion(true);}else if(reviewMode==='refine')showView('refine',true);else{localIndex=0;showLocal(true);}};
function filesList(){var list=document.getElementById('file-list');list.replaceChildren();selected.forEach(function(f){var li=node('li'),label=node('span',f.file.name+' · '+Math.ceil(f.file.size/1024)+' Ko · '+(prepared.has(f.id)?'Prêt pour l’analyse':'À analyser'));var button=node('button','Retirer');button.type='button';button.disabled=busy||locked();button.setAttribute('aria-label','Retirer '+f.file.name);button.onclick=function(){if(busy||locked())return;selected=selected.filter(function(x){return x.id!==f.id;});prepared.delete(f.id);request=null;filesList();};li.append(label,button);list.append(li);});if(view==='review')renderReview(false);}
document.getElementById('project-files').addEventListener('change',function(){if(busy||locked())return;var error=document.getElementById('project-error');error.textContent='';var next=selected.slice();for(var file of this.files){if(!['image/jpeg','image/png','application/pdf'].includes(file.type)){error.textContent=errorText('invalid_file');continue;}if(next.some(function(x){return x.file.name===file.name&&x.file.size===file.size&&x.file.lastModified===file.lastModified;}))continue;next.push({id:crypto.randomUUID(),file:file});}if(next.length>5||next.reduce(function(n,x){return n+x.file.size;},0)>8388608){error.textContent=errorText('files_too_large');this.value='';return;}selected=next;this.value='';request=null;filesList();});
function receipt(r){if(session&&r&&r.stored===true&&r.receipt===session.session_id){var p=document.getElementById('lead-receipt');p.textContent='Votre demande est enregistrée. Notre équipe pourra reprendre votre projet avec vous.';p.hidden=false;var status=document.getElementById('status-message');status.textContent='Votre demande est enregistrée. Notre équipe peut reprendre votre projet, même si l’estimation est interrompue.';status.hidden=false;return true;}return false;}
function errorText(code){return({invalid_contact:'Vérifiez vos coordonnées et le code postal du projet en Île-de-France.',session_expired:'Votre session a expiré. Vos informations sont conservées sur cette page. Contactez notre équipe au 07 55 18 89 37 pour reprendre votre projet.',invalid_pdf:'Le PDF original n’est pas lisible ou dépasse les limites de pages. Ajoutez un PDF valide ou des photos.',document_validation_busy:'Des documents sont déjà en cours de vérification. Patientez puis réessayez.',file_not_analyzed:'Un document n’a pas pu être analysé. Retirez-le ou ajoutez ses pages en photos lisibles.',files_too_large:'Les pièces jointes dépassent les limites indiquées.',invalid_file:'Un fichier n’est pas un JPEG, PNG ou PDF valide.',generation_uncertain:'La génération n’est pas confirmée. Votre saisie et vos fichiers sont conservés. Vérifiez à nouveau exactement cette demande, ou contactez notre équipe.',daily_limit:'Le service a atteint sa capacité du jour. Notre équipe peut reprendre votre demande.',storage_capacity:'Votre demande est enregistrée. Les pièces jointes n’ont pas pu être conservées ; notre équipe peut les récupérer avec vous.',session_capacity:'L’assistant accueille déjà de nombreux projets. Contactez notre équipe au 07 55 18 89 37.',pdf_busy:'Un téléchargement est déjà en préparation. Patientez avant de réessayer.',session_limit:'Vous avez atteint la limite de cette estimation. Notre équipe peut vous accompagner.',estimate_service_unavailable:'L’assistant est momentanément indisponible. Contactez-nous au 07 55 18 89 37.'})[code]||'L’opération n’est pas confirmée. Votre saisie est conservée sur cette page.';}
function uncertain(){return Object.assign(new Error(errorText('generation_uncertain')),{code:'generation_uncertain'});}
async function call(path,body,token){var response;try{response=await fetch(BASE+path,{method:'POST',headers:Object.assign({'Content-Type':'application/json'},token?{'X-Estimate-Token':token}:{}),body:JSON.stringify(body),signal:AbortSignal.timeout(115000),credentials:'omit',redirect:'error'});}catch(e){throw uncertain();}var data;try{data=await response.json();}catch(e){throw uncertain();}if(!data||typeof data!=='object')throw uncertain();if(!response.ok){if(data.receipt)receipt(data.receipt);throw Object.assign(new Error(errorText(data.error||'generation_uncertain')),{code:data.error||'generation_uncertain'});}return data;}
function base64(buffer){var bytes=new Uint8Array(buffer),parts=[];for(var i=0;i<bytes.length;i+=16384)parts.push(String.fromCharCode.apply(null,bytes.subarray(i,i+16384)));return btoa(parts.join(''));}
async function photo(file){var bitmap=await createImageBitmap(file);try{var scale=Math.min(1,1400/Math.max(bitmap.width,bitmap.height)),canvas=document.createElement('canvas');canvas.width=Math.max(1,Math.round(bitmap.width*scale));canvas.height=Math.max(1,Math.round(bitmap.height*scale));var ctx=canvas.getContext('2d');ctx.fillStyle='#ffffff';ctx.fillRect(0,0,canvas.width,canvas.height);ctx.drawImage(bitmap,0,0,canvas.width,canvas.height);return{media_type:'image/jpeg',data:canvas.toDataURL('image/jpeg',.76).split(',')[1]};}finally{bitmap.close();}}
async function pdfPages(buffer){if(!pdfLib){pdfLib=await import('https://cdn.jsdelivr.net/npm/pdfjs-dist@4.10.38/build/pdf.min.mjs');pdfLib.GlobalWorkerOptions.workerSrc='https://cdn.jsdelivr.net/npm/pdfjs-dist@4.10.38/build/pdf.worker.min.mjs';}var task=pdfLib.getDocument({data:new Uint8Array(buffer.slice(0)),isEvalSupported:false,disableAutoFetch:true,disableStream:true});var pdf=await task.promise;try{if(pdf.numPages>5)throw new Error('Ce PDF contient plus de 5 pages. Ajoutez uniquement les pages utiles à votre projet.');var out=[];for(var i=1;i<=pdf.numPages;i++){var page=await pdf.getPage(i),view=page.getViewport({scale:1}),scale=Math.min(1.5,1400/Math.max(view.width,view.height)),viewport=page.getViewport({scale:scale}),canvas=document.createElement('canvas');canvas.width=Math.ceil(viewport.width);canvas.height=Math.ceil(viewport.height);await page.render({canvasContext:canvas.getContext('2d'),viewport:viewport}).promise;out.push({media_type:'image/jpeg',data:canvas.toDataURL('image/jpeg',.76).split(',')[1]});page.cleanup();}return out;}finally{await pdf.destroy();}}
async function prepareFiles(){var out=[],imageCount=0;for(var item of selected){if(!prepared.has(item.id)){var b=await item.file.arrayBuffer(),images=item.file.type==='application/pdf'?await pdfPages(b):[await photo(item.file)];prepared.set(item.id,{id:item.id,name:item.file.name,type:item.file.type,data:base64(b),page_count:images.length,images:images});}var f=prepared.get(item.id);imageCount+=f.images.length;if(imageCount>12)throw new Error('Trop de pages à analyser ensemble. Gardez au maximum 12 pages ou photos.');out.push(f);}filesList();return out;}
function render(e){var target=document.getElementById('estimate-result');target.replaceChildren();var budget=node('div',undefined,'estimate-budget');budget.append(node('strong',money.format(e.range_ttc.low)+' à '+money.format(e.range_ttc.high)),node('p','TTC indicatif · fourchette de préparation (±20 %)'));target.append(budget);var table=node('table',undefined,'estimate-table'),head=node('thead'),row=node('tr');['Travaux estimés','Quantité','Montant HT'].forEach(function(t){row.append(node('th',t));});head.append(row);table.append(head);var tbody=node('tbody');e.sections.forEach(function(s){var lot=node('tr',undefined,'estimate-section-row'),cell=node('th',s.titre);cell.colSpan=3;lot.append(cell);tbody.append(lot);s.items.forEach(function(it){var r=node('tr');r.append(node('td',it.designation),node('td',it.quantite+' '+it.unite),node('td',money.format(it._total_ht)));tbody.append(r);});});table.append(tbody);target.append(table,node('p','Total de référence : '+money.format(e.totals.total_ttc)+' TTC.'));var list=node('ul',undefined,'estimate-assumptions');e.assumptions.forEach(function(s){list.append(node('li',s));});target.append(node('h3','Hypothèses et points à confirmer'),list);if(e.questions&&e.questions.length){target.append(node('h3','Questions à confirmer'));var questions=node('ul',undefined,'estimate-assumptions');e.questions.forEach(function(q){questions.append(node('li',q));});target.append(questions);}}

function validQuestions(list){return Array.isArray(list)&&list.length>0&&list.length<=4&&list.every(function(q){return typeof q==='string'&&q.trim().length>0;});}
function showQuestion(focus){document.getElementById('question-counter').textContent='Question '+(questionIndex+1)+' sur '+questions.length;document.getElementById('active-question').textContent=questions[questionIndex];answer.value=answers[questionIndex]||'';document.getElementById('question-next').textContent=questionIndex===questions.length-1?'Vérifier mes réponses →':'Suivant →';showView('question',focus);}
function beginQuestions(list){questions=list.slice();answers=new Array(questions.length).fill('');questionIndex=0;answer.value='';showQuestion(true);}
function saveAnswer(){answers[questionIndex]=answer.value;}
answer.addEventListener('input',function(){if(!busy&&!locked()&&view==='question')saveAnswer();});
document.getElementById('question-next').onclick=function(){if(busy||locked()||view!=='question')return;if(!answer.value.trim()){document.getElementById('project-error').textContent='Ajoutez une réponse ou choisissez « Je ne sais pas ».';answer.focus();return;}saveAnswer();if(questionIndex<questions.length-1){questionIndex++;showQuestion(true);}else{reviewMode='ai';renderReview(true);}};
document.getElementById('question-previous').onclick=function(){if(busy||locked()||view!=='question'||questionIndex===0)return;saveAnswer();questionIndex--;showQuestion(true);};
document.getElementById('question-unknown').onclick=function(){if(busy||locked()||view!=='question')return;answer.value='Je ne sais pas.';document.getElementById('question-next').onclick();};
document.getElementById('refine-next').onclick=function(){if(busy||locked()||view!=='refine')return;refinement=document.getElementById('refine-message').value.trim();if(!refinement){document.getElementById('project-error').textContent='Ajoutez votre précision avant de continuer.';return;}reviewMode='refine';renderReview(true);};
function requestRestart(){if(busy||locked()||!sessionUsed)return;previousView=view;showView('restart',true);}
document.getElementById('change-categories').onclick=requestRestart;
document.getElementById('restart-project').onclick=requestRestart;
document.getElementById('cancel-restart').onclick=function(){if(busy||locked()||view!=='restart')return;showView(previousView,true);};
document.getElementById('confirm-restart').onclick=function(){
 if(busy||locked()||view!=='restart')return;
 orientation++;history=[];acceptedQA=[];questions=[];answers=[];questionIndex=0;request=null;result=null;categories=[];manualCategories=false;localAnswers={};localQueue=[];localIndex=0;categoryKey='';entrySignature=null;message.value='';answer.value='';refinement='';
 editingOrientation=true;entrySummarized=false;resumeView='local';categoryInputs.forEach(function(input){input.checked=false;});document.getElementById('answers-review').replaceChildren();document.getElementById('estimate-result').replaceChildren();document.getElementById('entry-details').open=true;document.getElementById('project-attachments').open=false;document.getElementById('category-detection').hidden=true;showView('entry',true);summary();evaluateEntry();
};
function projectText(turn){
 var prefix=categories.length?'Catégories de travaux choisies : '+categories.join(' ; ')+'.':'Catégorie non imposée : projet décrit librement, à préciser.';
 if(orientation)prefix='NOUVELLE ORIENTATION DU PROJET n°'+orientation+' : les catégories et informations ci-dessous remplacent le projet et les questionnaires antérieurs conservés dans cette session. Ignorez les anciennes catégories, anciennes réponses et anciennes estimations ; utilisez uniquement cette nouvelle orientation et ses précisions. Ne reprenez pas un questionnaire antérieur.\n\n'+prefix;
 return prefix+'\n\n'+history.concat(turn).join('\n\nPrécisions du visiteur :\n');
}
async function generate(retry){
 if(busy)return;
 var error=document.getElementById('project-error');error.textContent='';
 if(locked()&&!retry||retry&&(!locked()||request.phase!=='generate'))return;
 if(!retry){
  if(view!=='review')return;
  // Read current values again, including silent autofill.
  if(!sessionUsed||editingOrientation)evaluateEntry();
  if(view!=='review'||!entryValid()||!localDone()){error.textContent='Vérifiez votre projet et vos coordonnées.';return;}
 }
 if(preview){error.textContent='Aperçu de conception : aucun appel IA, envoi de demande ou téléchargement réel.';return;}
 var turn,combined,qa;
 if(!retry){
  if(reviewMode==='ai'){
   if(!validQuestions(questions)||answers.some(function(a){return !a.trim();})){error.textContent='Vérifiez vos réponses avant de les envoyer.';return;}
   qa=questions.map(function(q,i){return{question:q,answer:answers[i].trim()};});
   turn='Réponses au questionnaire complémentaire :\n'+qa.map(function(item){return 'Question : '+item.question+'\nRéponse : '+item.answer;}).join('\n\n');
  }else if(reviewMode==='refine'){qa=[];turn='Précision complémentaire du visiteur : '+refinement;}
  else{
   qa=[];turn='Description du projet : '+(message.value.trim()||'Projet indiqué par les catégories choisies.')+'\n\nQuestions de préparation métier (questionnaire local) :\n'+localQA().map(function(item){return '['+item.trade+'] Question : '+item.question+'\nRéponse : '+item.answer;}).join('\n\n');
  }
  combined=projectText(turn);if(combined.length>18000){error.textContent='Votre projet est trop long. Résumez vos précisions.';return;}
 }
 setBusy(true);
 try{
  if(!retry){var files=await prepareFiles();request={id:crypto.randomUUID(),snapshot:JSON.stringify({contact:sessionUsed?identity:contact(),website:form.elements.website.value||'',attribution:attribution,project:combined,files:files}),turn:turn,qa:qa,phase:session?'generate':'session',uncertain:false};}
  var sentRequest=request,snapshot=JSON.parse(sentRequest.snapshot);
  if(!session){
   var created=await call('/sessions',{contact:snapshot.contact,website:snapshot.website,attribution:snapshot.attribution});
   if(request!==sentRequest||!/^[0-9a-f-]{36}$/.test(created.session_id||'')||!/^[0-9a-f]{64}$/.test(created.token||''))throw uncertain();
   session=created;identity=snapshot.contact;sentRequest.phase='generate';
  }
  sessionUsed=true;editingOrientation=false;
  var data=await call('/sessions/'+session.session_id+'/generate',{request_id:sentRequest.id,project:snapshot.project,files:snapshot.files},session.token);
  if(request!==sentRequest)throw uncertain();
  receipt(data.receipt);
  if(data.state==='questions'){
   if(!validQuestions(data.questions))throw uncertain();
   history.push(sentRequest.turn);acceptedQA=acceptedQA.concat(sentRequest.qa);request=null;result=null;beginQuestions(data.questions);
  }else if(data.state==='estimated'&&data.estimate_id===session.session_id){
   render(data);history.push(sentRequest.turn);acceptedQA=acceptedQA.concat(sentRequest.qa);request=null;result=data;questions=[];answers=[];answer.value='';document.getElementById('status-message').hidden=true;showView('result',true);
  }else throw uncertain();
 }catch(e){if(request){if(e.code&&e.code!=='generation_uncertain')request=null;else request.uncertain=true;}error.textContent=e.message||errorText('generation_uncertain');}
 finally{setBusy(false);}
}
projectForm.addEventListener('submit',function(e){e.preventDefault();if(!busy&&!locked())return generate(false);});
document.getElementById('retry-request').onclick=function(){return generate(true);};
document.getElementById('continue-project').onclick=function(){if(busy||locked()||!result)return;if(validQuestions(result.questions))beginQuestions(result.questions);else{questions=[];answers=[];refinement='';document.getElementById('refine-message').value='';showView('refine',true);}};
document.getElementById('download-pdf').onclick=async function(){if(busy||locked()||!session||!result)return;var error=document.getElementById('result-error');error.textContent='';setBusy(true);try{var r=await fetch(BASE+'/sessions/'+session.session_id+'/pdf',{method:'POST',headers:{'Content-Type':'application/json','X-Estimate-Token':session.token},body:'{}',signal:AbortSignal.timeout(115000),credentials:'omit',redirect:'error'});if(!r.ok||!(r.headers.get('content-type')||'').startsWith('application/pdf'))throw new Error('Le PDF n’a pas pu être généré. Votre demande reste enregistrée.');var blob=await r.blob();if(new TextDecoder().decode(await blob.slice(0,5).arrayBuffer())!=='%PDF-')throw new Error('Le fichier reçu n’est pas un PDF valide.');var url=URL.createObjectURL(blob),a=node('a');a.href=url;a.download='estimation-mistral-pro-reno.pdf';a.click();setTimeout(function(){URL.revokeObjectURL(url);},60000);}catch(e){error.textContent=e.message||'Téléchargement non confirmé.';}finally{setBusy(false);}};

showView('entry',false);
if(preview)document.getElementById('preview-note').hidden=false;
// Browser/password-manager autofill may update values without dispatching input.
watchAutofill();
}());
