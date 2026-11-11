'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const assets=path.join(__dirname,'../devis-travaux');
test('quote page has no advertising script, consent control or measurement hook',()=>{
  const html=fs.readFileSync(path.join(assets,'index.html'),'utf8');
  const js=fs.readFileSync(path.join(assets,'form.js'),'utf8');
  const css=fs.readFileSync(path.join(assets,'form.css'),'utf8');
  for(const text of [html,js,css]) assert.doesNotMatch(text,/openai|oaiq|measurement|measure\.js|wMeasurement/i);
  assert.equal(fs.existsSync(path.join(assets,'measure.js')),false);
  assert.deepEqual([...html.matchAll(/<script[^>]+src="([^"]+)"/g)].map(m=>m[1]),['/devis-travaux/form.js']);
});
test('confirmation contains only thanks, selected work, business phone and a discreet restart action',()=>{
  const html=fs.readFileSync(path.join(assets,'index.html'),'utf8');
  const block=html.match(/<div id="confirmation"[\s\S]*?<\/div>/)[0];
  assert.match(block,/<h2>Merci, votre demande est bien envoyée<\/h2>/);
  assert.match(block,/<p id="chosen-summary"><\/p>/);
  assert.match(block,/<a class="phone" href="tel:\+33609109069">06 09 10 90 69<\/a>/);
  assert.match(block,/<button id="new-request" type="button" class="new-request">Faire une autre demande<\/button>/);
  assert.equal((block.match(/<(?:h2|p|a|button)\b/g)||[]).length,4);
  assert.match(fs.readFileSync(path.join(assets,'form.css'),'utf8'),/#new-request[^}]*background: transparent[^}]*font-size: 13px/s);
});
