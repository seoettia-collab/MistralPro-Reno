/**
 * MISTRAL PRO RENO - Simulateur de Devis V2
 * Navigation 3 Niveaux + Calculs
 */

(function($) {
    'use strict';

    const TVA_RATE = 0.20;
    const VERSION = "v2.0";

    // Infos entreprise pour le PDF
    const COMPANY = {
        name: "Mistral Pro Reno",
        address: "9 rue Anatole de la Forge",
        city: "75017 Paris France",
        tva: "FR74851558882",
        phone: "07 55 18 89 37",
        email: "contact@mistralpro-reno.fr",
        capital: "1000 €",
        rcs: "85155888200029 RCS Paris",
        ape: "4120A",
        assurance: "HOKEN ASSURANCE - 25 Rue Marbeuf, 75008 Paris"
    };

    let logoDataUrl = null;

    // =====================================================
    // NAVIGATION 3 NIVEAUX
    // =====================================================

    function initNavigation() {
        // Catégories principales
        $('.main-cat').on('click', function() {
            const category = $(this).data('category');
            
            // Active le bouton
            $('.main-cat').removeClass('active');
            $(this).addClass('active');
            
            // Affiche le contenu
            $('.category-content').removeClass('active');
            $(`.category-content[data-category="${category}"]`).addClass('active');
            
            // Reset les sous-catégories à la première
            const firstSubCat = $(`.category-content[data-category="${category}"] .sub-cat`).first();
            if (firstSubCat.length) {
                firstSubCat.trigger('click');
            }
        });

        // Sous-catégories
        $('.sub-cat').on('click', function() {
            const subCategory = $(this).data('sub');
            const parentContent = $(this).closest('.category-content');
            
            // Active le bouton
            parentContent.find('.sub-cat').removeClass('active');
            $(this).addClass('active');
            
            // Affiche les options
            parentContent.find('.options-section').removeClass('active');
            parentContent.find(`.options-section[data-sub="${subCategory}"]`).addClass('active');
        });
    }

    // =====================================================
    // CALCULS
    // =====================================================

    function calculateTotal() {
        let total = 0;

        // Plomberie & SDB
        total += getCheckboxPrice('wc');
        total += getCheckboxPrice('lavabo');
        total += getCheckboxPrice('douche');
        total += getCheckboxPrice('baignoire');
        total += getCheckboxPrice('ballon-eau');
        total += getCheckboxPrice('adoucisseur');
        total += getSliderValue('robinets') * 150;
        total += getSliderValue('tuyauterie') * 35;
        total += getSelectValue('pack-sdb');
        total += getSliderValue('carrelage-sdb') * 55;
        total += getCheckboxPrice('meuble-sdb');
        total += getCheckboxPrice('colonne-douche');

        // Électricité & Chauffage
        total += getSelectValue('tableau-electrique');
        total += getSliderValue('points-lumineux') * 80;
        total += getSliderValue('prises') * 60;
        total += getSliderValue('interrupteurs') * 50;
        total += getSliderValue('radiateurs') * 300;
        total += getCheckboxPrice('clim-mono');
        total += getCheckboxPrice('clim-multi');
        total += getCheckboxPrice('gainable');
        total += getCheckboxPrice('vmc-simple');
        total += getCheckboxPrice('vmc-double');

        // Peinture & Sols
        total += getSliderValue('murs-peinture') * getSelectValue('type-peinture-murs');
        total += getSliderValue('plafonds-peinture') * getSelectValue('type-peinture-plafonds');
        total += getSliderValue('parquet-massif') * getSelectValue('gamme-parquet-massif');
        total += getSliderValue('parquet-contrecolle') * getSelectValue('gamme-parquet-contrecolle');
        total += getSliderValue('carrelage-sol') * getSelectValue('gamme-carrelage-sol');
        total += getSliderValue('lino-sol') * getSelectValue('gamme-lino-sol');
        total += getSliderValue('dalle-pvc') * getSelectValue('gamme-dalle-pvc');
        total += getSliderValue('faience-mur') * getSelectValue('gamme-faience-mur');
        total += getSliderValue('credence-mur') * getSelectValue('gamme-credence-mur');
        total += getSliderValue('depose-sol') * 15;
        total += getSliderValue('reagreage') * 45;
        total += getSliderValue('chape-sol') * 45;
        total += getSliderValue('primaire-sol') * 15;
        total += getSelectValue('ravalement');
        total += getSliderValue('facade-peinture') * 35;

        // Gros Œuvre
        total += getSelectValue('mur-porteur');
        total += getSliderValue('cloisons') * 45;
        total += getSliderValue('dalle-beton') * 70;
        total += getSliderValue('demolition') * 80;
        total += getSliderValue('isolation-murs') * 45;
        total += getSliderValue('isolation-combles') * 35;
        total += getSliderValue('ite') * 120;
        total += getSliderValue('placo-murs') * 35;
        total += getSliderValue('placo-cloisons') * 40;
        total += getSliderValue('faux-plafond') * 45;
        total += getSliderValue('enduit-lissage') * 18;
        total += getSliderValue('bandes-joints') * 8;
        total += getCheckboxPrice('placo-phonique');
        total += getCheckboxPrice('placo-hydrofuge');
        total += getSliderValue('extension') * 1800;
        total += getSliderValue('terrassement') * 50;
        total += getSliderValue('fondations') * 200;
        total += getSliderValue('charpente') * 180;

        // Menuiserie & Finitions
        total += getSliderValue('portes-int') * 350;
        total += getSliderValue('portes-bloc') * 250;
        total += getSliderValue('plinthes') * 12;
        total += getSliderValue('fenetres') * 450;
        total += getSliderValue('porte-entree') * 1800;
        total += getSliderValue('volets') * 500;
        total += getSliderValue('toiture') * 120;
        total += getSliderValue('zinguerie') * 80;
        total += getSliderValue('velux') * 800;
        total += getSliderValue('cuisine') * getSelectValue('gamme-cuisine');
        total += getSliderValue('placards') * 500;
        total += getCheckboxPrice('dressing');
        total += getCheckboxPrice('bibliotheque');

        // Calcul TVA et Total TTC
        const vat = total * TVA_RATE;
        const totalTTC = total + vat;

        // Mise à jour affichage
        $('#subtotal').text(formatCurrency(total));
        $('#vat').text(formatCurrency(vat));
        $('#total').text(formatCurrency(totalTTC));

        // Mise à jour des totaux individuels des sliders
        updateSliderTotals();

        // Mise à jour des badges de catégories
        updateCategoryBadges();
    }

    function getCheckboxPrice(id) {
        const $el = $('#' + id);
        if ($el.is(':checked')) {
            return parseFloat($el.data('price')) || 0;
        }
        return 0;
    }

    function getSliderValue(id) {
        return parseFloat($('#' + id).val()) || 0;
    }

    function getSelectValue(id) {
        return parseFloat($('#' + id).val()) || 0;
    }

    function formatCurrency(amount) {
        return new Intl.NumberFormat('fr-FR', {
            style: 'currency',
            currency: 'EUR',
            minimumFractionDigits: 0,
            maximumFractionDigits: 0
        }).format(amount);
    }

    function updateSliderTotals() {
        // Liste des sliders avec prix fixe
        const fixedPriceSliders = {
            'robinets': 150,
            'tuyauterie': 35,
            'carrelage-sdb': 55,
            'points-lumineux': 80,
            'prises': 60,
            'interrupteurs': 50,
            'radiateurs': 300,
            'depose-sol': 15,
            'reagreage': 45,
            'chape-sol': 45,
            'primaire-sol': 15,
            'facade-peinture': 35,
            'cloisons': 45,
            'dalle-beton': 70,
            'demolition': 80,
            'isolation-murs': 45,
            'isolation-combles': 35,
            'ite': 120,
            'placo-murs': 35,
            'placo-cloisons': 40,
            'faux-plafond': 45,
            'enduit-lissage': 18,
            'bandes-joints': 8,
            'extension': 1800,
            'terrassement': 50,
            'fondations': 200,
            'charpente': 180,
            'portes-int': 350,
            'portes-bloc': 250,
            'plinthes': 12,
            'fenetres': 450,
            'porte-entree': 1800,
            'volets': 500,
            'toiture': 120,
            'zinguerie': 80,
            'velux': 800,
            'placards': 500
        };

        // Sliders avec gamme (prix variable)
        const variablePriceSliders = {
            'murs-peinture': 'type-peinture-murs',
            'plafonds-peinture': 'type-peinture-plafonds',
            'parquet-massif': 'gamme-parquet-massif',
            'parquet-contrecolle': 'gamme-parquet-contrecolle',
            'carrelage-sol': 'gamme-carrelage-sol',
            'lino-sol': 'gamme-lino-sol',
            'dalle-pvc': 'gamme-dalle-pvc',
            'faience-mur': 'gamme-faience-mur',
            'credence-mur': 'gamme-credence-mur',
            'cuisine': 'gamme-cuisine'
        };

        // Mise à jour des totaux fixes
        for (const [sliderId, price] of Object.entries(fixedPriceSliders)) {
            const qty = getSliderValue(sliderId);
            const total = qty * price;
            const $totalEl = $(`#${sliderId}-total`);
            if ($totalEl.length) {
                $totalEl.text(formatCurrency(total));
            }
            
            // Ajoute classe has-value si valeur > 0
            const $card = $(`#${sliderId}`).closest('.slider-card');
            if (qty > 0) {
                $card.addClass('has-value');
            } else {
                $card.removeClass('has-value');
            }
        }

        // Mise à jour des totaux variables
        for (const [sliderId, selectId] of Object.entries(variablePriceSliders)) {
            const qty = getSliderValue(sliderId);
            const price = getSelectValue(selectId);
            const total = qty * price;
            const $totalEl = $(`#${sliderId}-total`);
            if ($totalEl.length) {
                $totalEl.text(formatCurrency(total));
            }
            
            const $card = $(`#${sliderId}`).closest('.slider-card');
            if (qty > 0) {
                $card.addClass('has-value');
            } else {
                $card.removeClass('has-value');
            }
        }
    }

    function updateCategoryBadges() {
        // Compte les sélections par catégorie
        const counts = {
            'plomberie': 0,
            'electricite': 0,
            'peinture': 0,
            'gros-oeuvre': 0,
            'menuiserie': 0
        };

        // Plomberie
        $('.category-content[data-category="plomberie"] input[type="checkbox"]:checked').each(function() {
            counts['plomberie']++;
        });
        $('.category-content[data-category="plomberie"] input[type="range"]').each(function() {
            if (parseFloat($(this).val()) > 0) counts['plomberie']++;
        });
        $('.category-content[data-category="plomberie"] select').each(function() {
            if (parseFloat($(this).val()) > 0) counts['plomberie']++;
        });

        // Électricité
        $('.category-content[data-category="electricite"] input[type="checkbox"]:checked').each(function() {
            counts['electricite']++;
        });
        $('.category-content[data-category="electricite"] input[type="range"]').each(function() {
            if (parseFloat($(this).val()) > 0) counts['electricite']++;
        });
        $('.category-content[data-category="electricite"] select').each(function() {
            if (parseFloat($(this).val()) > 0) counts['electricite']++;
        });

        // Peinture
        $('.category-content[data-category="peinture"] input[type="checkbox"]:checked').each(function() {
            counts['peinture']++;
        });
        $('.category-content[data-category="peinture"] input[type="range"]').each(function() {
            if (parseFloat($(this).val()) > 0) counts['peinture']++;
        });
        $('.category-content[data-category="peinture"] select').each(function() {
            if (parseFloat($(this).val()) > 0) counts['peinture']++;
        });

        // Gros Œuvre
        $('.category-content[data-category="gros-oeuvre"] input[type="checkbox"]:checked').each(function() {
            counts['gros-oeuvre']++;
        });
        $('.category-content[data-category="gros-oeuvre"] input[type="range"]').each(function() {
            if (parseFloat($(this).val()) > 0) counts['gros-oeuvre']++;
        });
        $('.category-content[data-category="gros-oeuvre"] select').each(function() {
            if (parseFloat($(this).val()) > 0) counts['gros-oeuvre']++;
        });

        // Menuiserie
        $('.category-content[data-category="menuiserie"] input[type="checkbox"]:checked').each(function() {
            counts['menuiserie']++;
        });
        $('.category-content[data-category="menuiserie"] input[type="range"]').each(function() {
            if (parseFloat($(this).val()) > 0) counts['menuiserie']++;
        });
        $('.category-content[data-category="menuiserie"] select').each(function() {
            if (parseFloat($(this).val()) > 0) counts['menuiserie']++;
        });

        // Mise à jour des badges
        for (const [cat, count] of Object.entries(counts)) {
            const $badge = $(`#badge-${cat}`);
            $badge.text(count);
            if (count > 0) {
                $badge.addClass('has-value');
            } else {
                $badge.removeClass('has-value');
            }
        }
    }

    // =====================================================
    // SYNCHRONISATION SLIDERS / NUMBER INPUTS
    // =====================================================

    function initSliders() {
        // Sync range -> number
        $('input[type="range"]').on('input', function() {
            const id = $(this).attr('id');
            const $numberInput = $('#' + id + '-number');
            if ($numberInput.length) {
                $numberInput.val($(this).val());
            }
            calculateTotal();
        });

        // Sync number -> range
        $('input[type="number"].number-input').on('input', function() {
            const id = $(this).attr('id').replace('-number', '');
            const $rangeInput = $('#' + id);
            if ($rangeInput.length) {
                const max = parseInt($rangeInput.attr('max')) || 999;
                const min = parseInt($rangeInput.attr('min')) || 0;
                let val = parseInt($(this).val()) || 0;
                val = Math.max(min, Math.min(max, val));
                $(this).val(val);
                $rangeInput.val(val);
            }
            calculateTotal();
        });

        // Reset si vide
        $('input[type="number"].number-input').on('blur', function() {
            if ($(this).val() === '') {
                $(this).val(0);
                const id = $(this).attr('id').replace('-number', '');
                $('#' + id).val(0);
                calculateTotal();
            }
        });
    }

    // =====================================================
    // ÉVÉNEMENTS
    // =====================================================

    function initEvents() {
        // Checkboxes et selects
        $('input[type="checkbox"], select').on('change', calculateTotal);

        // Reset
        $('#resetBtn').on('click', function() {
            if (confirm('Êtes-vous sûr de vouloir réinitialiser tous les champs ?')) {
                $('input[type="checkbox"]').prop('checked', false);
                $('input[type="range"], input[type="number"].number-input').val(0);
                $('select').prop('selectedIndex', 0);
                $('.client-form-section input').val('');
                $('.slider-card').removeClass('has-value');
                calculateTotal();
                $('html, body').animate({ scrollTop: 0 }, 300);
            }
        });

        // Télécharger
        $('#downloadQuote').on('click', generatePDF);

        // Imprimer
        $('#printQuote').on('click', function() {
            generatePDF(true);
        });
    }

    // =====================================================
    // GÉNÉRATION PDF
    // =====================================================

    function generatePDF(printMode = false) {
        // Validation des champs obligatoires
        const nom = $('#client-nom').val().trim();
        const adresse = $('#client-adresse').val().trim();
        const cp = $('#client-cp').val().trim();
        const ville = $('#client-ville').val().trim();
        const tel = $('#client-tel').val().trim();

        if (!nom || !adresse || !cp || !ville || !tel) {
            alert('Veuillez remplir toutes les informations client obligatoires (*) avant de générer le devis.');
            $('html, body').animate({ scrollTop: $('.client-form-section').offset().top - 100 }, 500);
            return;
        }

        if (!/^[0-9]{5}$/.test(cp)) {
            alert('Le code postal doit contenir exactement 5 chiffres.');
            $('#client-cp').focus();
            return;
        }

        // Collecte des items sélectionnés
        const items = collectItems();
        
        if (items.length === 0) {
            alert('Veuillez sélectionner au moins un élément pour générer le devis.');
            return;
        }

        // Récupération des totaux
        const subtotal = parseFloat($('#subtotal').text().replace(/[^\d,]/g, '').replace(',', '.')) || 0;
        const vat = parseFloat($('#vat').text().replace(/[^\d,]/g, '').replace(',', '.')) || 0;
        const total = parseFloat($('#total').text().replace(/[^\d,]/g, '').replace(',', '.')) || 0;

        try {
            createPDF(items, subtotal, vat, total, printMode);
        } catch (e) {
            console.error('Erreur génération PDF:', e);
            alert('Une erreur est survenue lors de la génération du PDF. Veuillez réessayer.');
        }
    }

    function collectItems() {
        const items = [];
        
        // Parcours de tous les inputs et les ajoute s'ils ont une valeur
        // Checkboxes
        $('input[type="checkbox"]:checked').each(function() {
            const id = $(this).attr('id');
            const price = parseFloat($(this).data('price')) || 0;
            const label = $(this).data('label') || $(this).closest('label').find('.option-name').text() || id;
            const category = $(this).closest('.category-content').find('.category-header h2').text() || 'Autre';
            
            items.push({
                id: id,
                description: label,
                quantity: 1,
                unit: 'u',
                unitPrice: price,
                total: price,
                category: category
            });
        });

        // Sliders avec prix fixe
        $('input[type="range"]').each(function() {
            const id = $(this).attr('id');
            const qty = parseFloat($(this).val()) || 0;
            if (qty > 0) {
                const price = parseFloat($(this).data('price')) || 0;
                const label = $(this).data('label') || $(`label[for="${id}"]`).text() || id;
                const category = $(this).closest('.category-content').find('.category-header h2').text() || 'Autre';
                const unit = getUnit(id);
                
                // Vérifie si c'est un slider avec gamme
                const $gammeSelect = $(`#gamme-${id}, #type-peinture-${id.replace('-peinture', '')}`);
                let actualPrice = price;
                if ($gammeSelect.length && !price) {
                    actualPrice = parseFloat($gammeSelect.val()) || 0;
                }
                
                if (actualPrice > 0) {
                    items.push({
                        id: id,
                        description: label,
                        quantity: qty,
                        unit: unit,
                        unitPrice: actualPrice,
                        total: qty * actualPrice,
                        category: category
                    });
                }
            }
        });

        // Selects (packs, tableaux, etc.)
        $('select').each(function() {
            const id = $(this).attr('id');
            // Ignore les selects de gamme
            if (id.startsWith('gamme-') || id.startsWith('type-peinture')) return;
            
            const val = parseFloat($(this).val()) || 0;
            if (val > 0) {
                const label = $(this).data('label') || $(`label[for="${id}"]`).text() || id;
                const selectedOption = $(this).find('option:selected');
                const description = selectedOption.data('label') || selectedOption.text() || label;
                const category = $(this).closest('.category-content').find('.category-header h2').text() || 'Autre';
                
                items.push({
                    id: id,
                    description: description,
                    quantity: 1,
                    unit: 'forfait',
                    unitPrice: val,
                    total: val,
                    category: category
                });
            }
        });

        return items;
    }

    function getUnit(id) {
        const $label = $(`label[for="${id}"]`);
        if (!$label.length) return 'u';
        const text = $label.text();
        if (text.includes('(m²)') || text.includes('m²')) return 'm²';
        if (text.includes('(ml)') || text.includes('ml')) return 'ml';
        if (text.includes('(m³)') || text.includes('m³')) return 'm³';
        return 'u';
    }

    function createPDF(items, subtotalHT, vatAmount, totalTTC, printMode) {
        const { jsPDF } = window.jspdf;
        const doc = new jsPDF();
        
        // Génère un numéro de devis unique
        const date = new Date();
        const quoteNumber = 'DEV-' + date.getFullYear() + 
            String(date.getMonth() + 1).padStart(2, '0') + 
            String(date.getDate()).padStart(2, '0') + '-' + 
            String(Math.floor(Math.random() * 9000) + 1000);
        
        let y = 20;
        
        // En-tête
        doc.setFontSize(16);
        doc.setTextColor(0, 51, 204);
        doc.setFont(undefined, 'bold');
        doc.text(COMPANY.name, 20, y);
        y += 8;
        
        doc.setFontSize(9);
        doc.setTextColor(0, 0, 0);
        doc.setFont(undefined, 'normal');
        doc.text(COMPANY.address, 20, y);
        y += 4;
        doc.text(COMPANY.city, 20, y);
        y += 4;
        doc.text('Tél: ' + COMPANY.phone, 20, y);
        y += 4;
        doc.text('Email: ' + COMPANY.email, 20, y);
        
        // Titre DEVIS
        doc.setFontSize(28);
        doc.setTextColor(74, 144, 226);
        doc.setFont(undefined, 'bold');
        doc.text('DEVIS', 160, 25);
        
        doc.setFontSize(10);
        doc.setTextColor(0, 0, 0);
        doc.setFont(undefined, 'normal');
        doc.text('N° ' + quoteNumber, 150, 35);
        doc.text('Date: ' + date.toLocaleDateString('fr-FR'), 150, 40);
        
        // Ligne séparatrice
        y = 55;
        doc.setDrawColor(74, 144, 226);
        doc.setLineWidth(0.5);
        doc.line(20, y, 190, y);
        
        // Infos client
        y += 8;
        doc.setFontSize(11);
        doc.setFont(undefined, 'bold');
        doc.text('CLIENT', 20, y);
        y += 6;
        
        doc.setFontSize(9);
        doc.setFont(undefined, 'normal');
        doc.text('Nom: ' + $('#client-nom').val(), 20, y);
        y += 4;
        doc.text('Adresse: ' + $('#client-adresse').val(), 20, y);
        y += 4;
        doc.text('CP/Ville: ' + $('#client-cp').val() + ' ' + $('#client-ville').val(), 20, y);
        y += 4;
        doc.text('Tél: ' + $('#client-tel').val(), 20, y);
        
        // Tableau des items
        y += 12;
        
        // En-tête tableau
        doc.setFontSize(9);
        doc.setFont(undefined, 'bold');
        doc.setFillColor(74, 144, 226);
        doc.rect(20, y - 4, 170, 6, 'F');
        doc.setTextColor(255, 255, 255);
        doc.text('DÉSIGNATION', 22, y);
        doc.text('QTÉ', 120, y);
        doc.text('UNITÉ', 135, y);
        doc.text('PRIX U.', 155, y);
        doc.text('TOTAL', 175, y);
        
        y += 4;
        doc.setTextColor(0, 0, 0);
        doc.setFont(undefined, 'normal');
        
        // Items
        items.forEach(item => {
            if (y > 260) {
                doc.addPage();
                y = 20;
            }
            
            y += 5;
            doc.setFontSize(8);
            const desc = item.description.substring(0, 60);
            doc.text(desc, 22, y);
            doc.text(item.quantity.toString(), 122, y);
            doc.text(item.unit, 137, y);
            doc.text(item.unitPrice.toFixed(0) + ' €', 157, y);
            doc.text(item.total.toFixed(0) + ' €', 177, y);
        });
        
        // Totaux
        y += 15;
        if (y > 250) {
            doc.addPage();
            y = 20;
        }
        
        doc.setDrawColor(74, 144, 226);
        doc.line(20, y, 190, y);
        y += 8;
        
        doc.setFontSize(10);
        doc.text('Total HT:', 130, y);
        doc.text(subtotalHT.toFixed(0) + ' €', 180, y, { align: 'right' });
        y += 5;
        doc.text('TVA 20%:', 130, y);
        doc.text(vatAmount.toFixed(0) + ' €', 180, y, { align: 'right' });
        y += 6;
        doc.setFont(undefined, 'bold');
        doc.setFontSize(12);
        doc.text('TOTAL TTC:', 130, y);
        doc.text(totalTTC.toFixed(0) + ' €', 180, y, { align: 'right' });
        
        // Pied de page
        doc.setFontSize(7);
        doc.setFont(undefined, 'normal');
        doc.setTextColor(100, 100, 100);
        doc.text('Capital de ' + COMPANY.capital + ' - ' + COMPANY.rcs + ' - APE: ' + COMPANY.ape, 105, 285, { align: 'center' });
        doc.text('Garantie décennale - ' + COMPANY.assurance, 105, 289, { align: 'center' });
        
        // Envoi ou impression
        if (printMode) {
            const blob = doc.output('blob');
            const url = URL.createObjectURL(blob);
            const win = window.open(url, '_blank');
            if (win) {
                win.onload = function() {
                    win.print();
                };
            }
        } else {
            doc.save('devis-mistral-pro-reno-' + quoteNumber + '.pdf');
            
            // Redirection vers page merci
            setTimeout(() => {
                window.location.href = 'merci.html';
            }, 1000);
        }
    }

    // =====================================================
    // INITIALISATION
    // =====================================================

    $(document).ready(function() {
        initNavigation();
        initSliders();
        initEvents();
        calculateTotal();
        
        console.log('Simulateur Mistral Pro Reno ' + VERSION + ' initialisé');
    });

})(jQuery);
