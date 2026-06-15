/**
 * Service d'impression unifié
 * Détecte automatiquement si on utilise un serveur d'impression distant (Android)
 * ou les routes API Next.js locales
 */

import { sendToPrintServer, PrintCommandBuilder } from './printService';

interface PrinterConfig {
  nom: string;
  ip: string;
  port: number;
  statut: 'active' | 'inactive';
  type_ticket: 'standard' | 'preparation';
}

interface PrintersConfig {
  caisse: PrinterConfig;
  cuisine: PrinterConfig;
  print_server_url?: string;
}

/**
 * Récupère la configuration des imprimantes depuis Supabase
 */
async function getPrintersConfig(): Promise<PrintersConfig | null> {
  try {
    const { supabase } = await import('@/lib/supabase');
    const { data, error } = await supabase
      .from('settings')
      .select('value')
      .eq('key', 'imprimantes_config')
      .single();

    if (error || !data) {
      console.error('Erreur récupération config imprimantes:', error);
      return null;
    }

    return JSON.parse(data.value);
  } catch (error) {
    console.error('Erreur parsing config imprimantes:', error);
    return null;
  }
}

/**
 * Imprime via le serveur distant (Android/Raspberry Pi)
 */
async function printViaRemoteServer(
  serverUrl: string,
  printerIp: string,
  printerPort: number,
  commands: any[]
): Promise<{ success: boolean; message: string }> {
  return await sendToPrintServer(serverUrl, printerIp, commands, printerPort);
}

/**
 * Imprime via les routes API Next.js (serveur local)
 */
async function printViaNextAPI(
  printerIp: string,
  printerPort: number,
  type: 'caisse' | 'cuisine',
  commande: any
): Promise<{ success: boolean; message: string }> {
  try {
    const response = await fetch('/api/printer/print-commande', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ip: printerIp,
        port: printerPort,
        type,
        commande,
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || 'Erreur d\'impression');
    }

    return {
      success: true,
      message: data.message || 'Impression réussie',
    };
  } catch (error: any) {
    console.error('Erreur printViaNextAPI:', error);
    return {
      success: false,
      message: error.message || 'Erreur d\'impression',
    };
  }
}

/**
 * Fonction principale d'impression
 * Détecte automatiquement la méthode à utiliser
 */
export async function printTicket(
  type: 'caisse' | 'cuisine',
  commande: any
): Promise<{ success: boolean; message: string }> {
  try {
    // Récupérer la configuration
    const config = await getPrintersConfig();

    if (!config) {
      return {
        success: false,
        message: 'Configuration des imprimantes non trouvée',
      };
    }

    const printer = config[type];

    // Vérifier que l'imprimante est configurée et active
    if (!printer.ip) {
      return {
        success: false,
        message: `Imprimante ${type} non configurée`,
      };
    }

    if (printer.statut !== 'active') {
      return {
        success: false,
        message: `Imprimante ${type} inactive`,
      };
    }

    // Détecter si on utilise un serveur distant
    const useRemoteServer = config.print_server_url && config.print_server_url.trim() !== '';

    if (useRemoteServer) {
      console.log(`📱 Impression via serveur distant: ${config.print_server_url}`);
      
      // TODO: Générer les commandes d'impression
      // Pour l'instant, on utilise l'API Next.js comme fallback
      // Il faudra créer une fonction pour convertir la commande en PrintCommands
      
      return {
        success: false,
        message: 'Impression via serveur distant en cours de développement. Utilisez l\'API Next.js pour le moment.',
      };
    } else {
      console.log(`🖥️ Impression via API Next.js locale`);
      return await printViaNextAPI(printer.ip, printer.port, type, commande);
    }
  } catch (error: any) {
    console.error('Erreur printTicket:', error);
    return {
      success: false,
      message: error.message || 'Erreur d\'impression',
    };
  }
}

/**
 * Imprime un ticket de test
 */
export async function printTestTicket(
  type: 'caisse' | 'cuisine'
): Promise<{ success: boolean; message: string }> {
  try {
    const config = await getPrintersConfig();

    if (!config) {
      return {
        success: false,
        message: 'Configuration des imprimantes non trouvée',
      };
    }

    const printer = config[type];

    if (!printer.ip) {
      return {
        success: false,
        message: `Imprimante ${type} non configurée`,
      };
    }

    // Détecter si on utilise un serveur distant
    const useRemoteServer = config.print_server_url && config.print_server_url.trim() !== '';

    if (useRemoteServer) {
      console.log(`📱 Test via serveur distant: ${config.print_server_url}`);
      
      // Créer un ticket de test simple
      const builder = new PrintCommandBuilder();
      builder
        .alignCenter()
        .setTextDoubleHeight()
        .bold(true)
        .println('TEST IMPRESSION')
        .bold(false)
        .setTextNormal()
        .newLine()
        .println(`Type: ${type.toUpperCase()}`)
        .println(`Imprimante: ${printer.nom}`)
        .println(`IP: ${printer.ip}:${printer.port}`)
        .newLine()
        .println(new Date().toLocaleString('fr-FR'))
        .newLine()
        .drawLine('-')
        .alignCenter()
        .println('✅ Test réussi !')
        .newLine()
        .newLine()
        .cut();

      const commands = builder.getCommands();
      
      return await sendToPrintServer(
        config.print_server_url!,
        printer.ip,
        commands,
        printer.port
      );
    } else {
      console.log(`🖥️ Test via API Next.js locale`);
      
      const response = await fetch('/api/printer/print', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ip: printer.ip,
          port: printer.port,
          type,
          nom: printer.nom,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Erreur d\'impression');
      }

      return {
        success: true,
        message: data.message || 'Test d\'impression réussi',
      };
    }
  } catch (error: any) {
    console.error('Erreur printTestTicket:', error);
    return {
      success: false,
      message: error.message || 'Erreur de test d\'impression',
    };
  }
}

/**
 * Teste la connexion à une imprimante
 */
export async function testPrinterConnection(
  type: 'caisse' | 'cuisine'
): Promise<{ success: boolean; message: string }> {
  try {
    const config = await getPrintersConfig();

    if (!config) {
      return {
        success: false,
        message: 'Configuration des imprimantes non trouvée',
      };
    }

    const printer = config[type];

    if (!printer.ip) {
      return {
        success: false,
        message: `Imprimante ${type} non configurée`,
      };
    }

    // Pour le test de connexion, on utilise toujours l'API Next.js
    // car elle a une route dédiée pour ça
    const response = await fetch('/api/printer/test', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ip: printer.ip,
        port: printer.port,
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || 'Erreur de test de connexion');
    }

    return {
      success: data.connected || false,
      message: data.message || (data.connected ? 'Connexion réussie' : 'Connexion échouée'),
    };
  } catch (error: any) {
    console.error('Erreur testPrinterConnection:', error);
    return {
      success: false,
      message: error.message || 'Erreur de test de connexion',
    };
  }
}
