/* ADS-LEAD-001: page dédiée, indépendante du simulateur et de son suivi. */
(() => {
  'use strict';
  const form = document.getElementById('lead-form');
  if (!form) return;
  const button = document.getElementById('send');
  const error = document.getElementById('form-error');
  const confirmation = document.getElementById('confirmation');
  const phone = form.elements.namedItem('telephone');
  const name = form.elements.namedItem('nom');
  const postcode = form.elements.namedItem('code_postal');
  const choices = [...form.querySelectorAll('input[name="travaux"]')];
  const allowedDepartments = ['75', '77', '78', '91', '92', '93', '94', '95'];
  let busy = false;
  let completed = false;
  button.disabled = false;

  function showError(message) {
    error.textContent = message;
    error.hidden = false;
    error.focus();
  }

  // Une annonce peut présélectionner un service, sans empêcher d'autres choix.
  const params = new URLSearchParams(window.location.search);
  const serviceKeys = ['salle-de-bain', 'cuisine', 'peinture', 'renovation', 'autres'];
  const selectedIndex = serviceKeys.indexOf(params.get('service'));
  if (selectedIndex >= 0) choices[selectedIndex].checked = true;

  form.addEventListener('submit', async (event) => {
    event.preventDefault();
    if (busy || completed) return;
    error.hidden = true;
    if (form.elements.namedItem('website').value) return;
    name.value = name.value.trim();
    phone.value = phone.value.trim();
    postcode.value = postcode.value.trim();
    if (!form.reportValidity()) return;
    const services = choices.filter((choice) => choice.checked).map((choice) => choice.value);
    if (!services.length) {
      showError('Choisissez au moins un type de travaux.');
      choices[0].focus();
      return;
    }
    const normalizedPhone = phone.value.replace(/[\s.()\-]/g, '').replace(/^0033/, '+33');
    if (!/^(?:0[1-9][0-9]{8}|\+33[1-9][0-9]{8})$/.test(normalizedPhone)) {
      showError('Vérifiez votre numéro de téléphone français (10 chiffres ou +33).');
      phone.focus();
      return;
    }
    if (!/^[0-9]{5}$/.test(postcode.value) || !allowedDepartments.includes(postcode.value.slice(0, 2))) {
      showError('Nous intervenons en Île-de-France. Vérifiez le code postal des travaux.');
      postcode.focus();
      return;
    }
    const payload = {
      nom: name.value,
      telephone: normalizedPhone,
      code_postal: postcode.value,
      travaux: services.join(', '),
      message: form.elements.namedItem('message').value.trim(),
      form_name: 'demande-devis-simple',
      form_location: 'demande-devis',
      submitted_at: new Date().toISOString(),
      page_url: window.location.origin + window.location.pathname
    };
    // Liste fermée : pas de données de contact ni d'URL complète dans l'analytique.
    for (const key of ['utm_source', 'utm_medium', 'utm_campaign', 'utm_content']) {
      const value = params.get(key);
      if (value) payload[key] = value.slice(0, 150);
    }
    busy = true;
    button.disabled = true;
    button.textContent = 'Envoi en cours…';
    form.setAttribute('aria-busy', 'true');
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 20000);
    try {
      const response = await fetch(form.action, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
        signal: controller.signal
      });
      if (!response.ok) throw new Error('submission_failed');
      completed = true;
      form.hidden = true;
      confirmation.hidden = false;
      confirmation.focus();
      // Point de raccordement uniquement : aucun pixel publicitaire n'est chargé ici.
      window.dataLayer = window.dataLayer || [];
      window.dataLayer.push({ event: 'lead_request_success', form_name: 'demande-devis-simple' });
    } catch (failure) {
      showError(failure.name === 'AbortError'
        ? 'La confirmation tarde à arriver. Votre demande a peut-être été reçue. Pour éviter un doublon, appelez-nous au 07 55 18 89 37.'
        : 'L’envoi n’a pas pu être confirmé. Réessayez ou appelez-nous au 07 55 18 89 37.');
    } finally {
      clearTimeout(timeout);
      busy = false;
      button.disabled = false;
      button.textContent = 'Être rappelé pour mon devis';
      form.removeAttribute('aria-busy');
    }
  });
})();
