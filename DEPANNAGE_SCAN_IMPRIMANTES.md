# 🔧 Dépannage : Scan des imprimantes ne trouve rien

## 🔍 Problème

Le scan du réseau ne détecte aucune imprimante alors qu'elles sont bien connectées en WiFi.

---

## ✅ Checklist de vérification

### 1. Vérifier le serveur d'impression

- [ ] Le serveur d'impression est démarré (smartphone Android ou PC)
- [ ] L'URL du serveur est correctement configurée dans l'app
- [ ] Le test de connexion au serveur fonctionne (bouton "Tester la connexion")

**Comment vérifier** :
1. Sur le smartphone/PC, vérifiez que le serveur affiche :
   ```
   🖨️  SERVEUR D'IMPRESSION LEVERT - DÉMARRÉ
   📡 Port: 3001
   ```
2. Dans l'app, testez la connexion au serveur

### 2. Vérifier le réseau

- [ ] Le smartphone/PC et les imprimantes sont sur le **même réseau WiFi**
- [ ] L'iPad et le smartphone/PC sont sur le **même réseau WiFi**
- [ ] Les imprimantes sont **allumées**
- [ ] Les imprimantes sont **connectées au WiFi** (voyant WiFi allumé)

**Comment vérifier** :
- Sur les imprimantes, imprimez la page de configuration réseau
- Vérifiez que l'adresse IP commence par le même sous-réseau (ex: 192.168.1.x)

### 3. Vérifier le sous-réseau

- [ ] Le sous-réseau configuré dans le scan correspond à votre réseau

**Sous-réseaux courants** :
- `192.168.1` (le plus courant)
- `192.168.0`
- `192.168.100`
- `10.0.0`

**Comment trouver votre sous-réseau** :
1. Sur le smartphone Android (Termux) :
   ```bash
   ifconfig wlan0 | grep "inet "
   ```
   Vous verrez : `inet 192.168.1.50` → Votre sous-réseau est `192.168.1`

2. Sur PC Windows :
   ```cmd
   ipconfig
   ```
   Cherchez "Adresse IPv4" : `192.168.1.100` → Votre sous-réseau est `192.168.1`

3. Sur PC Mac/Linux :
   ```bash
   ifconfig | grep "inet "
   ```

### 4. Vérifier les imprimantes

- [ ] Les imprimantes Epson sont bien des **imprimantes thermiques**
- [ ] Les imprimantes utilisent le **port 9100** (port standard ESC/POS)
- [ ] Les imprimantes sont accessibles depuis le smartphone/PC

**Comment tester** :
Depuis le smartphone/PC qui exécute le serveur, essayez de pinguer l'imprimante :

```bash
# Sur Android (Termux)
pkg install inetutils
ping -c 4 192.168.1.100

# Sur Windows
ping 192.168.1.100

# Sur Mac/Linux
ping -c 4 192.168.1.100
```

Si le ping ne fonctionne pas, l'imprimante n'est pas accessible sur le réseau.

---

## 🛠️ Solutions

### Solution 1 : Utiliser le scan rapide

Au lieu de scanner 254 IPs (1-254), utilisez une plage réduite :

1. Dans les options de scan, configurez :
   - **IP début** : 100
   - **IP fin** : 110
2. Cliquez sur **"⚡ Scan rapide (100-110)"**

Cela scanne seulement 11 IPs et prend ~5-10 secondes.

### Solution 2 : Trouver l'IP manuellement

Si vous connaissez l'IP de vos imprimantes :

1. **Méthode 1 : Page de configuration**
   - Sur l'imprimante, appuyez sur le bouton de configuration
   - Imprimez la page de configuration réseau
   - Notez l'adresse IP

2. **Méthode 2 : Application Epson iPrint**
   - Sur iPad, téléchargez "Epson iPrint"
   - L'app détecte automatiquement les imprimantes
   - Notez les adresses IP

3. **Méthode 3 : Interface du routeur**
   - Connectez-vous à votre routeur WiFi
   - Allez dans "Appareils connectés" ou "DHCP"
   - Cherchez les appareils "EPSON"

