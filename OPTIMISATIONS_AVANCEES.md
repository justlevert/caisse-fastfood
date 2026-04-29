# 🚀 PHASE 5 : OPTIMISATIONS AVANCÉES

## ⚠️ VALIDATION REQUISE - CHANGEMENTS ARCHITECTURAUX

Cette phase propose des optimisations avancées qui modifient l'architecture de l'application. **Validation explicite nécessaire avant implémentation.**

---

## 1️⃣ VIRTUAL SCROLLING (Produits > 50)

**Objectif :** Améliorer les performances si vous avez beaucoup de produits

**Implémentation :**
- Installer `react-window` ou `react-virtualized`
- Modifier `app/commande/page.tsx` pour utiliser virtual scrolling
- Rendre uniquement les produits visibles à l'écran

**Gain attendu :** 50-70% de réduction du temps de rendu avec 100+ produits

**Risque :** Moyen (changement de composant d'affichage)

**Code exemple :**
```tsx
import { FixedSizeGrid } from 'react-window';

<FixedSizeGrid
  columnCount={5}
  columnWidth={200}
  height={600}
  rowCount={Math.ceil(filteredProducts.length / 5)}
  rowHeight={250}
  width={1000}
>
  {({ columnIndex, rowIndex, style }) => (
    <div style={style}>
      <ProductCard product={filteredProducts[rowIndex * 5 + columnIndex]} />
    </div>
  )}
</FixedSizeGrid>
```

---

## 2️⃣ WEB WORKER POUR CALCULS PRIX TACOS

**Objectif :** Décharger les calculs complexes du thread principal

**Implémentation :**
- Créer `lib/workers/priceCalculator.worker.ts`
- Déplacer les calculs de prix tacos dans le worker
- Utiliser `postMessage` pour communication

**Gain attendu :** UI toujours fluide même avec calculs complexes

**Risque :** Élevé (architecture asynchrone)

**Fichiers à créer :**
- `lib/workers/priceCalculator.worker.ts`
- `lib/hooks/usePriceWorker.ts`

---

## 3️⃣ SERVICE WORKER POUR CACHE OFFLINE

**Objectif :** Application fonctionnelle même sans connexion

**Implémentation :**
- Créer `public/sw.js`
- Configurer Workbox pour Next.js
- Cacher les assets statiques et données essentielles

**Gain attendu :** Application utilisable hors ligne, chargement instantané

**Risque :** Élevé (gestion du cache complexe)

**Fichiers à créer :**
- `public/sw.js`
- Configuration Workbox dans `next.config.ts`

---

## 4️⃣ PREFETCH DES DONNÉES AU SURVOL

**Objectif :** Précharger les données avant le clic

**Implémentation :**
- Ajouter `onMouseEnter` sur les boutons catégories
- Précharger les produits de la catégorie survolée
- Utiliser `React.Suspense` pour transitions fluides

**Gain attendu :** Changement de catégorie instantané

**Risque :** Faible (amélioration progressive)

---

## 5️⃣ CODE SPLITTING PAR ROUTE

**Objectif :** Réduire le bundle initial

**Implémentation :**
- Configurer `next.config.ts` pour code splitting agressif
- Lazy load toutes les pages admin
- Séparer les chunks par fonctionnalité

**Gain attendu :** 40-50% de réduction du bundle initial

**Risque :** Faible (configuration Next.js)

**Configuration :**
```ts
// next.config.ts
const nextConfig = {
  experimental: {
    optimizePackageImports: ['@/components', '@/lib'],
  },
  webpack: (config) => {
    config.optimization.splitChunks = {
      chunks: 'all',
      cacheGroups: {
        default: false,
        vendors: false,
        commons: {
          name: 'commons',
          chunks: 'all',
          minChunks: 2,
        },
      },
    };
    return config;
  },
};
```

---

## 📊 GAINS CUMULÉS ATTENDUS

| Optimisation | Gain | Complexité | Recommandation |
|--------------|------|------------|----------------|
| Virtual Scrolling | 50-70% | Moyenne | Si > 50 produits |
| Web Worker | 20-30% | Élevée | Si tacos complexes |
| Service Worker | Instantané | Élevée | Si besoin offline |
| Prefetch | 30-40% | Faible | ✅ Recommandé |
| Code Splitting | 40-50% | Faible | ✅ Recommandé |

---

## ⚠️ RECOMMANDATION

**Commencer par :**
1. ✅ Prefetch (faible risque, bon gain)
2. ✅ Code Splitting (faible risque, bon gain)

**Évaluer ensuite :**
3. ⚠️ Virtual Scrolling (si > 50 produits)
4. ⚠️ Web Worker (si calculs lourds)
5. ⚠️ Service Worker (si besoin offline)

---

## 🎯 VALIDATION REQUISE

**Souhaitez-vous que j'implémente :**
- [ ] Prefetch + Code Splitting (faible risque)
- [ ] Virtual Scrolling (si beaucoup de produits)
- [ ] Web Worker (si calculs complexes)
- [ ] Service Worker (si besoin offline)
- [ ] Aucune (optimisations actuelles suffisantes)
