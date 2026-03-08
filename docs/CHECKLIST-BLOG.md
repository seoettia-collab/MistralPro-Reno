# 📝 CHECKLIST PUBLICATION BLOG

> **Procédure pour publier un nouvel article sur le blog Mistral Pro Reno**

---

## 🚀 ÉTAPES DE PUBLICATION

### 1. Préparer l'article

- [ ] Définir le sujet et le titre
- [ ] Rédiger le contenu (introduction, sections, conclusion)
- [ ] Préparer l'image principale (format **WebP**, dimensions 1200×630 pour Facebook)
- [ ] Choisir la catégorie/tag (Prix, Salle de bain, Urgences, Rénovation, etc.)

---

### 2. Créer le fichier article

```bash
# Copier le template
cp blog/TEMPLATE.html blog/nom-de-larticle.html
```

**Nommage fichier :**
- Tout en minuscules
- Tirets entre les mots
- Pas d'accents ni caractères spéciaux
- Exemple : `renovation-cuisine-prix-2026.html`

---

### 3. Modifier le contenu

Ouvrir le fichier et remplacer tous les `🔧 À MODIFIER` :

| Section | Ce qu'il faut modifier |
|---------|----------------------|
| `BLOG_META` | Métadonnées (title, date, image, category, excerpt) |
| `<title>` | Titre de l'article (60 caractères max) |
| `<meta description>` | Description SEO (150-160 caractères) |
| `<link canonical>` | URL du fichier |
| Open Graph | Titre, description, URL, **image** (IMPORTANT pour Facebook) |
| Schema.org | Titre, dates, description, image |
| `<h1>` | Titre principal |
| Date et temps | Date publication + temps de lecture |
| Catégorie | Tag de l'article |
| Contenu | Sections H2, paragraphes, listes |
| Image principale | Chemin + alt text |
| URL partage Facebook | URL de l'article |
| Articles liés | Choisir 3 articles pertinents |

**⚠️ IMPORTANT pour Facebook :** La balise `og:image` doit contenir l'URL complète de l'image :
```html
<meta property="og:image" content="https://www.mistralpro-reno.fr/images/nom-image.webp">
```

---

### 4. Ajouter l'image

- [ ] Convertir l'image en **WebP** (utiliser un outil en ligne ou Photoshop)
- [ ] Nommer le fichier : `nom-descriptif.webp` (minuscules, tirets)
- [ ] Placer dans `/images/`
- [ ] Vérifier : poids < 200 Ko idéalement

---

### 5. Ajouter la carte dans blog.html

Ouvrir `blog.html` et ajouter une nouvelle carte dans `.blog-grid` :

```html
<article class="blog-card">
  <div class="blog-card-img">
    <img src="images/NOM-IMAGE.webp" alt="DESCRIPTION ALT" width="400" height="250" loading="lazy">
  </div>
  <div class="blog-card-body">
    <div class="blog-card-meta">
      <span><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="14" height="14"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg> DATE</span>
      <span><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="14" height="14"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg> X min</span>
    </div>
    <span class="blog-card-tag">CATÉGORIE</span>
    <h2><a href="blog/nom-de-larticle.html">TITRE DE L'ARTICLE</a></h2>
    <p>DESCRIPTION COURTE (2 lignes max)</p>
    <a href="blog/nom-de-larticle.html" class="blog-card-link">Lire l'article →</a>
  </div>
</article>
```

**Important :** Placer le nouvel article **en premier** dans la grille (après `<div class="blog-grid">`).

---

### 6. Déployer

```bash
cd /chemin/vers/MistralPro-Reno
git add .
git commit -m "Blog: Nouvel article - TITRE"
git push origin main
```

Le déploiement est **automatique** (GitHub Actions → OVH).

---

### 7. Partager sur Facebook

Une fois le site mis à jour (~2 min après le push) :

1. Aller sur la page Facebook **Mistral Pro Reno**
2. Créer une publication
3. Coller le lien de l'article : `https://www.mistralpro-reno.fr/blog/nom-de-larticle.html`
4. Ajouter un texte accrocheur
5. Publier

**Astuce :** Facebook génère automatiquement l'aperçu grâce aux balises Open Graph.

---

## ✅ CHECKLIST RAPIDE

```
□ Fichier article créé (copie de TEMPLATE.html)
□ Contenu rédigé + meta SEO modifiées
□ Image WebP ajoutée dans /images/
□ Carte ajoutée dans blog.html
□ Git commit + push
□ Vérifier sur le site (après 2 min)
□ Partager sur Facebook
```

---

## 📊 BONNES PRATIQUES SEO

| Élément | Recommandation |
|---------|----------------|
| Titre H1 | 50-60 caractères, mot-clé au début |
| Meta description | 150-160 caractères, incitation à cliquer |
| Alt images | Descriptif + mot-clé naturel |
| Liens internes | Vers services.html, cost_calculator.html |
| Longueur | Minimum 800 mots pour le SEO |
| Temps de lecture | Calculer : nb mots ÷ 200 = X min |

---

## 📅 CALENDRIER SUGGÉRÉ

| Semaine | Action |
|---------|--------|
| Semaine 1 | Rédiger article |
| Semaine 2 | Publier + partager Facebook |
| Semaine 3 | Rédiger article |
| Semaine 4 | Publier + partager Facebook |

**Objectif : 2 articles/mois**

---

## 🔗 RESSOURCES

- **Template article** : `/blog/TEMPLATE.html`
- **Page blog** : `/blog.html`
- **Images** : `/images/`
- **Facebook** : https://www.facebook.com/profile.php?id=61587951641785

---

*Dernière mise à jour : 8 mars 2026*
