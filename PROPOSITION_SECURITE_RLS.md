# 🔒 PROPOSITION SÉCURITÉ RLS SUPABASE

## ⚠️ VALIDATION REQUISE AVANT TOUTE MODIFICATION

---

## 📊 SITUATION ACTUELLE

### Authentification
- ❌ PIN stocké dans localStorage (côté client)
- ❌ Pas d'authentification Supabase Auth
- ❌ Pas de session sécurisée

### Politiques RLS
- ✅ RLS activé sur toutes les tables
- ❌ Politiques "Allow all access" (aucune restriction)

### Risques
- 🔴 Accès non restreint aux données
- 🔴 Impossible de tracer les actions par utilisateur
- 🔴 Pas de différenciation utilisateur/admin côté serveur

---

## 🎯 OPTION A : SÉCURITÉ MAXIMALE (RECOMMANDÉ)

### Architecture proposée
```
1. Supabase Auth avec email/password
2. Table users liée à auth.users
3. RLS strict basé sur JWT
4. Rôles utilisateur/administrateur
```

### Tables à modifier

#### users (modification)
```sql
ALTER TABLE users ADD COLUMN auth_user_id UUID REFERENCES auth.users(id);
ALTER TABLE users ADD COLUMN email TEXT UNIQUE;
```

### Politiques RLS proposées

#### 1. TABLE: users
```sql
-- Lecture: Tous les utilisateurs authentifiés peuvent lire leur propre profil
CREATE POLICY "Users can read own profile"
ON users FOR SELECT
USING (auth.uid() = auth_user_id);

-- Lecture admin: Administrateurs peuvent lire tous les profils
CREATE POLICY "Admins can read all profiles"
ON users FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM users
    WHERE auth_user_id = auth.uid()
    AND role = 'administrateur'
  )
);

-- Modification: Seuls les admins peuvent modifier les utilisateurs
CREATE POLICY "Only admins can modify users"
ON users FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM users
    WHERE auth_user_id = auth.uid()
    AND role = 'administrateur'
  )
);
```

#### 2. TABLE: categories
```sql
-- Lecture: Tous les utilisateurs authentifiés
CREATE POLICY "Authenticated users can read categories"
ON categories FOR SELECT
TO authenticated
USING (true);

-- Modification: Seuls les admins
CREATE POLICY "Only admins can modify categories"
ON categories FOR INSERT, UPDATE, DELETE
USING (
  EXISTS (
    SELECT 1 FROM users
    WHERE auth_user_id = auth.uid()
    AND role = 'administrateur'
  )
);
```

#### 3. TABLE: products
```sql
-- Lecture: Tous les utilisateurs authentifiés
CREATE POLICY "Authenticated users can read products"
ON products FOR SELECT
TO authenticated
USING (true);

-- Modification: Seuls les admins
CREATE POLICY "Only admins can modify products"
ON products FOR INSERT, UPDATE, DELETE
USING (
  EXISTS (
    SELECT 1 FROM users
    WHERE auth_user_id = auth.uid()
    AND role = 'administrateur'
  )
);
```

#### 4. TABLE: orders
```sql
-- Lecture: Utilisateurs voient leurs commandes, admins voient tout
CREATE POLICY "Users can read own orders"
ON orders FOR SELECT
USING (
  user_id IN (
    SELECT id FROM users WHERE auth_user_id = auth.uid()
  )
  OR
  EXISTS (
    SELECT 1 FROM users
    WHERE auth_user_id = auth.uid()
    AND role = 'administrateur'
  )
);

-- Création: Tous les utilisateurs authentifiés
CREATE POLICY "Authenticated users can create orders"
ON orders FOR INSERT
TO authenticated
WITH CHECK (true);

-- Modification: Seuls les admins
CREATE POLICY "Only admins can modify orders"
ON orders FOR UPDATE, DELETE
USING (
  EXISTS (
    SELECT 1 FROM users
    WHERE auth_user_id = auth.uid()
    AND role = 'administrateur'
  )
);
```

#### 5. TABLE: order_items
```sql
-- Lecture: Liée aux orders (même logique)
CREATE POLICY "Users can read own order items"
ON order_items FOR SELECT
USING (
  order_id IN (
    SELECT id FROM orders
    WHERE user_id IN (
      SELECT id FROM users WHERE auth_user_id = auth.uid()
    )
  )
  OR
  EXISTS (
    SELECT 1 FROM users
    WHERE auth_user_id = auth.uid()
    AND role = 'administrateur'
  )
);

-- Création: Tous les utilisateurs authentifiés
CREATE POLICY "Authenticated users can create order items"
ON order_items FOR INSERT
TO authenticated
WITH CHECK (true);

-- Modification: Seuls les admins
CREATE POLICY "Only admins can modify order items"
ON order_items FOR UPDATE, DELETE
USING (
  EXISTS (
    SELECT 1 FROM users
    WHERE auth_user_id = auth.uid()
    AND role = 'administrateur'
  )
);
```

