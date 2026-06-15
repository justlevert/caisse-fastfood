# 🖨️ Solutions d'impression depuis iPad pour imprimantes Epson WiFi

## 📋 Votre situation

- **Application** : Hébergée sur Vercel (cloud)
- **Appareil** : iPad
- **Imprimantes** : 2 × Epson thermiques WiFi
  - Imprimante Caisse (tickets clients)
  - Imprimante Cuisine (bons de préparation)
- **Problème** : iOS/iPadOS bloque les connexions TCP directes aux imprimantes

---

## ✅ Solution 1 : Serveur d'impression sur smartphone Android (RECOMMANDÉ)

### 💡 Concept

Utilisez un vieux smartphone Android comme serveur d'impression intermédiaire.

```
iPad (Vercel) → HTTP → Smartphone Android → TCP → Imprimantes Epson
```

### ✅ Avantages

- ✅ **Gratuit** - Utilisez un vieux smartphone
- ✅ **Simple** - Installation en 15 minutes
- ✅ **Portable** - Le smartphone peut rester près des imprimantes
- ✅ **Faible consommation** - ~5W
- ✅ **Fiable** - Fonctionne 24/7
- ✅ **Déjà intégré** - Votre app supporte déjà cette solution !

### 📱 Matériel nécessaire

- 1 smartphone Android (même ancien, Android 7+)
- 1 chargeur USB
- Connexion WiFi (même réseau que les imprimantes)

### 🚀 Installation

#### Étape 1 : Installer Termux sur Android

1. Téléchargez **F-Droid** : https://f-droid.org
2. Dans F-Droid, installez **Termux**
3. Ouvrez Termux

#### Étape 2 : Installer Node.js

```bash
pkg update && pkg upgrade
pkg install nodejs
```

#### Étape 3 : Créer le serveur d'impression

```bash
mkdir ~/print-server
cd ~/print-server
```

Créez `package.json` :
```bash
cat > package.json << 'EOF'
{
  "name": "print-server",
  "version": "1.0.0",
  "type": "module",
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

Créez `server.js` :
```bash
cat > server.js << 'EOF'
import express from 'express';
import cors from 'cors';
import { ThermalPrinter, PrinterTypes } from 'node-thermal-printer';

const app = express();
app.use(cors());
app.use(express.json({ limit: '10mb' }));

const PORT = 3001;

// Test de santé
app.get('/health', (req, res) => {
  res.json({ status: 'ok', message: 'Serveur d\'impression actif' });
});

