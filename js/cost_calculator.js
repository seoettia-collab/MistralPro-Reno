!function(t){"use strict";const e="Mistral Pro Reno",o="9 rue Anatole de la Forge",n="75017 Paris",a="07 55 18 89 37",s="contact@mistralpro-reno.fr";let i=null;

// TOUS LES SELECTS PAR CATÉGORIE - V11
const allSelects={
plomberie:["select-receveur","select-porte-douche","select-barre-douche","select-mitigeur-douche","select-baignoire","select-robinet-baignoire","select-cumulus","select-adoucisseur","select-diagnostic","select-tuyauterie-pvc","select-tuyauterie-multi","select-tuyauterie-cuivre","select-pack-sdb","select-depose-mural","select-depose-sol"],
electricite:["select-tableau","select-points-lum","select-prises","select-inter","select-rad-500","select-rad-1500","select-rad-2000","select-seche-serv","select-clim","select-vmc-simple","select-vmc-double","select-aerateur"],
peinture:["select-peinture-murs-gamme","select-peinture-plaf-gamme","select-parquet-gamme","select-carrelage-gamme","select-lino-gamme","select-faience-gamme","select-credence-gamme","select-depose","select-ragreage","select-chape","select-ravalement","select-facade"],
"gros-oeuvre":["select-mur-porteur","select-cloisons","select-dalle","select-demo","select-iso-murs","select-iso-combles","select-ite","select-faux-plafond","select-doublage","select-extension","select-terrassement","select-fondations"],
menuiserie:["select-portes-int","select-plinthes","select-fenetres","select-porte-entree","select-volets","select-toiture","select-velux","select-zinguerie","select-cuisine","select-placards","select-rangements"]
};

// Liste plate pour compatibilité
const sanSelects=Object.values(allSelects).flat();

function r(){let e=0;
// Checkboxes standard (hors dépose)
t('input[type="checkbox"]:checked').not('.depose-item').each(function(){e+=parseFloat(t(this).data("price"))||0});
// Dépose checkboxes : 45€/item
const deposeItems=t('.depose-item:checked');
deposeItems.each(function(){e+=parseFloat(t(this).data("price"))||0});
// Dépose selects carrelage
const deposeSelects=t('.depose-select');
let hasDeposeSelect=false;
deposeSelects.each(function(){const prix=parseFloat(t(this).val())||0;if(prix>0){e+=prix;hasDeposeSelect=true;}});
// Forfait évacuation 80€ si au moins 1 item dépose (checkbox ou select)
if(deposeItems.length>0||hasDeposeSelect){e+=80;}
// Calcul peinture gamme × surface
const peintureFields=[
{gamme:"select-peinture-murs-gamme",input:"input-peinture-murs-m2"},
{gamme:"select-peinture-plaf-gamme",input:"input-peinture-plaf-m2"}
];
peintureFields.forEach(function(p){
const gamme=parseFloat(t("#"+p.gamme).val())||0;
const m2=parseFloat(t("#"+p.input).val())||0;
if(gamme>0&&m2>0){e+=gamme*m2}
// Style
const hasVal=gamme>0&&m2>0;
t("#"+p.gamme).css(hasVal?{"border-color":"#27ae60","background":"#e8f5e9"}:{"border-color":"#e0e0e0","background":"#fff"});
t("#"+p.input).css(hasVal?{"border-color":"#27ae60","background":"#e8f5e9"}:{"border-color":"#e0e0e0","background":"#fff"});
});
// Calcul enduit 45€/m²
const enduitM2=parseFloat(t("#input-enduit-m2").val())||0;
if(enduitM2>0){e+=45*enduitM2;t("#input-enduit-m2").css({"border-color":"#27ae60","background":"#e8f5e9"})}else{t("#input-enduit-m2").css({"border-color":"#e0e0e0","background":"#fff"})}
// Calcul sols gamme × surface
const solsFields=[
{gamme:"select-parquet-gamme",input:"input-parquet-m2"},
{gamme:"select-carrelage-gamme",input:"input-carrelage-m2"},
{gamme:"select-lino-gamme",input:"input-lino-m2"}
];
solsFields.forEach(function(p){
const gamme=parseFloat(t("#"+p.gamme).val())||0;
const m2=parseFloat(t("#"+p.input).val())||0;
if(gamme>0&&m2>0){e+=gamme*m2}
const hasVal=gamme>0&&m2>0;
t("#"+p.gamme).css(hasVal?{"border-color":"#27ae60","background":"#e8f5e9"}:{"border-color":"#e0e0e0","background":"#fff"});
t("#"+p.input).css(hasVal?{"border-color":"#27ae60","background":"#e8f5e9"}:{"border-color":"#e0e0e0","background":"#fff"});
});
// Calcul murs gamme × surface
const mursFields=[
{gamme:"select-faience-gamme",input:"input-faience-m2"},
{gamme:"select-credence-gamme",input:"input-credence-m2"}
];
mursFields.forEach(function(p){
const gamme=parseFloat(t("#"+p.gamme).val())||0;
const m2=parseFloat(t("#"+p.input).val())||0;
if(gamme>0&&m2>0){e+=gamme*m2}
const hasVal=gamme>0&&m2>0;
t("#"+p.gamme).css(hasVal?{"border-color":"#27ae60","background":"#e8f5e9"}:{"border-color":"#e0e0e0","background":"#fff"});
t("#"+p.input).css(hasVal?{"border-color":"#27ae60","background":"#e8f5e9"}:{"border-color":"#e0e0e0","background":"#fff"});
});
// Tous les selects san-select (hors depose-select et peinture gamme/surface)
sanSelects.forEach(function(id){if(id.startsWith("select-depose-"))return;if(id.startsWith("select-peinture-murs-")||id.startsWith("select-peinture-plaf-"))return;const prix=parseFloat(t("#"+id).val())||0;e+=prix;const sel=t("#"+id);prix>0?sel.css({"border-color":"#27ae60","background":"#e8f5e9"}):sel.css({"border-color":"#e0e0e0","background":"#fff"})});
// Style pour depose-select aussi
t('.depose-select').each(function(){const prix=parseFloat(t(this).val())||0;prix>0?t(this).css({"border-color":"#27ae60","background":"#e8f5e9"}):t(this).css({"border-color":"#e0e0e0","background":"#fff"})});
// Anciens selects non-san (compatibilité)
t("select").each(function(){const o=t(this).attr("id");if(!o||o.startsWith("gamme-")||o.startsWith("type-peinture")||o.startsWith("select-"))return;e+=parseFloat(t(this).val())||0});
const vat=.2*e,total=e+vat;
t("#subtotal").text(l(e)),t("#vat").text(l(vat)),t("#total").text(l(total));
// Mobile totals
t("#mobile-subtotal").text(l(e));t("#mobile-vat").text(l(vat));t("#mobile-total").text(l(total));
// Compteurs par catégorie
["plomberie","electricite","peinture","gros-oeuvre","menuiserie"].forEach(cat=>{let count=0;const panel=t(`.category-panel[data-category="${cat}"]`);
panel.find('input[type="checkbox"]:checked').each(function(){count++});
// Compter les selects de cette catégorie
if(allSelects[cat]){allSelects[cat].forEach(function(id){if(parseFloat(t("#"+id).val())>0)count++})}
// Anciens selects
panel.find("select").each(function(){const id=t(this).attr("id");if(!id||id.startsWith("gamme-")||id.startsWith("type-peinture")||id.startsWith("select-"))return;if(parseFloat(t(this).val())>0)count++});
const badge=t(`#count-${cat}`);badge.text(count);count>0?badge.addClass("has-value"):badge.removeClass("has-value")});
// Mise à jour panneau prévisualisation
updatePreview()}

function getCatName(c){return{plomberie:"Plomberie & Sanitaires",electricite:"Électricité",peinture:"Peinture & Revêtements","gros-oeuvre":"Gros Œuvre",menuiserie:"Menuiserie"}[c]||c||"Prestations"}

function updatePreview(){
const previewList=t("#preview-list");
const previewCount=t("#preview-count");
let html="";
let totalItems=0;
let totalHT=0;
const categories={};
const lotNames={"Plomberie & Sanitaires":"LOT 1 - PLOMBERIE & SANITAIRES","Électricité":"LOT 2 - ÉLECTRICITÉ","Peinture & Revêtements":"LOT 3 - PEINTURE & REVÊTEMENTS","Gros Œuvre":"LOT 4 - GROS ŒUVRE","Menuiserie":"LOT 5 - MENUISERIE"};

// Collecter dépose (checkboxes + selects carrelage) en une seule ligne
const deposeItems=t('.depose-item:checked');
const deposeSelectMural=t('#select-depose-mural');
const deposeSelectSol=t('#select-depose-sol');
const muralVal=parseFloat(deposeSelectMural.val())||0;
const solVal=parseFloat(deposeSelectSol.val())||0;

if(deposeItems.length>0||muralVal>0||solVal>0){
const deposeLabels=[];
let deposeTotal=0;
deposeItems.each(function(){
deposeLabels.push(t(this).data("label"));
deposeTotal+=parseFloat(t(this).data("price"))||0;
});
if(muralVal>0){
deposeLabels.push(deposeSelectMural.find("option:selected").data("label").replace(" évacuation déchetterie comprise",""));
deposeTotal+=muralVal;
}
if(solVal>0){
deposeLabels.push(deposeSelectSol.find("option:selected").data("label").replace(" évacuation déchetterie comprise",""));
deposeTotal+=solVal;
}
deposeTotal+=80;
const deposeLabel="Dépose "+deposeLabels.join(", ")+", y compris déconnexion, protection des ouvrages existants, tri sélectif et évacuation en déchetterie agréée";
if(!categories["Plomberie & Sanitaires"])categories["Plomberie & Sanitaires"]=[];
categories["Plomberie & Sanitaires"].push({label:deposeLabel,qty:1,unit:"ens",pu:deposeTotal,total:deposeTotal});
totalItems++;
totalHT+=deposeTotal;
}

// Collecter checkboxes standard (hors dépose)
t('input[type="checkbox"]:checked').not('.depose-item').each(function(){
const price=parseFloat(t(this).data("price"))||0;
if(price>0){
const label=t(this).data("label")||t(this).closest("label").find("strong").text();
const panelCat=t(this).closest(".category-panel").data("category");
const catName=getCatName(panelCat);
if(!categories[catName])categories[catName]=[];
categories[catName].push({label:label,qty:1,unit:"u",pu:price,total:price});
totalItems++;
totalHT+=price;}});

// Collecter tous les selects sélectionnés (hors dépose et peinture gamme/surface)
// Calcul spécial PEINTURE (gamme × surface)
const peintureCalcs=[
{gamme:"select-peinture-murs-gamme",input:"input-peinture-murs-m2",type:"murs"},
{gamme:"select-peinture-plaf-gamme",input:"input-peinture-plaf-m2",type:"plafonds"}
];
let peintureInfo="";
peintureCalcs.forEach(function(p){
const gammeVal=parseFloat(t("#"+p.gamme).val())||0;
const m2=parseFloat(t("#"+p.input).val())||0;
if(gammeVal>0&&m2>0){
const total=gammeVal*m2;
const gammeName=t("#"+p.gamme).find("option:selected").text().split("(")[0].trim();
const gammeLabel=t("#"+p.gamme).find("option:selected").data("label")||"Peinture "+p.type;
const fullLabel=gammeLabel+" - Gamme "+gammeName+" ("+gammeVal+"€/m²) - Surface "+m2+"m²";
if(!categories["Peinture & Revêtements"])categories["Peinture & Revêtements"]=[];
categories["Peinture & Revêtements"].push({label:fullLabel,qty:m2,unit:"m²",pu:gammeVal,total:total});
totalItems++;
totalHT+=total;
peintureInfo+=(peintureInfo?" | ":"")+p.type.charAt(0).toUpperCase()+p.type.slice(1)+": "+m2+"m² × "+gammeVal+"€ = "+formatPrice(total);
}
});
// Enduit 45€/m²
const enduitM2=parseFloat(t("#input-enduit-m2").val())||0;
if(enduitM2>0){
const enduitTotal=45*enduitM2;
const enduitLabel=t("#input-enduit-m2").data("label")||"Enduit de lissage ou rebouchage";
if(!categories["Peinture & Revêtements"])categories["Peinture & Revêtements"]=[];
categories["Peinture & Revêtements"].push({label:enduitLabel+" - Surface "+enduitM2+"m²",qty:enduitM2,unit:"m²",pu:45,total:enduitTotal});
totalItems++;
totalHT+=enduitTotal;
peintureInfo+=(peintureInfo?" | ":"")+"Enduit: "+enduitM2+"m² × 45€ = "+formatPrice(enduitTotal);
}
t("#peinture-total-info").html(peintureInfo?("💰 "+peintureInfo):"");

// Calcul spécial SOLS (gamme × surface)
const solsCalcs=[
{gamme:"select-parquet-gamme",input:"input-parquet-m2",type:"Parquet"},
{gamme:"select-carrelage-gamme",input:"input-carrelage-m2",type:"Carrelage"},
{gamme:"select-lino-gamme",input:"input-lino-m2",type:"Lino/PVC"}
];
let solsInfo="";
solsCalcs.forEach(function(p){
const gammeVal=parseFloat(t("#"+p.gamme).val())||0;
const m2=parseFloat(t("#"+p.input).val())||0;
if(gammeVal>0&&m2>0){
const total=gammeVal*m2;
const gammeName=t("#"+p.gamme).find("option:selected").text().split("(")[0].trim();
const gammeLabel=t("#"+p.gamme).find("option:selected").data("label")||p.type;
const fullLabel=gammeLabel+" - Gamme "+gammeName+" ("+gammeVal+"€/m²) - Surface "+m2+"m²";
if(!categories["Peinture & Revêtements"])categories["Peinture & Revêtements"]=[];
categories["Peinture & Revêtements"].push({label:fullLabel,qty:m2,unit:"m²",pu:gammeVal,total:total});
totalItems++;
totalHT+=total;
solsInfo+=(solsInfo?" | ":"")+p.type+": "+m2+"m² × "+gammeVal+"€ = "+formatPrice(total);
}
});
t("#sols-total-info").html(solsInfo?("💰 "+solsInfo):"");

// Calcul spécial MURS (gamme × surface)
const mursCalcs=[
{gamme:"select-faience-gamme",input:"input-faience-m2",type:"Faïence"},
{gamme:"select-credence-gamme",input:"input-credence-m2",type:"Crédence"}
];
let mursInfo="";
mursCalcs.forEach(function(p){
const gammeVal=parseFloat(t("#"+p.gamme).val())||0;
const m2=parseFloat(t("#"+p.input).val())||0;
if(gammeVal>0&&m2>0){
const total=gammeVal*m2;
const gammeName=t("#"+p.gamme).find("option:selected").text().split("(")[0].trim();
const gammeLabel=t("#"+p.gamme).find("option:selected").data("label")||p.type;
const fullLabel=gammeLabel+" - Gamme "+gammeName+" ("+gammeVal+"€/m²) - Surface "+m2+"m²";
if(!categories["Peinture & Revêtements"])categories["Peinture & Revêtements"]=[];
categories["Peinture & Revêtements"].push({label:fullLabel,qty:m2,unit:"m²",pu:gammeVal,total:total});
totalItems++;
totalHT+=total;
mursInfo+=(mursInfo?" | ":"")+p.type+": "+m2+"m² × "+gammeVal+"€ = "+formatPrice(total);
}
});
t("#murs-total-info").html(mursInfo?("💰 "+mursInfo):"");

Object.keys(allSelects).forEach(function(cat){
allSelects[cat].forEach(function(id){
if(id.startsWith("select-depose-"))return;
if(id.startsWith("select-peinture-murs-")||id.startsWith("select-peinture-plaf-"))return;
if(id.startsWith("select-parquet-")||id.startsWith("select-carrelage-")||id.startsWith("select-lino-"))return;
if(id.startsWith("select-faience-")||id.startsWith("select-credence-"))return;
const sel=t("#"+id);
const prix=parseFloat(sel.val())||0;
if(prix>0){
const selectedOption=sel.find("option:selected");
const label=selectedOption.data("label")||selectedOption.text().split("€")[0].trim();
const catName=getCatName(cat);
if(!categories[catName])categories[catName]=[];
categories[catName].push({label:label,qty:1,unit:"u",pu:prix,total:prix});
totalItems++;
totalHT+=prix;}})});

// Générer HTML format CCTP
if(totalItems===0){
html='<p class="preview-empty">Sélectionnez des prestations pour voir le récapitulatif</p>'}
else{
html='<div class="preview-table-header"><span>N°</span><span>Désignation</span><span>Qté</span><span>Unité</span><span>P.U. HT</span><span>Total HT</span></div>';
let lotNum=0;
Object.keys(categories).forEach(function(cat){
lotNum++;
let lotTotal=0;
categories[cat].forEach(function(item){lotTotal+=item.total});
html+='<div class="preview-lot"><span class="preview-lot-title">'+(lotNames[cat]||cat)+'</span><span class="preview-lot-subtotal">'+formatPrice(lotTotal)+'</span></div>';
let itemNum=0;
categories[cat].forEach(function(item){
itemNum++;
html+='<div class="preview-item"><span class="preview-item-num">'+lotNum+'.'+itemNum+'</span><span class="preview-item-label">'+item.label+'</span><span class="preview-item-qty">'+item.qty+'</span><span class="preview-item-unit">'+item.unit+'</span><span class="preview-item-pu">'+formatPrice(item.pu)+'</span><span class="preview-item-total">'+formatPrice(item.total)+'</span></div>'})})
}
previewList.html(html);
previewCount.text(totalItems+" prestation(s)");
// Totaux HT/TTC
const tva=totalHT*0.2;
const ttc=totalHT+tva;
t("#preview-ht").text(formatPrice(totalHT));
t("#preview-tva").text(formatPrice(tva));
t("#preview-ttc").text(formatPrice(ttc));
}

function formatPrice(p){return Math.round(p).toString().replace(/\B(?=(\d{3})+(?!\d))/g," ")+" €"}

function l(t){return new Intl.NumberFormat("fr-FR",{style:"currency",currency:"EUR",minimumFractionDigits:0,maximumFractionDigits:0}).format(t)}

function c(){const r=t("#formMessage"),l=t(".client-form"),c=t("#client-nom").val().trim(),h=t("#client-tel").val().trim(),g=t("#client-email").val().trim(),v=t("#client-cp").val().trim(),f=t("#client-adresse").val().trim(),x=t("#client-ville").val().trim();
if(!(c&&h&&g&&v))return r.addClass("show"),l.addClass("highlight"),void setTimeout(()=>{r.removeClass("show"),l.removeClass("highlight")},3e3);
if(!/^[0-9]{5}$/.test(v))return r.text("⚠️ Code postal invalide (5 chiffres)").addClass("show"),l.addClass("highlight"),void setTimeout(()=>{r.removeClass("show"),r.text("⚠️ Veuillez compléter votre formulaire"),l.removeClass("highlight")},3e3);
r.removeClass("show"),l.removeClass("highlight");
const b={};
// Checkboxes
t('input[type="checkbox"]:checked').each(function(){const e=d(t(this).closest(".category-panel").data("category")||"Prestations");b[e]||(b[e]=[]),b[e].push({desc:t(this).data("label")||t(this).closest("label").find("strong").text(),qty:1,unit:"u",price:parseFloat(t(this).data("price"))||0})});
// Tous les selects par catégorie
Object.keys(allSelects).forEach(function(cat){const catName=d(cat);allSelects[cat].forEach(function(id){const sel=t("#"+id);const prix=parseFloat(sel.val())||0;if(prix>0){b[catName]||(b[catName]=[]);const selectedOption=sel.find("option:selected");const label=selectedOption.data("label")||sel.data("label")||selectedOption.text().split("€")[0].trim();b[catName].push({desc:label,qty:1,unit:"u",price:prix})}})});
// Anciens selects non-san
t("select").each(function(){const e=t(this).attr("id");if(e&&!e.startsWith("gamme-")&&!e.startsWith("type-peinture")&&!e.startsWith("select-")&&!t(this).hasClass("gamme-select")){const e=parseFloat(t(this).val())||0;if(e>0){const o=d(t(this).closest(".category-panel").data("category")||"Prestations");b[o]||(b[o]=[]);const n=t(this).find("option:selected").data("label")||t(this).data("label")||t(this).closest(".select-box").find("label").text().trim().split("(")[0].trim();b[o].push({desc:n,qty:1,unit:"forfait",price:e})}}});
if(0===Object.values(b).flat().length)return void alert("Veuillez sélectionner au moins une prestation");
const{jsPDF:F}=window.jspdf,y=new F,C=new Date,T=C.toLocaleDateString("fr-FR"),S=new Date(C);S.setDate(S.getDate()+30);
const w=S.toLocaleDateString("fr-FR"),P="DEV-"+C.getFullYear()+String(C.getMonth()+1).padStart(2,"0")+String(C.getDate()).padStart(2,"0")+"-"+String(Math.floor(9e3*Math.random())+1e3);
let k=15;if(i)try{y.addImage(i,"PNG",15,k,40,40)}catch(t){m(y,k)}else m(y,k);
y.setFontSize(28),y.setTextColor(74,144,226),y.setFont(void 0,"bold"),y.text("Devis",175,20),y.setFontSize(9),y.setTextColor(80,80,80),y.setFont(void 0,"normal"),y.text("N° "+P,150,28),y.text("En date du : "+T,150,32),y.text("Valable jusqu'au : "+w,150,36),y.text("Votre contact : Mistral",150,40),y.text("Tél : "+a,150,44),y.text("Email : "+s,150,48),k=60,y.setDrawColor(74,144,226),y.setLineWidth(.5),y.line(15,k,195,k),k=68,y.setFontSize(12),y.setTextColor(74,144,226),y.setFont(void 0,"bold"),y.text("Mistral Pro Reno",15,k),k+=5,y.setFontSize(9),y.setTextColor(0,0,0),y.setFont(void 0,"normal"),y.text(o,15,k),k+=4,y.text(n,15,k),k+=4,y.text("TVA N° FR74851558882",15,k),k+=4,y.setTextColor(74,144,226),y.setFont(void 0,"bold"),y.text("Tél : "+a,15,k),k+=4,y.setTextColor(0,0,0),y.setFont(void 0,"normal"),y.text("Email : "+s,15,k);
let D=68;y.setFontSize(11),y.setTextColor(0,0,0),y.setFont(void 0,"bold"),y.text(c,110,D),D+=5,y.setFontSize(9),y.setFont(void 0,"normal"),f&&(y.text(f,110,D),D+=4);
const R=[v,x].filter(Boolean).join(" ");y.text(R,110,D),D+=4,y.text("France",110,D),D+=4,y.text(h,110,D),D+=4,g&&y.text(g,110,D),k=95,y.setFontSize(11),y.setTextColor(0,0,0),y.setFont(void 0,"bold"),y.text("Devis Estimatif - Travaux de Rénovation",15,k),k+=8,y.setFillColor(74,144,226),y.rect(15,k-4,180,7,"F"),y.setTextColor(255,255,255),y.setFontSize(8),y.setFont(void 0,"bold"),y.text("N°",17,k),y.text("DÉSIGNATION",27,k),y.text("QTÉ",145,k),y.text("P.U. TTC",160,k),y.text("TOTAL TTC",175,k),k+=5,y.setTextColor(0,0,0);
let E=0,z=1;Object.keys(b).forEach(t=>{const e=b[t];let o=0;e.forEach(t=>o+=t.qty*t.price),k>250&&(y.addPage(),k=20),k+=6,y.setFillColor(240,240,240),y.rect(15,k-4,180,6,"F"),y.setFont(void 0,"bold"),y.setFontSize(9),y.text(z+"",17,k),y.text(t.toUpperCase(),27,k);const lotTTC=o*1.2;y.text(u(lotTTC),180,k);let n=1;e.forEach(t=>{k>270&&(y.addPage(),k=20),k+=5;const e=t.qty*t.price;const ttc=e*1.2;E+=e,y.setFont(void 0,"normal"),y.setFontSize(7);y.text(z+"."+n,17,k);const maxLen=75;const o=t.desc.length>maxLen?t.desc.substring(0,maxLen)+"...":t.desc;y.text(o,27,k),y.text(t.qty+" "+t.unit,145,k),y.text(u(t.price*1.2),160,k),y.text(u(ttc),180,k),n++}),z++}),k+=15,k>250&&(y.addPage(),k=30),y.setDrawColor(74,144,226),y.setLineWidth(.5),y.line(120,k,190,k);
const $=.2*E,N=E+$,q=Math.round(.3*N),M=N-q;k+=8,y.setFontSize(10),y.setFont(void 0,"normal"),y.text("Total HT",125,k),y.text(u(E),185,k,{align:"right"}),k+=6,y.text("TVA 20%",125,k),y.text(u($),185,k,{align:"right"}),k+=8,y.setFont(void 0,"bold"),y.setFontSize(11),y.text("Total TTC",125,k),y.text(u(N),185,k,{align:"right"}),k+=10,y.setFillColor(74,144,226),y.rect(120,k-5,70,10,"F"),y.setTextColor(255,255,255),y.setFontSize(10),y.text("NET À PAYER",125,k),y.text(u(N),185,k,{align:"right"});
let O=k-30;O<200&&(O=k-30),y.setTextColor(0,0,0),y.setFont(void 0,"bold"),y.setFontSize(9),y.text("Conditions de paiement",20,O),O+=5,y.setFont(void 0,"normal"),y.setFontSize(8),y.text("Acompte de 30% à la signature : "+u(q)+" TTC",20,O),O+=4,y.text("Solde à la fin des travaux : "+u(M)+" TTC",20,O),O+=4,y.text("Paiement par virement bancaire.",20,O);
const L=y.internal.getNumberOfPages();for(let t=1;t<=L;t++)y.setPage(t),y.setFontSize(7),y.setTextColor(100,100,100),y.setFont(void 0,"normal"),y.text("Capital 1000 € - 85155888200029 RCS Paris - APE : 4120A",105,282,{align:"center"}),y.text("Garantie décennale - HOKEN ASSURANCE - 25 Rue Marbeuf, 75008 Paris",105,286,{align:"center"}),y.text("Page "+t+" / "+L,185,286,{align:"right"});
const A="Devis-"+P+"-"+c.replace(/[^a-zA-Z0-9]/g,"-").replace(/-+/g,"-").toUpperCase();y.setProperties({title:A,subject:"Devis travaux de rénovation",author:e,creator:e});
const j=[];Object.keys(b).forEach(t=>{b[t].forEach(e=>{j.push({categorie:t,description:e.desc,quantite:e.qty,unite:e.unit,prix_unitaire:e.price,total:e.qty*e.price})})});
async function sendWebhook(t,e,o){try{let n="",a="";e.forEach(t=>{t.categorie!==a&&(a=t.categorie,""!==n&&(n+="\n"),n+="━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n",n+=`${a.toUpperCase()}\n`,n+="───────────────────────────────────────────────────────────────────────────\n",n+="DÉSIGNATION                                      QTÉ        P.U.      TOTAL\n",n+="───────────────────────────────────────────────────────────────────────────\n");const e=t.description.substring(0,45).padEnd(45),o=`${t.quantite} ${t.unite}`.padStart(8),s=`${t.prix_unitaire} €`.padStart(10),i=`${t.total} €`.padStart(10);n+=`${e} ${o} ${s} ${i}\n`}),n+="━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n";
const s=await fetch("https://mistralpro-reno-backend.onrender.com/api/send-devis",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({nom:t.nom,telephone:t.tel,email:t.email,adresse:t.adresse,code_postal:t.cp,ville:t.ville,numero_devis:t.quoteNum,date_devis:(new Date).toLocaleDateString("fr-FR"),total_ht:Math.round(100*o.subtotal)/100,tva:Math.round(100*o.vat)/100,total_ttc:Math.round(100*o.totalTTC)/100,prestations_texte:n,form_name:"simulateur-devis",form_location:"cost_calculator",submitted_at:(new Date).toISOString(),page_url:window.location.href})});return s.ok?(console.log("Données envoyées au webhook avec succès"),!0):(console.warn("Erreur webhook:",s.status),!1)}catch(t){return console.error("Erreur envoi webhook:",t),!1}}
sendWebhook({nom:c,tel:h,email:g,adresse:f,cp:v,ville:x,quoteNum:P},j,{subtotal:E,vat:$,totalTTC:N});
const U=y.output("blob"),_=URL.createObjectURL(U),I=window.open(_,"_blank");I?I.onload=function(){I.document.title=A,I.print(),setTimeout(function(){URL.revokeObjectURL(_)},1e3)}:(y.save(A+".pdf"),URL.revokeObjectURL(_))}

