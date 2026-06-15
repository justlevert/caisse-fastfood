# Changelog - LevertOS

Toutes les modifications notables de ce projet seront documentées dans ce fichier.

## [1.0.0] - 15 juin 2026

### 🎉 Version initiale de production

#### ✨ Fonctionnalités principales

**Gestion des commandes**
- ✅ Prise de commande sur place et à emporter
- ✅ Système de panier avec quantités
- ✅ Gestion des modes de paiement (espèces/carte)
- ✅ Numéros de buzzer
- ✅ Remarques sur commandes

**Tacos personnalisables**
- ✅ Sélection de taille (S/M/L/XL)
- ✅ Choix des viandes (jusqu'à 4)
- ✅ Choix des sauces (jusqu'à 4)
- ✅ Suppléments (extras)
- ✅ Retraits d'ingrédients
- ✅ Gratinage
- ✅ Commentaires personnalisés
- ✅ Récapitulatif en temps réel
- ✅ Images pour viandes, sauces, extras, gratins

**Gestion multi-devises**
- ✅ Support Euro (EUR) et Franc Suisse (CHF)
- ✅ Changement de devise en temps réel
- ✅ Affichage dynamique sur toutes les pages

**Impression**
- ✅ Tickets de caisse
- ✅ Tickets de cuisine
- ✅ Support imprimantes thermiques Epson
- ✅ Impression via serveur distant (iPad/tablettes)
- ✅ Support smartphone Android comme serveur d'impression
- ✅ Configuration flexible des imprimantes

**Administration**
- ✅ Gestion des produits
- ✅ Gestion des catégories (avec drag & drop)
- ✅ Gestion des éléments de tacos (tailles, viandes, sauces, extras, gratins, ingrédients)
- ✅ Upload d'images (Supabase Storage)
- ✅ Clôture de caisse
- ✅ Export Excel des commandes

**Historique et rapports**
- ✅ Historique des commandes
- ✅ Filtrage par session/clôture
- ✅ Détails des commandes
- ✅ Réimpression des tickets
- ✅ Dashboard avec statistiques

**Sécurité et utilisateurs**
- ✅ Authentification par code PIN
- ✅ Rôles (administrateur/utilisateur)
- ✅ Verrouillage automatique
- ✅ Déconnexion sécurisée

**Interface utilisateur**
- ✅ Design moderne et responsive
- ✅ Optimisé pour iPad/tablettes
- ✅ Mode plein écran
- ✅ Thème orange/blanc
- ✅ Animations fluides

#### 🔧 Améliorations techniques

**Performance**
- ✅ Cache des données (30 minutes)
- ✅ Lazy loading des composants
- ✅ Optimisation des images
- ✅ Mémorisation des composants (React.memo)

**Synchronisation**
- ✅ Rafraîchissement automatique du cache après modifications
- ✅ Synchronisation catégories/produits en temps réel
- ✅ Validation de l'existence des catégories sélectionnées

**Base de données**
- ✅ Supabase (PostgreSQL)
- ✅ Storage pour les images
- ✅ Relations optimisées
- ✅ Indexes pour les performances

#### 📱 Support multi-plateforme

- ✅ iPad/iOS
- ✅ Tablettes Android
- ✅ Desktop (Windows/Mac/Linux)
- ✅ Responsive mobile

#### 🖨️ Solutions d'impression

- ✅ Serveur d'impression Node.js
- ✅ Support smartphone Android (Termux)
- ✅ Support Raspberry Pi
- ✅ Guide d'installation complet

#### 📚 Documentation

- ✅ `README.md` - Documentation principale
- ✅ `GUIDE_IMPRESSION_ANDROID.md` - Guide serveur Android
- ✅ `SOLUTIONS_IMPRESSION_IPAD.md` - Solutions d'impression iPad
- ✅ `CONFIGURATION_DEVISE.md` - Configuration des devises
- ✅ `FIX_SYNCHRONISATION_CATEGORIES_PRODUITS.md` - Fix synchronisation
- ✅ `FIX_DEVISE_ET_CATEGORIES.md` - Fix devise et catégories
- ✅ `INTEGRATION_SERVEUR_ANDROID.md` - Intégration serveur Android

#### 🐛 Corrections de bugs

- ✅ Synchronisation catégories après suppression
- ✅ Affichage devise dynamique sur ProductCard
- ✅ Affichage devise dynamique sur CartItem
- ✅ Affichage devise dynamique sur ValidationModal
- ✅ Rafraîchissement cache après modifications admin
- ✅ Validation existence catégorie sélectionnée

#### 🔒 Sécurité

- ✅ Validation des entrées utilisateur
- ✅ Protection des routes admin
- ✅ Stockage sécurisé des PINs
- ✅ CORS configuré pour l'impression

---

## [0.1.0] - Versions de développement

### Développement initial
- Mise en place de l'architecture
- Création des composants de base
- Intégration Supabase
- Tests et itérations

---

## 🚀 Prochaines versions prévues

### [1.1.0] - À venir
- [ ] Mode hors ligne
- [ ] Synchronisation automatique
- [ ] Notifications push
- [ ] Support multi-restaurants
- [ ] Statistiques avancées
- [ ] Export PDF des rapports

### [1.2.0] - À venir
- [ ] Application mobile native
- [ ] QR codes pour commandes
- [ ] Programme de fidélité
- [ ] Intégration paiement en ligne

---

*Format basé sur [Keep a Changelog](https://keepachangelog.com/)*
