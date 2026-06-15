# 💶 Configuration de la devise (EUR / CHF)

## 🎯 Fonctionnalité ajoutée

L'application LevertOS supporte maintenant **deux devises** :
- **💶 Euro (EUR)** - Symbole : €
- **🇨🇭 Franc Suisse (CHF)** - Symbole : CHF

---

## 📋 Étape 1 : Configuration de la base de données

### Exécuter le script SQL

1. Connectez-vous à votre **dashboard Supabase**
2. Allez dans **SQL Editor**
3. Créez une nouvelle requête
4. Copiez-collez ce code :

```sql
-- Ajouter le paramètre de devise
INSERT INTO settings (key, value, description)
VALUES (
  'devise',
  'EUR',
  'Devise utilisée dans l''application (EUR ou CHF)'
)
ON CONFLICT (key) DO NOTHING;

-- Vérifier
SELECT * FROM settings WHERE key = 'devise';
```

5. Cliquez sur **Run** (ou F5)
6. Vous devriez voir une ligne avec `key = 'devise'` et `value = 'EUR'`

✅ **La base de données est configurée !**

---

## 🎨 Étape 2 : Configurer la devise dans l'application

### Dans l'interface

1. Ouvrez l'application LevertOS
2. Allez dans **Paramètres** (⚙️)
3. Section **"💰 Configuration TVA"**
4. Vous verrez une nouvelle section **"Devise"** avec deux boutons :
   - **💶 Euro (EUR)**
   - **🇨🇭 Franc Suisse (CHF)**
5. Cliquez sur la devise souhaitée
6. Le symbole affiché s'actualise en dessous
7. Cliquez sur **"Enregistrer TVA et Devise"**

✅ **La devise est configurée !**

---

## 🔧 Étape 3 : Utiliser la devise dans l'application

### Fonction utilitaire créée

Un nouveau fichier `lib/utils/currency.ts` a été créé avec des fonctions utilitaires :

#### 1. Obtenir la devise configurée

```typescript
import { getCurrency } from '@/lib/utils/currency';

const devise = await getCurrency(); // 'EUR' ou 'CHF'
```

#### 2. Obtenir le symbole

```typescript
import { getCurrencySymbol } from '@/lib/utils/currency';

const symbol = getCurrencySymbol('EUR'); // '€'
const symbol = getCurrencySymbol('CHF'); // 'CHF'
```

#### 3. Formater un prix

```typescript
import { formatPrice } from '@/lib/utils/currency';

const prix = formatPrice(12.50, 'EUR'); // "12.50 €"
const prix = formatPrice(12.50, 'CHF'); // "12.50 CHF"
```

#### 4. Hook React pour composants

```typescript
'use client';

import { useCurrency } from '@/lib/utils/currency';

export default function MonComposant() {
  const { currency, symbol, loading } = useCurrency();
  
  if (loading) return <div>Chargement...</div>;
  
  return (
    <div>
      Prix: 10.00 {symbol}
    </div>
  );
}
```

---

## 📝 Exemple d'intégration

### Avant (prix en dur avec €)

```typescript
<div className="text-2xl font-bold">
  {product.prix.toFixed(2)} €
</div>
```

### Après (prix avec devise dynamique)

```typescript
'use client';

import { useCurrency } from '@/lib/utils/currency';

export default function ProductCard({ product }) {
  const { symbol } = useCurrency();
  
  return (
    <div className="text-2xl font-bold">
      {product.prix.toFixed(2)} {symbol}
    </div>
  );
}
```

---

## 🎯 Fichiers à modifier (optionnel)

Pour utiliser la devise partout dans l'application, vous pouvez modifier ces fichiers :

### 1. Page de commande (`app/commande/page.tsx`)
- Affichage des prix des produits
- Total du panier
- Tickets imprimés

### 2. Historique (`app/historique/page.tsx`)
- Prix des commandes

### 3. TacoBuilder (`components/TacoBuilderModal.tsx`)
- Prix des options
- Prix total

### 4. Cartes produits
- Tous les composants affichant des prix

---

## 🖨️ Impression des tickets

Les tickets imprimés utiliseront automatiquement la devise configurée si vous utilisez la fonction `formatPrice()` dans `lib/ticketGenerator.ts`.

### Exemple de modification

