const express = require('express');
const cors = require('cors');
const { ThermalPrinter, PrinterTypes } = require('node-thermal-printer');

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json({ limit: '10mb' }));

// Route de test
app.get('/health', (req, res) => {
  res.json({ status: 'ok', message: 'Serveur d\'impression actif' });
});

// Route pour détecter le réseau WiFi actuel
app.get('/detect-network', (req, res) => {
  try {
    const os = require('os');
    const networkInterfaces = os.networkInterfaces();
    
    let detectedSubnet = '192.168.1';
    let serverIp = null;
    
    // Chercher l'interface WiFi active
    for (const [name, interfaces] of Object.entries(networkInterfaces)) {
      if (interfaces) {
        for (const iface of interfaces) {
          // Ignorer les interfaces loopback et IPv6
          if (iface.family === 'IPv4' && !iface.internal) {
            const ip = iface.address;
            // Extraire le sous-réseau (ex: 192.168.1 depuis 192.168.1.50)
            const parts = ip.split('.');
            if (parts.length === 4) {
              detectedSubnet = `${parts[0]}.${parts[1]}.${parts[2]}`;
              serverIp = ip;
              break;
            }
          }
        }
        if (serverIp) break;
      }
    }
    
    console.log(`📡 Réseau détecté: ${detectedSubnet}.x (IP serveur: ${serverIp})`);
    
    res.json({
      success: true,
      subnet: detectedSubnet,
      serverIp: serverIp,
      message: `Réseau détecté: ${detectedSubnet}.x`
    });
    
  } catch (error) {
    console.error('❌ Erreur détection réseau:', error.message);
    res.status(500).json({
      success: false,
      subnet: '192.168.1',
      message: 'Impossible de détecter le réseau, utilisation de 192.168.1 par défaut'
    });
  }
});

