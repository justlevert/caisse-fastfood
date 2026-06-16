# 🖨️ Serveur d'Impression LevertOS

Serveur Node.js standalone pour gérer les impressions sur imprimantes thermiques depuis iPad/tablettes.

## 📋 Prérequis

- Node.js 16+ installé sur un ordinateur Windows/Mac/Linux
- Ordinateur connecté au même réseau WiFi que l'iPad et les imprimantes
- Imprimantes thermiques configurées en réseau (IP fixe)

## 🚀 Installation

1. Ouvrez un terminal dans le dossier `print-server`
2. Installez les dépendances :
   ```bash
   npm install
   ```

## ▶️ Démarrage

```bash
npm start
```

Le serveur démarre sur le port **3001** par défaut.

## 🔧 Configuration dans l'application

1. Trouvez l'adresse IP de l'ordinateur qui exécute ce serveur :
   - **Windows** : `ipconfig` dans CMD
   - **Mac/Linux** : `ifconfig` ou `ip addr`
   - Exemple : `192.168.1.100`

2. Dans l'application LevertOS (sur iPad), allez dans **Paramètres → Imprimantes**

3. Configurez l'URL du serveur d'impression :
   ```
   http://192.168.1.100:3001
   ```

## 🧪 Test

Testez que le serveur est accessible depuis l'iPad :
```
http://[IP_SERVEUR]:3001/health
```

Vous devriez voir : `{"status":"ok","message":"Serveur d'impression actif"}`

## � Endpoints disponibles

### 1. GET `/health`
Vérifier que le serveur est actif.

**Response** :
```json
{
  "status": "ok",
  "message": "Serveur d'impression actif"
}
```

### 2. POST `/test-printer`
Tester la connexion à une imprimante spécifique.

**Request** :
```json
{
  "ip": "192.168.1.100",
  "port": 9100
}
```

**Response** :
```json
{
  "success": true,
  "message": "Imprimante 192.168.1.100:9100 accessible"
}
```

### 3. POST `/scan-printers`
Scanner le réseau pour détecter les imprimantes disponibles.

**Request** :
```json
{
  "subnet": "192.168.1",
  "startIp": 1,
  "endIp": 254,
  "port": 9100
}
```

**Response** :
```json
{
  "success": true,
  "printers": [
    {
      "ip": "192.168.1.100",
      "port": 9100,
      "name": "Imprimante Epson 192.168.1.100",
      "status": "online"
    }
  ],
  "message": "1 imprimante(s) détectée(s)"
}
```

### 4. POST `/print`
Imprimer un ticket sur une imprimante.

**Request** :
```json
{
  "ip": "192.168.1.100",
  "port": 9100,
  "commands": [
    { "method": "alignCenter", "args": [] },
    { "method": "bold", "args": [true] },
    { "method": "println", "args": ["TICKET DE TEST"] },
    { "method": "bold", "args": [false] },
    { "method": "cut", "args": [] }
  ]
}
```

**Response** :
```json
{
  "success": true,
  "message": "Impression réussie"
}
```

## ✨ Nouvelle fonctionnalité : Détection automatique

Le serveur peut maintenant scanner votre réseau local pour détecter automatiquement les imprimantes thermiques Epson disponibles.

**Avantages** :
- ✅ Plus besoin de chercher les IP manuellement
- ✅ Détection rapide (20-40 secondes pour 254 IPs)
- ✅ Affichage du statut en temps réel
- ✅ Assignment en un clic depuis l'interface

**Utilisation** :
1. Dans l'application, allez dans **Paramètres → Imprimantes**
2. Cliquez sur **"🔍 Scanner le réseau"**
3. Les imprimantes détectées s'affichent automatiquement
4. Cliquez sur **"🖨️ Caisse"** ou **"👨‍🍳 Cuisine"** pour assigner

## �📝 Notes

- Le serveur doit rester actif pendant les heures d'ouverture
- Utilisez `npm run dev` pour le développement (redémarrage automatique)
- Les logs d'impression s'affichent dans le terminal

## 🔒 Sécurité

- Le serveur accepte les connexions de n'importe quelle origine (CORS activé)
- À utiliser uniquement sur un réseau local sécurisé
- Ne pas exposer sur Internet

## 🐛 Dépannage

**Problème : "Impossible de se connecter au serveur"**
- Vérifiez que le serveur est démarré
- Vérifiez l'adresse IP
- Vérifiez que le pare-feu autorise le port 3001

**Problème : "Imprimante non connectée"**
- Vérifiez l'IP de l'imprimante
- Pingez l'imprimante : `ping [IP_IMPRIMANTE]`
- Vérifiez que l'imprimante est allumée et connectée au réseau
