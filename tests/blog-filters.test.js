const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const path = require('node:path');

function setup() {
  const categories = ['all', 'renovation', 'cuisine', 'prix'];
  const buttons = categories.map(filter => ({
    dataset: { filter }, attrs: {},
    classList: { toggle() {} },
    setAttribute(k, v) { this.attrs[k] = v; },
    addEventListener(_, callback) { this.click = callback; }
  }));
  const section = { hidden: false };
  const cards = [
    { dataset: { category: 'renovation', tags: 'prix' }, featured: true },
    { dataset: { category: 'cuisine' } },
    { dataset: { category: 'prix' } }
  ].map(c => Object.assign(c, {
    classList: { contains: name => name === 'featured-card' && !!c.featured },
    closest: () => section
  }));
  const count = { textContent: '' };
  const document = {
    querySelectorAll: selector => selector === '.filter-tag' ? buttons : cards,
    getElementById: () => count
  };
  vm.runInNewContext(fs.readFileSync(path.join(__dirname, '../js/blog-filters.js'), 'utf8'), { document });
  return { cards, buttons, section, count };
}
test('initial list shows every article and correct pressed state', () => {
  const { cards, buttons, count } = setup();
  assert.equal(cards.filter(c => !c.hidden).length, 3);
  assert.equal(count.textContent, '3 articles affichés');
  assert.equal(buttons[0].attrs['aria-pressed'], 'true');
  assert.equal(buttons[1].attrs['aria-pressed'], 'false');
});
test('subject filter hides featured section without leaving a gap', () => {
  const { cards, buttons, section, count } = setup();
  buttons[2].click();
  assert.deepEqual(cards.map(c => c.hidden), [true, false, true]);
  assert.equal(section.hidden, true);
  assert.equal(count.textContent, '1 article affiché');
});
test('pricing filter supports secondary tags and return to all restores articles', () => {
  const { cards, buttons, section, count } = setup();
  buttons[3].click();
  assert.deepEqual(cards.map(c => c.hidden), [false, true, false]);
  assert.equal(section.hidden, false);
  assert.equal(count.textContent, '2 articles affichés');
  buttons[0].click();
  assert.equal(cards.every(c => !c.hidden), true);
  assert.equal(section.hidden, false);
});
