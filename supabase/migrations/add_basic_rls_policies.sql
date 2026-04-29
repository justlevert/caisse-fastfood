-- =====================================================
-- MIGRATION : POLITIQUES RLS BASIQUES (OPTION C)
-- Application de Caisse Fast-Food
-- =====================================================
-- 
-- ⚠️ ATTENTION : SÉCURITÉ MINIMALE
-- Cette configuration est UNIQUEMENT pour développement local
-- NE PAS UTILISER EN PRODUCTION
--
-- Fonctionnement :
-- - Lecture publique pour données de référence (catégories, produits)
-- - Lecture/écriture authentifiée pour données opérationnelles (commandes)
-- - Gestion admin via application (pas de RLS strict)
--
-- =====================================================

-- =====================================================
-- SUPPRIMER LES ANCIENNES POLITIQUES "ALLOW ALL"
-- =====================================================

-- Users
DROP POLICY IF EXISTS "Allow all access to users" ON users;

-- Categories
DROP POLICY IF EXISTS "Allow all access to categories" ON categories;

-- Products
DROP POLICY IF EXISTS "Allow all access to products" ON products;

-- Orders
DROP POLICY IF EXISTS "Allow all access to orders" ON orders;

-- Order Items
DROP POLICY IF EXISTS "Allow all access to order_items" ON order_items;

-- =====================================================
-- NOUVELLES POLITIQUES RLS BASIQUES
-- =====================================================

-- =====================================================
-- TABLE: users
-- =====================================================

-- Lecture: Tous les utilisateurs authentifiés peuvent lire les profils
CREATE POLICY "authenticated_read_users"
ON users FOR SELECT
TO authenticated, anon
USING (true);

-- Écriture: Tous les utilisateurs authentifiés (validation côté app)
CREATE POLICY "authenticated_write_users"
ON users FOR INSERT, UPDATE, DELETE
TO authenticated, anon
USING (true);

-- =====================================================
-- TABLE: categories
-- =====================================================

-- Lecture publique (nécessaire pour afficher les catégories)
CREATE POLICY "public_read_categories"
ON categories FOR SELECT
TO authenticated, anon
USING (true);

-- Écriture: Tous les utilisateurs authentifiés (validation admin côté app)
CREATE POLICY "authenticated_write_categories"
ON categories FOR INSERT, UPDATE, DELETE
TO authenticated, anon
USING (true);

-- =====================================================
-- TABLE: products
-- =====================================================

-- Lecture publique (nécessaire pour afficher les produits)
CREATE POLICY "public_read_products"
ON products FOR SELECT
TO authenticated, anon
USING (true);

-- Écriture: Tous les utilisateurs authentifiés (validation admin côté app)
CREATE POLICY "authenticated_write_products"
ON products FOR INSERT, UPDATE, DELETE
TO authenticated, anon
USING (true);

-- =====================================================
-- TABLE: orders
-- =====================================================

-- Lecture: Tous les utilisateurs authentifiés
CREATE POLICY "authenticated_read_orders"
ON orders FOR SELECT
TO authenticated, anon
USING (true);

-- Création: Tous les utilisateurs authentifiés
CREATE POLICY "authenticated_create_orders"
ON orders FOR INSERT
TO authenticated, anon
WITH CHECK (true);

-- Modification: Tous les utilisateurs authentifiés (validation admin côté app)
CREATE POLICY "authenticated_update_orders"
ON orders FOR UPDATE
TO authenticated, anon
USING (true);

-- Suppression: Tous les utilisateurs authentifiés (validation admin côté app)
CREATE POLICY "authenticated_delete_orders"
ON orders FOR DELETE
TO authenticated, anon
USING (true);

-- =====================================================
-- TABLE: order_items
-- =====================================================

-- Lecture: Tous les utilisateurs authentifiés
CREATE POLICY "authenticated_read_order_items"
ON order_items FOR SELECT
TO authenticated, anon
USING (true);

-- Création: Tous les utilisateurs authentifiés
CREATE POLICY "authenticated_create_order_items"
ON order_items FOR INSERT
TO authenticated, anon
WITH CHECK (true);

-- Modification: Tous les utilisateurs authentifiés
CREATE POLICY "authenticated_update_order_items"
ON order_items FOR UPDATE
TO authenticated, anon
USING (true);

-- Suppression: Tous les utilisateurs authentifiés
CREATE POLICY "authenticated_delete_order_items"
ON order_items FOR DELETE
TO authenticated, anon
USING (true);

-- =====================================================
-- TABLES TACOS (si elles existent)
-- =====================================================

