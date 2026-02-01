/**
 * MISTRAL PRO RENO - Simulateur V3
 * Navigation + Calculs + PDF
 */

(function($) {
    'use strict';

    const TVA_RATE = 0.20;
    const COMPANY = {
        name: "Mistral Pro Reno",
        address: "9 rue Anatole de la Forge",
        city: "75017 Paris",
        phone: "07 55 18 89 37",
        email: "contact@mistralpro-reno.fr"
    };

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
        $('#downloadQuote').on('click', generatePDF);
    }

    // =====================================================
    // PDF GENERATION
    // =====================================================
    
    function generatePDF() {
        // Validation
        const nom = $('#client-nom').val().trim();
        const tel = $('#client-tel').val().trim();
        const adresse = $('#client-adresse').val().trim();
        const cp = $('#client-cp').val().trim();
        const ville = $('#client-ville').val().trim();

        if (!nom || !tel || !adresse || !cp || !ville) {
            alert('Veuillez remplir tous les champs obligatoires (*)');
            return;
        }

        if (!/^[0-9]{5}$/.test(cp)) {
            alert('Code postal invalide (5 chiffres)');
            return;
        }

        // Collecte items
        const items = [];
        
        $('input[type="checkbox"]:checked').each(function() {
            items.push({
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
                
                // Prix variable ?
                const $gamme = $(`#gamme-${id}, #type-peinture-${id.replace('-peinture', '')}`);
                if ($gamme.length && !price) {
                    price = parseFloat($gamme.val()) || 0;
                }
                
                if (price > 0) {
                    items.push({
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
            if (id && !id.startsWith('gamme-') && !id.startsWith('type-peinture')) {
                const val = parseFloat($(this).val()) || 0;
                if (val > 0) {
                    items.push({
                        desc: $(this).find('option:selected').text(),
                        qty: 1,
                        unit: 'forfait',
                        price: val
                    });
                }
            }
        });

        if (items.length === 0) {
            alert('Veuillez sélectionner au moins une prestation');
            return;
        }

        // Génération PDF
        const { jsPDF } = window.jspdf;
        const doc = new jsPDF();
        
        const date = new Date();
        const quoteNum = 'DEV-' + date.getFullYear() + 
            String(date.getMonth() + 1).padStart(2, '0') + 
            String(date.getDate()).padStart(2, '0') + '-' + 
            String(Math.floor(Math.random() * 9000) + 1000);

        let y = 20;

        // Header
        doc.setFontSize(18);
        doc.setTextColor(244, 196, 48);
        doc.setFont(undefined, 'bold');
        doc.text(COMPANY.name, 20, y);
        
        y += 8;
        doc.setFontSize(10);
        doc.setTextColor(0, 0, 0);
        doc.setFont(undefined, 'normal');
        doc.text(COMPANY.address + ', ' + COMPANY.city, 20, y);
        y += 5;
        doc.text('Tél: ' + COMPANY.phone + ' | ' + COMPANY.email, 20, y);

        // Titre
        doc.setFontSize(24);
        doc.setTextColor(0, 0, 0);
        doc.setFont(undefined, 'bold');
        doc.text('DEVIS', 160, 25);
        
        doc.setFontSize(10);
        doc.setFont(undefined, 'normal');
        doc.text('N° ' + quoteNum, 155, 32);
        doc.text('Date: ' + date.toLocaleDateString('fr-FR'), 155, 37);

        // Ligne
        y = 50;
        doc.setDrawColor(244, 196, 48);
        doc.setLineWidth(1);
        doc.line(20, y, 190, y);

        // Client
        y += 10;
        doc.setFontSize(11);
        doc.setFont(undefined, 'bold');
        doc.text('CLIENT', 20, y);
        y += 6;
        doc.setFont(undefined, 'normal');
        doc.setFontSize(10);
        doc.text(nom, 20, y);
        y += 5;
        doc.text(adresse, 20, y);
        y += 5;
        doc.text(cp + ' ' + ville, 20, y);
        y += 5;
        doc.text('Tél: ' + tel, 20, y);

        // Tableau
        y += 15;
        doc.setFillColor(244, 196, 48);
        doc.rect(20, y - 5, 170, 8, 'F');
        doc.setTextColor(0, 0, 0);
        doc.setFont(undefined, 'bold');
        doc.text('Désignation', 22, y);
        doc.text('Qté', 120, y);
        doc.text('Unité', 135, y);
        doc.text('P.U.', 155, y);
        doc.text('Total', 175, y);

        y += 5;
        doc.setFont(undefined, 'normal');
        
        let subtotal = 0;
        items.forEach(item => {
            if (y > 270) {
                doc.addPage();
                y = 20;
            }
            y += 6;
            const total = item.qty * item.price;
            subtotal += total;
            
            doc.text(item.desc.substring(0, 50), 22, y);
            doc.text(item.qty.toString(), 122, y);
            doc.text(item.unit, 137, y);
            doc.text(item.price.toFixed(0) + ' €', 157, y);
            doc.text(total.toFixed(0) + ' €', 177, y);
        });

        // Totaux
        y += 15;
        doc.setDrawColor(200, 200, 200);
        doc.line(120, y, 190, y);
        y += 8;
        
        const vat = subtotal * TVA_RATE;
        const totalTTC = subtotal + vat;

        doc.text('Total HT:', 125, y);
        doc.text(subtotal.toFixed(0) + ' €', 185, y, { align: 'right' });
        y += 6;
        doc.text('TVA 20%:', 125, y);
        doc.text(vat.toFixed(0) + ' €', 185, y, { align: 'right' });
        y += 8;
        doc.setFont(undefined, 'bold');
        doc.setFontSize(12);
        doc.text('TOTAL TTC:', 125, y);
        doc.text(totalTTC.toFixed(0) + ' €', 185, y, { align: 'right' });

        // Footer
        doc.setFontSize(8);
        doc.setFont(undefined, 'normal');
        doc.setTextColor(100, 100, 100);
        doc.text('Devis valable 30 jours - Garantie décennale', 105, 285, { align: 'center' });

        doc.save('devis-mistral-' + quoteNum + '.pdf');
        
        // Redirect
        setTimeout(() => {
            window.location.href = 'merci.html';
        }, 1000);
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

    // =====================================================
    // INIT
    // =====================================================
    
    $(document).ready(function() {
        initNavigation();
        initSliders();
        initEvents();
        calculateTotal();
        console.log('Simulateur Mistral Pro Reno V3 ready');
    });

})(jQuery);