Une fois que vous avez les IP, **entrez-les manuellement** dans les sections "Imprimante Caisse" et "Imprimante Cuisine".

### Solution 3 : Vérifier le sous-réseau

Si votre réseau n'utilise pas `192.168.1`, changez le sous-réseau :

1. Trouvez votre sous-réseau (voir checklist ci-dessus)
2. Dans les options de scan, changez **"Sous-réseau"** :
   - Si votre IP est `192.168.0.50` → Utilisez `192.168.0`
   - Si votre IP est `10.0.0.50` → Utilisez `10.0.0`
3. Relancez le scan

### Solution 4 : Augmenter la plage de scan

Si vos imprimantes ont des IPs élevées (ex: 192.168.1.200) :

1. Dans les options de scan :
   - **IP début** : 1
   - **IP fin** : 254
2. Cliquez sur **"🔍 Scan complet"**
3. Attendez 30-60 secondes

### Solution 5 : Redémarrer le serveur d'impression

Parfois, le serveur doit être redémarré :

**Sur smartphone Android (Termux)** :
1. Arrêtez le serveur : `Ctrl+C`
2. Redémarrez : `npm start`

**Sur PC** :
1. Arrêtez le serveur : `Ctrl+C`
2. Redémarrez : `npm start`

### Solution 6 : Vérifier les logs du serveur

Regardez les logs du serveur pendant le scan :

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🔍 DÉMARRAGE DU SCAN
   Réseau: 192.168.1.1-254
   Port: 9100
   Plage: 254 adresses IP
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
   🔍 Test 192.168.1.1:9100...
   ❌ Pas de réponse: 192.168.1.1:9100
   🔍 Test 192.168.1.2:9100...
   ⚠️  Erreur 192.168.1.2: Connection timeout
   ...
   🔍 Test 192.168.1.100:9100...
   ✅ IMPRIMANTE TROUVÉE: 192.168.1.100:9100
   ...
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
✅ SCAN TERMINÉ
   Total scanné: 254 IPs
   Imprimantes trouvées: 1
   🖨️  192.168.1.100:9100
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

**Ce que vous devriez voir** :
- ✅ `IMPRIMANTE TROUVÉE` si une imprimante est détectée
- ❌ `Pas de réponse` si l'IP n'a pas d'imprimante
- ⚠️ `Erreur` avec le message d'erreur

**Si vous voyez beaucoup d'erreurs "Connection timeout"** :
- Le réseau est peut-être lent
- Le timeout est trop court
- Les imprimantes ne sont pas sur ce sous-réseau

---

## 🔍 Diagnostic avancé

### Test manuel d'une imprimante

Si vous connaissez l'IP d'une imprimante (ex: 192.168.1.100), testez-la manuellement :

**Depuis l'app** :
1. Entrez l'IP dans "Imprimante Caisse"
2. Cliquez sur "🔍 Tester connexion"
3. Si ça fonctionne, l'imprimante est accessible

**Depuis le serveur (Termux ou PC)** :
Utilisez l'endpoint `/test-printer` :

```bash
curl -X POST http://localhost:3001/test-printer \
  -H "Content-Type: application/json" \
  -d '{"ip":"192.168.1.100","port":9100}'
```

Réponse attendue :
```json
{
  "success": true,
  "message": "Imprimante 192.168.1.100:9100 accessible"
}
```

### Vérifier la connectivité réseau

**Test 1 : Ping l'imprimante**
```bash
ping 192.168.1.100
```

**Test 2 : Telnet sur le port 9100**
```bash
# Sur PC Windows
telnet 192.168.1.100 9100

# Sur Mac/Linux/Android
telnet 192.168.1.100 9100
```

Si telnet se connecte, l'imprimante est accessible sur le port 9100.

### Vérifier le pare-feu

**Sur Windows** :
Le pare-feu peut bloquer les connexions sortantes vers le port 9100.

