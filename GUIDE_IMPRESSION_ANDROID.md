# 📱 Guide d'installation : Serveur d'impression sur smartphone Android

## 🎯 Objectif

Transformer un vieux smartphone Android en serveur d'impression pour permettre l'impression depuis iPad vers des imprimantes thermiques WiFi.

---

## 📋 Matériel nécessaire

- ✅ Smartphone Android (version 7.0 minimum)
- ✅ Chargeur + câble USB
- ✅ Connexion WiFi
- ✅ Imprimantes thermiques WiFi (80mm)
- ✅ iPad avec l'application LevertOS

**Recommandations :**
- Android 9.0 ou supérieur
- 2GB de RAM minimum
- Batterie en bon état

---

## 🚀 ÉTAPE 1 : Installation de Termux

### 1.1 Télécharger Termux

**⚠️ IMPORTANT : Ne PAS utiliser Google Play Store (version obsolète)**

**Méthode recommandée : F-Droid**

1. Sur le smartphone Android, ouvrez le navigateur
2. Allez sur : **https://f-droid.org**
3. Téléchargez et installez l'application **F-Droid**
4. Ouvrez F-Droid
5. Recherchez **"Termux"**
6. Installez **Termux** (com.termux)

**Alternative : Téléchargement direct**
- URL : https://f-droid.org/packages/com.termux/
- Téléchargez le fichier APK
- Installez-le (autorisez les sources inconnues si demandé)

### 1.2 Premiers réglages Android

1. **Désactiver l'économie d'énergie pour Termux**
   - Paramètres → Applications → Termux
   - Batterie → Non restreint

2. **Activer "Rester activé pendant le chargement"**
   - Paramètres → Options pour les développeurs
   - Activez "Rester activé pendant le chargement"
   
   *Si "Options pour les développeurs" n'est pas visible :*
   - Paramètres → À propos du téléphone
   - Appuyez 7 fois sur "Numéro de build"

---

## 🔧 ÉTAPE 2 : Configuration de Termux

### 2.1 Mise à jour du système

Ouvrez **Termux** et tapez les commandes suivantes :

```bash
# Mettre à jour les paquets
pkg update

# Confirmer avec "Y" (Yes) si demandé
```

Puis :

```bash
# Mettre à niveau les paquets
pkg upgrade

# Confirmer avec "Y" si demandé
```

⏱️ *Durée : 2-5 minutes selon la connexion*

### 2.2 Installation de Node.js

```bash
# Installer Node.js et npm
pkg install nodejs

# Vérifier l'installation
node --version
npm --version
```

Vous devriez voir :
```
v18.x.x
9.x.x
```

### 2.3 Accès au stockage (optionnel)

```bash
# Donner accès au stockage du téléphone
termux-setup-storage

# Accepter la permission quand demandé
```

---

## 📦 ÉTAPE 3 : Création du serveur d'impression

### 3.1 Créer le dossier du projet

```bash
# Créer et entrer dans le dossier
mkdir print-server
cd print-server
```

### 3.2 Créer le fichier package.json

```bash
cat > package.json << 'EOF'
{
  "name": "levert-print-server",
  "version": "1.0.0",
  "description": "Serveur d'impression pour imprimantes thermiques",
  "main": "server.js",
  "scripts": {
    "start": "node server.js"
  },
  "dependencies": {
    "express": "^4.18.2",
    "cors": "^2.8.5",
    "node-thermal-printer": "^4.4.4"
  }
}
EOF
```

### 3.3 Créer le fichier server.js

```bash
cat > server.js << 'EOF'
const express = require('express');
const cors = require('cors');
const { ThermalPrinter, PrinterTypes } = require('node-thermal-printer');

const app = express();
const PORT = 3001;

// Middleware
app.use(cors());
app.use(express.json({ limit: '10mb' }));

// Route de santé
app.get('/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    message: 'Serveur d\'impression actif',
    timestamp: new Date().toISOString()
  });
});

// Route d'impression
app.post('/print', async (req, res) => {
  try {
    const { ip, port = 9100, commands } = req.body;

    // Validation
    if (!ip) {
      return res.status(400).json({ 
        success: false, 
        message: 'Adresse IP de l\'imprimante requise' 
      });
    }

    if (!commands || !Array.isArray(commands)) {
      return res.status(400).json({ 
        success: false, 
        message: 'Commandes d\'impression requises' 
      });
    }

    console.log(`📄 Impression vers ${ip}:${port}`);

    // Créer l'imprimante
    const printer = new ThermalPrinter({
      type: PrinterTypes.EPSON,
      interface: `tcp://${ip}:${port}`,
      removeSpecialCharacters: false,
      lineCharacter: '=',
      options: {
        timeout: 5000,
      },
    });

    // Vérifier la connexion
    const isConnected = await printer.isPrinterConnected();
    
    if (!isConnected) {
      console.error(`❌ Imprimante ${ip}:${port} non connectée`);
      return res.status(500).json({
        success: false,
        message: `Impossible de se connecter à l'imprimante ${ip}:${port}`
      });
    }

    console.log(`✅ Connecté à l'imprimante ${ip}:${port}`);

    // Exécuter les commandes
    for (const cmd of commands) {
      const { method, args = [] } = cmd;
      
      if (typeof printer[method] === 'function') {
        printer[method](...args);
      } else {
        console.warn(`⚠️ Méthode inconnue: ${method}`);
      }
    }

    // Envoyer à l'imprimante
    await printer.execute();

    console.log(`✅ Impression réussie sur ${ip}:${port}`);

    res.json({
      success: true,
      message: 'Impression réussie'
    });

  } catch (error) {
    console.error('❌ Erreur d\'impression:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Erreur d\'impression inconnue'
    });
  }
});

