# Application de Caisse Fast-Food

Application professionnelle de caisse pour fast-food (tacos/burgers) développée avec Next.js, TypeScript, Tailwind CSS et Supabase.

## Installation

1. Installer les dépendances :
```bash
npm install
```

2. Configurer Supabase :
   - Créer un projet sur [Supabase](https://supabase.com)
   - Copier `.env.local.example` vers `.env.local`
   - Remplir les variables d'environnement :
     - `NEXT_PUBLIC_SUPABASE_URL`
     - `NEXT_PUBLIC_SUPABASE_ANON_KEY`

3. Créer les tables dans Supabase (voir section Base de données)

## Lancer l'application

```bash
npm run dev
```

Ouvrir [http://localhost:3000](http://localhost:3000)

## Structure du projet

```
├── app/                    # Pages Next.js (App Router)
│   ├── page.tsx           # Page de login
│   ├── commande/          # Page de commande
│   ├── layout.tsx         # Layout principal
│   └── globals.css        # Styles globaux
├── lib/                   # Utilitaires
│   └── supabase.ts        # Client Supabase
├── types/                 # Types TypeScript
│   └── database.types.ts  # Types de la base de données
└── public/                # Assets statiques
```

## Base de données Supabase

### Tables à créer

#### Table `users`
```sql
CREATE TABLE users (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  pin VARCHAR(4) NOT NULL UNIQUE,
  role VARCHAR(20) NOT NULL CHECK (role IN ('utilisateur', 'administrateur')),
  nom VARCHAR(100) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

#### Table `categories`
```sql
CREATE TABLE categories (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  nom VARCHAR(100) NOT NULL,
  image_url TEXT,
  ordre INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

#### Table `products`
```sql
CREATE TABLE products (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  nom VARCHAR(100) NOT NULL,
  prix DECIMAL(10, 2) NOT NULL,
  image_url TEXT,
  category_id UUID REFERENCES categories(id),
  actif BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

#### Table `orders`
```sql
CREATE TABLE orders (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES users(id),
  total DECIMAL(10, 2) NOT NULL,
  mode VARCHAR(20) NOT NULL CHECK (mode IN ('sur_place', 'a_emporter')),
  paiement VARCHAR(20) NOT NULL CHECK (paiement IN ('especes', 'carte')),
  buzzer INTEGER,
  statut VARCHAR(20) NOT NULL DEFAULT 'en_cours' CHECK (statut IN ('en_cours', 'termine', 'annule')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

#### Table `order_items`
```sql
CREATE TABLE order_items (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  order_id UUID REFERENCES orders(id) ON DELETE CASCADE,
  product_id UUID REFERENCES products(id),
  quantite INTEGER NOT NULL DEFAULT 1,
  prix_unitaire DECIMAL(10, 2) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

### Row Level Security (RLS)

Activer RLS sur toutes les tables et créer les politiques appropriées selon les rôles.

## Stack Technique

- **Frontend** : Next.js 15 + TypeScript
- **UI** : Tailwind CSS
- **Backend** : Supabase
- **Optimisé** : Tablette (iPad + Android)

## Fonctionnalités

### ✅ Implémenté
- Page de login avec clavier numérique (PIN 4 chiffres)
- Interface tactile optimisée tablette
- Design clair (blanc, bleu, gris)

### 🚧 À développer
- Page de commande
- Gestion des produits/catégories
- Historique des commandes
- Dashboard
- Paramètres
- Impression tickets
- Authentification Supabase
- Gestion des rôles

## Sécurité

- Authentification par PIN
- Gestion des rôles (utilisateur/administrateur)
- Protection RLS Supabase
- Validation avant modifications critiques

## Design

- Couleurs : blanc, bleu, gris
- Interface tactile (gros boutons)
- Optimisé tablette
- Pas de dark mode