function u(t){return Math.round(t).toString().replace(/\B(?=(\d{3})+(?!\d))/g," ")+" €"}
function d(t){return{plomberie:"Plomberie & Sanitaires",electricite:"Électricité",peinture:"Peinture & Revêtements","gros-oeuvre":"Gros Œuvre",menuiserie:"Menuiserie"}[t]||t||"Prestations"}
function p(t){return t.includes("m2")||t.includes("peinture")||t.includes("sol")||t.includes("mur")||t.includes("plafond")||t.includes("isolation")||t.includes("placo")||t.includes("toiture")||t.includes("extension")||t.includes("cloison")||t.includes("dalle")||t.includes("faux-plafond")?"m²":t.includes("ml")||t.includes("tuyauterie")||t.includes("plinthe")||t.includes("zinguerie")||t.includes("cuisine")||t.includes("placard")?"ml":t.includes("m3")||t.includes("demolition")||t.includes("terrassement")||t.includes("fondation")?"m³":"u"}
function m(t,e){t.setDrawColor(74,144,226),t.setLineWidth(2),t.circle(32,e+17,16,"S"),t.setFontSize(12),t.setTextColor(74,144,226),t.setFont(void 0,"bold"),t.text("MPR",24,e+20)}

function updateSanTabs(){
const sanCategories={"san-wc":["wc-suspendu","wc-poser"],"san-lavabo":["lavabo-simple","lavabo-double","robinet-lavabo-std","robinet-lavabo-conf","robinet-lavabo-prem"]};
for(const[cat,ids]of Object.entries(sanCategories)){let hasSelection=false;for(const id of ids){if(t("#"+id).is(":checked")){hasSelection=true;break}}const btn=t(`.sub-tab[data-subsub="${cat}"]`);hasSelection?btn.addClass("has-selection"):btn.removeClass("has-selection")}
let doucheHasSelection=false;["select-receveur","select-porte-douche","select-barre-douche","select-mitigeur-douche"].forEach(function(id){if(parseFloat(t("#"+id).val())>0)doucheHasSelection=true});
const doucheBtn=t('.sub-tab[data-subsub="san-douche"]');doucheHasSelection?doucheBtn.addClass("has-selection"):doucheBtn.removeClass("has-selection");
let baignoireHasSelection=false;["select-baignoire","select-robinet-baignoire"].forEach(function(id){if(parseFloat(t("#"+id).val())>0)baignoireHasSelection=true});
const baignoireBtn=t('.sub-tab[data-subsub="san-baignoire"]');baignoireHasSelection?baignoireBtn.addClass("has-selection"):baignoireBtn.removeClass("has-selection");
// Dépose
let deposeHasSelection=t('.depose-item:checked').length>0||parseFloat(t('#select-depose-mural').val())>0||parseFloat(t('#select-depose-sol').val())>0;
const deposeBtn=t('.sub-tab[data-subsub="san-depose"]');deposeHasSelection?deposeBtn.addClass("has-selection"):deposeBtn.removeClass("has-selection");
}

