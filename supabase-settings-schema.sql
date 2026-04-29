-- =====================================================
-- TABLE SETTINGS - PARAMÈTRES DE L'APPLICATION
-- =====================================================

-- Table des paramètres
CREATE TABLE IF NOT EXISTS settings (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  key VARCHAR(100) NOT NULL UNIQUE,
  value TEXT NOT NULL,
  description TEXT,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_by UUID REFERENCES users(id) ON DELETE SET NULL
);

-- Activer RLS
ALTER TABLE settings ENABLE ROW LEVEL SECURITY;

-- Politique RLS (accès complet)
DROP POLICY IF EXISTS "Allow all access to settings" ON settings;
CREATE POLICY "Allow all access to settings" ON settings FOR ALL USING (true);

-- =====================================================
-- DONNÉES PAR DÉFAUT
-- =====================================================

INSERT INTO settings (key, value, description) VALUES
  ('tva_sur_place', '10.0', 'TVA pour consommation sur place (%)'),
  ('tva_a_emporter', '5.5', 'TVA pour vente à emporter (%)'),
  ('timer_verrouillage', '300', 'Durée d''inactivité avant verrouillage (secondes)'),
  ('admin_password_hash', '', 'Hash du mot de passe administrateur'),
  ('imprimantes_config', '{"caisse":{"nom":"Imprimante Caisse","ip":"","port":9100,"statut":"inactive","type_ticket":"standard"},"cuisine":{"nom":"Imprimante Cuisine","ip":"","port":9100,"statut":"inactive","type_ticket":"preparation"}}', 'Configuration des imprimantes thermiques WiFi'),
  ('ticket_config', '{"logo":{"actif":false,"url":"","texte_alternatif":"Mon Restaurant","upload_actif":false},"entete":{"actif":true,"ligne1":"FAST-FOOD TACOS & BURGERS","ligne2":"123 Rue de la Paix, 75000 Paris","ligne3":"Tél: 01 23 45 67 89"},"affichage":{"numero_commande":true,"date_heure":true,"nom_caissier":true,"mode_consommation":true},"pied_page":{"actif":true,"ligne1":"Merci de votre visite !","ligne2":"À bientôt","ligne3":"www.monrestaurant.fr"},"mise_en_forme":{"largeur_ticket":48,"police_taille":"normale","separateur":"=","gras_titre":true,"italique_pied":false},"options_avancees":{"qr_code":{"actif":false,"contenu":"url_commande"},"code_barres":{"actif":false,"format":"CODE128"}},"apercu":{"actif":true}}', 'Configuration de la mise en forme des tickets de caisse'),
  ('ticket_cuisine_config', '{"logo":{"actif":true,"texte_alternatif":"🍔 CUISINE"},"entete":{"actif":true,"ligne1":"BON DE PREPARATION","ligne2":""},"affichage":{"numero_commande":true,"heure":true,"buzzer":true,"table_numero":false,"mode_consommation":true,"details_produits":true,"options_supplements":true,"ingredients_retires":true},"pied_page":{"actif":false,"ligne1":"","ligne2":""},"mise_en_forme":{"largeur_ticket":48,"police_taille":"grande","separateur":"=","gras_produits":true,"espacement_produits":true,"taille_police_cuisine":"grande"},"options_production":{"grouper_par_categorie":true,"afficher_quantites_grandes":true},"apercu":{"actif":true}}', 'Configuration de la mise en forme des tickets cuisine')
ON CONFLICT (key) DO NOTHING;