// Test de connexion à une imprimante
app.post('/test-printer', async (req, res) => {
  const { ip, port } = req.body;
  
  try {
    const printer = new ThermalPrinter({
      type: PrinterTypes.EPSON,
      interface: `tcp://${ip}:${port || 9100}`,
      characterSet: 'FRANCE',
      removeSpecialCharacters: true,
      lineCharacter: '=',
      options: { timeout: 5000 }
    });

    const isConnected = await printer.isPrinterConnected();
    
    if (isConnected) {
      res.json({ success: true, message: 'Imprimante connectée' });
    } else {
      res.status(400).json({ success: false, message: 'Imprimante non accessible' });
    }
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Imprimer un ticket
app.post('/print', async (req, res) => {
  const { ip, port, commands } = req.body;
  
  try {
    const printer = new ThermalPrinter({
      type: PrinterTypes.EPSON,
      interface: `tcp://${ip}:${port || 9100}`,
      characterSet: 'FRANCE',
      removeSpecialCharacters: true,
      lineCharacter: '=',
      options: { timeout: 10000 }
    });

    const isConnected = await printer.isPrinterConnected();
    if (!isConnected) {
      return res.status(400).json({ success: false, message: 'Imprimante non connectée' });
    }

    // Exécuter les commandes
    for (const cmd of commands) {
      switch (cmd.type) {
        case 'println':
          printer.println(cmd.text);
          break;
        case 'bold':
          printer.bold(cmd.value);
          break;
        case 'alignCenter':
          printer.alignCenter();
          break;
        case 'alignLeft':
          printer.alignLeft();
          break;
        case 'drawLine':
          printer.drawLine();
          break;
        case 'newLine':
          printer.newLine();
          break;
        case 'cut':
          printer.cut();
          break;
      }
    }

    await printer.execute();
    res.json({ success: true, message: 'Impression réussie' });
  } catch (error) {
    console.error('Erreur impression:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`🖨️  Serveur d'impression démarré sur le port ${PORT}`);
  console.log(`📱 Accessible sur le réseau local`);
});
EOF
```

#### Étape 4 : Installer et démarrer

```bash
npm install
npm start
```

#### Étape 5 : Trouver l'IP du smartphone

```bash
ifconfig wlan0 | grep "inet "
```

Notez l'IP (ex: `192.168.1.50`)

#### Étape 6 : Configurer dans l'application

1. Sur iPad, ouvrez votre app LevertOS
2. **Paramètres → Imprimantes**
3. Dans "Serveur d'impression" : `http://192.168.1.50:3001`
4. Configurez les IP des imprimantes :
   - Imprimante Caisse : `192.168.1.100` (exemple)
   - Imprimante Cuisine : `192.168.1.101` (exemple)
5. Testez la connexion

### 🔄 Démarrage automatique (optionnel)

Pour que le serveur démarre automatiquement :

```bash
# Installer tmux
pkg install tmux

# Créer un script de démarrage
cat > ~/start-print-server.sh << 'EOF'
#!/data/data/com.termux/files/usr/bin/bash
cd ~/print-server
npm start
EOF

chmod +x ~/start-print-server.sh

# Démarrer dans tmux
tmux new -d -s print-server ~/start-print-server.sh
```

### 📖 Guide complet

Consultez `GUIDE_IMPRESSION_ANDROID.md` pour le guide détaillé.

---

## ✅ Solution 2 : Raspberry Pi comme serveur d'impression

### 💡 Concept

Utilisez un Raspberry Pi Zero W ou Pi 4 comme serveur d'impression.

```
iPad (Vercel) → HTTP → Raspberry Pi → TCP → Imprimantes Epson
```

### ✅ Avantages

- ✅ **Professionnel** - Solution stable
- ✅ **Faible consommation** - 2-5W
- ✅ **Compact** - Taille d'une carte de crédit
- ✅ **Fiable** - Conçu pour tourner 24/7
- ✅ **Même code** - Utilise le même serveur Node.js

### 💰 Coût

- **Raspberry Pi Zero W** : ~15€
- **Raspberry Pi 4 (2GB)** : ~45€
- **Carte microSD** : ~10€
- **Alimentation** : ~8€
- **Total** : 33-63€

### 🚀 Installation

1. Installez **Raspberry Pi OS Lite**
2. Connectez en SSH
3. Installez Node.js :
   ```bash
   curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
   sudo apt-get install -y nodejs
   ```
4. Copiez le dossier `print-server/` sur le Pi
5. Installez et démarrez :
   ```bash
   cd ~/print-server
   npm install
   npm start
   ```

### 🔄 Service systemd (démarrage auto)

```bash
sudo nano /etc/systemd/system/print-server.service
```

```ini
[Unit]
Description=Print Server
After=network.target

[Service]
Type=simple
User=pi
WorkingDirectory=/home/pi/print-server
ExecStart=/usr/bin/npm start
Restart=always

[Install]
WantedBy=multi-user.target
```

```bash
sudo systemctl enable print-server
sudo systemctl start print-server
```

---

## ✅ Solution 3 : Mini PC / PC recyclé

### 💡 Concept

Utilisez un vieux PC ou mini PC comme serveur d'impression.

### ✅ Avantages

- ✅ **Gratuit** - Si vous avez déjà un vieux PC
- ✅ **Puissant** - Peut gérer d'autres tâches
- ✅ **Facile** - Installation Windows ou Linux classique

### ⚠️ Inconvénients

- ⚠️ **Consommation** - 20-50W
- ⚠️ **Encombrant** - Plus gros qu'un smartphone/Pi
- ⚠️ **Bruit** - Ventilateurs

### 🚀 Installation (Windows)

1. Installez **Node.js** : https://nodejs.org
2. Copiez le dossier `print-server/`
3. Ouvrez PowerShell dans ce dossier
4. Installez et démarrez :
   ```powershell
   npm install
   npm start
   ```

### 🔄 Démarrage automatique (Windows)

Créez un fichier `start-print-server.bat` :
```batch
@echo off
cd C:\print-server
npm start
```

Ajoutez ce fichier au démarrage Windows (Win+R → `shell:startup`)

---

## ✅ Solution 4 : Service cloud d'impression (PrintNode)

### 💡 Concept

Utilisez un service tiers comme **PrintNode** pour gérer l'impression.

```
iPad (Vercel) → API PrintNode → Client PrintNode → Imprimantes
```

### ✅ Avantages

- ✅ **Aucun matériel** - Tout dans le cloud
- ✅ **Professionnel** - Support technique
- ✅ **Multi-sites** - Gérez plusieurs restaurants

### ⚠️ Inconvénients

- ⚠️ **Payant** - ~10$/mois par imprimante
- ⚠️ **Dépendance** - Service tiers
- ⚠️ **Configuration** - Plus complexe

### 🚀 Installation

1. Créez un compte sur **PrintNode.com**
2. Installez le client PrintNode sur un PC/Mac
3. Configurez vos imprimantes
4. Intégrez l'API PrintNode dans votre app

---

## ✅ Solution 5 : Serveur Vercel Edge Functions (LIMITÉ)

### 💡 Concept

Utilisez les Edge Functions de Vercel pour envoyer des commandes d'impression.

### ⚠️ Limitations

- ❌ **Ne fonctionne PAS** - Vercel ne peut pas se connecter directement aux imprimantes locales
- ❌ Nécessite quand même un serveur intermédiaire

**Verdict** : Non recommandé pour votre cas.

---

## 📊 Comparaison des solutions

| Solution | Coût | Difficulté | Fiabilité | Consommation | Recommandé |
|----------|------|------------|-----------|--------------|------------|
| **Smartphone Android** | Gratuit | ⭐⭐ Facile | ⭐⭐⭐⭐ | 5W | ✅ **OUI** |
| **Raspberry Pi** | 33-63€ | ⭐⭐⭐ Moyen | ⭐⭐⭐⭐⭐ | 2-5W | ✅ **OUI** |
| **Mini PC** | Gratuit-100€ | ⭐⭐ Facile | ⭐⭐⭐⭐ | 20-50W | ⚠️ Si déjà disponible |
| **PrintNode** | ~20$/mois | ⭐⭐⭐⭐ Difficile | ⭐⭐⭐⭐⭐ | 0W | ⚠️ Si budget |
| **Vercel seul** | Gratuit | - | ❌ | 0W | ❌ **NON** |

---

## 🎯 Recommandation pour votre cas

### 🥇 Solution recommandée : Smartphone Android

**Pourquoi ?**
- ✅ Votre app **supporte déjà** cette solution
- ✅ **Gratuit** si vous avez un vieux smartphone
- ✅ **Installation rapide** (15 minutes)
- ✅ **Faible consommation** (5W)
- ✅ **Portable** et discret
- ✅ **Fiable** pour un restaurant

**Matériel nécessaire** :
- 1 vieux smartphone Android (Android 7+)
- 1 chargeur USB
- Connexion WiFi

**Temps d'installation** : 15-30 minutes

**Coût** : 0€ (si smartphone disponible)

---

## 🚀 Guide de démarrage rapide

### Étape 1 : Préparer le smartphone

1. Réinitialisez le smartphone (optionnel)
2. Connectez-le au WiFi (même réseau que les imprimantes)
3. Installez F-Droid : https://f-droid.org
4. Installez Termux depuis F-Droid

### Étape 2 : Installer le serveur

```bash
# Dans Termux
pkg update && pkg upgrade
pkg install nodejs
mkdir ~/print-server
cd ~/print-server
```

Copiez les fichiers `package.json` et `server.js` (voir ci-dessus)

```bash
npm install
npm start
```

### Étape 3 : Trouver l'IP

```bash
ifconfig wlan0 | grep "inet "
```

Notez l'IP (ex: `192.168.1.50`)

### Étape 4 : Configurer l'app

1. iPad → App LevertOS
2. **Paramètres → Imprimantes**
3. URL serveur : `http://192.168.1.50:3001`
4. IP Imprimante Caisse : `192.168.1.X`
5. IP Imprimante Cuisine : `192.168.1.Y`
6. Testez !

---

## 🔧 Configuration des imprimantes Epson

### Trouver l'IP des imprimantes

#### Méthode 1 : Menu imprimante

1. Appuyez sur le bouton de configuration
2. Imprimez la page de configuration réseau
3. Notez l'adresse IP

#### Méthode 2 : Interface routeur

1. Connectez-vous à votre routeur WiFi
2. Liste des appareils connectés
3. Cherchez "EPSON" ou "Printer"
4. Notez les adresses IP

#### Méthode 3 : Application Epson

1. Téléchargez **Epson iPrint** sur iPad
2. L'app détecte automatiquement les imprimantes
3. Notez les adresses IP

### Configuration réseau recommandée

**IP fixes** (recommandé pour éviter les changements) :

1. Dans le routeur, réservez les IP :
   - Imprimante Caisse : `192.168.1.100`
   - Imprimante Cuisine : `192.168.1.101`
   - Smartphone/Serveur : `192.168.1.50`

2. Configurez les imprimantes avec ces IP fixes

---

## 🐛 Dépannage

### Problème : "Serveur d'impression non accessible"

**Solutions** :
1. Vérifiez que le serveur tourne sur le smartphone
2. Vérifiez que l'iPad et le smartphone sont sur le même WiFi
3. Testez l'URL dans Safari : `http://192.168.1.50:3001/health`
4. Désactivez le pare-feu du smartphone (si activé)

### Problème : "Imprimante non connectée"

**Solutions** :
1. Vérifiez que l'imprimante est allumée
2. Vérifiez l'IP de l'imprimante (page de config)
3. Pingez l'imprimante depuis Termux : `ping 192.168.1.100`
4. Vérifiez que le port est 9100 (port par défaut Epson)

### Problème : "Le serveur s'arrête quand je ferme Termux"

**Solution** : Utilisez tmux

```bash
pkg install tmux
tmux new -s print-server
cd ~/print-server
npm start
# Ctrl+B puis D pour détacher
```

---

## 📱 Maintien du serveur actif

### Option 1 : Termux:Boot (démarrage auto)

1. Installez **Termux:Boot** depuis F-Droid
2. Créez `~/.termux/boot/start-print-server.sh` :
   ```bash
   #!/data/data/com.termux/files/usr/bin/bash
   termux-wake-lock
   cd ~/print-server
   npm start
   ```
3. Rendez-le exécutable : `chmod +x ~/.termux/boot/start-print-server.sh`

### Option 2 : Termux:Widget (démarrage manuel)

1. Installez **Termux:Widget** depuis F-Droid
2. Créez `~/.shortcuts/start-print.sh` :
   ```bash
   #!/data/data/com.termux/files/usr/bin/bash
   cd ~/print-server
   npm start
   ```
3. Ajoutez le widget sur l'écran d'accueil

### Option 3 : Wake Lock (empêcher la mise en veille)

```bash
# Dans Termux
termux-wake-lock
cd ~/print-server
npm start
```

---

## 💡 Conseils pour un restaurant

### 1. Positionnement du smartphone

- ✅ Près des imprimantes (WiFi stable)
- ✅ Branché sur secteur en permanence
- ✅ En mode avion (sauf WiFi) pour économiser batterie
- ✅ Luminosité au minimum

### 2. Monitoring

- Vérifiez régulièrement que le serveur tourne
- Testez l'impression chaque matin
- Gardez un câble réseau Ethernet en backup (avec adaptateur USB)

### 3. Backup

- Gardez un 2ème smartphone configuré en backup
- Notez les IP et configurations
- Sauvegardez les fichiers `package.json` et `server.js`

---

## 📞 Support

### Fichiers de référence

- `GUIDE_IMPRESSION_ANDROID.md` - Guide détaillé Android
- `print-server/README.md` - Documentation du serveur
- `INTEGRATION_SERVEUR_ANDROID.md` - Intégration dans l'app

### En cas de problème

1. Vérifiez les logs dans Termux
2. Testez `/health` dans Safari
3. Vérifiez les IP (imprimantes et serveur)
4. Redémarrez le serveur : `Ctrl+C` puis `npm start`

---

## ✅ Checklist de mise en service

- [ ] Smartphone Android disponible
- [ ] F-Droid installé
- [ ] Termux installé
- [ ] Node.js installé dans Termux
- [ ] Serveur d'impression créé
- [ ] Serveur démarré
- [ ] IP du serveur notée
- [ ] IP des imprimantes notées
- [ ] URL configurée dans l'app
- [ ] Test de connexion au serveur réussi
- [ ] Test d'impression Caisse réussi
- [ ] Test d'impression Cuisine réussi
- [ ] Wake lock activé
- [ ] Démarrage auto configuré (optionnel)

---

*Document créé le 15 juin 2026*  
*Version 1.0*  
*LevertOS - Solutions d'impression pour iPad*
