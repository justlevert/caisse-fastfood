'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { InvoiceRecord } from '@/types/invoice.types';
import InvoiceList from '@/components/desktop/InvoiceList';
import InvoiceDetail from '@/components/desktop/InvoiceDetail';

export default function AdminFacturesPage() {
  const router = useRouter();
  const [invoices, setInvoices] = useState<InvoiceRecord[]>([]);
  const [selectedInvoice, setSelectedInvoice] = useState<InvoiceRecord | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'month' | 'week'>('all');
  const [searchTerm, setSearchTerm] = useState('');

  // Charger les factures depuis Supabase
  useEffect(() => {
    loadInvoices();
  }, [filter]);

  const loadInvoices = async () => {
    setIsLoading(true);
    try {
      let query = supabase
        .from('invoices')
        .select('*')
        .order('created_at', { ascending: false });

      // Filtrage par période
      if (filter === 'week') {
        const weekAgo = new Date();
        weekAgo.setDate(weekAgo.getDate() - 7);
        query = query.gte('created_at', weekAgo.toISOString());
      } else if (filter === 'month') {
        const monthAgo = new Date();
        monthAgo.setMonth(monthAgo.getMonth() - 1);
        query = query.gte('created_at', monthAgo.toISOString());
      }

      const { data, error } = await query;

      if (error) {
        console.error('Erreur chargement factures:', error);
        return;
      }

      setInvoices(data || []);
    } catch (error) {
      console.error('Erreur:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Filtrer par recherche
  const filteredInvoices = invoices.filter((inv) => {
    if (!searchTerm) return true;
    const term = searchTerm.toLowerCase();
    return (
      inv.fournisseur.toLowerCase().includes(term) ||
      (inv.numero_facture && inv.numero_facture.toLowerCase().includes(term)) ||
      (inv.categorie && inv.categorie.toLowerCase().includes(term))
    );
  });

  // Calcul des totaux
  const totalTTC = filteredInvoices.reduce((sum, inv) => sum + inv.montant_ttc, 0);
  const totalTVA = filteredInvoices.reduce((sum, inv) => sum + (inv.tva || 0), 0);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button
                onClick={() => router.back()}
                className="text-gray-500 hover:text-gray-700 text-lg"
              >
                ← Retour
              </button>
              <div>
                <h1 className="text-2xl font-bold text-gray-800">
                  📄 Gestion des Factures
                </h1>
                <p className="text-sm text-gray-500">
                  {filteredInvoices.length} facture{filteredInvoices.length !== 1 ? 's' : ''}
                  {' '} &bull; Total : {totalTTC.toFixed(2)} € TTC
                  {totalTVA > 0 && ` (dont ${totalTVA.toFixed(2)} € TVA)`}
                </p>
              </div>
            </div>
          </div>

          {/* Filtres */}
          <div className="flex items-center gap-4 mt-4">
            {/* Recherche */}
            <div className="flex-1 max-w-md">
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-none text-sm"
                placeholder="Rechercher par fournisseur, n° facture..."
              />
            </div>

            {/* Filtres période */}
            <div className="flex gap-2">
              {[
                { value: 'all' as const, label: 'Tout' },
                { value: 'month' as const, label: 'Ce mois' },
                { value: 'week' as const, label: 'Cette semaine' },
              ].map((f) => (
                <button
                  key={f.value}
                  onClick={() => setFilter(f.value)}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                    filter === f.value
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  {f.label}
                </button>
              ))}
            </div>

            {/* Bouton rafraîchir */}
            <button
              onClick={loadInvoices}
              disabled={isLoading}
              className="px-4 py-2 bg-gray-100 text-gray-600 rounded-lg text-sm font-medium hover:bg-gray-200 transition-colors disabled:opacity-50"
            >
              🔄 Rafra&icirc;chir
            </button>
          </div>
        </div>
      </div>

      {/* Contenu principal : liste + détail */}
      <div className="max-w-7xl mx-auto px-6 py-6">
        <div className="grid grid-cols-12 gap-6">
          {/* Colonne gauche : liste */}
          <div className="col-span-5">
            <InvoiceList
              invoices={filteredInvoices}
              selectedId={selectedInvoice?.id || null}
              onSelect={setSelectedInvoice}
              isLoading={isLoading}
            />
          </div>

          {/* Colonne droite : détail */}
          <div className="col-span-7">
            {selectedInvoice ? (
              <InvoiceDetail invoice={selectedInvoice} />
            ) : (
              <div className="bg-white rounded-xl shadow-md p-12 text-center">
                <div className="text-6xl mb-4">👈</div>
                <p className="text-gray-500 text-lg">
                  S&eacute;lectionnez une facture dans la liste
                </p>
                <p className="text-gray-400 text-sm mt-2">
                  pour afficher ses d&eacute;tails
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