// Démarrer le serveur
app.listen(PORT, '0.0.0.0', () => {
  console.log('');
  console.log('🖨️  ═══════════════════════════════════════════════════');
  console.log('🖨️  SERVEUR D\'IMPRESSION LEVERT - DÉMARRÉ');
  console.log('🖨️  ═══════════════════════════════════════════════════');
  console.log(`🖨️  Port: ${PORT}`);
  console.log('🖨️  ═══════════════════════════════════════════════════');
  console.log('');
  console.log('📱 Serveur accessible depuis l\'iPad');
  console.log('💡 Trouvez l\'IP de ce téléphone avec : ifconfig wlan0');
  console.log('');
});
EOF
```

### 3.4 Installer les dépendances

```bash
# Installation des packages npm
npm install
```

⏱️ *Durée : 3-10 minutes selon la connexion*

Vous devriez voir :
```
added XXX packages
```

---

## 🌐 ÉTAPE 4 : Trouver l'adresse IP du smartphone

### 4.1 Commande pour trouver l'IP

Dans Termux, tapez :

```bash
ifconfig wlan0 | grep "inet "
```

**Ou :**

```bash
ip addr show wlan0 | grep "inet "
```

### 4.2 Identifier l'adresse IP

Vous verrez quelque chose comme :
```
inet 192.168.1.50/24 brd 192.168.1.255 scope global wlan0
```

**Votre adresse IP est : `192.168.1.50`**

📝 **Notez cette adresse IP, vous en aurez besoin !**

---

## ▶️ ÉTAPE 5 : Démarrer le serveur

### 5.1 Lancer le serveur

```bash
# Assurez-vous d'être dans le bon dossier
cd ~/print-server

# Démarrer le serveur
npm start
```

### 5.2 Vérification

Vous devriez voir :

```
🖨️  ═══════════════════════════════════════════════════
🖨️  SERVEUR D'IMPRESSION LEVERT - DÉMARRÉ
🖨️  ═══════════════════════════════════════════════════
🖨️  Port: 3001
🖨️  ═══════════════════════════════════════════════════

📱 Serveur accessible depuis l'iPad
💡 Trouvez l'IP de ce téléphone avec : ifconfig wlan0
```

✅ **Le serveur est maintenant actif !**

⚠️ **Ne fermez pas Termux** - Laissez l'application ouverte

---

## 🔒 ÉTAPE 6 : Empêcher la mise en veille

### 6.1 Installer Termux:API

```bash
# Installer le package API
pkg install termux-api
```

### 6.2 Activer le wake lock

```bash
# Empêcher le téléphone de se mettre en veille
termux-wake-lock
```

Vous verrez une notification "Termux wake lock held"

### 6.3 Vérifier que ça fonctionne

Le téléphone ne devrait plus se mettre en veille tant que Termux est ouvert.

---

## 📱 ÉTAPE 7 : Configuration sur l'iPad

### 7.1 Tester la connexion

1. Sur l'iPad, ouvrez **Safari**
2. Allez sur : `http://192.168.1.50:3001/health`
   *(Remplacez par votre IP)*
3. Vous devriez voir :
   ```json
   {
     "status": "ok",
     "message": "Serveur d'impression actif",
     "timestamp": "2026-06-14T15:05:00.000Z"
   }
   ```

✅ **Si vous voyez ce message, la connexion fonctionne !**

### 7.2 Configurer l'application LevertOS

1. Ouvrez l'application **LevertOS** sur l'iPad
2. Allez dans **Paramètres** (⚙️)
3. Cliquez sur **Imprimantes**
4. Dans la section **"Serveur d'impression (iPad/Tablettes)"** :
   - Entrez : `http://192.168.1.50:3001`
   - *(Remplacez par votre IP)*
5. Configurez vos imprimantes :
   - **Imprimante Caisse** : IP de l'imprimante caisse
   - **Imprimante Cuisine** : IP de l'imprimante cuisine
6. Cliquez sur **Enregistrer**

### 7.3 Tester l'impression

1. Dans les paramètres, cliquez sur **"🖨️ Imprimer test"**
2. Un ticket de test devrait s'imprimer
3. ✅ Si ça fonctionne, c'est terminé !

---

## 🔄 ÉTAPE 8 : Démarrage automatique (Optionnel)

### 8.1 Installer Termux:Boot

1. Téléchargez **Termux:Boot** depuis F-Droid
   - URL : https://f-droid.org/packages/com.termux.boot/
2. Installez l'application

### 8.2 Créer le script de démarrage

Dans Termux :

