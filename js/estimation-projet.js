(function () {
 'use strict';
 var preview = (location.protocol === 'file:' || /^(localhost|127\.0\.0\.1)$/.test(location.hostname)) && new URLSearchParams(location.search).has('preview');
 var form = document.getElementById('identity-form');
 function showStep(id) { ['identity-step','project-step','result-step'].forEach(function(x){document.getElementById(x).hidden=x!==id;});var step=['identity-step','project-step','result-step'].indexOf(id);document.querySelectorAll('.estimate-steps li').forEach(function(li,i){if(i===step)li.setAttribute('aria-current','step');else li.removeAttribute('aria-current');}); }
 if(preview){document.getElementById('preview-note').hidden=false;var mode=new URLSearchParams(location.search).get('preview');if(mode==='conversation')showStep('project-step');}
 form.addEventListener('submit',function(e){e.preventDefault();if(!form.reportValidity())return;if(preview)showStep('project-step');else document.getElementById('identity-error').textContent='Le service est en préparation. Vous pouvez nous contacter directement au 07 55 18 89 37.';});
 document.getElementById('edit-identity').onclick=function(){showStep('identity-step');};
 document.getElementById('project-form').onsubmit=function(e){e.preventDefault();document.getElementById('project-error').textContent=preview?'Aperçu de conception : aucune estimation IA ni demande réelle ne sera générée.':'Le service est en préparation.';};
}());
