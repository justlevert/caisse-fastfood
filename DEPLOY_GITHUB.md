# 🚀 GUIDE DE DÉPLOIEMENT GITHUB + VERCEL

## ÉTAPE 1 : Pousser le code sur GitHub

Remplacez `VOTRE_USERNAME` et `VOTRE_REPO` par vos vraies valeurs.

```bash
# Ajouter le remote GitHub
git remote add origin https://github.com/VOTRE_USERNAME/VOTRE_REPO.git

# Renommer la branche en main (standard GitHub)
git branch -M main

# Pousser le code
git push -u origin main
```

## ÉTAPE 2 : Créer un compte Vercel

1. Allez sur : https://vercel.com/signup
2. Cliquez sur "Continue with GitHub"
3. Autorisez Vercel à accéder à vos repos

## ÉTAPE 3 : Importer le projet sur Vercel

1. Sur Vercel, cliquez sur "Add New Project"
2. Sélectionnez votre repo `VOTRE_REPO`
3. Configurez les variables d'environnement :

### Variables d'environnement à ajouter :

```
NEXT_PUBLIC_SUPABASE_URL=https://feicgbirofkbjnqjwcgr.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZlaWNnYmlyb2ZrYmpucWp3Y2dyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQ1NTIxMjAsImV4cCI6MjA5MDEyODEyMH0.aB2RsnPLzvkDFDVpC_qkdf0cFVQeKpw3ATK2L6KVAvk
```

4. Cliquez sur "Deploy"

## ÉTAPE 4 : Attendre le déploiement

- Vercel va builder votre application (2-3 minutes)
- Vous recevrez une URL de production : `https://votre-app.vercel.app`

## ✅ C'EST TERMINÉ !

Votre application sera accessible en ligne et se redéploiera automatiquement à chaque push sur GitHub.

---

## 🔧 Commandes utiles après déploiement

### Mettre à jour l'application :
```bash
git add .
git commit -m "Description des changements"
git push
```

Vercel détectera automatiquement le push et redéploiera.

### Voir les logs de déploiement :
https://vercel.com/dashboard

---

## 📱 Accès mobile

Une fois déployé, vous pourrez accéder à votre application depuis :
- PC : `https://votre-app.vercel.app`
- Tablette : `https://votre-app.vercel.app`
- Mobile : `https://votre-app.vercel.app`

Pas besoin de serveur HTTPS local, Vercel fournit automatiquement HTTPS !