function updateAllTabs(){
updateSanTabs();
// Mapping sub-tab -> selects
const tabSelects={
"sanitaires":["select-receveur","select-porte-douche","select-barre-douche","select-mitigeur-douche","select-baignoire","select-robinet-baignoire"],
"equipements":["select-cumulus","select-adoucisseur"],
"tuyauterie":["select-tuyauterie-pvc","select-tuyauterie-multi","select-tuyauterie-cuivre"],
"pack-sdb":["select-pack-sdb"],
"diagnostic":["select-diagnostic"],
"elec-base":["select-tableau","select-points-lum","select-prises","select-inter"],
"chauffage":["select-rad-500","select-rad-1500","select-rad-2000","select-seche-serv"],
"clim":["select-clim"],
"vmc":["select-vmc-simple","select-vmc-double","select-aerateur"],
"peinture-int":["select-peinture-murs-gamme","select-peinture-plaf-gamme"],
"sols":["select-parquet-gamme","select-carrelage-gamme","select-lino-gamme"],
"murs-rev":["select-faience-gamme","select-credence-gamme"],
"preparation":["select-depose","select-ragreage","select-chape"],
"ext":["select-ravalement","select-facade"],
"maconnerie":["select-mur-porteur","select-cloisons","select-dalle","select-demo"],
"isolation":["select-iso-murs","select-iso-combles","select-ite"],
"platrerie":["select-faux-plafond","select-doublage"],
"construction":["select-extension","select-terrassement","select-fondations"],
"menu-int":["select-portes-int","select-plinthes"],
"menu-ext":["select-fenetres","select-porte-entree","select-volets"],
"toiture":["select-toiture","select-velux","select-zinguerie"],
"agencement":["select-cuisine","select-placards","select-rangements"]
};
// Checkboxes par tab
const tabCheckboxes={
"sanitaires":["wc-suspendu","wc-poser","lavabo-simple","lavabo-double","robinet-lavabo-std","robinet-lavabo-conf","robinet-lavabo-prem"]
};
for(const[tab,selects]of Object.entries(tabSelects)){
let hasSelection=false;
// Cas spécial peinture-int: gamme ET m² requis OU enduit
if(tab==="peinture-int"){
const mursGamme=parseFloat(t("#select-peinture-murs-gamme").val())||0;
const mursM2=parseFloat(t("#input-peinture-murs-m2").val())||0;
const plafGamme=parseFloat(t("#select-peinture-plaf-gamme").val())||0;
const plafM2=parseFloat(t("#input-peinture-plaf-m2").val())||0;
const enduitM2=parseFloat(t("#input-enduit-m2").val())||0;
if((mursGamme>0&&mursM2>0)||(plafGamme>0&&plafM2>0)||enduitM2>0){hasSelection=true}
}
// Cas spécial sols: gamme ET m² requis
else if(tab==="sols"){
const parquetGamme=parseFloat(t("#select-parquet-gamme").val())||0;
const parquetM2=parseFloat(t("#input-parquet-m2").val())||0;
const carrelageGamme=parseFloat(t("#select-carrelage-gamme").val())||0;
const carrelageM2=parseFloat(t("#input-carrelage-m2").val())||0;
const linoGamme=parseFloat(t("#select-lino-gamme").val())||0;
const linoM2=parseFloat(t("#input-lino-m2").val())||0;
if((parquetGamme>0&&parquetM2>0)||(carrelageGamme>0&&carrelageM2>0)||(linoGamme>0&&linoM2>0)){hasSelection=true}
}
// Cas spécial murs-rev: gamme ET m² requis
else if(tab==="murs-rev"){
const faienceGamme=parseFloat(t("#select-faience-gamme").val())||0;
const faienceM2=parseFloat(t("#input-faience-m2").val())||0;
const credenceGamme=parseFloat(t("#select-credence-gamme").val())||0;
const credenceM2=parseFloat(t("#input-credence-m2").val())||0;
if((faienceGamme>0&&faienceM2>0)||(credenceGamme>0&&credenceM2>0)){hasSelection=true}
}else{
selects.forEach(function(id){if(parseFloat(t("#"+id).val())>0)hasSelection=true});
}
if(tabCheckboxes[tab]){tabCheckboxes[tab].forEach(function(id){if(t("#"+id).is(":checked"))hasSelection=true})}
const btn=t(`.sub-tab[data-sub="${tab}"]`);
hasSelection?btn.addClass("has-selection"):btn.removeClass("has-selection");
}
}