```bash
# Créer le dossier boot
mkdir -p ~/.termux/boot

# Créer le script
cat > ~/.termux/boot/start-print-server.sh << 'EOF'
#!/data/data/com.termux/files/usr/bin/bash
termux-wake-lock
cd ~/print-server
npm start
EOF

# Rendre le script exécutable
chmod +x ~/.termux/boot/start-print-server.sh
```

### 8.3 Activer le démarrage automatique

1. Redémarrez le téléphone
2. Ouvrez **Termux:Boot** une fois
3. Le serveur démarrera automatiquement à chaque démarrage du téléphone

---

## 🛠️ Utilisation quotidienne

### Démarrer le serveur manuellement

```bash
cd ~/print-server
npm start
```

### Arrêter le serveur

Appuyez sur **Ctrl + C** dans Termux

### Redémarrer le serveur

```bash
# Arrêter avec Ctrl+C, puis :
npm start
```

### Voir les logs en temps réel

Les logs s'affichent automatiquement dans Termux quand le serveur tourne.

---

## 🐛 Dépannage

### Problème : "Command not found: node"

**Solution :**
```bash
pkg install nodejs
```

### Problème : "Cannot connect to printer"

**Causes possibles :**
1. L'imprimante n'est pas allumée
2. L'imprimante n'est pas sur le même WiFi
3. L'IP de l'imprimante est incorrecte

**Solution :**
```bash
# Tester la connexion à l'imprimante
ping 192.168.1.X
# (Remplacez X par l'IP de votre imprimante)
```

### Problème : Le serveur s'arrête quand je ferme Termux

**Solution : Utiliser tmux**
```bash
# Installer tmux
pkg install tmux

# Démarrer une session tmux
tmux

# Lancer le serveur
cd ~/print-server
npm start

# Détacher la session : Ctrl+B puis D
# Le serveur continue de tourner en arrière-plan
```

**Pour revenir à la session :**
```bash
tmux attach
```

### Problème : Le téléphone se met en veille

**Solution :**
```bash
termux-wake-lock
```

### Problème : "Port 3001 already in use"

**Solution :**
```bash
# Tuer le processus qui utilise le port
pkill node

# Relancer le serveur
npm start
```

### Problème : L'iPad ne peut pas se connecter

**Vérifications :**
1. ✅ Le smartphone et l'iPad sont sur le même WiFi
2. ✅ Le serveur est démarré (vérifiez dans Termux)
3. ✅ L'IP est correcte
4. ✅ Testez dans Safari : `http://[IP]:3001/health`

---

## 💡 Conseils et optimisations

### Prolonger la durée de vie de la batterie

1. **Limiter la charge à 80%**
   - Utilisez une application comme **AccuBattery**
   - Ou un chargeur intelligent

2. **Réduire la luminosité**
   - Mettez l'écran au minimum

3. **Désactiver les services inutiles**
   - Bluetooth
   - GPS
   - Données mobiles

### Sécurité

- Le serveur est accessible uniquement sur le réseau local
- Ne pas exposer le port 3001 sur Internet
- Gardez le téléphone dans un endroit sûr

### Maintenance

- Redémarrez le téléphone une fois par semaine
- Vérifiez les mises à jour de Termux : `pkg upgrade`
- Surveillez l'espace disque : `df -h`

---

## 📊 Architecture finale

```
┌─────────────────┐
│  iPad (Caisse)  │
│   Application   │
└────────┬────────┘
         │ WiFi
         │ HTTP (port 3001)
         ↓
┌─────────────────┐
│   Smartphone    │
│    Android      │
│  (Termux +      │
│   Node.js)      │
└────────┬────────┘
         │ WiFi
         │ TCP (port 9100)
         ↓
┌─────────────────┐
│  Imprimantes    │
│   Thermiques    │
│   WiFi 80mm     │
└─────────────────┘
```

---

## ✅ Checklist finale

- [ ] Termux installé depuis F-Droid
- [ ] Node.js installé et fonctionnel
- [ ] Serveur créé et dépendances installées
- [ ] IP du smartphone identifiée
- [ ] Serveur démarré avec succès
- [ ] Wake lock activé
- [ ] Test `/health` réussi depuis Safari
- [ ] Configuration iPad complétée
- [ ] Test d'impression réussi
- [ ] (Optionnel) Démarrage automatique configuré

---

## 📞 Support

Si vous rencontrez des problèmes :

1. Vérifiez que toutes les étapes ont été suivies
2. Consultez la section Dépannage
3. Vérifiez les logs dans Termux
4. Redémarrez le serveur et le téléphone

---

## 🎉 Félicitations !

Votre système d'impression est maintenant opérationnel !

**Avantages de cette solution :**
- ✅ Gratuit (si vous avez un vieux Android)
- ✅ Faible consommation électrique (~5W)
- ✅ Compact et discret
- ✅ Fonctionne 24/7
- ✅ Pas besoin d'ordinateur

**Le smartphone peut rester branché en permanence et servir de serveur d'impression pour votre restaurant !**

---

*Document créé le 14 juin 2026*  
*Version 1.0*  
*LevertOS - Système de caisse pour restauration rapide*
