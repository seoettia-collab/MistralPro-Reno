(function () {
  'use strict';
  var buttons = document.querySelectorAll('.filter-tag');
  var cards = document.querySelectorAll('.blog-card, .featured-card');
  var count = document.getElementById('blog-results-count');
  function show(filter) {
    var visible = 0;
    buttons.forEach(function (button) {
      var active = button.dataset.filter === filter;
      button.classList.toggle('active', active);
      button.setAttribute('aria-pressed', String(active));
    });
    cards.forEach(function (card) {
      var tags = (card.dataset.tags || '').split(/\s+/);
      var matches = filter === 'all' || card.dataset.category === filter || tags.indexOf(filter) !== -1;
      card.hidden = !matches;
      if (matches) visible += 1;
      if (card.classList.contains('featured-card')) {
        var section = card.closest('.blog-featured');
        if (section) section.hidden = !matches;
      }
    });
    if (count) count.textContent = visible + (visible === 1 ? ' article affiché' : ' articles affichés');
  }
  buttons.forEach(function (button) {
    button.addEventListener('click', function () { show(button.dataset.filter); });
  });
  show('all');
})();
