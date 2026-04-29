@echo off
echo ========================================
echo GENERATION CERTIFICAT SSL LOCAL
echo ========================================
echo.

:: Télécharger mkcert si pas installé
if not exist "mkcert.exe" (
    echo Téléchargement de mkcert...
    powershell -Command "Invoke-WebRequest -Uri 'https://github.com/FiloSottile/mkcert/releases/download/v1.4.4/mkcert-v1.4.4-windows-amd64.exe' -OutFile 'mkcert.exe'"
)

:: Installer le certificat racine
echo Installation du certificat racine...
mkcert.exe -install

:: Générer le certificat pour localhost et l'IP locale
echo Génération du certificat...
mkcert.exe localhost 192.168.0.38

:: Renommer les fichiers
echo Renommage des fichiers...
if exist "localhost+1.pem" (
    ren "localhost+1.pem" "localhost-cert.pem"
)
if exist "localhost+1-key.pem" (
    ren "localhost+1-key.pem" "localhost-key.pem"
)

echo.
echo ========================================
echo CERTIFICAT GENERE AVEC SUCCES !
echo ========================================
echo.
echo Fichiers créés :
echo - localhost-cert.pem
echo - localhost-key.pem
echo.
echo Pour démarrer le serveur HTTPS :
echo   node server-https.js
echo.
echo Accès depuis Android :
echo   https://192.168.0.38:3443
echo.
pause
