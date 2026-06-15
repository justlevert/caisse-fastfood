/**
 * Service d'impression pour iPad/tablettes
 * Envoie les commandes d'impression à un serveur Node.js distant
 */

interface PrintCommand {
  method: string;
  args?: any[];
}

interface PrintRequest {
  ip: string;
  port?: number;
  commands: PrintCommand[];
}

/**
 * Envoie une tâche d'impression au serveur d'impression
 * @param serverUrl URL du serveur d'impression (ex: http://192.168.1.100:3001)
 * @param printerIp IP de l'imprimante thermique
 * @param commands Liste des commandes d'impression
 */
export async function sendToPrintServer(
  serverUrl: string,
  printerIp: string,
  commands: PrintCommand[],
  printerPort: number = 9100
): Promise<{ success: boolean; message: string }> {
  try {
    // Vérifier que l'URL du serveur est configurée
    if (!serverUrl || serverUrl.trim() === '') {
      throw new Error('URL du serveur d\'impression non configurée');
    }

    // Nettoyer l'URL (enlever le slash final si présent)
    const cleanUrl = serverUrl.replace(/\/$/, '');

    const response = await fetch(`${cleanUrl}/print`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        ip: printerIp,
        port: printerPort,
        commands,
      } as PrintRequest),
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
    console.error('Erreur sendToPrintServer:', error);
    return {
      success: false,
      message: error.message || 'Erreur de connexion au serveur d\'impression',
    };
  }
}

/**
 * Teste la connexion au serveur d'impression
 */
export async function testPrintServer(serverUrl: string): Promise<boolean> {
  try {
    if (!serverUrl || serverUrl.trim() === '') {
      return false;
    }

    const cleanUrl = serverUrl.replace(/\/$/, '');
    const response = await fetch(`${cleanUrl}/health`, {
      method: 'GET',
    });

    if (!response.ok) {
      return false;
    }

    const data = await response.json();
    return data.status === 'ok';
  } catch (error) {
    console.error('Erreur test serveur:', error);
    return false;
  }
}

/**
 * Convertit les commandes de ThermalPrinter en format JSON
 * pour envoi au serveur distant
 */
export class PrintCommandBuilder {
  private commands: PrintCommand[] = [];

  // Méthodes de base
  println(text: string = '') {
    this.commands.push({ method: 'println', args: [text] });
    return this;
  }

  print(text: string) {
    this.commands.push({ method: 'print', args: [text] });
    return this;
  }

  newLine() {
    this.commands.push({ method: 'newLine' });
    return this;
  }

  // Alignement
  alignCenter() {
    this.commands.push({ method: 'alignCenter' });
    return this;
  }

  alignLeft() {
    this.commands.push({ method: 'alignLeft' });
    return this;
  }

  alignRight() {
    this.commands.push({ method: 'alignRight' });
    return this;
  }

  // Style
  bold(enabled: boolean) {
    this.commands.push({ method: 'bold', args: [enabled] });
    return this;
  }

  invert(enabled: boolean) {
    this.commands.push({ method: 'invert', args: [enabled] });
    return this;
  }

  underline(enabled: boolean) {
    this.commands.push({ method: 'underline', args: [enabled] });
    return this;
  }

  // Taille
  setTextSize(width: number, height: number) {
    this.commands.push({ method: 'setTextSize', args: [width, height] });
    return this;
  }

  setTextNormal() {
    this.commands.push({ method: 'setTextNormal' });
    return this;
  }

  setTextDoubleHeight() {
    this.commands.push({ method: 'setTextDoubleHeight' });
    return this;
  }

  setTextDoubleWidth() {
    this.commands.push({ method: 'setTextDoubleWidth' });
    return this;
  }

  setTextQuadArea() {
    this.commands.push({ method: 'setTextQuadArea' });
    return this;
  }

  // Ligne
  drawLine(character: string = '-') {
    this.commands.push({ method: 'drawLine', args: [character] });
    return this;
  }

  // Table
  tableCustom(data: any[]) {
    this.commands.push({ method: 'tableCustom', args: [data] });
    return this;
  }

  // Coupe
  cut() {
    this.commands.push({ method: 'cut' });
    return this;
  }

  partialCut() {
    this.commands.push({ method: 'partialCut' });
    return this;
  }

  // Obtenir les commandes
  getCommands(): PrintCommand[] {
    return this.commands;
  }

  // Réinitialiser
  clear() {
    this.commands = [];
    return this;
  }
}
