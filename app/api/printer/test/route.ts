import { NextRequest, NextResponse } from 'next/server';
import { ThermalPrinter, PrinterTypes } from 'node-thermal-printer';

export async function POST(request: NextRequest) {
  try {
    const { ip, port } = await request.json();

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
        timeout: 3000,
      },
    });

    // Tenter de se connecter
    const isConnected = await printer.isPrinterConnected();

    if (isConnected) {
      return NextResponse.json({
        success: true,
        message: `Connexion réussie à l'imprimante ${ip}:${port || 9100}`,
      });
    } else {
      return NextResponse.json(
        {
          success: false,
          message: `Impossible de se connecter à l'imprimante ${ip}:${port || 9100}`,
        },
        { status: 500 }
      );
    }
  } catch (error: any) {
    console.error('Erreur test imprimante:', error);
    return NextResponse.json(
      {
        success: false,
        message: `Erreur de connexion: ${error.message || 'Erreur inconnue'}`,
      },
      { status: 500 }
    );
  }
}
