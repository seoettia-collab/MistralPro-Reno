(function () {
  'use strict';
  var header = document.querySelector('.premium-header');
  var button = document.querySelector('.premium-menu-button');
  var menu = document.getElementById('premium-menu');
  if (!header || !button || !menu) return;
  function setOpen(open, focusButton) {
    header.classList.toggle('is-open', open);
    menu.classList.toggle('is-open', open);
    button.setAttribute('aria-expanded', String(open));
    button.setAttribute('aria-label', open ? 'Fermer le menu' : 'Ouvrir le menu');
    if (focusButton) button.focus();
  }
  button.addEventListener('click', function () {
    setOpen(button.getAttribute('aria-expanded') !== 'true');
  });
  menu.querySelectorAll('a').forEach(function (link) {
    link.addEventListener('click', function () { setOpen(false); });
  });
  document.addEventListener('keydown', function (event) {
    if (event.key === 'Escape' && button.getAttribute('aria-expanded') === 'true') {
      setOpen(false, true);
    }
  });
  document.addEventListener('click', function (event) {
    if (!header.contains(event.target)) setOpen(false);
  });
  if (document.body.classList.contains('premium-calculator')) {
    var categories = document.querySelectorAll('.main-cat');
    categories.forEach(function (category) {
      category.addEventListener('click', function () {
        categories.forEach(function (item) {
          item.setAttribute('aria-pressed', String(item === category));
        });
      });
    });
  }
})();
