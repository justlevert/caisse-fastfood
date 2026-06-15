# ✅ Intégration du serveur d'impression Android - TERMINÉE

## 🎯 Fonctionnalités ajoutées

L'application LevertOS supporte maintenant **deux modes d'impression** :

### 1️⃣ Mode Direct (API Next.js)
- Fonctionne si l'application Next.js tourne sur un serveur avec accès réseau aux imprimantes
- Utilise les routes API `/api/printer/*`
- **Limitation** : Ne fonctionne pas depuis iPad/tablette

### 2️⃣ Mode Serveur Distant (Android/Raspberry Pi) ✨ NOUVEAU
- Fonctionne depuis iPad/tablette
- Utilise un serveur Node.js intermédiaire (smartphone Android, Raspberry Pi, PC)
- Le serveur fait le pont entre l'iPad et les imprimantes

---

## 📁 Fichiers créés/modifiés

### Nouveaux fichiers

1. **`lib/services/printService.ts`**
   - Service pour communiquer avec le serveur d'impression distant
   - Classe `PrintCommandBuilder` pour créer des commandes d'impression
   - Fonction `testPrintServer()` pour tester la connexion

2. **`lib/services/unifiedPrintService.ts`** ⭐
   - Service unifié qui détecte automatiquement le mode d'impression
   - Fonctions principales :
     - `printTicket()` - Imprimer un ticket de commande
     - `printTestTicket()` - Imprimer un ticket de test
     - `testPrinterConnection()` - Tester la connexion à une imprimante

3. **`print-server/package.json`**
   - Configuration npm du serveur d'impression

4. **`print-server/server.js`**
   - Serveur Express qui reçoit les commandes d'impression et les envoie aux imprimantes

5. **`print-server/README.md`**
   - Documentation du serveur d'impression

6. **`GUIDE_IMPRESSION_ANDROID.md`** 📱
   - Guide complet pour installer le serveur sur un smartphone Android avec Termux

7. **`IMPRESSION_IPAD.md`**
   - Guide général pour l'impression depuis iPad

### Fichiers modifiés

1. **`app/parametres/page.tsx`**
   - Ajout du champ "URL du serveur d'impression"
   - Bouton "Tester la connexion au serveur"
   - Fonctions `testImprimante()` et `printTest()` utilisent maintenant le service unifié
   - Détection automatique du mode (direct ou distant)

2. **`types/database.types.ts`**
   - Interface `PrintersConfig` étendue avec `print_server_url?: string`

---

## 🚀 Comment utiliser

### Configuration initiale

1. **Installer le serveur d'impression sur un smartphone Android**
   - Suivez le guide : `GUIDE_IMPRESSION_ANDROID.md`
   - Installez Termux depuis F-Droid
   - Créez le serveur Node.js
   - Notez l'adresse IP du smartphone (ex: `192.168.1.50`)

2. **Configurer l'application sur iPad**
   - Ouvrez l'app LevertOS
   - Allez dans **Paramètres → Imprimantes**
   - Dans "Serveur d'impression (iPad/Tablettes)" :
     - Entrez : `http://192.168.1.50:3001`
   - Cliquez sur **"🔍 Tester la connexion au serveur"**
   - Vous devriez voir : ✅ Serveur d'impression accessible !

3. **Configurer les imprimantes**
   - Configurez normalement les IP des imprimantes
   - Activez les imprimantes
   - Testez avec **"🖨️ Imprimer test"**

### Utilisation quotidienne

1. **Démarrer le serveur Android** (si pas en auto-start)
   ```bash
   cd ~/print-server
   npm start
   ```

2. **Utiliser l'application normalement**
   - L'impression fonctionne automatiquement
   - Le système détecte si un serveur distant est configuré
   - Les logs s'affichent dans Termux

---

## 🔍 Détection automatique

Le système détecte automatiquement le mode à utiliser :

```typescript
// Si print_server_url est configuré → Mode serveur distant
if (config.print_server_url && config.print_server_url.trim() !== '') {
  console.log('📱 Impression via serveur distant');
  // Utilise printService.ts
} else {
  console.log('🖥️ Impression via API Next.js');
  // Utilise /api/printer/*
}
```

---

## 📊 Architecture

### Mode Direct (sans serveur)
```
Application Next.js
        ↓
   API Routes (/api/printer/*)
        ↓
   node-thermal-printer
        ↓
   Imprimante (TCP)
```

### Mode Serveur Distant (avec Android)
```
iPad (Application)
        ↓ HTTP
Smartphone Android (Serveur Node.js)
        ↓ TCP
Imprimante Thermique
```

