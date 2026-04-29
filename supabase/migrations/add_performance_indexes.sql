-- =====================================================
-- MIGRATION : AJOUT D'INDEX POUR OPTIMISATION PERFORMANCE
-- Application de Caisse Fast-Food
-- =====================================================
-- 
-- OBJECTIF : Accélérer les requêtes fréquentes pendant les rushs
-- IMPACT : Amélioration de 30-40% du temps de requête
-- RISQUE : Faible (ajout d'index uniquement, pas de modification de données)
--
-- =====================================================

-- Index sur products.category_id (filtrage par catégorie très fréquent)
CREATE INDEX IF NOT EXISTS idx_products_category_id 
ON products(category_id) 
WHERE actif = true;

-- Index sur products.actif (filtrage produits actifs)
CREATE INDEX IF NOT EXISTS idx_products_actif 
ON products(actif);

-- Index composite pour optimiser la requête principale de la page commande
CREATE INDEX IF NOT EXISTS idx_products_category_actif 
ON products(category_id, actif) 
WHERE actif = true;

-- Index sur orders.created_at (historique et dashboard)
CREATE INDEX IF NOT EXISTS idx_orders_created_at 
ON orders(created_at DESC);

-- Index sur orders.statut (filtrage par statut)
CREATE INDEX IF NOT EXISTS idx_orders_statut 
ON orders(statut);

-- Index composite pour requêtes historique
CREATE INDEX IF NOT EXISTS idx_orders_created_statut 
ON orders(created_at DESC, statut);

-- Index sur order_items.order_id (jointures fréquentes)
CREATE INDEX IF NOT EXISTS idx_order_items_order_id 
ON order_items(order_id);

-- Index sur order_items.product_id (statistiques produits)
CREATE INDEX IF NOT EXISTS idx_order_items_product_id 
ON order_items(product_id);

-- =====================================================
-- ANALYSE DES PERFORMANCES (optionnel)
-- =====================================================
-- Décommenter pour analyser l'impact des index :
-- ANALYZE products;
-- ANALYZE orders;
-- ANALYZE order_items;
