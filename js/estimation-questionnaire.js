/* Questionnaire métier local : aucune requête, aucun modèle et aucun stockage. */
(function(root){
'use strict';
var UNKNOWN='__unknown__';
var categories=['Salle de bain','Cuisine','Rénovation générale','Autre projet'];
function option(value,label){return{value:value,label:label};}
function choices(entries){return entries.map(function(pair){return option(pair[0],pair[1]);});}
function question(id,trade,label,type,entries){return{id:id,trade:trade,label:label,type:type,options:entries?choices(entries):[],unit:type==='number'?'m²':'',max:type==='number'?100000:2000};}
function single(id,trade,label,entries){return question(id,trade,label,'single',entries);}
function multi(id,trade,label,entries){return question(id,trade,label,'multi',entries);}
function includes(value,key){return Array.isArray(value)&&value.includes(key);}
function bathroomEquipment(){
 var q=question('sdb.equipment','Salle de bain','Que souhaitez-vous faire pour les équipements concernés ?','equipment');
 q.equipment=[{id:'bath',label:'Baignoire',picture:'bath'},{id:'shower',label:'Douche',picture:'shower'},{id:'basin',label:'Meuble vasque',picture:'basin'},{id:'wc',label:'WC',picture:'wc'}];
 var actions={keep:['Conserver','conserver l’équipement existant'],remove:['Déposer uniquement','déposer uniquement, sans nouvel équipement'],replace:['Remplacer','déposer l’équipement existant et installer un équipement neuf'],add:['Ajouter','installer un équipement supplémentaire, sans dépose prévue'],shower:['Remplacer par une douche','déposer la baignoire et installer une douche à sa place, sans baignoire neuve'],none:['Absent / non concerné','absent ou non concerné par les travaux']};
 q.equipment.forEach(function(item){var keys=item.id==='bath'?['keep','remove','replace','shower','none']:['keep','remove','replace','add','none'];keys.forEach(function(key){q.options.push({value:item.id+':'+key,label:item.label+' : '+actions[key][1]+'.',equipment:item.id,action:actions[key][0]});});});
 return q;
}
function hasNewEquipment(values){return Array.isArray(values)&&values.some(function(value){return /:(replace|add|shower)$/.test(value);});}
function queue(selected,answers){
 var out=[];answers=answers||{};
 categories.filter(function(trade){return selected.includes(trade);}).forEach(function(trade){
  if(trade==='Salle de bain'){
   var equipment= bathroomEquipment(),equipmentAnswers=answers['sdb.equipment'];out.push(equipment);if(!answered(equipment,equipmentAnswers))equipmentAnswers=[];
   if(includes(equipmentAnswers,'bath:shower')||includes(equipmentAnswers,'shower:replace')||includes(equipmentAnswers,'shower:add'))out.push(single('sdb.shower',trade,'Quel type de douche souhaitez-vous ?',[['walkin','Une douche à l’italienne'],['lowtray','Un receveur extra-plat'],['standard','Un receveur classique']]));
   out.push(multi('sdb.cover',trade,'Quels revêtements faut-il reprendre ?',[['floor','Le sol'],['walls','Les murs / la faïence'],['ceiling','Le plafond'],['none','Aucun revêtement']]));
   out.push(single('sdb.area-known',trade,'Connaissez-vous la surface de la salle de bain ?',[['yes','Oui'],['no','Non']]));
   if(answers['sdb.area-known']==='yes')out.push(question('sdb.area',trade,'Quelle est la surface de la salle de bain en m² ?','number'));
   if(hasNewEquipment(equipmentAnswers))out.push(single('sdb.layout',trade,'Les arrivées d’eau et évacuations doivent-elles changer de place ?',[['keep','Conserver les emplacements'],['move','Déplacer au moins un équipement']]));
  }else if(trade==='Cuisine'){
   out.push(single('kitchen.remove',trade,'Que faut-il déposer dans votre cuisine ?',[['all','Toute la cuisine existante'],['some','Certains meubles ou équipements'],['none','Aucune dépose']]));
   out.push(multi('kitchen.install',trade,'Que souhaitez-vous installer ou remplacer dans la cuisine ?',[['units','Les meubles'],['top','Le plan de travail'],['sink','L’évier et la robinetterie'],['appliances','L’électroménager']]));
   if(includes(answers['kitchen.install'],'sink'))out.push(single('kitchen.water',trade,'L’évier doit-il rester au même emplacement ?',[['same','Oui, au même emplacement'],['move','Non, il doit être déplacé']]));
   out.push(multi('kitchen.cover',trade,'Quelles finitions de cuisine faut-il reprendre ?',[['floor','Le sol'],['splashback','La crédence'],['paint','La peinture des murs / plafond'],['none','Aucune de ces finitions']]));
   out.push(single('kitchen.area-known',trade,'Connaissez-vous la surface de la cuisine ?',[['yes','Oui'],['no','Non']]));
   if(answers['kitchen.area-known']==='yes')out.push(question('kitchen.area',trade,'Quelle est la surface de la cuisine en m² ?','number'));
  }else if(trade==='Rénovation générale'){
   out.push(single('general.property',trade,'Quel bien souhaitez-vous rénover ?',[['flat','Un appartement'],['house','Une maison'],['premises','Un local professionnel']]));
   out.push(multi('general.works',trade,'Quels travaux sont prévus dans cette rénovation ?',[['layout','Modifier les pièces / cloisons'],['electric','Reprendre l’électricité'],['water','Reprendre la plomberie'],['finish','Refaire les sols et peintures'],['insulation','Améliorer l’isolation']]));
   if(includes(answers['general.works'],'layout'))out.push(single('general.structure',trade,'Quels éléments faut-il modifier pour redistribuer les pièces ?',[['partitions','Des cloisons'],['bearing','Un mur porteur ou une ouverture structurelle'],['unidentified','La nature des murs reste à vérifier']]));
   out.push(multi('general.rooms',trade,'Quelles pièces sont concernées ?',[['living','Séjour'],['bedrooms','Chambres'],['kitchen','Cuisine'],['bathroom','Salle de bain'],['whole','Tout le logement']]));
   out.push(single('general.area-known',trade,'Connaissez-vous la surface à rénover ?',[['yes','Oui'],['no','Non']]));
   if(answers['general.area-known']==='yes')out.push(question('general.area',trade,'Quelle est la surface à rénover en m² ?','number'));
  }else{
   out.push(single('other.scope',trade,'Quelle partie de votre projet faut-il étudier ?',[['extension','Un agrandissement'],['roof','La toiture'],['facade','La façade'],['outside','Un aménagement extérieur'],['other','D’autres travaux']]));
   if(answers['other.scope']==='extension')out.push(single('other.extension',trade,'Quel agrandissement envisagez-vous ?',[['ground','Une extension au sol'],['upper','Une surélévation'],['porch','Une véranda']]));
   if(answers['other.scope']==='roof')out.push(multi('other.roof',trade,'Quels travaux de toiture sont envisagés ?',[['leak','Traiter une fuite'],['cover','Refaire la couverture'],['frame','Intervenir sur la charpente'],['insulation','Isoler la toiture']]));
   if(answers['other.scope']==='facade')out.push(single('other.facade',trade,'Quel travail de façade envisagez-vous ?',[['paint','Nettoyage / peinture'],['render','Réfection de l’enduit'],['insulation','Isolation par l’extérieur']]));
   if(answers['other.scope']==='other'||answers['other.scope']==='outside')out.push(question('other.elements',trade,'Quels éléments faut-il créer, remplacer ou remettre en état ?','text'));
   out.push(single('other.area-known',trade,'Connaissez-vous la surface concernée par ces travaux ?',[['yes','Oui'],['no','Non']]));
   if(answers['other.area-known']==='yes')out.push(question('other.area',trade,'Quelle est la surface concernée en m² ?','number'));
   out.push(single('other.access',trade,'Comment accède-t-on à la zone de travaux ?',[['ground','Directement depuis le rez-de-chaussée'],['stairs','Par des escaliers'],['lift','Par un ascenseur'],['outside','Par l’extérieur']]));
  }
 });
 return out;
}
function answered(q,value){
 if(value===UNKNOWN)return true;
 if(q.type==='single')return q.options.some(function(o){return o.value===value;});
 if(q.type==='equipment')return Array.isArray(value)&&value.length>0&&value.every(function(v){return typeof v==='string';})&&new Set(value.map(function(v){return v.split(':')[0];})).size===value.length&&value.every(function(v){return q.options.some(function(o){return o.value===v;});});
 if(q.type==='multi')return Array.isArray(value)&&value.length>0&&value.every(function(v){return q.options.some(function(o){return o.value===v;});});
 if(q.type==='number'){var n=Number(String(value||'').replace(',','.'));return n>0&&Number.isFinite(n)&&n<=q.max;}
 return typeof value==='string'&&value.trim().length>0&&value.length<=q.max;
}
function prune(selected,answers){
 var clean=Object.assign({},answers),changed=true;
 if(Object.hasOwn(clean,'sdb.equipment')&&!answered(bathroomEquipment(),clean['sdb.equipment']))delete clean['sdb.equipment'];
 while(changed){changed=false;var ids=queue(selected,clean).map(function(q){return q.id;});Object.keys(clean).forEach(function(id){if(!ids.includes(id)){delete clean[id];changed=true;}});}
 return clean;
}
function format(q,value){
 if(value===UNKNOWN)return 'Je ne sais pas.';
 if(q.type==='equipment'){if(!answered(q,value))return 'Actions non précisées.';return q.equipment.map(function(item){var selected=q.options.find(function(o){return o.equipment===item.id&&value.includes(o.value);});return selected?selected.label:item.label+' : non précisé.';}).join('\n');}
 if(q.type==='multi')return q.options.filter(function(o){return value.includes(o.value);}).map(function(o){return o.label;}).join(' ; ');
 if(q.type==='single'){var o=q.options.find(function(o){return o.value===value;});return o?o.label:'';}
 return String(value).trim()+(q.unit?' '+q.unit:'');
}
function detect(text){
 var s=String(text||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase();
 // Only explicit work vocabulary: a bare “pièce”, “rénovation” or “maison” imposes no category.
 return categories.filter(function(c){var pattern={'Salle de bain':/\b(salles? de bains?|sdb|baignoire|douche)\b/,'Cuisine':/\bcuisines?\b/,'Rénovation générale':/\brenovation (complete|generale|globale)\b|\b(tout|tout l[’']appartement|toute la maison) a refaire\b/}[c];if(!pattern)return false;var matches=new RegExp(pattern.source,'g'),match;while((match=matches.exec(s))!==null){if(!/\b(pas de|sans|aucune)\s*$/.test(s.slice(Math.max(0,match.index-20),match.index)))return true;}return false;});
}
var api={UNKNOWN:UNKNOWN,categories:categories,queue:queue,prune:prune,answered:answered,format:format,detect:detect};
root.MPRQuestionnaire=api;
if(typeof module==='object'&&module.exports)module.exports=api;
}(typeof window==='object'?window:globalThis));