```typescript
// Avant
printer.println(`Total: ${total.toFixed(2)} €`);

// Après
import { getCurrency, formatPrice } from '@/lib/utils/currency';

const currency = await getCurrency();
printer.println(`Total: ${formatPrice(total, currency)}`);
```

---

## 🔄 Changement de devise

### Impact du changement

Quand vous changez la devise dans les paramètres :
- ✅ Les **nouveaux prix** s'affichent avec le nouveau symbole
- ✅ Les **tickets** utilisent la nouvelle devise
- ⚠️ Les **prix en base de données** restent les mêmes (ce sont des nombres)
- ⚠️ Vous devez **rafraîchir la page** pour voir le changement

### Cache de la devise

La devise est mise en cache pour éviter trop de requêtes à la base de données.

Pour forcer le rechargement :
```typescript
import { invalidateCurrencyCache } from '@/lib/utils/currency';

invalidateCurrencyCache();
```

---

## 💡 Bonnes pratiques

### 1. Toujours utiliser les fonctions utilitaires

❌ **Mauvais** :
```typescript
<span>{prix.toFixed(2)} €</span>
```

✅ **Bon** :
```typescript
import { useCurrency } from '@/lib/utils/currency';

const { symbol } = useCurrency();
<span>{prix.toFixed(2)} {symbol}</span>
```

### 2. Gérer le chargement

```typescript
const { currency, symbol, loading } = useCurrency();

if (loading) {
  return <div>Chargement...</div>;
}
```

### 3. Composants serveur vs client

- **Composants serveur** : Utilisez `getCurrency()` et `formatPrice()`
- **Composants client** : Utilisez le hook `useCurrency()`

---

## 🧪 Tests

### Test 1 : Changement de devise

1. Paramètres → TVA → Sélectionnez **EUR**
2. Enregistrez
3. Vérifiez que les prix affichent **€**
4. Changez pour **CHF**
5. Enregistrez
6. Rafraîchissez la page
7. Vérifiez que les prix affichent **CHF**

### Test 2 : Impression

1. Configurez la devise
2. Créez une commande de test
3. Imprimez le ticket
4. Vérifiez que le symbole correct apparaît

---

## 📊 Architecture

```
┌─────────────────┐
│   Paramètres    │
│   (Interface)   │
└────────┬────────┘
         │
         ↓
┌─────────────────┐
│    Supabase     │
│  settings.devise│
└────────┬────────┘
         │
         ↓
┌─────────────────┐
│ currency.ts     │
│ (Utilitaires)   │
└────────┬────────┘
         │
         ↓
┌─────────────────┐
│  Composants     │
│  (Affichage)    │
└─────────────────┘
```

---

## 🐛 Dépannage

### "La devise ne change pas"

**Solution** :
1. Vérifiez que le paramètre est bien enregistré dans Supabase
2. Rafraîchissez la page (F5)
3. Videz le cache du navigateur

### "Erreur lors du chargement de la devise"

**Solution** :
1. Vérifiez que le script SQL a été exécuté
2. Vérifiez la connexion Supabase
3. Consultez la console du navigateur (F12)

### "Le symbole ne s'affiche pas"

**Solution** :
1. Vérifiez que vous utilisez `useCurrency()` dans un composant client
2. Ajoutez `'use client';` en haut du fichier
3. Vérifiez que le composant n'est pas en mode loading

---

## ✅ Checklist de mise en service

- [ ] Script SQL exécuté dans Supabase
- [ ] Paramètre `devise` visible dans la table `settings`
- [ ] Section "Devise" visible dans Paramètres → TVA
- [ ] Sélection EUR/CHF fonctionne
- [ ] Sauvegarde réussie
- [ ] Symbole correct affiché dans l'interface
- [ ] (Optionnel) Composants modifiés pour utiliser `useCurrency()`
- [ ] (Optionnel) Tickets imprimés avec la bonne devise

---

## 🎉 Avantages

✅ **Flexibilité** - Changez de devise en un clic  
✅ **Simplicité** - Pas besoin de modifier les prix en base  
✅ **Cohérence** - Même devise partout dans l'app  
✅ **Performance** - Mise en cache pour éviter les requêtes  

---

*Document créé le 14 juin 2026*  
*Version 1.0*  
*LevertOS - Système de caisse pour restauration rapide*
