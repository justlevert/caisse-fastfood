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
