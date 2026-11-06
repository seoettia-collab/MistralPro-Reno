'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const questionnaire = require('../js/estimation-questionnaire.js');

const bath = ['Salle de bain'];
const kitchen = ['Cuisine'];
const find = (questions, id) => {
  const question = questions.find(item => item.id === id);
  assert.ok(question, `Question métier attendue : ${id}`);
  return question;
};

test('le métier choisi pose ses propres questions, sans mêler cuisine et salle de bain', () => {
  const bathroom = questionnaire.queue(bath, {});
  const cooking = questionnaire.queue(kitchen, {});
  assert.equal(bathroom[0].trade, 'Salle de bain');
  assert.ok(bathroom[0].options.some(option => option.value === 'bath'));
  assert.ok(bathroom.every(question => question.trade === 'Salle de bain'));
  assert.equal(cooking[0].trade, 'Cuisine');
  assert.ok(cooking.every(question => question.trade === 'Cuisine'));
  assert.ok(!cooking.some(question => question.id === 'sdb.shower'));
});

test('déposer une baignoire ne présume pas une douche à installer', () => {
  const replacementByBasin = { 'sdb.remove': 'bath', 'sdb.install': ['basin'] };
  assert.ok(!questionnaire.queue(bath, replacementByBasin).some(question => question.id === 'sdb.shower'));
  const shower = questionnaire.queue(bath, { ...replacementByBasin, 'sdb.install': ['shower', 'basin'] });
  assert.ok(find(shower, 'sdb.shower').options.some(option => option.value === 'walkin'));
});

test('la surface numérique est demandée seulement si le visiteur la connaît', () => {
  for (const [trade, prefix] of [['Salle de bain', 'sdb'], ['Cuisine', 'kitchen']]) {
    for (const knowledge of [undefined, 'no', questionnaire.UNKNOWN]) {
      const answers = knowledge === undefined ? {} : { [prefix + '.area-known']: knowledge };
      assert.ok(!questionnaire.queue([trade], answers).some(question => question.type === 'number'));
    }
    const area = find(questionnaire.queue([trade], { [prefix + '.area-known']: 'yes' }), prefix + '.area');
    assert.equal(area.type, 'number');
    assert.equal(questionnaire.answered(area, '8,5'), true);
    assert.equal(questionnaire.answered(area, '0'), false);
    assert.equal(questionnaire.answered(area, '-3'), false);
    assert.equal(questionnaire.answered(area, 'inconnue'), false);
  }
});

test('corriger une réponse retire ses branches périmées et garde les autres métiers', () => {
  const answers = {
    'sdb.remove': 'bath', 'sdb.install': ['keep'],
    'sdb.shower': 'walkin', 'sdb.layout': 'move',
    'sdb.area-known': 'no', 'sdb.area': '9',
    'kitchen.install': ['sink'], 'kitchen.water': 'same', 'kitchen.cover': ['floor'],
  };
  const cleaned = questionnaire.prune(['Salle de bain', 'Cuisine'], answers);
  for (const obsolete of ['sdb.shower', 'sdb.layout', 'sdb.area']) {
    assert.ok(!Object.hasOwn(cleaned, obsolete));
  }
  assert.equal(cleaned['sdb.remove'], 'bath');
  assert.deepEqual(cleaned['sdb.install'], ['keep']);
  assert.equal(cleaned['kitchen.water'], 'same');
  assert.deepEqual(cleaned['kitchen.cover'], ['floor']);
  assert.equal(answers['sdb.shower'], 'walkin', 'La source conservée pour la revue ne doit pas être mutée.');

  const kitchenOnly = questionnaire.prune(kitchen, answers);
  assert.ok(Object.keys(kitchenOnly).every(id => id.startsWith('kitchen.')));
  assert.equal(kitchenOnly['kitchen.water'], 'same');

  const wcOnly = { ...answers, 'sdb.install': ['wc'] };
  assert.ok(questionnaire.queue(bath, wcOnly).some(question => question.id === 'sdb.layout'));
  assert.equal(questionnaire.prune(bath, wcOnly)['sdb.layout'], 'move');
});

test('je ne sais pas reste une incertitude, sans quantité ni branche supposée', () => {
  const unknown = questionnaire.UNKNOWN;
  const pending = questionnaire.queue(bath, { 'sdb.install': unknown, 'sdb.area-known': unknown });
  assert.ok(!pending.some(question => ['sdb.shower', 'sdb.layout', 'sdb.area'].includes(question.id)));
  for (const question of pending) {
    assert.equal(questionnaire.answered(question, unknown), true);
    assert.equal(questionnaire.format(question, unknown), 'Je ne sais pas.');
  }
  const area = find(questionnaire.queue(bath, { 'sdb.area-known': 'yes' }), 'sdb.area');
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