---

## 🎯 OPTION B : SÉCURITÉ INTERMÉDIAIRE

### Architecture proposée
```
1. Garder le système PIN actuel
2. Ajouter service_role key côté serveur
3. RLS basé sur user_id passé dans les requêtes
4. Validation côté API routes
```

### Politiques RLS simplifiées

```sql
-- Lecture publique pour données de référence
CREATE POLICY "Public read categories" ON categories FOR SELECT USING (true);
CREATE POLICY "Public read products" ON products FOR SELECT USING (true);

-- Commandes: Accessible à tous les utilisateurs authentifiés (via PIN)
CREATE POLICY "Authenticated can manage orders" ON orders FOR ALL USING (true);
CREATE POLICY "Authenticated can manage order_items" ON order_items FOR ALL USING (true);

-- Gestion: Validation côté application (moins sécurisé)
```

---

## 🎯 OPTION C : SÉCURITÉ MINIMALE

### Politiques RLS basiques

```sql
-- Lecture publique pour tout (comme actuellement)
CREATE POLICY "Public read all" ON categories FOR SELECT USING (true);
CREATE POLICY "Public read all" ON products FOR SELECT USING (true);
CREATE POLICY "Public read all" ON orders FOR SELECT USING (true);

-- Écriture: Restreindre via anon key vs service_role key
-- (Nécessite configuration Supabase côté projet)
```

---

## 📊 COMPARAISON DES OPTIONS

| Critère | Option A | Option B | Option C |
|---------|----------|----------|----------|
| **Sécurité** | ⭐⭐⭐⭐⭐ | ⭐⭐⭐ | ⭐⭐ |
| **Complexité** | Élevée | Moyenne | Faible |
| **Modification code** | Importante | Moyenne | Minimale |
| **Traçabilité** | Excellente | Bonne | Faible |
| **Conformité PRD** | ✅ Complète | ⚠️ Partielle | ❌ Limitée |

---

## 🚀 RECOMMANDATION

### Pour production : **OPTION A**
- Sécurité maximale
- Conforme aux meilleures pratiques
- Traçabilité complète
- Évolutif

### Pour test rapide : **OPTION B**
- Compromis acceptable
- Moins de modifications
- Sécurité correcte

### À éviter : **OPTION C**
- Sécurité insuffisante pour production
- Uniquement pour développement local

---

## ⚠️ VALIDATION REQUISE

**Quelle option souhaitez-vous implémenter ?**

- [ ] **Option A** - Sécurité maximale (Supabase Auth + RLS strict)
- [ ] **Option B** - Sécurité intermédiaire (PIN + RLS basique)
- [ ] **Option C** - Sécurité minimale (développement uniquement)

**Ou souhaitez-vous :**
- [ ] Plus de détails sur une option spécifique
- [ ] Une option personnalisée
- [ ] Reporter la sécurisation pour plus tard

---

## 📝 FICHIERS À CRÉER/MODIFIER PAR OPTION

### Option A
```
CRÉER:
- supabase/migrations/add_supabase_auth.sql
- lib/auth/supabaseAuth.ts
- app/login/page.tsx (nouveau système)

MODIFIER:
- lib/supabase.ts (ajout auth)
- app/page.tsx (migration login)
- Toutes les pages utilisant les données
```

### Option B
```
CRÉER:
- supabase/migrations/add_rls_policies.sql
- lib/middleware/authMiddleware.ts

MODIFIER:
- lib/supabase.ts (ajout user_id context)
- app/api/* (validation PIN)
```

### Option C
```
CRÉER:
- supabase/migrations/add_basic_rls.sql

MODIFIER:
- Aucun fichier code
```

---

## ❓ QUESTIONS À CLARIFIER

1. **Authentification** : Souhaitez-vous migrer vers Supabase Auth ou garder le système PIN ?
2. **Traçabilité** : Besoin de tracer qui fait quoi (logs d'actions) ?
3. **Délai** : Sécurisation urgente ou peut attendre ?
4. **Environnement** : Production déjà en cours ou encore en développement ?

**J'attends votre décision avant toute modification.** 🔒
