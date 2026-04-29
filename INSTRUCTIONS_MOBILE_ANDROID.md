# 📱 GUIDE D'ACCÈS MOBILE ANDROID

## ⚠️ PROBLÈME IDENTIFIÉ

Votre téléphone Android ne peut pas accéder à `localhost:3002` car **localhost = le téléphone lui-même**, pas votre PC.

---

## ✅ SOLUTION RAPIDE (HTTP - Sans caméra)

### **1. Vérifiez que PC et téléphone sont sur le même WiFi**

### **2. Sur votre téléphone Android, ouvrez :**
```
http://192.168.0.38:3002
```

**Fonctionnera :**
- ✅ Page login
- ✅ Page commande
- ✅ Toutes les pages sauf caméra

**Ne fonctionnera PAS :**
- ❌ Bouton "Prendre une photo" (nécessite HTTPS)

---

## 🔒 SOLUTION COMPLÈTE (HTTPS - Avec caméra)

Pour que la caméra fonctionne sur Android, vous devez utiliser **HTTPS**.

### **Étape 1 : Installer mkcert (certificat local)**

**Sur votre PC Windows :**

```powershell
# Installer Chocolatey (si pas déjà installé)
Set-ExecutionPolicy Bypass -Scope Process -Force; [System.Net.ServicePointManager]::SecurityProtocol = [System.Net.ServicePointManager]::SecurityProtocol -bor 3072; iex ((New-Object System.Net.WebClient).DownloadString('https://community.chocolatey.org/install.ps1'))

# Installer mkcert
choco install mkcert

# Créer le certificat
cd c:\Saas\Caisse
mkcert -install
mkcert localhost 192.168.0.38
```

Cela créera :
- `localhost+1.pem` (certificat)
- `localhost+1-key.pem` (clé privée)

### **Étape 2 : Renommer les fichiers**

```powershell
cd c:\Saas\Caisse
Rename-Item "localhost+1.pem" "localhost-cert.pem"
Rename-Item "localhost+1-key.pem" "localhost-key.pem"
```

### **Étape 3 : Démarrer le serveur HTTPS**

```powershell
node server-https.js
```

### **Étape 4 : Sur votre téléphone Android**

1. Ouvrez Chrome
2. Tapez : `https://192.168.0.38:3443`
3. Acceptez le certificat (cliquez "Avancé" → "Continuer")
4. La caméra fonctionnera maintenant ! 📸

---

## 🧪 TESTS À EFFECTUER

### **Test 1 : Page Login**
- URL : `http://192.168.0.38:3002`
- Vérifier : Design bleu, logo 🍔, auto-submit

### **Test 2 : Page Factures Mobile**
- URL : `http://192.168.0.38:3002/mobile/factures`
- Code : `9999`
- Vérifier : Liste factures, bouton +

### **Test 3 : Caméra (nécessite HTTPS)**
- URL : `https://192.168.0.38:3443/mobile/factures`
- Cliquer : Bouton + → Prendre une photo
- Vérifier : Caméra s'ouvre

---

## ❓ DÉPANNAGE

### **"Site inaccessible" sur Android**
- ✅ Vérifiez que PC et téléphone sont sur le même WiFi
- ✅ Vérifiez que le serveur tourne (voir terminal PC)
- ✅ Essayez de ping l'IP depuis le téléphone

### **"Connexion non sécurisée" (HTTPS)**
- ✅ Normal pour certificat auto-signé
- ✅ Cliquez "Avancé" → "Continuer vers le site"

### **Caméra ne s'ouvre pas**
- ✅ Utilisez HTTPS (pas HTTP)
- ✅ Autorisez les permissions caméra dans Chrome
- ✅ Vérifiez que Chrome a accès à la caméra (Paramètres Android)

---

## 🚀 COMMANDES RAPIDES

### **Démarrer serveur HTTP (sans caméra) :**
```powershell
cd c:\Saas\Caisse
npm run dev
```
Accès : `http://192.168.0.38:3002`

### **Démarrer serveur HTTPS (avec caméra) :**
```powershell
cd c:\Saas\Caisse
node server-https.js
```
Accès : `https://192.168.0.38:3443`

---

## 📝 RÉSUMÉ

| Fonctionnalité | HTTP (3002) | HTTPS (3443) |
|----------------|-------------|--------------|
| Page Login | ✅ | ✅ |
| Page Commande | ✅ | ✅ |
| Page Factures | ✅ | ✅ |
| **Caméra** | ❌ | ✅ |
| Charger fichier | ✅ | ✅ |

**Recommandation : Utilisez HTTPS pour tester la caméra sur Android.**