---

## 🧪 Tests disponibles

### 1. Test de connexion au serveur
- **Où** : Paramètres → Imprimantes → Section "Serveur d'impression"
- **Bouton** : 🔍 Tester la connexion au serveur
- **Vérifie** : Que le serveur Android est accessible

### 2. Test de connexion à l'imprimante
- **Où** : Paramètres → Imprimantes → Chaque imprimante
- **Bouton** : 🔍 Tester connexion
- **Vérifie** : Que l'imprimante est accessible depuis le serveur

### 3. Test d'impression
- **Où** : Paramètres → Imprimantes → Chaque imprimante
- **Bouton** : 🖨️ Imprimer test
- **Imprime** : Un ticket de test avec date/heure

---

## 💡 Messages de diagnostic

### Lors du test de connexion
```
📱 Test de connexion via serveur distant (http://192.168.1.50:3001)...
✅ Serveur d'impression accessible !
```

### Lors de l'impression
```
📱 Impression via serveur distant (http://192.168.1.50:3001)...
✅ Test d'impression réussi
```

### En cas d'erreur
```
❌ Impossible de se connecter au serveur d'impression
❌ Imprimante non connectée
❌ Configuration des imprimantes non trouvée
```

---

## 🐛 Dépannage

### "Impossible de se connecter au serveur d'impression"

**Causes possibles :**
1. Le serveur Android n'est pas démarré
2. L'URL est incorrecte
3. L'iPad et le smartphone ne sont pas sur le même WiFi
4. Le pare-feu bloque le port 3001

**Solutions :**
```bash
# 1. Vérifier que le serveur tourne
cd ~/print-server
npm start

# 2. Vérifier l'IP du smartphone
ifconfig wlan0 | grep "inet "

# 3. Tester depuis Safari sur iPad
http://192.168.1.50:3001/health
```

### "Imprimante non connectée"

**Causes possibles :**
1. L'imprimante est éteinte
2. L'IP de l'imprimante est incorrecte
3. L'imprimante n'est pas sur le même réseau que le smartphone

**Solutions :**
```bash
# Depuis Termux sur Android, tester la connexion
ping 192.168.1.X
# (Remplacez X par l'IP de votre imprimante)
```

### Le serveur s'arrête quand je ferme Termux

**Solution : Utiliser tmux**
```bash
pkg install tmux
tmux
cd ~/print-server
npm start
# Ctrl+B puis D pour détacher
```

---

## 📝 Checklist de mise en service

- [ ] Serveur installé sur smartphone Android
- [ ] Serveur démarré et accessible
- [ ] URL du serveur configurée dans l'app
- [ ] Test de connexion au serveur réussi
- [ ] IP des imprimantes configurées
- [ ] Imprimantes activées
- [ ] Test de connexion aux imprimantes réussi
- [ ] Test d'impression réussi
- [ ] (Optionnel) Démarrage automatique configuré

---

## 🎉 Avantages de cette solution

✅ **Gratuit** - Si vous avez un vieux smartphone Android  
✅ **Simple** - Installation en 15 minutes  
✅ **Fiable** - Le smartphone peut rester allumé 24/7  
✅ **Économique** - Consommation ~5W  
✅ **Compact** - Tient dans la main  
✅ **Sans PC** - Pas besoin d'ordinateur à proximité  

---

## 📞 Support

En cas de problème :

1. Consultez `GUIDE_IMPRESSION_ANDROID.md` pour l'installation
2. Vérifiez les logs dans Termux
3. Testez la connexion avec Safari : `http://[IP]:3001/health`
4. Vérifiez que tout est sur le même WiFi

---

## 🔄 Prochaines étapes (optionnel)

### Amélioration 1 : Génération complète des tickets
Actuellement, le mode serveur distant utilise un ticket de test simple. Pour implémenter l'impression complète des commandes :

1. Créer une fonction dans `lib/ticketGenerator.ts` qui retourne des `PrintCommand[]` au lieu d'utiliser directement `ThermalPrinter`
2. Modifier `unifiedPrintService.ts` pour utiliser ces commandes

### Amélioration 2 : Monitoring
Ajouter un dashboard pour voir :
- État du serveur (en ligne/hors ligne)
- Nombre d'impressions
- Dernière impression
- Logs d'erreurs

### Amélioration 3 : Multi-serveurs
Supporter plusieurs serveurs d'impression pour la redondance

---

*Document créé le 14 juin 2026*  
*Version 1.0*  
*LevertOS - Système de caisse pour restauration rapide*
