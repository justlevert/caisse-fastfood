import { NextRequest, NextResponse } from 'next/server';
import { ThermalPrinter, PrinterTypes } from 'node-thermal-printer';
import { generateTicketCaisse, generateTicketCuisine } from '@/lib/ticketGenerator';
import { supabase } from '@/lib/supabase';

export async function POST(request: NextRequest) {
  try {
    const { ip, port, type, commande } = await request.json();

    if (!ip) {
      return NextResponse.json(
        { success: false, message: 'Adresse IP requise' },
        { status: 400 }
      );
    }

    if (!commande) {
      return NextResponse.json(
        { success: false, message: 'Données de commande requises' },
        { status: 400 }
      );
    }

    // Récupérer la configuration depuis Supabase
    const configKey = type === 'caisse' ? 'ticket_config' : 'ticket_cuisine_config';
    const { data: settingData, error: settingError } = await supabase
      .from('settings')
      .select('value')
      .eq('key', configKey)
      .single();

    if (settingError || !settingData) {
      return NextResponse.json(
        { success: false, message: 'Configuration non trouvée' },
        { status: 500 }
      );
    }

    const config = JSON.parse(settingData.value);

    // Créer l'imprimante
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

    // Générer le ticket selon le type
    if (type === 'caisse') {
      generateTicketCaisse(printer, config, commande);
    } else {
      generateTicketCuisine(printer, config, commande);
    }

    // Couper le papier
    printer.cut();

    // Envoyer à l'imprimante
    await printer.execute();

    return NextResponse.json({
      success: true,
      message: `Ticket ${type} imprimé avec succès`,
    });
  } catch (error: any) {
    console.error('Erreur impression commande:', error);
    return NextResponse.json(
      {
        success: false,
        message: `Erreur d'impression: ${error.message || 'Erreur inconnue'}`,
      },
      { status: 500 }
    );
  }
}
