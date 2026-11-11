'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const questionnaire = require('../js/estimation-questionnaire.js');

const bath = ['Salle de bain'];
const kitchen = ['Cuisine'];
const detailedQueue = (selected, answers) => questionnaire.queue(selected, answers, { detailedOnly: true });
const find = (questions, id) => {
  const question = questions.find(item => item.id === id);
  assert.ok(question, `Question métier attendue : ${id}`);
  return question;
};

test('le métier choisi pose ses propres questions, sans mêler cuisine et salle de bain', () => {
  const bathroom = detailedQueue(bath, {});
  const cooking = detailedQueue(kitchen, {});
  assert.equal(bathroom[0].trade, 'Salle de bain');
  assert.ok(bathroom[0].options.some(option => option.value === 'bath:remove'));
  assert.ok(bathroom.every(question => question.trade === 'Salle de bain'));
  assert.equal(cooking[0].trade, 'Cuisine');
  assert.ok(cooking.every(question => question.trade === 'Cuisine'));
  assert.ok(!cooking.some(question => question.id === 'sdb.shower'));
});

test('chaque action déclenche uniquement ses branches métier explicites', () => {
  for (const value of ['bath:keep','bath:remove','bath:none','shower:keep','shower:remove','shower:none','basin:keep','wc:remove']) {
    const queue = detailedQueue(bath, { 'sdb.equipment': [value] });
    assert.ok(!queue.some(question => ['sdb.shower','sdb.layout'].includes(question.id)), value);
  }
  for (const value of ['bath:shower','shower:replace','shower:add']) {
    const queue = detailedQueue(bath, { 'sdb.equipment': [value] });
    assert.ok(find(queue, 'sdb.shower'));
    assert.ok(find(queue, 'sdb.layout'));
  }
  for (const value of ['bath:replace','basin:replace','basin:add','wc:replace','wc:add']) {
    const queue = detailedQueue(bath, { 'sdb.equipment': [value] });
    assert.ok(!queue.some(question => question.id === 'sdb.shower'), value);
    assert.ok(find(queue, 'sdb.layout'));
  }
});
test('validation stricte des actions : une par équipement, sans sélection présumée', () => {
  const q = find(detailedQueue(bath, {}), 'sdb.equipment');
  assert.equal(q.type, 'equipment');
  assert.deepEqual(q.equipment.map(item => item.id), ['bath','shower','basin','wc']);
  for (const answer of [undefined,[],{},['bath:keep','bath:remove'],['bath:unknown'],[42]]) {
    assert.equal(questionnaire.answered(q, answer), false);
    assert.ok(!detailedQueue(bath, { 'sdb.equipment': answer }).some(item => ['sdb.shower','sdb.layout'].includes(item.id)));
  }
  assert.equal(questionnaire.answered(q, ['bath:none']), true);
  assert.equal(questionnaire.answered(q, ['bath:shower','shower:keep','basin:add','wc:none']), true);
  assert.equal(questionnaire.prune(bath, {'sdb.equipment':['bath:keep','bath:replace']}, { detailedOnly: true })['sdb.equipment'], undefined);
});
test('résumé itemisé : baignoire vers douche sans baignoire neuve, autres équipements non précisés', () => {
  const q = find(detailedQueue(bath, {}), 'sdb.equipment');
  const text = questionnaire.format(q, ['bath:shower']);
  assert.match(text, /Baignoire : déposer la baignoire et installer une douche à sa place, sans baignoire neuve/);
  for (const equipment of ['Douche','Meuble vasque','WC']) assert.ok(text.includes(equipment + ' : non précisé.'));
  assert.doesNotMatch(text, /conserver/);
  const separate = questionnaire.format(q, ['bath:shower','shower:replace']);
  assert.match(separate, /Douche : déposer l’équipement existant et installer un équipement neuf/);
  assert.equal(separate.split('\n').length, 4);
});
test('la surface numérique est demandée seulement si le visiteur la connaît', () => {
  for (const [trade, prefix] of [['Salle de bain', 'sdb'], ['Cuisine', 'kitchen']]) {
    for (const knowledge of [undefined, 'no', questionnaire.UNKNOWN]) {
      const answers = knowledge === undefined ? {} : { [prefix + '.area-known']: knowledge };
      assert.ok(!detailedQueue([trade], answers).some(question => question.type === 'number'));
    }
    const area = find(detailedQueue([trade], { [prefix + '.area-known']: 'yes' }), prefix + '.area');
    assert.equal(area.type, 'number');
    assert.equal(questionnaire.answered(area, '8,5'), true);
    assert.equal(questionnaire.answered(area, '0'), false);
    assert.equal(questionnaire.answered(area, '-3'), false);
    assert.equal(questionnaire.answered(area, 'inconnue'), false);
  }
});

