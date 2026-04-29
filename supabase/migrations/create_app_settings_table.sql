-- Création de la table app_settings pour stocker les paramètres globaux de l'application
-- Cette table permet de synchroniser les paramètres entre desktop et mobile

CREATE TABLE IF NOT EXISTS app_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  openai_api_key TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Trigger pour mettre à jour automatiquement updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_app_settings_updated_at ON app_settings;

CREATE TRIGGER update_app_settings_updated_at
  BEFORE UPDATE ON app_settings
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- RLS (Row Level Security)
ALTER TABLE app_settings ENABLE ROW LEVEL SECURITY;

-- Politique : Tout le monde peut lire les paramètres
CREATE POLICY "app_settings_select_policy"
  ON app_settings
  FOR SELECT
  USING (true);

-- Politique : Tout le monde peut insérer
CREATE POLICY "app_settings_insert_policy"
  ON app_settings
  FOR INSERT
  WITH CHECK (true);

-- Politique : Tout le monde peut modifier
CREATE POLICY "app_settings_update_policy"
  ON app_settings
  FOR UPDATE
  USING (true)
  WITH CHECK (true);

-- Politique : Tout le monde peut supprimer
CREATE POLICY "app_settings_delete_policy"
  ON app_settings
  FOR DELETE
  USING (true);