1. Ouvrez "Pare-feu Windows Defender"
2. "Paramètres avancés"
3. "Règles de sortie"
4. Créez une règle pour autoriser le port 9100

**Sur Android (Termux)** :
Normalement, pas de pare-feu.

---

## 📊 Cas d'usage typiques

### Cas 1 : Réseau domestique standard

- **Sous-réseau** : `192.168.1`
- **Plage** : 1-254
- **Temps de scan** : 30-60 secondes
- **Solution** : Scan complet

### Cas 2 : Réseau d'entreprise

- **Sous-réseau** : Peut varier (192.168.0, 10.0.0, etc.)
- **Plage** : Souvent limitée (ex: 100-200)
- **Temps de scan** : 20-40 secondes
- **Solution** : Demander au service IT le sous-réseau et la plage

### Cas 3 : Box internet française

- **Sous-réseau** : `192.168.1` (Freebox, Livebox, SFR Box)
- **Plage** : Généralement 1-100
- **Temps de scan** : 10-20 secondes
- **Solution** : Scan rapide 1-100

### Cas 4 : Réseau restaurant

- **Sous-réseau** : Variable
- **Plage** : Souvent 1-50
- **Imprimantes** : IPs fixes configurées par l'installateur
- **Solution** : Demander les IP à l'installateur et entrer manuellement

---

## 💡 Conseils

### 1. Utilisez des IP fixes pour les imprimantes

Configurez vos imprimantes avec des **adresses IP fixes** (statiques) :
- Imprimante Caisse : `192.168.1.100`
- Imprimante Cuisine : `192.168.1.101`

Cela évite que les IP changent et facilite la configuration.

**Comment configurer une IP fixe** :
1. Sur l'imprimante, accédez au menu réseau
2. Changez de DHCP à "IP statique"
3. Entrez l'IP souhaitée

Ou configurez une réservation DHCP sur votre routeur.

### 2. Documentez vos IP

Notez les IP de vos imprimantes :
- Imprimante Caisse : _______________
- Imprimante Cuisine : _______________
- Serveur d'impression : _______________

### 3. Testez régulièrement

Testez la connexion aux imprimantes régulièrement pour vous assurer qu'elles sont toujours accessibles.

---

## 🆘 Toujours pas de résultat ?

### Vérifications finales

1. **Les imprimantes sont-elles vraiment Epson ?**
   - Seules les imprimantes Epson ESC/POS sont supportées

2. **Les imprimantes sont-elles en mode réseau ?**
   - Certaines imprimantes ont un mode USB et un mode réseau
   - Vérifiez qu'elles sont en mode réseau/WiFi

3. **Le port 9100 est-il le bon ?**
   - La plupart des imprimantes thermiques utilisent 9100
   - Certaines utilisent 9001 ou 9002
   - Vérifiez dans la documentation de l'imprimante

4. **Y a-t-il un VPN actif ?**
   - Un VPN peut bloquer l'accès au réseau local
   - Désactivez le VPN temporairement

5. **Le réseau WiFi a-t-il une isolation client ?**
   - Certains réseaux WiFi (hôtels, entreprises) isolent les clients
   - Les appareils ne peuvent pas se voir entre eux
   - Contactez l'administrateur réseau

---

## 📞 Support

Si après toutes ces vérifications, le scan ne fonctionne toujours pas :

1. **Vérifiez les logs du serveur** (section ci-dessus)
2. **Notez les messages d'erreur** exacts
3. **Vérifiez votre configuration réseau** :
   - Sous-réseau utilisé
   - IP du serveur d'impression
   - IP des imprimantes (si connues)
4. **Essayez la configuration manuelle** en entrant les IP directement

---

**🎯 Dans 90% des cas, le problème vient de :**
1. ❌ Mauvais sous-réseau configuré
2. ❌ Imprimantes éteintes ou déconnectées du WiFi
3. ❌ Serveur d'impression et imprimantes sur des réseaux différents
4. ❌ IP des imprimantes en dehors de la plage scannée

**✅ Solution rapide : Trouvez les IP manuellement et entrez-les directement !**
