'use strict';
// CONVERSION-PARIS-01 : parcours en 3 étapes, campagne Paris, cohérence ville/CP, réponses rapides, succès seulement après reçu serveur.
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const root=path.resolve(__dirname,'..'),read=f=>fs.readFileSync(path.join(root,f),'utf8');
const F=require('../js/estimation-flow.js');
const base=()=>({travaux:['Rénovation complète'],surface:'40 à 70 m²',postal_code:'75017',pieces:['Cuisine'],nature:'Je ne sais pas',demarrage:'Dès que possible',details:'',contact:{first_name:'Jean',last_name:'TEST',phone:'06 00 00 00 00',email:'t@example.test',address:'12 rue de Lévis',postal_code:'75017',city:'Paris'}});

test('étape 1 : seulement travaux, code postal du chantier et surface',()=>{const html=read('estimation-projet.html'),s1=html.slice(html.indexOf('id="step-1"'),html.indexOf('id="step-2"'));
 assert.match(s1,/data-group="travaux"/);assert.match(s1,/name="project_postal_code"/);assert.match(s1,/data-group="surface"/);
 for(const n of ['first_name','last_name','phone','email','address','"city"'])assert.ok(!s1.includes('name='+(n.startsWith('"')?n:'"'+n+'"')),n+' ne doit pas être en étape 1');
 const s3=html.slice(html.indexOf('id="step-3"'),html.indexOf('id="step-4"'));for(const n of ['first_name','last_name','phone','email','address','postal_code','city'])assert.match(s3,new RegExp('name="'+n+'"'));});

test('réponses rapides : pièces multiples, nature, démarrage, « Je ne sais pas » partout',()=>{const html=read('estimation-projet.html');
 for(const g of ['travaux','surface','pieces','nature','demarrage']){assert.match(html,new RegExp('data-group="'+g+'"'));assert.ok(F.CHOICES[g].includes('Je ne sais pas'),g);}
 assert.match(html,/data-group="pieces" data-multi="true"/);assert.match(html,/data-group="nature" data-multi="false"/);
 assert.deepEqual(F.toggle(['Cuisine'],'WC',true),['Cuisine','WC']);assert.deepEqual(F.toggle(['Cuisine','WC'],'Je ne sais pas',true),['Je ne sais pas']);assert.deepEqual(F.toggle(['Je ne sais pas'],'Séjour',true),['Séjour']);assert.deepEqual(F.toggle(['Cuisine'],'Cuisine',true),[]);});

test('campagne Paris : ?zone=paris ou utm_campaign contenant paris ; Île-de-France sinon',()=>{assert.equal(F.zone('?zone=paris'),'paris');assert.equal(F.zone('?utm_campaign=Renovation-PARIS-nov'),'paris');assert.equal(F.zone('?utm_campaign=idf'),'idf');assert.equal(F.zone(''),'idf');
 const js=read('js/estimation-projet.js');assert.match(js,/Votre rénovation à Paris/);assert.match(read('estimation-projet.html'),/Paris intra-muros \(75001 à 75020\)/);});

test('parcours Paris : 75001 à 75020 et 75116 seulement',()=>{for(let n=1;n<=20;n++)assert.equal(F.postalError('750'+String(n).padStart(2,'0'),'paris'),'');assert.equal(F.postalError('75116','paris'),'');for(const cp of ['75000','75021','75117','92100','93200','7501'])assert.notEqual(F.postalError(cp,'paris'),'',cp);assert.equal(F.postalError('92100','idf'),'');assert.notEqual(F.postalError('60000','idf'),'');});

test('cohérence ville / code postal côté navigateur',()=>{for(const[cp,c]of [['75017','Boulogne'],['92100','Paris'],['75017','Paris 8e'],['75116','Paris 15e']])assert.notEqual(F.cityError(cp,c),'',cp+c);for(const[cp,c]of [['75017','Paris'],['75017','Paris 17e'],['75116','Paris 16e'],['75001','Paris 1er'],['92100','Boulogne-Billancourt']])assert.equal(F.cityError(cp,c),'',cp+c);assert.equal(F.cityFor('75017'),'Paris');assert.equal(F.cityFor('92100'),'');});

test('validation par étape et bouton de rappel quand tout est saisi',()=>{const s=base();assert.equal(F.ready(s,'paris'),true);assert.ok(F.stepErrors(1,{...s,travaux:[]},'paris').travaux);assert.ok(F.stepErrors(1,{...s,surface:''},'paris').surface);assert.ok(F.stepErrors(2,{...s,pieces:[]},'paris').pieces);assert.ok(F.stepErrors(3,{...s,contact:{...s.contact,phone:'123'}},'paris').phone);assert.ok(F.stepErrors(3,{...s,contact:{...s.contact,city:'Clichy'}},'paris').city);
 const html=read('estimation-projet.html');assert.match(html,/id="callback-submit"[^>]*>Être rappelé pour mon projet</);});

test('origine publicitaire conservée : utm_* et fbclid',()=>{const a=F.attribution('?utm_source=facebook&utm_medium=paid_social&utm_campaign=paris&utm_content=v1&utm_term=t&ad_id=9&fbclid=IwAR123&autre=x');assert.deepEqual(a,{utm_source:'facebook',utm_medium:'paid_social',utm_campaign:'paris',utm_content:'v1',utm_term:'t',ad_id:'9',fbclid:'IwAR123'});});

test('succès et conversion uniquement après reçu serveur confirmé ; rejeu sur la même session',()=>{const js=read('js/estimation-projet.js');
 assert.equal(F.confirmed({session_id:'a'},{stored:true,receipt:'a'}),true);assert.equal(F.confirmed({session_id:'a'},{stored:false,receipt:'a'}),false);assert.equal(F.confirmed({session_id:'a'},{stored:true,receipt:'b'}),false);
 const lead=js.indexOf("'/lead'"),check=js.indexOf('F.confirmed(session,lead.receipt)'),conv=js.indexOf("track('generate_lead'"),done=js.indexOf('showDone(session'),gen=js.indexOf('runEstimate(session,files)');
 assert.ok(lead>0&&lead<check&&check<conv&&conv<done&&done<gen,'ordre : /lead → reçu confirmé → conversion → succès → estimation');
 assert.match(js,/sessionStorage/);assert.match(js,/retry-request/);assert.match(js,/pending\.uncertain=true/);
 assert.match(js,/estimation_step_view/);assert.match(js,/estimation_abandon/);});

test('demande de test marquée TEST, aucune donnée fictive envoyée hors mode test',()=>{const js=read('js/estimation-projet.js');assert.match(js,/test:testMode\|\|undefined/);assert.equal(F.isTest('?test=1'),true);assert.equal(F.isTest(''),false);assert.match(read('estimation-projet.html'),/Mode TEST/);});

test('téléphone et horaires à jour, questionnaire IA et OpenAI absents de la page',()=>{const html=read('estimation-projet.html');assert.match(html,/06 09 10 90 69/);assert.match(html,/7j\/7/);assert.match(html,/8h à 20h|8h-20h/);assert.doesNotMatch(html,/openai|estimation-questionnaire\.js/i);assert.match(html,/<\/body>\s*<\/html>\s*$/);});
