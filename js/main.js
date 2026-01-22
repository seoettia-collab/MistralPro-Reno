// =============================================
// MAIN.JS v2.0 - Avec envoi formulaire vers n8n
// =============================================

// === CONFIGURATION ===
// ⚠️ REMPLACE CETTE URL PAR TON WEBHOOK N8N
const WEBHOOK_URL = 'https://ettia.app.n8n.cloud/webhook/landing-form';

// === TRACKING GTM ===
window.dataLayer = window.dataLayer || [];

function trackFormSubmit(formName, formLocation) {
    window.dataLayer.push({
        event: 'form_submit',
        form_name: formName,
        form_location: formLocation
    });
}

function trackClickToCall(phone, location) {
    window.dataLayer.push({
        event: 'click_to_call',
        phone_number: phone,
        click_location: location
    });
}

function trackScrollMilestone(percent) {
    window.dataLayer.push({
        event: 'scroll_milestone',
        scroll_percentage: percent
    });
}

function trackConversion(type, value) {
    window.dataLayer.push({
        event: 'conversion',
        conversion_type: type,
        conversion_value: value
    });
}

// === ENVOI FORMULAIRE VERS N8N ===
async function submitFormToN8n(formData, formElement) {
    const submitBtn = formElement.querySelector('button[type="submit"]');
    const errorEl = formElement.querySelector('#form-error') || document.getElementById('form-error');
    
    // État loading
    const originalText = submitBtn.textContent;
    submitBtn.textContent = 'Envoi en cours...';
    submitBtn.disabled = true;
    if (errorEl) errorEl.style.display = 'none';
    
    try {
        const response = await fetch(WEBHOOK_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                ...formData,
                submitted_at: new Date().toISOString(),
                page_url: window.location.href,
                user_agent: navigator.userAgent
            })
        });
        
        if (response.ok) {
            // Succès → Redirection vers page merci
            trackConversion('lead_form', 1);
            window.location.href = '/merci.html';
        } else {
            throw new Error('Erreur serveur');
        }
    } catch (error) {
        console.error('Erreur envoi formulaire:', error);
        
        // Afficher erreur
        if (errorEl) {
            errorEl.textContent = 'Une erreur est survenue. Veuillez réessayer ou nous appeler directement.';
            errorEl.style.display = 'block';
        }
        
        // Reset bouton
        submitBtn.textContent = originalText;
        submitBtn.disabled = false;
    }
}

