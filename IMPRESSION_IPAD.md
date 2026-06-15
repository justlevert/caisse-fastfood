# 🖨️ Configuration de l'impression depuis iPad/Tablette

## 📋 Problème

Les navigateurs sur iPad/tablettes ne peuvent pas se connecter directement aux imprimantes thermiques pour des raisons de sécurité. Il faut un **serveur intermédiaire**.

## ✅ Solution : Serveur d'impression

### 1️⃣ Installation du serveur (sur un ordinateur Windows/Mac/Linux)

**Prérequis :**
- Un ordinateur connecté au même réseau WiFi que l'iPad et les imprimantes
- Node.js installé (version 16 ou supérieure)

**Installation :**

```bash
# 1. Ouvrir un terminal dans le dossier print-server
cd print-server

# 2. Installer les dépendances
npm install

# 3. Démarrer le serveur
npm start
```

Le serveur démarre sur le port **3001**.

### 2️⃣ Trouver l'adresse IP de l'ordinateur

**Windows :**
```cmd
ipconfig
```
Cherchez "Adresse IPv4" (ex: `192.168.1.100`)

**Mac/Linux :**
```bash
ifconfig
# ou
ip addr
```

### 3️⃣ Configuration dans l'application

1. Sur l'iPad, ouvrez l'application LevertOS
2. Allez dans **Paramètres → Imprimantes**
3. Dans la section **"Serveur d'impression (iPad/Tablettes)"**
4. Entrez l'URL : `http://[IP_ORDINATEUR]:3001`
   - Exemple : `http://192.168.1.100:3001`
5. Configurez normalement les imprimantes (IP, port, etc.)
6. Cliquez sur **"Enregistrer"**

### 4️⃣ Test

1. Testez la connexion au serveur depuis Safari sur iPad :
   ```
   http://192.168.1.100:3001/health
   ```
   Vous devriez voir : `{"status":"ok","message":"Serveur d'impression actif"}`

2. Dans l'app, testez l'impression avec le bouton **"🖨️ Imprimer test"**

## 🔧 Architecture

```
┌─────────┐         WiFi          ┌──────────────┐         WiFi          ┌────────────┐
│  iPad   │ ──────────────────────▶│  Ordinateur  │ ──────────────────────▶│ Imprimante │
│ (App)   │  HTTP (port 3001)     │  (Serveur)   │  TCP (port 9100)      │ Thermique  │
└─────────┘                        └──────────────┘                        └────────────┘
```

## 📝 Notes importantes

- **Le serveur doit rester actif** pendant les heures d'ouverture
- L'ordinateur, l'iPad et les imprimantes doivent être sur le **même réseau WiFi**
- Le pare-feu de l'ordinateur doit autoriser le port **3001**
- Les imprimantes doivent avoir une **IP fixe** (configurée dans le routeur)

## 🐛 Dépannage

### "Impossible de se connecter au serveur"
- ✅ Vérifiez que le serveur est démarré (`npm start`)
- ✅ Vérifiez l'adresse IP de l'ordinateur
- ✅ Vérifiez que l'iPad et l'ordinateur sont sur le même WiFi
- ✅ Testez l'URL dans Safari : `http://[IP]:3001/health`

### "Imprimante non connectée"
- ✅ Vérifiez que l'imprimante est allumée
- ✅ Vérifiez l'IP de l'imprimante
- ✅ Pingez l'imprimante depuis l'ordinateur : `ping [IP_IMPRIMANTE]`
- ✅ Vérifiez que l'imprimante est sur le même réseau

### Le serveur se ferme tout seul
- Utilisez un gestionnaire de processus comme **PM2** :
  ```bash
  npm install -g pm2
  pm2 start server.js --name print-server
  pm2 save
  pm2 startup
  ```

## 🚀 Démarrage automatique (optionnel)

Pour que le serveur démarre automatiquement au démarrage de l'ordinateur :

**Windows :**
- Créez un raccourci du script dans le dossier Démarrage
- Ou utilisez le Planificateur de tâches

**Mac :**
- Créez un fichier `.plist` dans `~/Library/LaunchAgents/`

**Linux :**
- Créez un service systemd

Ou utilisez **PM2** (recommandé) :
```bash
npm install -g pm2
cd print-server
pm2 start server.js --name print-server
pm2 save
pm2 startup
```

## 💡 Alternative : Impression Cloud

Si vous ne pouvez pas installer de serveur local, envisagez :
- **Google Cloud Print** (obsolète)
- **PrintNode** (service payant)
- **CUPS** (serveur d'impression Linux)

Mais le serveur Node.js local est la solution la plus simple et gratuite ! 🎉
