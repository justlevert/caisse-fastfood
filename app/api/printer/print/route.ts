import { NextRequest, NextResponse } from 'next/server';
import { ThermalPrinter, PrinterTypes } from 'node-thermal-printer';

export async function POST(request: NextRequest) {
  try {
    const { ip, port, type, nom } = await request.json();

    if (!ip) {
      return NextResponse.json(
        { success: false, message: 'Adresse IP requise' },
        { status: 400 }
      );
    }

    const printer = new ThermalPrinter({
      type: PrinterTypes.EPSON,
      interface: `tcp://${ip}:${port || 9100}`,
      removeSpecialCharacters: false,
      lineCharacter: '=',
      options: {
        timeout: 5000,
      },
    });

    // Vérifier la connexion
    const isConnected = await printer.isPrinterConnected();
    
    if (!isConnected) {
      return NextResponse.json(
        { success: false, message: 'Imprimante non connectée' },
        { status: 500 }
      );
    }

    // Créer le ticket de test
    printer.alignCenter();
    printer.setTextSize(1, 1);
    printer.bold(true);
    printer.println('=================================');
    printer.println('   TEST D\'IMPRESSION');
    printer.println('=================================');
    printer.bold(false);
    printer.newLine();
    
    printer.alignLeft();
    printer.setTextNormal();
    printer.println(`Imprimante: ${nom || 'Sans nom'}`);
    printer.println(`Type: ${type === 'caisse' ? 'Caisse' : 'Cuisine'}`);
    printer.println(`IP: ${ip}:${port || 9100}`);
    printer.newLine();
    
    const now = new Date();
    printer.println(`Date: ${now.toLocaleDateString('fr-FR')}`);
    printer.println(`Heure: ${now.toLocaleTimeString('fr-FR')}`);
    printer.newLine();
    
    printer.alignCenter();
    if (type === 'caisse') {
      printer.println('Ticket de caisse');
      printer.println('TVA, Total, Paiement');
    } else {
      printer.println('Ticket de cuisine');
      printer.println('Produits, Buzzer, Heure');
    }
    printer.newLine();
    
    printer.println('=================================');
    printer.println('   TEST REUSSI');
    printer.println('=================================');
    printer.newLine();
    printer.newLine();
    printer.newLine();
    
    // Couper le papier
    printer.cut();

    // Envoyer à l'imprimante
    await printer.execute();

    return NextResponse.json({
      success: true,
      message: `Ticket de test imprimé sur ${nom || 'l\'imprimante'}`,
    });
  } catch (error: any) {
    console.error('Erreur impression:', error);
    return NextResponse.json(
      {
        success: false,
        message: `Erreur d'impression: ${error.message || 'Erreur inconnue'}`,
      },
      { status: 500 }
    );
  }
}
