/**
 * MISTRAL PRO RENO - Simulateur V3
 * Navigation + Calculs + PDF + Envoi Webhook
 */

(function($) {
    'use strict';

    const TVA_RATE = 0.20;
    const WEBHOOK_URL = 'https://ettia.app.n8n.cloud/webhook/landing-form';
    
    const COMPANY = {
        name: "Mistral Pro Reno",
        address: "9 rue Anatole de la Forge",
        city: "75017 Paris",
        phone: "07 55 18 89 37",
        email: "contact@mistralpro-reno.fr"
    };
    
    // Variable pour stocker le logo en base64
    let companyLogo = null;
    
    // Charger le logo au démarrage
    function loadLogo() {
        const img = new Image();
        img.crossOrigin = 'anonymous';
        img.onload = function() {
            try {
                const canvas = document.createElement('canvas');
                canvas.width = img.width;
                canvas.height = img.height;
                canvas.getContext('2d').drawImage(img, 0, 0);
                companyLogo = canvas.toDataURL('image/png');
                console.log('Logo chargé avec succès');
            } catch(e) {
                console.warn('Erreur conversion logo:', e);
            }
        };
        img.onerror = function() {
            console.warn('Logo non trouvé, utilisation du logo par défaut');
        };
        img.src = 'images/logo.png';
    }
    
    // =====================================================
    // ENVOI WEBHOOK N8N
    // =====================================================
    
    async function sendToWebhook(formData, itemsList, totals) {
        try {
            // Créer une version texte des prestations pour l'email (groupé par catégorie avec colonnes)
            let prestationsTexte = '';
            let currentCategory = '';
            
            itemsList.forEach(item => {
                // Si nouvelle catégorie, ajouter l'en-tête
                if (item.categorie !== currentCategory) {
                    currentCategory = item.categorie;
                    if (prestationsTexte !== '') prestationsTexte += '\n';
                    prestationsTexte += `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n`;
                    prestationsTexte += `${currentCategory.toUpperCase()}\n`;
                    prestationsTexte += `───────────────────────────────────────────────────────────────────────────\n`;
                    prestationsTexte += `DÉSIGNATION                                      QTÉ        P.U.      TOTAL\n`;
                    prestationsTexte += `───────────────────────────────────────────────────────────────────────────\n`;
                }
                // Formater chaque ligne avec colonnes alignées
                const desc = item.description.substring(0, 45).padEnd(45);
                const qty = `${item.quantite} ${item.unite}`.padStart(8);
                const pu = `${item.prix_unitaire} €`.padStart(10);
                const total = `${item.total} €`.padStart(10);
                prestationsTexte += `${desc} ${qty} ${pu} ${total}\n`;
            });
            prestationsTexte += `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n`;
            
            const response = await fetch(WEBHOOK_URL, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    // Infos client
                    nom: formData.nom,
                    telephone: formData.tel,
                    email: formData.email,
                    adresse: formData.adresse,
                    code_postal: formData.cp,
                    ville: formData.ville,
                    
                    // Infos devis
                    numero_devis: formData.quoteNum,
                    date_devis: new Date().toLocaleDateString('fr-FR'),
                    
                    // Totaux (arrondis à 2 décimales)
                    total_ht: Math.round(totals.subtotal * 100) / 100,
                    tva: Math.round(totals.vat * 100) / 100,
                    total_ttc: Math.round(totals.totalTTC * 100) / 100,
                    
                    // Détail prestations (texte formaté pour email)
                    prestations_texte: prestationsTexte,
                    
                    // Métadonnées
                    form_name: 'simulateur-devis',
                    form_location: 'cost_calculator',
                    submitted_at: new Date().toISOString(),
                    page_url: window.location.href
                })
            });
            
            if (response.ok) {
                console.log('Données envoyées au webhook avec succès');
                return true;
            } else {
                console.warn('Erreur webhook:', response.status);
                return false;
            }
        } catch (error) {
            console.error('Erreur envoi webhook:', error);
            return false;
        }
    }

    // =====================================================
    // NAVIGATION
    // =====================================================
    
    function initNavigation() {
        console.log('initNavigation appelée');
        console.log('Nombre de .main-cat trouvés:', $('.main-cat').length);
        console.log('Nombre de .category-panel trouvés:', $('.category-panel').length);
        
        // Catégories principales
        $('.main-cat').on('click', function() {
            const cat = $(this).data('category');
            console.log('Clic sur catégorie:', cat);
            
            $('.main-cat').removeClass('active');
            $(this).addClass('active');
            $('.category-panel').removeClass('active');
            $(`.category-panel[data-category="${cat}"]`).addClass('active');
            
            // Active le premier sub-tab
            const $panel = $(`.category-panel[data-category="${cat}"]`);
            console.log('Panel trouvé:', $panel.length);
            $panel.find('.sub-tab').removeClass('active').first().addClass('active');
            $panel.find('.sub-content').removeClass('active').first().addClass('active');
        });

        // Sous-catégories
        $('.sub-tab').on('click', function() {
            const sub = $(this).data('sub');
            console.log('Clic sur sous-catégorie:', sub);
            const $panel = $(this).closest('.category-panel');
            $panel.find('.sub-tab').removeClass('active');
            $(this).addClass('active');
            $panel.find('.sub-content').removeClass('active');
            $panel.find(`.sub-content[data-sub="${sub}"]`).addClass('active');
        });
    }

    // =====================================================
    // CALCULS
    // =====================================================
    
    function calculateTotal() {
        let total = 0;

        // Checkboxes
        $('input[type="checkbox"]:checked').each(function() {
            total += parseFloat($(this).data('price')) || 0;
        });

        // Sliders avec prix fixe
        const fixedPrices = {
            'robinets': 150, 'tuyauterie': 35, 'carrelage-sdb': 55,
            'points-lumineux': 80, 'prises': 60, 'interrupteurs': 50, 'radiateurs': 300,
            'depose-sol': 15, 'reagreage': 45, 'chape-sol': 45, 'facade-peinture': 35,
            'cloisons': 45, 'dalle-beton': 70, 'demolition': 80,
            'isolation-murs': 45, 'isolation-combles': 35, 'ite': 120,
            'faux-plafond': 45, 'placo-murs': 35,
            'extension': 1800, 'terrassement': 50, 'fondations': 200,
            'portes-int': 350, 'plinthes': 12,
            'fenetres': 450, 'porte-entree': 1800, 'volets': 500,
            'toiture': 120, 'velux': 800, 'zinguerie': 80,
            'placards': 500
        };

        for (const [id, price] of Object.entries(fixedPrices)) {
            const qty = parseFloat($('#' + id).val()) || 0;
            const itemTotal = qty * price;
            total += itemTotal;
            $(`#${id}-total`).text(formatCurrency(itemTotal));
            
            // Highlight si valeur
            const $row = $(`#${id}`).closest('.slider-row');
            if (qty > 0) {
                $row.css('background', '#fff8e1');
            } else {
                $row.css('background', '');
            }
        }

        // Sliders avec gamme variable
        const variablePrices = {
            'murs-peinture': 'type-peinture-murs',
            'plafonds-peinture': 'type-peinture-plafonds',
            'parquet-massif': 'gamme-parquet-massif',
            'carrelage-sol': 'gamme-carrelage-sol',
            'lino-sol': 'gamme-lino-sol',
            'faience-mur': 'gamme-faience-mur',
            'credence-mur': 'gamme-credence-mur',
            'cuisine': 'gamme-cuisine'
        };

        for (const [sliderId, selectId] of Object.entries(variablePrices)) {
            const qty = parseFloat($('#' + sliderId).val()) || 0;
            const price = parseFloat($('#' + selectId).val()) || 0;
            const itemTotal = qty * price;
            total += itemTotal;
            $(`#${sliderId}-total`).text(formatCurrency(itemTotal));
            
            const $row = $(`#${sliderId}`).closest('.slider-row');
            if (qty > 0) {
                $row.css('background', '#fff8e1');
            } else {
                $row.css('background', '');
            }
        }

        // Selects (packs)
        $('select').each(function() {
            const id = $(this).attr('id');
            if (id && !id.startsWith('gamme-') && !id.startsWith('type-peinture')) {
                total += parseFloat($(this).val()) || 0;
            }
        });

        // Calcul TVA
        const vat = total * TVA_RATE;
        const totalTTC = total + vat;

        // Affichage
        $('#subtotal').text(formatCurrency(total));
        $('#vat').text(formatCurrency(vat));
        $('#total').text(formatCurrency(totalTTC));

        // Mise à jour compteurs
        updateCounts();
    }

    function formatCurrency(amount) {
        return new Intl.NumberFormat('fr-FR', {
            style: 'currency',
            currency: 'EUR',
            minimumFractionDigits: 0,
            maximumFractionDigits: 0
        }).format(amount);
    }

    function updateCounts() {
        const categories = ['plomberie', 'electricite', 'peinture', 'gros-oeuvre', 'menuiserie'];
        
        categories.forEach(cat => {
            let count = 0;
            const $panel = $(`.category-panel[data-category="${cat}"]`);
            
            // Compte checkboxes cochées
            $panel.find('input[type="checkbox"]:checked').each(function() {
                count++;
            });
            
            // Compte sliders > 0
            $panel.find('input[type="range"]').each(function() {
                if (parseFloat($(this).val()) > 0) count++;
            });
            
            // Compte selects > 0 (sauf gammes)
            $panel.find('select').each(function() {
                const id = $(this).attr('id');
                if (id && !id.startsWith('gamme-') && !id.startsWith('type-peinture')) {
                    if (parseFloat($(this).val()) > 0) count++;
                }
            });
            
            const $countEl = $(`#count-${cat}`);
            $countEl.text(count);
            if (count > 0) {
                $countEl.addClass('has-value');
            } else {
                $countEl.removeClass('has-value');
            }
        });
    }

    // =====================================================
    // SLIDERS SYNC
    // =====================================================
    
    function initSliders() {
        // Range -> Number
        $('input[type="range"]').on('input', function() {
            const id = $(this).attr('id');
            $('#' + id + '-number').val($(this).val());
            calculateTotal();
        });

        // Number -> Range
        $('.qty-input').on('input', function() {
            const id = $(this).attr('id').replace('-number', '');
            const $range = $('#' + id);
            if ($range.length) {
                let val = parseInt($(this).val()) || 0;
                const max = parseInt($range.attr('max')) || 9999;
                val = Math.min(Math.max(0, val), max);
                $(this).val(val);
                $range.val(val);
            }
            calculateTotal();
        });

        $('.qty-input').on('blur', function() {
            if ($(this).val() === '') {
                $(this).val(0);
                const id = $(this).attr('id').replace('-number', '');
                $('#' + id).val(0);
                calculateTotal();
            }
        });
    }

    // =====================================================
    // EVENTS
    // =====================================================
    
    function initEvents() {
        $('input[type="checkbox"], select').on('change', calculateTotal);

        // Reset
        $('#resetBtn').on('click', function() {
            if (confirm('Réinitialiser tous les champs ?')) {
                $('input[type="checkbox"]').prop('checked', false);
                $('input[type="range"]').val(0);
                $('.qty-input').val(0);
                $('select').prop('selectedIndex', 0);
                $('#clientForm')[0].reset();
                $('.slider-row').css('background', '');
                calculateTotal();
            }
        });

        // Download PDF
        console.log('Attachement événement printQuote');
        $('#printQuote').on('click', generatePDF);
    }

    // =====================================================
    // IMPRESSION DEVIS
    // =====================================================
    
    function printDevis() {
        console.log('printDevis appelée');
        
        const $formMessage = $('#formMessage');
        const $clientForm = $('.client-form');
        
        console.log('formMessage trouvé:', $formMessage.length);
        console.log('clientForm trouvé:', $clientForm.length);
        
        // Validation des champs obligatoires
        const nom = $('#client-nom').val().trim();
        const tel = $('#client-tel').val().trim();
        const email = $('#client-email').val().trim();
        const cp = $('#client-cp').val().trim();
        
        console.log('Valeurs:', { nom, tel, email, cp });

        if (!nom || !tel || !email || !cp) {
            console.log('Validation échouée - affichage message');
            $formMessage.addClass('show');
            $clientForm.addClass('highlight');
            setTimeout(() => {
                $formMessage.removeClass('show');
                $clientForm.removeClass('highlight');
            }, 3000);
            return;
        }

        if (!/^[0-9]{5}$/.test(cp)) {
            $formMessage.text('⚠️ Code postal invalide (5 chiffres)').addClass('show');
            $clientForm.addClass('highlight');
            setTimeout(() => {
                $formMessage.removeClass('show');
                $formMessage.text('⚠️ Veuillez compléter votre formulaire');
                $clientForm.removeClass('highlight');
            }, 3000);
            return;
        }

        // Masquer le message si tout est OK
        $formMessage.removeClass('show');
        $clientForm.removeClass('highlight');

        // Lancer l'impression
        window.print();
    }

    // =====================================================
    // PDF GENERATION - FORMAT PROFESSIONNEL
    // =====================================================
    
    function generatePDF() {
        const $formMessage = $('#formMessage');
        const $clientForm = $('.client-form');
        
        // Validation des champs obligatoires
        const nom = $('#client-nom').val().trim();
        const tel = $('#client-tel').val().trim();
        const email = $('#client-email').val().trim();
        const cp = $('#client-cp').val().trim();
        const adresse = $('#client-adresse').val().trim();
        const ville = $('#client-ville').val().trim();

        if (!nom || !tel || !email || !cp) {
            $formMessage.addClass('show');
            $clientForm.addClass('highlight');
            setTimeout(() => {
                $formMessage.removeClass('show');
                $clientForm.removeClass('highlight');
            }, 3000);
            return;
        }

        if (!/^[0-9]{5}$/.test(cp)) {
            $formMessage.text('⚠️ Code postal invalide (5 chiffres)').addClass('show');
            $clientForm.addClass('highlight');
            setTimeout(() => {
                $formMessage.removeClass('show');
                $formMessage.text('⚠️ Veuillez compléter votre formulaire');
                $clientForm.removeClass('highlight');
            }, 3000);
            return;
        }

        // Masquer le message si tout est OK
        $formMessage.removeClass('show');
        $clientForm.removeClass('highlight');

        // Collecte items par catégorie
        const itemsByCategory = {};
        
        $('input[type="checkbox"]:checked').each(function() {
            const category = $(this).closest('.category-panel').data('category') || 
                           $(this).closest('.sub-content').prev('.sub-tabs').find('.sub-tab.active').text() ||
                           'Prestations';
            const catName = getCategoryName(category);
            
            if (!itemsByCategory[catName]) itemsByCategory[catName] = [];
            
            itemsByCategory[catName].push({
                desc: $(this).data('label') || $(this).closest('label').find('strong').text(),
                qty: 1,
                unit: 'u',
                price: parseFloat($(this).data('price')) || 0
            });
        });

        $('input[type="range"]').each(function() {
            const qty = parseFloat($(this).val()) || 0;
            if (qty > 0) {
                const id = $(this).attr('id');
                let price = parseFloat($(this).data('price')) || 0;
                
                const $gamme = $(`#gamme-${id}, #type-peinture-${id.replace('-peinture', '')}`);
                if ($gamme.length && !price) {
                    price = parseFloat($gamme.val()) || 0;
                }
                
                if (price > 0) {
                    const category = $(this).closest('.category-panel').data('category') || 'Prestations';
                    const catName = getCategoryName(category);
                    
                    if (!itemsByCategory[catName]) itemsByCategory[catName] = [];
                    
                    itemsByCategory[catName].push({
                        desc: $(this).data('label') || $(`label[for="${id}"]`).text().split('(')[0].trim(),
                        qty: qty,
                        unit: getUnit(id),
                        price: price
                    });
                }
            }
        });

        $('select').each(function() {
            const id = $(this).attr('id');
            // Exclure les selects de gamme/type (ils sont juste pour définir le prix unitaire)
            if (id && 
                !id.startsWith('gamme-') && 
                !id.startsWith('type-peinture') &&
                !$(this).hasClass('gamme-select')) {
                const val = parseFloat($(this).val()) || 0;
                if (val > 0) {
                    const category = $(this).closest('.category-panel').data('category') || 'Prestations';
                    const catName = getCategoryName(category);
                    
                    if (!itemsByCategory[catName]) itemsByCategory[catName] = [];
                    
                    // Priorité: data-label de l'option > data-label du select > label > texte option
                    const $selectedOption = $(this).find('option:selected');
                    const label = $selectedOption.data('label') || 
                                  $(this).data('label') || 
                                  $(this).closest('.select-box').find('label').text().trim().split('(')[0].trim();
                    
                    itemsByCategory[catName].push({
                        desc: label,
                        qty: 1,
                        unit: 'forfait',
                        price: val
                    });
                }
            }
        });

        const allItems = Object.values(itemsByCategory).flat();
        if (allItems.length === 0) {
            alert('Veuillez sélectionner au moins une prestation');
            return;
        }

        // =====================================================
        // GÉNÉRATION PDF PROFESSIONNEL
        // =====================================================
        const { jsPDF } = window.jspdf;
        const doc = new jsPDF();
        
        const date = new Date();
        const dateStr = date.toLocaleDateString('fr-FR');
        const validityDate = new Date(date);
        validityDate.setDate(validityDate.getDate() + 30);
        const validityStr = validityDate.toLocaleDateString('fr-FR');
        
        const quoteNum = 'DEV-' + date.getFullYear() + 
            String(date.getMonth() + 1).padStart(2, '0') + 
            String(date.getDate()).padStart(2, '0') + '-' + 
            String(Math.floor(Math.random() * 9000) + 1000);

        let y = 15;

        // ===== LOGO (haut gauche) =====
        if (companyLogo) {
            try {
                doc.addImage(companyLogo, 'PNG', 15, y, 40, 40);
            } catch(e) {
                drawLogoFallback(doc, y);
            }
        } else {
            drawLogoFallback(doc, y);
        }

        // ===== TITRE DEVIS (haut droite) =====
        doc.setFontSize(28);
        doc.setTextColor(74, 144, 226);
        doc.setFont(undefined, 'bold');
        doc.text('Devis', 175, 20);
        
        doc.setFontSize(9);
        doc.setTextColor(80, 80, 80);
        doc.setFont(undefined, 'normal');
        doc.text('N° ' + quoteNum, 150, 28);
        doc.text('En date du : ' + dateStr, 150, 32);
        doc.text('Valable jusqu\'au : ' + validityStr, 150, 36);
        doc.text('Votre contact : Mistral', 150, 40);
        doc.text('Tél : ' + COMPANY.phone, 150, 44);
        doc.text('Email : ' + COMPANY.email, 150, 48);

        // ===== LIGNE SÉPARATRICE =====
        y = 60;
        doc.setDrawColor(74, 144, 226);
        doc.setLineWidth(0.5);
        doc.line(15, y, 195, y);

        // ===== INFOS ENTREPRISE (gauche, sous la ligne) =====
        y = 68;
        doc.setFontSize(12);
        doc.setTextColor(74, 144, 226);
        doc.setFont(undefined, 'bold');
        doc.text('Mistral Pro Reno', 15, y);
        
        y += 5;
        doc.setFontSize(9);
        doc.setTextColor(0, 0, 0);
        doc.setFont(undefined, 'normal');
        doc.text(COMPANY.address, 15, y);
        y += 4;
        doc.text(COMPANY.city, 15, y);
        y += 4;
        doc.text('TVA N° FR74851558882', 15, y);
        y += 4;
        doc.setTextColor(74, 144, 226);
        doc.setFont(undefined, 'bold');
        doc.text('Tél : ' + COMPANY.phone, 15, y);
        y += 4;
        doc.setTextColor(0, 0, 0);
        doc.setFont(undefined, 'normal');
        doc.text('Email : ' + COMPANY.email, 15, y);

        // ===== INFOS CLIENT (droite, sous la ligne) =====
        let yClient = 68;
        doc.setFontSize(11);
        doc.setTextColor(0, 0, 0);
        doc.setFont(undefined, 'bold');
        doc.text(nom, 110, yClient);
        
        yClient += 5;
        doc.setFontSize(9);
        doc.setFont(undefined, 'normal');
        if (adresse) {
            doc.text(adresse, 110, yClient);
            yClient += 4;
        }
        const cpVilleStr = [cp, ville].filter(Boolean).join(' ');
        doc.text(cpVilleStr, 110, yClient);
        yClient += 4;
        doc.text('France', 110, yClient);
        yClient += 4;
        doc.text(tel, 110, yClient);
        yClient += 4;
        if (email) {
            doc.text(email, 110, yClient);
        }

        // ===== TITRE DEVIS ESTIMATIF =====
        y = 95;
        doc.setFontSize(11);
        doc.setTextColor(0, 0, 0);
        doc.setFont(undefined, 'bold');
        doc.text('Devis Estimatif - Travaux de Rénovation', 15, y);

        // ===== EN-TÊTE TABLEAU =====
        y += 8;
        doc.setFillColor(74, 144, 226);
        doc.rect(15, y - 4, 180, 7, 'F');
        doc.setTextColor(255, 255, 255);
        doc.setFontSize(8);
        doc.setFont(undefined, 'bold');
        doc.text('N°', 17, y);
        doc.text('DÉSIGNATION', 27, y);
        doc.text('QTÉ', 115, y);
        doc.text('PRIX U.', 135, y);
        doc.text('TVA', 155, y);
        doc.text('TOTAL HT', 175, y);

        y += 5;
        doc.setTextColor(0, 0, 0);
        
        // ===== CONTENU TABLEAU PAR CATÉGORIE =====
        let subtotal = 0;
        let sectionNum = 1;

        Object.keys(itemsByCategory).forEach(catName => {
            const items = itemsByCategory[catName];
            let catTotal = 0;
            items.forEach(item => catTotal += item.qty * item.price);
            
            // Vérifier saut de page
            if (y > 250) {
                doc.addPage();
                y = 20;
            }
            
            // Titre catégorie
            y += 6;
            doc.setFillColor(240, 240, 240);
            doc.rect(15, y - 4, 180, 6, 'F');
            doc.setFont(undefined, 'bold');
            doc.setFontSize(9);
            doc.text(sectionNum + '', 17, y);
            doc.text(catName.toUpperCase(), 27, y);
            doc.text(formatPrice(catTotal), 180, y);
            
            // Items de la catégorie
            let itemNum = 1;
            items.forEach(item => {
                if (y > 270) {
                    doc.addPage();
                    y = 20;
                }
                
                y += 5;
                const total = item.qty * item.price;
                subtotal += total;
                
                doc.setFont(undefined, 'normal');
                doc.setFontSize(8);
                
                // Numéro
                doc.text(sectionNum + '.' + itemNum, 17, y);
                
                // Description (tronquée si trop longue)
                const desc = item.desc.length > 50 ? item.desc.substring(0, 50) + '...' : item.desc;
                doc.text(desc, 27, y);
                
                // Quantité + unité
                doc.text(item.qty + ' ' + item.unit, 115, y);
                
                // Prix unitaire
                doc.text(formatPrice(item.price), 135, y);
                
                // TVA
                doc.text('20 %', 155, y);
                
                // Total
                doc.text(formatPrice(total), 175, y);
                
                itemNum++;
            });
            
            sectionNum++;
        });

        // ===== TOTAUX =====
        y += 15;
        if (y > 250) {
            doc.addPage();
            y = 30;
        }
        
        doc.setDrawColor(74, 144, 226);
        doc.setLineWidth(0.5);
        doc.line(120, y, 190, y);
        
        const vat = subtotal * TVA_RATE;
        const totalTTC = subtotal + vat;
        const acompte = Math.round(totalTTC * 0.3);
        const solde = totalTTC - acompte;
        
        y += 8;
        doc.setFontSize(10);
        doc.setFont(undefined, 'normal');
        doc.text('Total HT', 125, y);
        doc.text(formatPrice(subtotal), 185, y, { align: 'right' });
        
        y += 6;
        doc.text('TVA 20%', 125, y);
        doc.text(formatPrice(vat), 185, y, { align: 'right' });
        
        y += 8;
        doc.setFont(undefined, 'bold');
        doc.setFontSize(11);
        doc.text('Total TTC', 125, y);
        doc.text(formatPrice(totalTTC), 185, y, { align: 'right' });
        
        // ===== ENCADRÉ NET À PAYER =====
        y += 10;
        doc.setFillColor(74, 144, 226);
        doc.rect(120, y - 5, 70, 10, 'F');
        doc.setTextColor(255, 255, 255);
        doc.setFontSize(10);
        doc.text('NET À PAYER', 125, y);
        doc.text(formatPrice(totalTTC), 185, y, { align: 'right' });

        // ===== CONDITIONS DE PAIEMENT (gauche) =====
        let yConditions = y - 30;
        if (yConditions < 200) yConditions = y - 30;
        
        doc.setTextColor(0, 0, 0);
        doc.setFont(undefined, 'bold');
        doc.setFontSize(9);
        doc.text('Conditions de paiement', 20, yConditions);
        
        yConditions += 5;
        doc.setFont(undefined, 'normal');
        doc.setFontSize(8);
        doc.text('Acompte de 30% à la signature : ' + formatPrice(acompte) + ' TTC', 20, yConditions);
        yConditions += 4;
        doc.text('Solde à la fin des travaux : ' + formatPrice(solde) + ' TTC', 20, yConditions);
        yConditions += 4;
        doc.text('Paiement par virement bancaire.', 20, yConditions);

        // ===== FOOTER =====
        const pageCount = doc.internal.getNumberOfPages();
        for (let i = 1; i <= pageCount; i++) {
            doc.setPage(i);
            doc.setFontSize(7);
            doc.setTextColor(100, 100, 100);
            doc.setFont(undefined, 'normal');
            doc.text('Capital 1000 € - 85155888200029 RCS Paris - APE : 4120A', 105, 282, { align: 'center' });
            doc.text('Garantie décennale - HOKEN ASSURANCE - 25 Rue Marbeuf, 75008 Paris', 105, 286, { align: 'center' });
            doc.text('Page ' + i + ' / ' + pageCount, 185, 286, { align: 'right' });
        }

        // ===== NOM DU FICHIER =====
        // Nettoyer le nom du client pour le nom de fichier
        const nomClean = nom.replace(/[^a-zA-Z0-9]/g, '-').replace(/-+/g, '-').toUpperCase();
        const fileName = 'Devis-' + quoteNum + '-' + nomClean;
        
        // Définir les propriétés du document
        doc.setProperties({
            title: fileName,
            subject: 'Devis travaux de rénovation',
            author: COMPANY.name,
            creator: COMPANY.name
        });

        // ===== ENVOI WEBHOOK N8N =====
        // Préparer la liste des prestations pour le webhook
        const itemsList = [];
        Object.keys(itemsByCategory).forEach(catName => {
            itemsByCategory[catName].forEach(item => {
                itemsList.push({
                    categorie: catName,
                    description: item.desc,
                    quantite: item.qty,
                    unite: item.unit,
                    prix_unitaire: item.price,
                    total: item.qty * item.price
                });
            });
        });
        
        // Envoyer au webhook (sans PDF, juste les données)
        sendToWebhook(
            { nom, tel, email, adresse, cp, ville, quoteNum },
            itemsList,
            { subtotal, vat, totalTTC }
        );

        // ===== OUVRIR POUR IMPRESSION =====
        const pdfBlob = doc.output('blob');
        const pdfUrl = URL.createObjectURL(pdfBlob);
        const printWindow = window.open(pdfUrl, '_blank');
        
        if (printWindow) {
            printWindow.onload = function() {
                // Définir le titre de la fenêtre
                printWindow.document.title = fileName;
                printWindow.print();
                setTimeout(function() {
                    URL.revokeObjectURL(pdfUrl);
                }, 1000);
            };
        } else {
            doc.save(fileName + '.pdf');
            URL.revokeObjectURL(pdfUrl);
        }
    }
    
    // Fonction pour formater les prix
    function formatPrice(amount) {
        return Math.round(amount).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ' ') + ' €';
    }
    
    // Fonction pour obtenir le nom de catégorie lisible
    function getCategoryName(category) {
        const names = {
            'plomberie': 'Plomberie & Sanitaires',
            'electricite': 'Électricité',
            'peinture': 'Peinture & Revêtements',
            'gros-oeuvre': 'Gros Œuvre',
            'menuiserie': 'Menuiserie'
        };
        return names[category] || category || 'Prestations';
    }

    function getUnit(id) {
        if (id.includes('m2') || id.includes('peinture') || id.includes('sol') || 
            id.includes('mur') || id.includes('plafond') || id.includes('isolation') ||
            id.includes('placo') || id.includes('toiture') || id.includes('extension') ||
            id.includes('cloison') || id.includes('dalle') || id.includes('faux-plafond')) {
            return 'm²';
        }
        if (id.includes('ml') || id.includes('tuyauterie') || id.includes('plinthe') ||
            id.includes('zinguerie') || id.includes('cuisine') || id.includes('placard')) {
            return 'ml';
        }
        if (id.includes('m3') || id.includes('demolition') || id.includes('terrassement') ||
            id.includes('fondation')) {
            return 'm³';
        }
        return 'u';
    }
    
    // Fonction pour dessiner le logo fallback (cercle MPR)
    function drawLogoFallback(doc, y) {
        doc.setDrawColor(74, 144, 226);
        doc.setLineWidth(2);
        doc.circle(32, y + 17, 16, 'S');
        doc.setFontSize(12);
        doc.setTextColor(74, 144, 226);
        doc.setFont(undefined, 'bold');
        doc.text('MPR', 24, y + 20);
    }

    // =====================================================
    // INIT
    // =====================================================
    
    $(document).ready(function() {
        loadLogo(); // Charger le logo
        initNavigation();
        initSliders();
        initEvents();
        calculateTotal();
        console.log('Simulateur Mistral Pro Reno V3 ready');
    });

})(jQuery);