test('corriger une réponse retire ses branches périmées et garde les autres métiers', () => {
  const answers = {
    'sdb.equipment': ['bath:keep'],
    'sdb.shower': 'walkin', 'sdb.layout': 'move',
    'sdb.area-known': 'no', 'sdb.area': '9',
    'kitchen.install': ['sink'], 'kitchen.water': 'same', 'kitchen.cover': ['floor'],
  };
  const cleaned = questionnaire.prune(['Salle de bain', 'Cuisine'], answers, { detailedOnly: true });
  for (const obsolete of ['sdb.shower', 'sdb.layout', 'sdb.area']) {
    assert.ok(!Object.hasOwn(cleaned, obsolete));
  }
  assert.deepEqual(cleaned['sdb.equipment'], ['bath:keep']);
  assert.equal(cleaned['kitchen.water'], 'same');
  assert.deepEqual(cleaned['kitchen.cover'], ['floor']);
  assert.equal(answers['sdb.shower'], 'walkin', 'La source conservée pour la revue ne doit pas être mutée.');

  const kitchenOnly = questionnaire.prune(kitchen, answers, { detailedOnly: true });
  assert.ok(Object.keys(kitchenOnly).every(id => id.startsWith('kitchen.')));
  assert.equal(kitchenOnly['kitchen.water'], 'same');

  const wcOnly = { ...answers, 'sdb.equipment': ['wc:add'] };
  assert.ok(detailedQueue(bath, wcOnly).some(question => question.id === 'sdb.layout'));
  assert.equal(questionnaire.prune(bath, wcOnly, { detailedOnly: true })['sdb.layout'], 'move');
});

test('je ne sais pas reste une incertitude, sans quantité ni branche supposée', () => {
  const unknown = questionnaire.UNKNOWN;
  const pending = detailedQueue(bath, { 'sdb.equipment': unknown, 'sdb.area-known': unknown });
  assert.ok(!pending.some(question => ['sdb.shower', 'sdb.layout', 'sdb.area'].includes(question.id)));
  for (const question of pending) {
    assert.equal(questionnaire.answered(question, unknown), true);
    assert.equal(questionnaire.format(question, unknown), 'Je ne sais pas.');
  }
  const area = find(detailedQueue(bath, { 'sdb.area-known': 'yes' }), 'sdb.area');
  assert.equal(questionnaire.format(area, unknown), 'Je ne sais pas.');
  assert.doesNotMatch(questionnaire.format(area, unknown), /\d|m²/);
});

test('la détection reconnaît accents et vocabulaire explicite sans classer une pièce vague', () => {
  assert.deepEqual(questionnaire.detect('Remplacer ma baignoire'), bath);
  assert.deepEqual(questionnaire.detect('Installer une douche'), bath);
  assert.deepEqual(questionnaire.detect('Refaire la CUISINE'), kitchen);
  assert.deepEqual(questionnaire.detect('RÉNOVATION GÉNÉRALE de mon appartement'), ['Rénovation générale']);
  assert.deepEqual(questionnaire.detect('Rénover une pièce de ma maison'), []);
  assert.deepEqual(questionnaire.detect('Cuisine et salle de bains'), ['Salle de bain', 'Cuisine']);
});