// Route pour tester une imprimante
app.post('/test-printer', async (req, res) => {
  try {
    const { ip, port = 9100 } = req.body;

    if (!ip) {
      return res.status(400).json({
        success: false,
        message: 'Adresse IP requise'
      });
    }

    console.log(`🔍 Test de connexion à ${ip}:${port}`);

    const printer = new ThermalPrinter({
      type: PrinterTypes.EPSON,
      interface: `tcp://${ip}:${port}`,
      options: { timeout: 3000 }
    });

    const isConnected = await printer.isPrinterConnected();

    if (isConnected) {
      console.log(`✅ Imprimante ${ip}:${port} connectée`);
      res.json({
        success: true,
        message: `Imprimante ${ip}:${port} accessible`
      });
    } else {
      console.log(`❌ Imprimante ${ip}:${port} non accessible`);
      res.status(400).json({
        success: false,
        message: `Imprimante ${ip}:${port} non accessible`
      });
    }
  } catch (error) {
    console.error(`❌ Erreur test imprimante:`, error.message);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// Route pour scanner le réseau et détecter les imprimantes
app.post('/scan-printers', async (req, res) => {
  try {
    const { subnet = '192.168.1', startIp = 1, endIp = 254, port = 9100 } = req.body;

    console.log(`\n🔍 Scan ${subnet}.${startIp}-${endIp}:${port} (${endIp - startIp + 1} IPs)`);

    const printers = [];
    let scannedCount = 0;
    const totalIps = endIp - startIp + 1;

    // Scanner les IPs en parallèle (par groupes de 20 pour plus de rapidité)
    const batchSize = 20;
    for (let i = startIp; i <= endIp; i += batchSize) {
      const batch = [];
      
      for (let j = i; j < Math.min(i + batchSize, endIp + 1); j++) {
        const ip = `${subnet}.${j}`;
        
        batch.push(
          (async () => {
            try {
              const printer = new ThermalPrinter({
                type: PrinterTypes.EPSON,
                interface: `tcp://${ip}:${port}`,
                options: { 
                  timeout: 1500 // Timeout optimisé
                }
              });

              const isConnected = await printer.isPrinterConnected();

              if (isConnected) {
                console.log(`✅ Trouvée: ${ip}:${port}`);
                return {
                  ip,
                  port,
                  name: `Imprimante Epson ${ip}`,
                  status: 'online'
                };
              }
            } catch (error) {
              // Erreur silencieuse - pas de log pour ne pas polluer
            }
            return null;
          })()
        );
      }

      const results = await Promise.all(batch);
      const foundInBatch = results.filter(p => p !== null);
      printers.push(...foundInBatch);
      
      scannedCount += batch.length;
      // Afficher la progression tous les 50 IPs seulement
      if (scannedCount % 50 === 0 || scannedCount === totalIps) {
        console.log(`📊 ${scannedCount}/${totalIps} IPs | ${printers.length} imprimante(s)`);
      }
    }

    console.log(`✅ Scan terminé: ${printers.length} imprimante(s) trouvée(s)\n`);
    if (printers.length > 0) {
      printers.forEach(p => console.log(`   🖨️  ${p.ip}:${p.port}`));
    }

    res.json({
      success: true,
      printers,
      message: `${printers.length} imprimante(s) détectée(s)`
    });

  } catch (error) {
    console.error('❌ Erreur scan:', error.message);
    res.status(500).json({
      success: false,
      message: error.message || 'Erreur lors du scan du réseau'
    });
  }
});

// Route d'impression
app.post('/print', async (req, res) => {
  try {
    const { ip, port = 9100, commands } = req.body;

    if (!ip) {
      return res.status(400).json({
        success: false,
        message: 'Adresse IP de l\'imprimante requise'
      });
    }

    if (!commands || !Array.isArray(commands)) {
      return res.status(400).json({
        success: false,
        message: 'Commandes d\'impression requises'
      });
    }

    console.log(`📄 Impression vers ${ip}:${port}`);

    // Créer l'imprimante
    const printer = new ThermalPrinter({
      type: PrinterTypes.EPSON,
      interface: `tcp://${ip}:${port}`,
      removeSpecialCharacters: false,
      lineCharacter: '=',
      options: {
        timeout: 5000,
      },
    });

    // Vérifier la connexion
    const isConnected = await printer.isPrinterConnected();
    
    if (!isConnected) {
      console.error(`❌ Imprimante ${ip}:${port} non connectée`);
      return res.status(500).json({
        success: false,
        message: `Impossible de se connecter à l'imprimante ${ip}:${port}`
      });
    }

    console.log(`✅ Connecté à l'imprimante ${ip}:${port}`);

    // Exécuter les commandes
    for (const cmd of commands) {
      const { method, args = [] } = cmd;
      
      if (typeof printer[method] === 'function') {
        printer[method](...args);
      } else {
        console.warn(`⚠️ Méthode inconnue: ${method}`);
      }
    }

    // Envoyer à l'imprimante
    await printer.execute();

    console.log(`✅ Impression réussie sur ${ip}:${port}`);

    res.json({
      success: true,
      message: 'Impression réussie'
    });

  } catch (error) {
    console.error('❌ Erreur d\'impression:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Erreur d\'impression inconnue'
    });
  }
});

// Démarrer le serveur
app.listen(PORT, '0.0.0.0', () => {
  console.log('');
  console.log('🖨️  ═══════════════════════════════════════════════════');
  console.log('🖨️  SERVEUR D\'IMPRESSION LEVERT - DÉMARRÉ');
  console.log('🖨️  ═══════════════════════════════════════════════════');
  console.log(`🖨️  Port: ${PORT}`);
  console.log(`🖨️  URL locale: http://localhost:${PORT}`);
  console.log('🖨️  ═══════════════════════════════════════════════════');
  console.log('');
  console.log('📱 Pour utiliser depuis iPad/tablette:');
  console.log('   1. Trouvez l\'adresse IP de cet ordinateur');
  console.log('   2. Configurez l\'URL du serveur dans l\'app:');
  console.log('      http://[IP_DE_CET_ORDINATEUR]:3001');
  console.log('');
  console.log('💡 Exemple: http://192.168.1.100:3001');
  console.log('');
});
