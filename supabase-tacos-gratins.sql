-- =====================================================
-- AJOUT OPTION GRATINAGE POUR TACOS PERSONNALISABLES
-- Application de Caisse Fast-Food
-- =====================================================

-- Table des options de gratinage
CREATE TABLE IF NOT EXISTS taco_gratins (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  nom VARCHAR(100) NOT NULL,
  prix DECIMAL(10, 2) NOT NULL DEFAULT 0,
  image_url TEXT,
  actif BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- ROW LEVEL SECURITY (RLS)
-- =====================================================

ALTER TABLE taco_gratins ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow all access to taco_gratins" ON taco_gratins;
CREATE POLICY "Allow all access to taco_gratins" ON taco_gratins FOR ALL USING (true);

-- =====================================================
-- DONNÉES DE TEST
-- =====================================================

-- Options de gratinage
INSERT INTO taco_gratins (nom, prix) VALUES
  ('Sans gratinage', 0.00),
  ('Gratinage fromage', 1.00),
  ('Gratinage emmental', 1.00),
  ('Gratinage cheddar', 1.20),
  ('Gratinage 3 fromages', 1.50)
ON CONFLICT DO NOTHING;
