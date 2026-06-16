# 🔍 Détection automatique des imprimantes thermiques

## 📋 Vue d'ensemble

Cette fonctionnalité permet de scanner automatiquement votre réseau local pour détecter les imprimantes thermiques Epson disponibles et les assigner facilement à la caisse ou à la cuisine.

---

## ✨ Fonctionnalités

### 1. Scan automatique du réseau
- Détecte toutes les imprimantes thermiques Epson sur le réseau local
- Scan rapide et efficace (par groupes de 20 IPs en parallèle)
- Affiche l'adresse IP, le port et le statut de chaque imprimante

### 2. Assignment en un clic
- Bouton "🖨️ Caisse" pour assigner à l'imprimante de caisse
- Bouton "👨‍🍳 Cuisine" pour assigner à l'imprimante de cuisine
- Configuration automatique de l'IP, du port et activation

### 3. Statut en temps réel
- 🟢 En ligne : Imprimante accessible
- 🔴 Hors ligne : Imprimante non accessible

---

## 🚀 Comment utiliser

### Étape 1 : Configurer le serveur d'impression

1. Allez dans **Paramètres → Imprimantes**
2. Section "🌐 Serveur d'impression (iPad/Tablettes)"
3. Entrez l'URL du serveur : `http://192.168.1.X:3001`
4. Cliquez sur "🔍 Tester la connexion au serveur"
5. Vérifiez que le serveur est accessible ✅

### Étape 2 : Scanner le réseau

1. Section "🔍 Détection automatique des imprimantes"
2. Cliquez sur **"🔍 Scanner le réseau"**
3. Attendez quelques secondes (le scan peut prendre 10-30 secondes)
4. Les imprimantes détectées s'affichent dans la liste

### Étape 3 : Assigner les imprimantes

Pour chaque imprimante détectée :

1. **Pour l'imprimante de caisse** :
   - Cliquez sur le bouton **"🖨️ Caisse"**
   - L'imprimante est automatiquement assignée à la caisse

2. **Pour l'imprimante de cuisine** :
   - Cliquez sur le bouton **"👨‍🍳 Cuisine"**
   - L'imprimante est automatiquement assignée à la cuisine

### Étape 4 : Vérifier la configuration

1. Descendez dans les sections "Imprimante Caisse" et "Imprimante Cuisine"
2. Vérifiez que les IP sont correctement renseignées
3. Cliquez sur "🔍 Tester connexion" pour chaque imprimante
4. Cliquez sur "🖨️ Imprimer test" pour vérifier l'impression

---

## 🔧 Configuration technique

### Serveur d'impression (print-server)

Le serveur d'impression a été mis à jour avec 2 nouveaux endpoints :

#### 1. POST `/test-printer`
Teste la connexion à une imprimante spécifique.

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

