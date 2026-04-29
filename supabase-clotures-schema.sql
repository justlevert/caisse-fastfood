-- =====================================================
-- SCHEMA CLOTURE DE CAISSE
-- Application de Caisse Fast-Food
-- =====================================================

-- Table des clôtures de caisse
CREATE TABLE IF NOT EXISTS clotures (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  date_cloture TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  
  -- Statistiques de la session
  nombre_commandes INTEGER NOT NULL,
  total_especes DECIMAL(10, 2) NOT NULL DEFAULT 0,
  total_carte DECIMAL(10, 2) NOT NULL DEFAULT 0,
  total_general DECIMAL(10, 2) NOT NULL DEFAULT 0,
  
  -- Période couverte
  date_debut TIMESTAMP WITH TIME ZONE NOT NULL,
  date_fin TIMESTAMP WITH TIME ZONE NOT NULL,
  
  -- Métadonnées
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Ajout du champ cloture_id dans la table orders
ALTER TABLE orders 
ADD COLUMN IF NOT EXISTS cloture_id UUID REFERENCES clotures(id) ON DELETE SET NULL;

-- Index pour améliorer les performances
CREATE INDEX IF NOT EXISTS idx_orders_cloture_id ON orders(cloture_id);
CREATE INDEX IF NOT EXISTS idx_clotures_date ON clotures(date_cloture DESC);

-- =====================================================
-- ROW LEVEL SECURITY (RLS)
-- =====================================================

-- Activer RLS sur la table clotures
ALTER TABLE clotures ENABLE ROW LEVEL SECURITY;

-- Politique RLS (accès complet pour l'instant)
DROP POLICY IF EXISTS "Allow all access to clotures" ON clotures;
CREATE POLICY "Allow all access to clotures" ON clotures FOR ALL USING (true);

-- =====================================================
-- COMMENTAIRES
-- =====================================================

COMMENT ON TABLE clotures IS 'Enregistre les clôtures de caisse avec statistiques de session';
COMMENT ON COLUMN clotures.cloture_id IS 'NULL = session en cours, UUID = session clôturée';
COMMENT ON COLUMN orders.cloture_id IS 'Référence à la clôture de caisse (NULL = session en cours)';