-- Appliquer les mêmes politiques pour les tables tacos
DO $$
BEGIN
  -- Vérifier si les tables existent avant de créer les politiques
  
  -- taco_sizes
  IF EXISTS (SELECT FROM pg_tables WHERE tablename = 'taco_sizes') THEN
    EXECUTE 'DROP POLICY IF EXISTS "public_read_taco_sizes" ON taco_sizes';
    EXECUTE 'CREATE POLICY "public_read_taco_sizes" ON taco_sizes FOR SELECT TO authenticated, anon USING (true)';
    EXECUTE 'CREATE POLICY "authenticated_write_taco_sizes" ON taco_sizes FOR INSERT, UPDATE, DELETE TO authenticated, anon USING (true)';
  END IF;

  -- taco_meats
  IF EXISTS (SELECT FROM pg_tables WHERE tablename = 'taco_meats') THEN
    EXECUTE 'DROP POLICY IF EXISTS "public_read_taco_meats" ON taco_meats';
    EXECUTE 'CREATE POLICY "public_read_taco_meats" ON taco_meats FOR SELECT TO authenticated, anon USING (true)';
    EXECUTE 'CREATE POLICY "authenticated_write_taco_meats" ON taco_meats FOR INSERT, UPDATE, DELETE TO authenticated, anon USING (true)';
  END IF;

  -- taco_sauces
  IF EXISTS (SELECT FROM pg_tables WHERE tablename = 'taco_sauces') THEN
    EXECUTE 'DROP POLICY IF EXISTS "public_read_taco_sauces" ON taco_sauces';
    EXECUTE 'CREATE POLICY "public_read_taco_sauces" ON taco_sauces FOR SELECT TO authenticated, anon USING (true)';
    EXECUTE 'CREATE POLICY "authenticated_write_taco_sauces" ON taco_sauces FOR INSERT, UPDATE, DELETE TO authenticated, anon USING (true)';
  END IF;

  -- taco_extras
  IF EXISTS (SELECT FROM pg_tables WHERE tablename = 'taco_extras') THEN
    EXECUTE 'DROP POLICY IF EXISTS "public_read_taco_extras" ON taco_extras';
    EXECUTE 'CREATE POLICY "public_read_taco_extras" ON taco_extras FOR SELECT TO authenticated, anon USING (true)';
    EXECUTE 'CREATE POLICY "authenticated_write_taco_extras" ON taco_extras FOR INSERT, UPDATE, DELETE TO authenticated, anon USING (true)';
  END IF;

  -- taco_ingredients
  IF EXISTS (SELECT FROM pg_tables WHERE tablename = 'taco_ingredients') THEN
    EXECUTE 'DROP POLICY IF EXISTS "public_read_taco_ingredients" ON taco_ingredients';
    EXECUTE 'CREATE POLICY "public_read_taco_ingredients" ON taco_ingredients FOR SELECT TO authenticated, anon USING (true)';
    EXECUTE 'CREATE POLICY "authenticated_write_taco_ingredients" ON taco_ingredients FOR INSERT, UPDATE, DELETE TO authenticated, anon USING (true)';
  END IF;

  -- taco_gratins
  IF EXISTS (SELECT FROM pg_tables WHERE tablename = 'taco_gratins') THEN
    EXECUTE 'DROP POLICY IF EXISTS "public_read_taco_gratins" ON taco_gratins';
    EXECUTE 'CREATE POLICY "public_read_taco_gratins" ON taco_gratins FOR SELECT TO authenticated, anon USING (true)';
    EXECUTE 'CREATE POLICY "authenticated_write_taco_gratins" ON taco_gratins FOR INSERT, UPDATE, DELETE TO authenticated, anon USING (true)';
  END IF;

END $$;

-- =====================================================
-- AUTRES TABLES (clotures, invoices, app_settings)
-- =====================================================

DO $$
BEGIN
  -- clotures
  IF EXISTS (SELECT FROM pg_tables WHERE tablename = 'clotures') THEN
    EXECUTE 'DROP POLICY IF EXISTS "authenticated_read_clotures" ON clotures';
    EXECUTE 'CREATE POLICY "authenticated_read_clotures" ON clotures FOR SELECT TO authenticated, anon USING (true)';
    EXECUTE 'CREATE POLICY "authenticated_write_clotures" ON clotures FOR INSERT, UPDATE, DELETE TO authenticated, anon USING (true)';
  END IF;

  -- invoices (mobile)
  IF EXISTS (SELECT FROM pg_tables WHERE tablename = 'invoices') THEN
    EXECUTE 'DROP POLICY IF EXISTS "authenticated_read_invoices" ON invoices';
    EXECUTE 'CREATE POLICY "authenticated_read_invoices" ON invoices FOR SELECT TO authenticated, anon USING (true)';
    EXECUTE 'CREATE POLICY "authenticated_write_invoices" ON invoices FOR INSERT, UPDATE, DELETE TO authenticated, anon USING (true)';
  END IF;

  -- app_settings
  IF EXISTS (SELECT FROM pg_tables WHERE tablename = 'app_settings') THEN
    EXECUTE 'DROP POLICY IF EXISTS "authenticated_read_app_settings" ON app_settings';
    EXECUTE 'CREATE POLICY "authenticated_read_app_settings" ON app_settings FOR SELECT TO authenticated, anon USING (true)';
    EXECUTE 'CREATE POLICY "authenticated_write_app_settings" ON app_settings FOR INSERT, UPDATE, DELETE TO authenticated, anon USING (true)';
  END IF;

END $$;

-- =====================================================
-- NOTES IMPORTANTES
-- =====================================================

-- ⚠️ LIMITATIONS DE SÉCURITÉ :
-- 
-- 1. Lecture publique : N'importe qui avec l'anon key peut lire les données
-- 2. Pas de vérification de rôle : Admin vs Utilisateur géré côté app
-- 3. Pas de traçabilité : Impossible de savoir qui a fait quoi
-- 4. Contournable : Un utilisateur avancé peut modifier les requêtes
--
-- ✅ ACCEPTABLE POUR :
-- - Développement local
-- - Tests
-- - Prototypes
--
-- ❌ NE PAS UTILISER POUR :
-- - Production
-- - Données sensibles
-- - Multi-utilisateurs non fiables
--
-- 📝 POUR AMÉLIORER LA SÉCURITÉ PLUS TARD :
-- - Migrer vers Option A (Supabase Auth + RLS strict)
-- - Ou Option B (API routes avec validation serveur)
--
-- =====================================================