test('un premier équipement nié ne masque pas le second équipement positif du même métier', () => {
  assert.deepEqual(questionnaire.detect('Pas de douche, mais une baignoire à remplacer'), bath);
  assert.deepEqual(questionnaire.detect('Sans baignoire, installer une douche'), bath);
  assert.deepEqual(questionnaire.detect('Aucune cuisine à déposer, mais une cuisine à installer'), kitchen);
  assert.deepEqual(questionnaire.detect('Pas de cuisine, uniquement une salle de bain'), bath);
  assert.deepEqual(questionnaire.detect('Sans douche et sans baignoire'), []);
});


test('par défaut : une seule question à cases par métier, aucun détail technique imposé', () => {
  const questions = questionnaire.queue(questionnaire.categories, {});
  assert.equal(questions.length, 4);
  assert.deepEqual(questions.map(q => q.trade), questionnaire.categories);
  assert.ok(questions.every(q => q.type === 'multi' && q.simple === true && !q.optional));
  assert.deepEqual(questions.map(q => q.options.length), [5, 4, 3, 5]);
  assert.ok(!questions.some(q => /area|layout|shower$/.test(q.id)));
  const sdb = questions[0];
  assert.equal(questionnaire.answered(sdb, undefined), false);
  assert.equal(questionnaire.answered(sdb, []), false);
  assert.equal(questionnaire.answered(sdb, ['bath-to-shower', 'wc']), true);
  assert.equal(questionnaire.answered(sdb, ['bath:keep']), false);
  assert.match(questionnaire.format(sdb, ['bath-to-shower', 'wc']), /Remplacer la baignoire par une douche ; Remplacer le WC/);
});
test('les anciens questionnaires apparaissent seulement sur demande et restent facultatifs', () => {
  const questions = questionnaire.queue(['Salle de bain', 'Cuisine'], {}, { details: ['Salle de bain'] });
  const details = questions.filter(q => q.optional);
  assert.ok(details.length > 0);
  assert.ok(details.every(q => q.trade === 'Salle de bain'));
  assert.ok(details.some(q => q.id === 'sdb.equipment'));
  assert.ok(details.some(q => q.id === 'sdb.area-known'));
  assert.equal(questions.filter(q => !q.optional).length, 2);
});
test('revenir au court ou retirer un métier exclut les anciennes précisions du contexte', () => {
  const answers = { 'sdb.simple': ['wc'], 'sdb.equipment': ['wc:replace'], 'sdb.layout': 'move', 'sdb.area-known': 'yes', 'sdb.area': '8', 'kitchen.simple': ['top'] };
  const simple = questionnaire.prune(['Salle de bain', 'Cuisine'], answers);
  assert.deepEqual(simple, { 'sdb.simple': ['wc'], 'kitchen.simple': ['top'] });
  const kitchenOnly = questionnaire.prune(kitchen, answers, { details: ['Salle de bain'] });
  assert.deepEqual(kitchenOnly, { 'kitchen.simple': ['top'] });
  assert.equal(answers['sdb.area'], '8');
});

test('baignoire vers douche : les précisions ne peuvent pas ajouter une baignoire neuve contradictoire', () => {
  const settings = { details: ['Salle de bain'] };
  const answers = { 'sdb.simple': ['bath-to-shower'], 'sdb.equipment': ['bath:replace', 'wc:add'] };
  const clean = questionnaire.prune(bath, answers, settings);
  assert.deepEqual(clean['sdb.equipment'], ['wc:add']);
  const questions = questionnaire.queue(bath, clean, settings);
  const equipment = find(questions, 'sdb.equipment');
  assert.ok(equipment.equipment.every(item => item.id !== 'bath'));
  assert.ok(equipment.options.every(option => !option.value.startsWith('bath:')));
  assert.ok(find(questions, 'sdb.shower'));
  assert.ok(find(questions, 'sdb.layout'));
  assert.doesNotMatch(questionnaire.format(equipment, clean['sdb.equipment']), /Baignoire/);
  assert.match(questionnaire.format(questions[0], clean['sdb.simple']), /Remplacer la baignoire par une douche/);
});
