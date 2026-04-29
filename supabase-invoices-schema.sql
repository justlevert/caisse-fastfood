-- =====================================================
-- SCHÉMA SUPABASE - MODULE MOBILE FACTURES
-- =====================================================

-- Table pour stocker les factures scannées
CREATE TABLE IF NOT EXISTS invoices (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  
  -- Données de la facture
  fournisseur TEXT NOT NULL,
  adresse TEXT,
  date_facture DATE NOT NULL,
  montant_valide DECIMAL(10,2),
  montant_ttc DECIMAL(10,2) NOT NULL,
  tva DECIMAL(10,2),
  numero_facture TEXT,
  categorie TEXT,
  
  -- Métadonnées
  image_url TEXT,
  confidence_fournisseur DECIMAL(3,2),
  confidence_date DECIMAL(3,2),
  
  -- Audit
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Index pour améliorer les performances
CREATE INDEX IF NOT EXISTS idx_invoices_user_id ON invoices(user_id);
CREATE INDEX IF NOT EXISTS idx_invoices_date_facture ON invoices(date_facture);
CREATE INDEX IF NOT EXISTS idx_invoices_created_at ON invoices(created_at DESC);

-- RLS (Row Level Security) - Admin uniquement
ALTER TABLE invoices ENABLE ROW LEVEL SECURITY;

-- Policy : Seuls les admins peuvent voir les factures
CREATE POLICY "Admin can view invoices" ON invoices
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role = 'administrateur'
    )
  );

-- Policy : Seuls les admins peuvent insérer des factures
CREATE POLICY "Admin can insert invoices" ON invoices
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role = 'administrateur'
    )
  );

-- Policy : Seuls les admins peuvent modifier des factures
CREATE POLICY "Admin can update invoices" ON invoices
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role = 'administrateur'
    )
  );

-- Policy : Seuls les admins peuvent supprimer des factures
CREATE POLICY "Admin can delete invoices" ON invoices
  FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role = 'administrateur'
    )
  );

-- Fonction pour mettre à jour automatiquement updated_at
CREATE OR REPLACE FUNCTION update_invoices_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger pour updated_at
CREATE TRIGGER trigger_invoices_updated_at
  BEFORE UPDATE ON invoices
  FOR EACH ROW
  EXECUTE FUNCTION update_invoices_updated_at();

-- =====================================================
-- CONFIGURATION SUPABASE STORAGE
-- =====================================================

-- Créer le bucket pour les images de factures
-- À exécuter dans le dashboard Supabase Storage :
-- Nom du bucket : invoices
-- Public : false (privé, accès admin uniquement)
