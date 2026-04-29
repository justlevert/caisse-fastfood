-- =====================================================
-- SCHEMA DE BASE DE DONNÉES SUPABASE
-- Application de Caisse Fast-Food
-- =====================================================

-- Table des utilisateurs
CREATE TABLE IF NOT EXISTS users (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  pin VARCHAR(4) NOT NULL UNIQUE,
  role VARCHAR(20) NOT NULL CHECK (role IN ('utilisateur', 'administrateur')),
  nom VARCHAR(100) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Table des catégories
CREATE TABLE IF NOT EXISTS categories (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  nom VARCHAR(100) NOT NULL UNIQUE,
  image_url TEXT,
  ordre INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Table des produits
CREATE TABLE IF NOT EXISTS products (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  nom VARCHAR(100) NOT NULL,
  prix DECIMAL(10, 2) NOT NULL,
  image_url TEXT,
  category_id UUID REFERENCES categories(id) ON DELETE SET NULL,
  actif BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Table des commandes
CREATE TABLE IF NOT EXISTS orders (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  total DECIMAL(10, 2) NOT NULL,
  mode VARCHAR(20) NOT NULL CHECK (mode IN ('sur_place', 'a_emporter')),
  paiement VARCHAR(20) NOT NULL CHECK (paiement IN ('especes', 'carte')),
  buzzer INTEGER,
  statut VARCHAR(20) NOT NULL DEFAULT 'en_cours' CHECK (statut IN ('en_cours', 'termine', 'annule')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Table des items de commande
CREATE TABLE IF NOT EXISTS order_items (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  order_id UUID REFERENCES orders(id) ON DELETE CASCADE,
  product_id UUID REFERENCES products(id) ON DELETE SET NULL,
  quantite INTEGER NOT NULL DEFAULT 1,
  prix_unitaire DECIMAL(10, 2) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- ROW LEVEL SECURITY (RLS)
-- =====================================================

-- Activer RLS sur toutes les tables
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;

-- Politiques RLS (accès complet pour l'instant - à affiner selon authentification)
DROP POLICY IF EXISTS "Allow all access to users" ON users;
CREATE POLICY "Allow all access to users" ON users FOR ALL USING (true);

DROP POLICY IF EXISTS "Allow all access to categories" ON categories;
CREATE POLICY "Allow all access to categories" ON categories FOR ALL USING (true);

DROP POLICY IF EXISTS "Allow all access to products" ON products;
CREATE POLICY "Allow all access to products" ON products FOR ALL USING (true);

DROP POLICY IF EXISTS "Allow all access to orders" ON orders;
CREATE POLICY "Allow all access to orders" ON orders FOR ALL USING (true);

DROP POLICY IF EXISTS "Allow all access to order_items" ON order_items;
CREATE POLICY "Allow all access to order_items" ON order_items FOR ALL USING (true);

-- =====================================================
-- DONNÉES DE TEST
-- =====================================================

-- Utilisateurs de test
INSERT INTO users (pin, role, nom) VALUES
  ('1234', 'administrateur', 'Admin'),
  ('0000', 'utilisateur', 'Caissier 1')
ON CONFLICT (pin) DO NOTHING;

-- Catégories de test
INSERT INTO categories (nom, ordre) VALUES
  ('Tacos', 1),
  ('Burgers', 2),
  ('Boissons', 3),
  ('Desserts', 4)
ON CONFLICT (nom) DO NOTHING;

-- Produits de test
-- Insertion automatique avec récupération des category_id
DO $$
DECLARE
  tacos_id UUID;
  burgers_id UUID;
  boissons_id UUID;
BEGIN
  -- Récupérer les IDs des catégories
  SELECT id INTO tacos_id FROM categories WHERE nom = 'Tacos' LIMIT 1;
  SELECT id INTO burgers_id FROM categories WHERE nom = 'Burgers' LIMIT 1;
  SELECT id INTO boissons_id FROM categories WHERE nom = 'Boissons' LIMIT 1;

  -- Insérer les produits
  INSERT INTO products (nom, prix, category_id, actif) VALUES
    ('Tacos M', 6.50, tacos_id, true),
    ('Burger Classic', 7.00, burgers_id, true),
    ('Coca Cola', 2.50, boissons_id, true)
  ON CONFLICT DO NOTHING;
END $$;