// === INITIALISATION ===
document.addEventListener('DOMContentLoaded', function() {
    
    // Menu mobile
    const menuToggle = document.querySelector('.menu-toggle');
    const navMenu = document.querySelector('.nav-menu');
    if (menuToggle) {
        menuToggle.addEventListener('click', function() {
            navMenu.classList.toggle('active');
        });
    }
    
    // Click to call tracking
    document.querySelectorAll('a[href^="tel:"]').forEach(link => {
        link.addEventListener('click', function() {
            trackClickToCall('0755188937', this.getAttribute('data-location') || 'unknown');
        });
    });
    
    // Navigation active
    const currentPath = window.location.pathname;
    document.querySelectorAll('.nav-menu a').forEach(link => {
        const href = link.getAttribute('href');
        if (href === currentPath || 
            (currentPath === '/' && href === 'index.html') ||
            currentPath.includes(href.replace('.html', ''))) {
            link.classList.add('active');
        }
    });
    
    // === FORMULAIRES - ENVOI VERS N8N ===
    document.querySelectorAll('form[data-form-name]').forEach(form => {
        form.addEventListener('submit', async function(e) {
            e.preventDefault(); // Empêcher le rechargement de page
            
            const formName = this.getAttribute('data-form-name');
            const formLocation = this.getAttribute('data-form-location');
            
            // Collecter les données du formulaire
            const formData = {
                form_name: formName,
                form_location: formLocation
            };
            
            // Récupérer tous les champs
            const inputs = this.querySelectorAll('input, select, textarea');
            inputs.forEach(input => {
                // Ignorer les checkboxes (on les traite séparément)
                if (input.type === 'checkbox') return;
                
                if (input.name) {
                    formData[input.name] = input.value || '';
                }
            });
            
            // Récupérer les checkboxes cochées (travaux multiples)
            const checkedTravaux = this.querySelectorAll('input[name="travaux"]:checked');
            if (checkedTravaux.length > 0) {
                const travauxValues = Array.from(checkedTravaux).map(cb => cb.value);
                formData['travaux'] = travauxValues.join(', ');
            }
            
            // S'assurer que le message est bien récupéré
            const messageField = this.querySelector('textarea[name="message"]');
            if (messageField) {
                formData['message'] = messageField.value || '';
            }
            
            // Tracking GTM
            trackFormSubmit(formName, formLocation);
            
            // Envoyer vers n8n
            await submitFormToN8n(formData, this);
        });
    });
    
    // Toggle détails optionnels
    document.querySelectorAll('[data-toggle]').forEach(btn => {
        btn.addEventListener('click', function() {
            const targetId = this.getAttribute('data-toggle');
            const target = document.getElementById(targetId);
            if (target) {
                target.classList.toggle('hidden');
                this.textContent = target.classList.contains('hidden') 
                    ? '+ Ajouter des détails (optionnel)' 
                    : '- Masquer les détails';
            }
        });
    });
    
    // Popup devis
    const stickyBtn = document.querySelector('.sticky-devis-btn');
    const popupOverlay = document.querySelector('.devis-popup-overlay');
    const popupClose = document.querySelector('.devis-popup-close');
    
    if (stickyBtn && popupOverlay) {
        stickyBtn.addEventListener('click', function() {
            popupOverlay.classList.add('active');
            document.body.style.overflow = 'hidden';
        });
        
        popupClose.addEventListener('click', function() {
            popupOverlay.classList.remove('active');
            document.body.style.overflow = '';
        });
        
        popupOverlay.addEventListener('click', function(e) {
            if (e.target === popupOverlay) {
                popupOverlay.classList.remove('active');
                document.body.style.overflow = '';
            }
        });
    }
});

// === SCROLL TRACKING (Landing page) ===
if (window.location.pathname.includes('landing')) {
    let tracked25 = false, tracked50 = false, tracked75 = false, tracked100 = false;
    
    window.addEventListener('scroll', function() {
        const percent = (window.scrollY / (document.documentElement.scrollHeight - window.innerHeight)) * 100;
        
        if (percent >= 25 && !tracked25) { trackScrollMilestone(25); tracked25 = true; }
        if (percent >= 50 && !tracked50) { trackScrollMilestone(50); tracked50 = true; }
        if (percent >= 75 && !tracked75) { trackScrollMilestone(75); tracked75 = true; }
        if (percent >= 95 && !tracked100) { trackScrollMilestone(100); tracked100 = true; }
    });
}

// === PAGE MERCI - Conversion tracking ===
if (window.location.pathname.includes('merci')) {
    trackConversion('lead_form', 1);
}

// === SLIDER ===
let currentSlide = 0;
const slides = document.querySelectorAll('.slide');

function showSlide(index) {
    slides.forEach((slide, i) => {
        slide.classList.remove('active');
        if (i === index) slide.classList.add('active');
    });
}

function nextSlide() {
    currentSlide = (currentSlide + 1) % slides.length;
    showSlide(currentSlide);
}

function prevSlide() {
    currentSlide = (currentSlide - 1 + slides.length) % slides.length;
    showSlide(currentSlide);
}

if (slides.length > 0) {
    showSlide(0);
    setInterval(nextSlide, 5000);
    
    const nextBtn = document.querySelector('.slider-next');
    const prevBtn = document.querySelector('.slider-prev');
    if (nextBtn) nextBtn.addEventListener('click', nextSlide);
    if (prevBtn) prevBtn.addEventListener('click', prevSlide);
}

// === ANIMATIONS ===
const observerOptions = {
    threshold: 0.1,
    rootMargin: '0px 0px -50px 0px'
};

const observer = new IntersectionObserver(entries => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            entry.target.classList.add('fade-in');
        }
    });
}, observerOptions);

document.querySelectorAll('.service-card, .card, .gallery-item').forEach(el => {
    observer.observe(el);
});

// === SCROLL TO TOP ===
function scrollToTop() {
    window.scrollTo({ top: 0, behavior: 'smooth' });
}
