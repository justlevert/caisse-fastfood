# 📱 Module Mobile Factures - Guide d'installation

## 🎯 Objectif

Module mobile simplifié permettant de scanner des factures, extraire automatiquement les informations avec OCR (Tesseract.js), et les enregistrer dans Supabase.

---

## ✅ Fichiers créés

### Types
- `types/invoice.types.ts` - Types TypeScript pour le module

### Services
- `lib/services/ocrService.ts` - Service d'extraction OCR avec Tesseract.js

### Composants
- `components/mobile/InvoiceHeader.tsx` - Header avec retour + titre + icône
- `components/mobile/InvoicePreviewCard.tsx` - Carte aperçu facture
- `components/mobile/ConfidenceCard.tsx` - Carte confiance IA
- `components/mobile/InvoiceFormCard.tsx` - Formulaire principal
- `components/mobile/InvoiceActions.tsx` - Boutons bas de page

### Pages
- `app/mobile/factures/page.tsx` - Page principale avec gestion d'état

### SQL
- `supabase-invoices-schema.sql` - Schéma de la table invoices

---

## 🔧 Installation Supabase

### 1. Créer la table `invoices`

Exécutez le fichier SQL dans votre console Supabase :

```bash
supabase-invoices-schema.sql
```

### 2. Créer le bucket Storage `invoices`

1. Dashboard Supabase → **Storage**
2. **New bucket**
3. Nom : `invoices`
4. Public : **Non** (privé)
5. **Create bucket**

### 3. Configurer les policies Storage (optionnel)

Si vous souhaitez stocker les images dans Supabase Storage, configurez les policies dans le dashboard.

---

## 🔐 Configuration

### Code d'accès mobile

Le code par défaut est `9999`. Pour le modifier :

Éditez `app/mobile/factures/page.tsx` ligne 29 :

```typescript
const MOBILE_ACCESS_CODE = '9999'; // Changez ici
```

---

## 📱 Utilisation

### Accès au module

URL : `http://localhost:3001/mobile/factures`

### Flux utilisateur

1. **Authentification** → Code `9999`
2. **Capture photo** → Prendre une photo de la facture
3. **Analyse OCR** → Extraction automatique des données
4. **Vérification** → Interface avec :
   - Aperçu de la facture
   - Confiance IA par champ
   - Formulaire pré-rempli
5. **Validation** → Enregistrement dans Supabase

---

## 🎨 Interface

### Structure

**Header**
- Bouton ← Retour
- Titre "Vérification"
- Icône 📄

**Carte Aperçu**
- Miniature image (80x100px)
- Nom fournisseur
- Adresse
- Bouton "Ouvrir l'image"

**Carte Confiance IA**
- Fournisseur : XX%
- Date : XX%
- Icônes : ✓ vert (≥70%) / ⚠️ orange (<70%)

**Formulaire**
- Fournisseur
- Date (avec icône 📅)
- Montant validé (calculé auto)
- Montant TTC
- TVA (calculée auto à 20%)
- Numéro facture
- Catégorie (select)

**Actions**
- Reprendre la photo (blanc)
- Valider (bleu)

---

## 🔍 Extraction OCR

### Données extraites

- ✅ Fournisseur (première ligne)
- ✅ Adresse (si contient rue/avenue/etc)
- ✅ Date (formats DD/MM/YYYY, DD-MM-YYYY)
- ✅ Montant (formats XX.XX€, XX,XX€)
- ✅ Numéro de facture

### Confiance IA

- Score par champ (0-100%)
- Icône verte si ≥ 70%
- Icône orange si < 70%

---

## 💾 Enregistrement Supabase

**✅ Implémentation complète**

Le module enregistre automatiquement les factures dans Supabase avec :

### Upload d'image
- Upload vers Storage bucket `invoices`
- Nom de fichier unique avec timestamp
- URL publique récupérée et stockée

### Table `invoices`

Champs enregistrés :
- `user_id` - ID de l'utilisateur connecté
- `fournisseur` - Nom du fournisseur
- `adresse` - Adresse (optionnel)
- `date_facture` - Date de la facture
- `montant_valide` - Montant HT calculé
- `montant_ttc` - Montant TTC
- `tva` - TVA calculée (20%)
- `numero_facture` - Numéro de facture (optionnel)
- `categorie` - Catégorie (optionnel)
- `image_url` - URL de l'image uploadée
- `confidence_fournisseur` - Score de confiance OCR
- `confidence_date` - Score de confiance OCR
- `created_at` - Date de création (auto)
- `updated_at` - Date de modification (auto)

---

## 🔒 Sécurité

- ✅ Accès réservé aux **administrateurs uniquement**
- ✅ Code d'accès dédié pour mobile
- ✅ RLS (Row Level Security) activé sur la table `invoices`
- ✅ Policies Supabase pour admin uniquement

---

## 🧪 Test

1. Lancez le serveur : `npm run dev`
2. Accédez à : `http://localhost:3001/mobile/factures`
3. Connectez-vous avec le code `9999`
4. Prenez une photo de facture
5. Vérifiez l'extraction OCR
6. Validez

---

## 📦 Dépendances

- `tesseract.js` - OCR (déjà installé)
- `@supabase/supabase-js` - Base de données (déjà installé)

---

## ✅ Checklist

- [ ] Exécuter `supabase-invoices-schema.sql` dans Supabase
- [ ] Créer bucket Storage `invoices` (optionnel)
- [ ] Tester l'accès : http://localhost:3001/mobile/factures
- [ ] Tester capture photo
- [ ] Vérifier extraction OCR
- [ ] Tester validation

---

## 🎯 Prochaines améliorations possibles

- [ ] Liste des factures enregistrées
- [ ] Export CSV/Excel
- [ ] Statistiques des dépenses
- [ ] Catégorisation automatique par IA
- [ ] Notifications push
- [ ] Scan de codes-barres
