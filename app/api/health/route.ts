import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function GET() {
  try {
    // Test connexion Supabase
    const { count, error } = await supabase
      .from('invoices')
      .select('*', { count: 'exact', head: true });

    if (error) {
      return NextResponse.json({
        status: 'error',
        message: 'Erreur connexion Supabase',
        error: error.message,
      }, { status: 500 });
    }

    return NextResponse.json({
      status: 'ok',
      server: 'Next.js running',
      database: 'Supabase connected',
      invoices_count: count,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    return NextResponse.json({
      status: 'error',
      message: error instanceof Error ? error.message : 'Erreur inconnue',
    }, { status: 500 });
  }
}
