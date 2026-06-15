-- Ajouter le paramètre de devise dans la table settings
-- À exécuter dans l'éditeur SQL de Supabase

INSERT INTO settings (key, value, description)
VALUES (
  'devise',
  'EUR',
  'Devise utilisée dans l''application (EUR ou CHF)'
)
ON CONFLICT (key) DO NOTHING;

-- Vérifier que le paramètre a été ajouté
SELECT * FROM settings WHERE key = 'devise';