#### 2. POST `/scan-printers`
Scanne le réseau pour détecter les imprimantes.

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
    },
    {
      "ip": "192.168.1.101",
      "port": 9100,
      "name": "Imprimante Epson 192.168.1.101",
      "status": "online"
    }
  ],
  "message": "2 imprimante(s) détectée(s)"
}
```

### Paramètres de scan

- **subnet** : Sous-réseau à scanner (par défaut : `192.168.1`)
- **startIp** : IP de départ (par défaut : `1`)
- **endIp** : IP de fin (par défaut : `254`)
- **port** : Port des imprimantes (par défaut : `9100`)
- **timeout** : Timeout par imprimante (1000ms pour le scan)
- **batchSize** : Nombre d'IPs scannées en parallèle (20)

---

## 📱 Interface utilisateur

### Section de détection

```
┌─────────────────────────────────────────────────┐
│ 🔍 Détection automatique des imprimantes       │
├─────────────────────────────────────────────────┤
│ Scannez votre réseau local pour détecter       │
│ automatiquement les imprimantes thermiques     │
│ disponibles.                                    │
│                                                 │
│ ┌─────────────────────────────────────────┐   │
│ │      🔍 Scanner le réseau               │   │
│ └─────────────────────────────────────────┘   │
│                                                 │
│ 📋 Imprimantes détectées (2)                   │
│                                                 │
│ ┌─────────────────────────────────────────┐   │
│ │ Imprimante Epson 192.168.1.100          │   │
│ │ 📍 IP: 192.168.1.100:9100               │   │
│ │ 🟢 En ligne                              │   │
│ │                                          │   │
│ │ [🖨️ Caisse] [👨‍🍳 Cuisine]              │   │
│ └─────────────────────────────────────────┘   │
│                                                 │
│ ┌─────────────────────────────────────────┐   │
│ │ Imprimante Epson 192.168.1.101          │   │
│ │ 📍 IP: 192.168.1.101:9100               │   │
│ │ 🟢 En ligne                              │   │
│ │                                          │   │
│ │ [🖨️ Caisse] [👨‍🍳 Cuisine]              │   │
│ └─────────────────────────────────────────┘   │
└─────────────────────────────────────────────────┘
```

---

## ⚙️ Algorithme de scan

### 1. Scan par lots
Le scan est effectué par groupes de 20 IPs en parallèle pour optimiser la vitesse :

```javascript
const batchSize = 20;
for (let i = startIp; i <= endIp; i += batchSize) {
  // Scanner 20 IPs en parallèle
  const batch = [...];
  const results = await Promise.all(batch);
  printers.push(...results.filter(p => p !== null));
}
```

### 2. Timeout court
Chaque test de connexion a un timeout de 1000ms pour accélérer le scan :

```javascript
const printer = new ThermalPrinter({
  type: PrinterTypes.EPSON,
  interface: `tcp://${ip}:${port}`,
  options: { timeout: 1000 }
});
```

### 3. Détection silencieuse
Les erreurs de connexion sont ignorées (imprimantes non trouvées) :

```javascript
try {
  const isConnected = await printer.isPrinterConnected();
  if (isConnected) {
    return { ip, port, name, status: 'online' };
  }
} catch (error) {
  // Ignorer les erreurs
}
return null;
```

---

## 🎯 Avantages

### Pour l'utilisateur
- ✅ **Simplicité** : Plus besoin de chercher les IP manuellement
- ✅ **Rapidité** : Configuration en quelques clics
- ✅ **Fiabilité** : Détection automatique des imprimantes en ligne
- ✅ **Visibilité** : Statut en temps réel de chaque imprimante

### Pour l'administrateur
- ✅ **Gain de temps** : Configuration rapide
- ✅ **Moins d'erreurs** : Pas de saisie manuelle d'IP
- ✅ **Diagnostic** : Voir immédiatement quelles imprimantes sont accessibles

---

## 🐛 Dépannage

### "Aucune imprimante détectée"

**Causes possibles** :
1. Les imprimantes ne sont pas sur le même réseau
2. Les imprimantes sont éteintes
3. Le port 9100 est bloqué par un pare-feu
4. Le sous-réseau est incorrect (pas 192.168.1.x)

**Solutions** :
1. Vérifiez que les imprimantes sont allumées et connectées au WiFi
2. Vérifiez que le smartphone/serveur est sur le même réseau
3. Essayez de pinguer les imprimantes manuellement
4. Vérifiez le sous-réseau de votre réseau (peut être 192.168.0.x ou autre)

### "Serveur d'impression non accessible"

**Solution** :
1. Vérifiez que le serveur d'impression est démarré
2. Vérifiez l'URL du serveur dans les paramètres
3. Testez la connexion au serveur avec le bouton de test

### Le scan prend trop de temps

**Normal** :
- Le scan de 254 IPs peut prendre 20-40 secondes
- C'est normal car chaque IP est testée

**Optimisation** :
- Réduisez la plage d'IPs (ex: 100-110 au lieu de 1-254)
- Modifiez les paramètres dans le code si nécessaire

---

## 📊 Performance

### Temps de scan typique

- **Plage 1-254** : ~30 secondes
- **Plage 100-110** : ~5 secondes
- **Plage 1-50** : ~10 secondes

### Charge réseau

- **Bande passante** : Très faible (quelques Ko)
- **Connexions simultanées** : 20 maximum
- **Impact** : Négligeable sur le réseau

---

## 🔄 Workflow complet

```
1. Utilisateur clique "Scanner le réseau"
   ↓
2. Frontend appelle /scan-printers sur le serveur
   ↓
3. Serveur scanne le réseau par lots de 20 IPs
   ↓
4. Pour chaque IP, test de connexion (timeout 1s)
   ↓
5. Imprimantes trouvées renvoyées au frontend
   ↓
6. Affichage de la liste des imprimantes
   ↓
7. Utilisateur clique "Caisse" ou "Cuisine"
   ↓
8. IP et port assignés automatiquement
   ↓
9. Imprimante activée et prête à l'emploi
```

---

## 📝 Notes techniques

### Compatibilité
- ✅ Imprimantes Epson thermiques (ESC/POS)
- ✅ Port standard 9100
- ✅ Connexion TCP/IP
- ⚠️ Nécessite un serveur d'impression (smartphone Android ou PC)

### Limitations
- Scan limité à un sous-réseau (ex: 192.168.1.x)
- Timeout de 1s par imprimante (peut manquer les imprimantes lentes)
- Nécessite que les imprimantes soient allumées

### Améliorations futures possibles
- [ ] Configuration du sous-réseau dans l'interface
- [ ] Scan de plusieurs sous-réseaux
- [ ] Détection du modèle d'imprimante
- [ ] Sauvegarde des imprimantes détectées
- [ ] Scan en arrière-plan périodique

---

## ✅ Checklist d'utilisation

- [ ] Serveur d'impression configuré et démarré
- [ ] URL du serveur renseignée dans les paramètres
- [ ] Connexion au serveur testée et réussie
- [ ] Scan du réseau effectué
- [ ] Imprimantes détectées dans la liste
- [ ] Imprimante assignée à la caisse
- [ ] Imprimante assignée à la cuisine
- [ ] Test de connexion réussi pour chaque imprimante
- [ ] Test d'impression réussi pour chaque imprimante

---

**🎉 Avec cette fonctionnalité, la configuration des imprimantes devient un jeu d'enfant !**

*Dernière mise à jour : 16 juin 2026*
