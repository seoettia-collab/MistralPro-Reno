'use strict';
const test=require('node:test'),assert=require('node:assert/strict');
delete require.cache[require.resolve('../js/estimation-questionnaire.js')];
globalThis.MPR_DETAILED_DEFAULT=undefined;
const q=require('../js/estimation-questionnaire.js');
test('formulaire simple par défaut : une seule question par métier',()=>{
 q.setDetailed(false);
 for(const trade of q.categories){const list=q.queue([trade],{});assert.equal(list.length,1);assert.equal(list[0].trade,trade);}
 const sdb=q.queue(['Salle de bain'],{})[0];
 assert.deepEqual(sdb.options.map(o=>o.label),['Remplacer la baignoire par une douche','Remplacer la douche','Remplacer le WC','Remplacer le meuble vasque','Refaire le carrelage']);
 assert.ok(!q.queue(['Salle de bain'],{'simple.sdb':['bath-to-shower']}).some(x=>/douche souhaitez|surface/i.test(x.label)));
 assert.equal(q.queue(['Salle de bain','Cuisine'],{}).length,2);
});
test('formulaire détaillé en option : questions actuelles',()=>{
 q.setDetailed(true);assert.equal(q.queue(['Salle de bain'],{})[0].id,'sdb.equipment');q.setDetailed(false);
});
