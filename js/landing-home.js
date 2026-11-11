(function () {
  'use strict';
  var choices = document.querySelectorAll('input[name="landing-project"]');
  var link = document.getElementById('landing-project-cta');
  if (!choices.length || !link) return;
  var allowed = ['appartement', 'salle-de-bain', 'cuisine', 'maison'];
  function syncChoice() {
    var selected = document.querySelector('input[name="landing-project"]:checked');
    if (selected && allowed.indexOf(selected.value) !== -1) {
      link.href = '/estimation-projet.html?projet=' + encodeURIComponent(selected.value);
    }
  }
  choices.forEach(function (choice) { choice.addEventListener('change', syncChoice); });
  syncChoice();
}());
