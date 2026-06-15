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

## 📝 Notes

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
