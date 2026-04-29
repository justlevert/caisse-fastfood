-- =====================================================
-- SCHÉMA TACOS PERSONNALISABLES
-- Application de Caisse Fast-Food
-- =====================================================

-- Table des tailles de tacos
CREATE TABLE IF NOT EXISTS taco_sizes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  nom VARCHAR(50) NOT NULL,
  prix DECIMAL(10, 2) NOT NULL,
  max_viandes INTEGER NOT NULL,
  max_sauces INTEGER NOT NULL,
  ordre INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Table des viandes disponibles
CREATE TABLE IF NOT EXISTS taco_meats (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  nom VARCHAR(100) NOT NULL,
  image_url TEXT,
  actif BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Table des sauces disponibles
CREATE TABLE IF NOT EXISTS taco_sauces (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  nom VARCHAR(100) NOT NULL,
  image_url TEXT,
  actif BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Table des accompagnements/extras
CREATE TABLE IF NOT EXISTS taco_extras (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  nom VARCHAR(100) NOT NULL,
  prix DECIMAL(10, 2) NOT NULL DEFAULT 0,
  image_url TEXT,
  actif BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Table des ingrédients à retirer
CREATE TABLE IF NOT EXISTS taco_ingredients (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  nom VARCHAR(100) NOT NULL,
  actif BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Modification de la table products (ajouter colonne is_customizable)
ALTER TABLE products ADD COLUMN IF NOT EXISTS is_customizable BOOLEAN DEFAULT false;

-- Modification de la table order_items (ajouter colonne customization)
ALTER TABLE order_items ADD COLUMN IF NOT EXISTS customization JSONB;

-- =====================================================
-- ROW LEVEL SECURITY (RLS)
-- =====================================================

ALTER TABLE taco_sizes ENABLE ROW LEVEL SECURITY;
ALTER TABLE taco_meats ENABLE ROW LEVEL SECURITY;
ALTER TABLE taco_sauces ENABLE ROW LEVEL SECURITY;
ALTER TABLE taco_extras ENABLE ROW LEVEL SECURITY;
ALTER TABLE taco_ingredients ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow all access to taco_sizes" ON taco_sizes;
CREATE POLICY "Allow all access to taco_sizes" ON taco_sizes FOR ALL USING (true);

DROP POLICY IF EXISTS "Allow all access to taco_meats" ON taco_meats;
CREATE POLICY "Allow all access to taco_meats" ON taco_meats FOR ALL USING (true);

DROP POLICY IF EXISTS "Allow all access to taco_sauces" ON taco_sauces;
CREATE POLICY "Allow all access to taco_sauces" ON taco_sauces FOR ALL USING (true);

DROP POLICY IF EXISTS "Allow all access to taco_extras" ON taco_extras;
CREATE POLICY "Allow all access to taco_extras" ON taco_extras FOR ALL USING (true);

DROP POLICY IF EXISTS "Allow all access to taco_ingredients" ON taco_ingredients;
CREATE POLICY "Allow all access to taco_ingredients" ON taco_ingredients FOR ALL USING (true);

-- =====================================================
-- DONNÉES DE TEST
-- =====================================================

-- Tailles de tacos
INSERT INTO taco_sizes (nom, prix, max_viandes, max_sauces, ordre) VALUES
  ('S', 5.50, 1, 1, 1),
  ('M', 6.50, 2, 2, 2),
  ('L', 7.50, 3, 2, 3),
  ('XL', 8.50, 4, 3, 4)
ON CONFLICT DO NOTHING;

-- Viandes
INSERT INTO taco_meats (nom) VALUES
  ('Poulet'),
  ('Boeuf'),
  ('Merguez'),
  ('Cordon Bleu'),
  ('Kefta')
ON CONFLICT DO NOTHING;

-- Sauces
INSERT INTO taco_sauces (nom) VALUES
  ('Algérienne'),
  ('Samourai'),
  ('Blanche'),
  ('Harissa'),
  ('Barbecue'),
  ('Ketchup'),
  ('Mayonnaise')
ON CONFLICT DO NOTHING;

-- Extras
INSERT INTO taco_extras (nom, prix) VALUES
  ('Fromage', 0.50),
  ('Oeuf', 0.50),
  ('Double viande', 1.50)
ON CONFLICT DO NOTHING;

-- Ingrédients à retirer
INSERT INTO taco_ingredients (nom) VALUES
  ('Oignons'),
  ('Tomates'),
  ('Salade'),
  ('Cornichons')
ON CONFLICT DO NOTHING;
