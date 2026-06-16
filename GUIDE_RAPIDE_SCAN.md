# 🚀 Guide rapide : Scanner les imprimantes

## ⚡ Méthode la plus simple (3 étapes)

### Étape 1 : Configurer l'URL du serveur
Dans **Paramètres → Imprimantes** :
- Entrez l'URL : `http://192.168.1.50:3001` (remplacez par votre IP)
- Cliquez sur **"🔍 Tester la connexion au serveur"**
- Vérifiez : ✅ "Serveur d'impression accessible !"

### Étape 2 : Le réseau est détecté automatiquement !
- ✅ Le sous-réseau est **automatiquement extrait** de l'URL
- Si votre URL est `http://192.168.1.50:3001` → Le sous-réseau devient `192.168.1`
- Si votre URL est `http://192.168.0.100:3001` → Le sous-réseau devient `192.168.0`

### Étape 3 : Scanner
- Cliquez sur **"⚡ Scan rapide (100-110)"** pour un scan de 10 secondes
- OU cliquez sur **"🔍 Scan complet"** pour scanner tout le réseau (30-60 secondes)

---

## 📡 Bouton "Détecter réseau"

### Quand l'utiliser ?
- Si le sous-réseau n'est pas correct
- Si vous voulez vérifier l'IP du serveur
- Si vous avez changé de réseau WiFi

### Comment ça marche ?
1. Cliquez sur **"📡 Détecter réseau"**
2. Deux méthodes sont essayées :
   - **Méthode 1** : Demande au serveur son IP réseau
   - **Méthode 2** : Extrait le sous-réseau depuis l'URL du serveur
3. Le champ "Sous-réseau" est mis à jour automatiquement

---

## 🎯 Exemples pratiques

### Exemple 1 : Réseau standard (192.168.1.x)
```
URL serveur : http://192.168.1.50:3001
↓
Sous-réseau détecté : 192.168.1
↓
Scan rapide : 192.168.1.100 à 192.168.1.110
```

### Exemple 2 : Réseau différent (192.168.0.x)
```
URL serveur : http://192.168.0.25:3001
↓
Sous-réseau détecté : 192.168.0
↓
Scan rapide : 192.168.0.100 à 192.168.0.110
```

### Exemple 3 : Réseau entreprise (10.0.0.x)
```
URL serveur : http://10.0.0.100:3001
↓
Sous-réseau détecté : 10.0.0
↓
Scan complet : 10.0.0.1 à 10.0.0.254
```

---

## 🔧 Options de scan

### Sous-réseau
- **Détecté automatiquement** depuis l'URL du serveur
- Modifiable manuellement si nécessaire
- Exemples : `192.168.1`, `192.168.0`, `10.0.0`

### IP début / IP fin
- **Par défaut** : 1 à 254 (scan complet)
- **Scan rapide** : 100 à 110 (11 IPs seulement)
- **Personnalisé** : Vous pouvez choisir n'importe quelle plage

---

## ⏱️ Temps de scan

| Plage | Nombre d'IPs | Temps estimé |
|-------|--------------|--------------|
| 100-110 | 11 | ~5-10 secondes |
| 1-50 | 50 | ~10-20 secondes |
| 1-100 | 100 | ~20-30 secondes |
| 1-254 | 254 | ~30-60 secondes |

---

## 🖨️ Après le scan

### Si des imprimantes sont trouvées
1. Elles s'affichent dans la liste
2. Vous voyez : IP, port, statut (🟢 en ligne)
3. Cliquez sur **"🖨️ Caisse"** ou **"👨‍🍳 Cuisine"** pour assigner

### Si aucune imprimante n'est trouvée
**Vérifiez** :
- ✅ Les imprimantes sont allumées
- ✅ Les imprimantes sont connectées au WiFi
- ✅ Le sous-réseau est correct
- ✅ Les imprimantes sont sur le même réseau que le serveur

**Solutions** :
1. Essayez le **scan complet** (1-254)
2. Vérifiez le sous-réseau avec **"📡 Détecter réseau"**
3. Trouvez les IP manuellement et entrez-les directement

---

## 💡 Astuces

### Astuce 1 : Scan rapide d'abord
Commencez toujours par un **scan rapide** (100-110). La plupart des imprimantes ont des IPs dans cette plage.

### Astuce 2 : Détection automatique
Le sous-réseau est **automatiquement détecté** dès que vous entrez l'URL du serveur. Pas besoin de cliquer sur "Détecter réseau" !

### Astuce 3 : IP fixes recommandées
Configurez vos imprimantes avec des **IP fixes** :
- Imprimante Caisse : `192.168.1.100`
- Imprimante Cuisine : `192.168.1.101`

Comme ça, elles seront toujours trouvées au même endroit.

### Astuce 4 : Logs du serveur
Regardez les logs du serveur pendant le scan pour voir la progression :
```
🔍 Scan 192.168.1.1-254:9100 (254 IPs)
📊 50/254 IPs | 0 imprimante(s)
✅ Trouvée: 192.168.1.100:9100
📊 100/254 IPs | 1 imprimante(s)
✅ Scan terminé: 1 imprimante(s) trouvée(s)
   🖨️  192.168.1.100:9100
```

---

## 🆘 Dépannage rapide

### "Le serveur ne répond pas"
➡️ Vérifiez que le serveur est démarré sur le smartphone/PC

### "Aucune imprimante trouvée"
➡️ Essayez le scan complet (1-254)
➡️ Vérifiez le sous-réseau avec "📡 Détecter réseau"

### "Le sous-réseau est incorrect"
➡️ Cliquez sur "📡 Détecter réseau"
➡️ Ou modifiez manuellement le champ "Sous-réseau"

### "Le scan est trop long"
➡️ Utilisez le scan rapide (100-110)
➡️ Ou réduisez la plage (ex: 1-100)

---

## ✅ Checklist

- [ ] URL du serveur configurée
- [ ] Test de connexion au serveur réussi
- [ ] Sous-réseau détecté automatiquement (ou manuellement)
- [ ] Scan lancé (rapide ou complet)
- [ ] Imprimantes trouvées et affichées
- [ ] Imprimantes assignées (Caisse/Cuisine)
- [ ] Test de connexion réussi pour chaque imprimante
- [ ] Test d'impression réussi

---

**🎉 C'est tout ! Le scan devrait fonctionner parfaitement maintenant !**

*Si vous avez encore des problèmes, consultez `DEPANNAGE_SCAN_IMPRIMANTES.md` pour un guide complet.*
