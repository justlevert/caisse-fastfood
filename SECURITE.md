# 🔒 SÉCURITÉ DE L'APPLICATION

## ✅ MESURES DE SÉCURITÉ IMPLÉMENTÉES

### **1. Authentification Sécurisée**
- ✅ PIN stocké de manière **chiffrée** dans localStorage
- ✅ Limitation à **5 tentatives** de connexion
- ✅ Verrouillage automatique pendant **5 minutes** après échec
- ✅ Compteur de tentatives visible pour l'utilisateur

### **2. Protection des Données Sensibles**
- ✅ Chiffrement des données dans localStorage (PIN, clé API, rôle)
- ✅ Suppression de tous les `console.log` avec données sensibles
- ✅ Clé API OpenAI chiffrée côté client
- ✅ Service de sécurité centralisé (`securityService.ts`)

### **3. Gestion de Session**
- ✅ Timeout automatique après **30 minutes** d'inactivité
- ✅ Déconnexion automatique et nettoyage des données
- ✅ Hook React `useSessionTimeout` réutilisable

### **4. Validation et Contrôles**
- ✅ Validation côté client ET serveur
- ✅ Protection contre les attaques par force brute
- ✅ Vérification des permissions (utilisateur vs admin)

---

## 🔐 FONCTIONS DE SÉCURITÉ DISPONIBLES

### **Service de Sécurité** (`lib/services/securityService.ts`)

```typescript
// Chiffrement
encryptData(data: string): string
decryptData(encryptedData: string): string

// Stockage sécurisé
setSecureItem(key: string, value: string): void
getSecureItem(key: string): string | null
removeSecureItem(key: string): void
clearSecureStorage(): void

// Hash
hashPin(pin: string): Promise<string>

// Limitation de tentatives
recordFailedAttempt(): boolean
resetLoginAttempts(): void
getRemainingLockoutTime(): number
getFailedAttempts(): number
```

### **Hook de Session** (`lib/hooks/useSessionTimeout.ts`)

```typescript
// Utilisation dans un composant
import { useSessionTimeout } from '@/lib/hooks/useSessionTimeout';

function MyComponent() {
  useSessionTimeout(30); // 30 minutes
  // ...
}
```

---

## ⚠️ RECOMMANDATIONS POUR LA PRODUCTION

### **1. Variables d'Environnement**
- ✅ Utiliser `.env.local` pour les secrets (déjà configuré)
- ✅ Ne JAMAIS commit `.env.local` dans Git (déjà dans `.gitignore`)
- ✅ Configurer les variables sur Vercel

### **2. Supabase RLS (Row Level Security)**
- ⚠️ **IMPORTANT** : Activer les politiques RLS sur toutes les tables
- ⚠️ Limiter l'accès aux données selon le rôle utilisateur
- ⚠️ Voir le fichier `PROPOSITION_SECURITE_RLS.md` pour les détails

### **3. HTTPS Obligatoire**
- ✅ Vercel fournit automatiquement HTTPS
- ✅ Redirection automatique HTTP → HTTPS

### **4. Clé API OpenAI**
- ✅ Stockée de manière chiffrée
- ⚠️ Pour une sécurité maximale, déplacer l'appel API côté serveur uniquement
- ⚠️ Limiter les quotas sur le compte OpenAI

### **5. Audit Régulier**
- 🔍 Vérifier les logs Supabase régulièrement
- 🔍 Surveiller les tentatives de connexion échouées
- 🔍 Mettre à jour les dépendances npm régulièrement

---

## 🚨 EN CAS DE COMPROMISSION

### **Si un PIN est compromis :**
1. Changer le PIN dans la base de données Supabase
2. Révoquer les sessions actives
3. Vérifier les logs d'accès

### **Si la clé API OpenAI est compromise :**
1. Révoquer immédiatement la clé sur OpenAI
2. Générer une nouvelle clé
3. Mettre à jour dans l'application

### **Si la base de données est compromise :**
1. Contacter le support Supabase
2. Changer tous les mots de passe
3. Auditer les accès

---

## 📊 CHECKLIST DE SÉCURITÉ AVANT DÉPLOIEMENT

- [x] PIN chiffré dans localStorage
- [x] Limitation de tentatives de connexion
- [x] Timeout de session automatique
- [x] Clé API OpenAI chiffrée
- [x] Console.log sensibles supprimés
- [x] `.env.local` dans `.gitignore`
- [ ] RLS Supabase activé (à configurer)
- [ ] Variables d'environnement sur Vercel (à configurer)
- [ ] Test de pénétration (recommandé)

---

## 🔗 RESSOURCES

- [Documentation Supabase RLS](https://supabase.com/docs/guides/auth/row-level-security)
- [Sécurité Next.js](https://nextjs.org/docs/app/building-your-application/authentication)
- [OWASP Top 10](https://owasp.org/www-project-top-ten/)

---

**Date de dernière mise à jour** : Juin 2026
**Version** : 1.0.0