t(document).ready(function(){
!function(){const t=new Image;t.crossOrigin="anonymous",t.onload=function(){try{const e=document.createElement("canvas");e.width=t.width,e.height=t.height,e.getContext("2d").drawImage(t,0,0),i=e.toDataURL("image/png"),console.log("Logo chargé avec succès")}catch(t){console.warn("Erreur conversion logo:",t)}},t.onerror=function(){console.warn("Logo non trouvé, utilisation du logo par défaut")},t.src="images/logo.png"}(),
console.log("initNavigation appelée"),console.log("Nombre de .main-cat trouvés:",t(".main-cat").length),console.log("Nombre de .category-panel trouvés:",t(".category-panel").length),
t(".main-cat").on("click",function(){const e=t(this).data("category");console.log("Clic sur catégorie:",e),t(".main-cat").removeClass("active"),t(this).addClass("active"),t(".category-panel").removeClass("active"),t(`.category-panel[data-category="${e}"]`).addClass("active");const o=t(`.category-panel[data-category="${e}"]`);console.log("Panel trouvé:",o.length),o.find(".sub-tab").removeClass("active").first().addClass("active"),o.find(".sub-content").removeClass("active").first().addClass("active")}),
t(".sub-tab").on("click",function(){const e=t(this).data("sub");const ss=t(this).data("subsub");if(ss){const o=t(this).closest(".sub-content");o.find(".sub-tab").removeClass("active"),t(this).addClass("active"),o.find(".subsub-content").removeClass("active"),o.find(`.subsub-content[data-subsub="${ss}"]`).addClass("active");return}console.log("Clic sur sous-catégorie:",e);const o=t(this).closest(".category-panel");o.find(".sub-tabs").first().find(".sub-tab").removeClass("active"),t(this).addClass("active"),o.find(".sub-content").removeClass("active"),o.find(`.sub-content[data-sub="${e}"]`).addClass("active")}),
t('input[type="range"]').on("input",function(){const e=t(this).attr("id");t("#"+e+"-number").val(t(this).val()),r()}),
t(".qty-input").on("input",function(){const e=t(this).attr("id");if(e&&e.startsWith("qty-")){r();return}const o=e.replace("-number",""),n=t("#"+o);if(n.length){let e=parseInt(t(this).val())||0;const a=parseInt(n.attr("max"))||9999;e=Math.min(Math.max(0,e),a),t(this).val(e),n.val(e)}r()}),
t(".qty-input").on("blur",function(){if(""===t(this).val()){t(this).val(0);const e=t(this).attr("id");if(e&&e.startsWith("qty-")){r();return}const o=e.replace("-number","");t("#"+o).val(0),r()}}),
t('input[type="checkbox"], select').on("change",function(){r();updateAllTabs()}),
// Peinture + Sols + Murs: recalcul sur saisie manuelle m²
t("#input-peinture-murs-m2, #input-peinture-plaf-m2, #input-enduit-m2, #input-parquet-m2, #input-carrelage-m2, #input-lino-m2, #input-faience-m2, #input-credence-m2").on("input",function(){r();updateAllTabs()}),
t("#resetBtn").on("click",function(){confirm("Réinitialiser tous les champs ?")&&(t('input[type="checkbox"]').prop("checked",!1),t('input[type="range"]').val(0),t(".qty-input").val(0),t("select").prop("selectedIndex",0),t("#clientForm")[0].reset(),t(".slider-row").css("background",""),r(),updateAllTabs())}),
// Reset par section
t(".btn-section-reset").on("click",function(){
const cat=t(this).data("category");
const panel=t(`.category-panel[data-category="${cat}"]`);
// Reset selects
panel.find("select").prop("selectedIndex",0);
// Reset checkboxes
panel.find('input[type="checkbox"]').prop("checked",!1);
// Reset sliders
panel.find('input[type="range"]').val(0);
// Reset qty inputs
panel.find(".qty-input").val(0);
// Recalculer
r();
updateAllTabs();
console.log("Section "+cat+" réinitialisée");
}),
console.log("Attachement événement printQuote"),t("#printQuote").on("click",c),r(),console.log("Simulateur Mistral Pro Reno V5 ready")})}(jQuery);
