# 🔄 Mise à jour GitHub et Vercel - Version 1.0.0

## 🚀 Commandes rapides

Ouvrez PowerShell dans le dossier `c:\Saas\Caisse` et exécutez :

```powershell
# 1. Ajouter tous les fichiers modifiés
git add .

# 2. Créer un commit avec la version
git commit -m "🚀 Version 1.0.0 - Mise à jour majeure

✨ Nouvelles fonctionnalités:
- Support multi-devises (EUR/CHF)
- Impression via serveur Android
- Images pour tacos (viandes, sauces, extras, gratins)
- Commentaires sur tacos
- Récapitulatif en temps réel

🐛 Corrections:
- Synchronisation catégories/produits
- Affichage devise dynamique
- Cache rafraîchi après modifications admin

📚 Documentation:
- Guide impression Android
- Solutions impression iPad
- Configuration devise
"

# 3. Créer un tag de version
git tag -a v1.0.0 -m "Version 1.0.0 - Release de production"

# 4. Pousser sur GitHub
git push origin main

# 5. Pousser le tag
git push origin v1.0.0
```

---

## ✅ C'est tout !

Vercel détectera automatiquement la mise à jour et redéploiera votre application.

---

## 📊 Vérification

### Sur GitHub
1. Allez sur votre dépôt GitHub
2. Vous devriez voir le nouveau commit
3. Dans l'onglet "Releases", vous verrez la version v1.0.0

### Sur Vercel
1. Allez sur https://vercel.com
2. Ouvrez votre projet
3. Vous verrez un nouveau déploiement en cours
4. Attendez 2-3 minutes que le build se termine
5. ✅ Votre app est mise à jour !

---

## 🔄 Pour les prochaines mises à jour

Utilisez toujours ces commandes :

```powershell
git add .
git commit -m "Description des changements"
git push origin main
```

Pour une nouvelle version (ex: 1.1.0) :
```powershell
# Modifier package.json version: "1.1.0"
git add .
git commit -m "🚀 Version 1.1.0 - Description"
git tag -a v1.1.0 -m "Version 1.1.0"
git push origin main
git push origin v1.1.0
```
