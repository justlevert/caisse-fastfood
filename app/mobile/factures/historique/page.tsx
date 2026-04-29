'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';

interface Invoice {
  id: string;
  fournisseur: string;
  adresse: string | null;
  date_facture: string;
  montant_ttc: number;
  montant_valide: number;
  tva: number;
  numero_facture: string | null;
  categorie: string | null;
  image_url: string | null;
  created_at: string;
}

export default function HistoriqueFacturesPage() {
  const router = useRouter();
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);
  const [showImageModal, setShowImageModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCategory, setFilterCategory] = useState<string>('all');

  useEffect(() => {
    loadInvoices();
  }, []);

  const loadInvoices = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('invoices')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setInvoices(data || []);
    } catch (error) {
      console.error('Erreur chargement factures:', error);
      alert('Erreur lors du chargement des factures');
    } finally {
      setIsLoading(false);
    }
  };

  const deleteInvoice = async (id: string) => {
    if (!confirm('Êtes-vous sûr de vouloir supprimer cette facture ?')) return;

    try {
      const { error } = await supabase
        .from('invoices')
        .delete()
        .eq('id', id);

      if (error) throw error;
      
      setInvoices(invoices.filter(inv => inv.id !== id));
      alert('✅ Facture supprimée');
    } catch (error) {
      console.error('Erreur suppression:', error);
      alert('❌ Erreur lors de la suppression');
    }
  };

  const filteredInvoices = invoices.filter(invoice => {
    const matchSearch = invoice.fournisseur.toLowerCase().includes(searchTerm.toLowerCase()) ||
                       invoice.numero_facture?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchCategory = filterCategory === 'all' || invoice.categorie === filterCategory;
    return matchSearch && matchCategory;
  });

  const categories = ['all', ...Array.from(new Set(invoices.map(inv => inv.categorie).filter((cat): cat is string => Boolean(cat))))];

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      {/* Header */}
      <div className="bg-gradient-to-r from-slate-800 to-slate-900 text-white shadow-xl">
        <div className="px-4 py-3.5 flex items-center justify-between">
          <button
            onClick={() => router.back()}
            className="flex items-center gap-2 text-white/90 hover:text-white font-semibold text-sm transition-colors"
          >
            <span className="text-lg">←</span>
            <span>Retour</span>
          </button>
          <h1 className="text-lg font-bold">Historique Factures</h1>
          <div className="w-8 h-8 bg-white/10 rounded-lg flex items-center justify-center">
            <span className="text-lg">📋</span>
          </div>
        </div>
      </div>

      {/* Filtres */}
      <div className="p-4 space-y-3">
        {/* Recherche */}
        <div className="relative">
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Rechercher par fournisseur ou n° facture..."
            className="w-full px-4 py-2.5 pl-10 text-sm border border-gray-300 rounded-xl focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 focus:outline-none bg-white transition-all"
          />
          <span className="absolute left-3 top-2.5 text-gray-400">🔍</span>
        </div>

        {/* Catégories */}
        <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
          {categories.map(cat => (
            <button
              key={cat}
              onClick={() => setFilterCategory(cat)}
              className={`px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
                filterCategory === cat
                  ? 'bg-gradient-to-r from-blue-600 to-blue-700 text-white shadow-lg'
                  : 'bg-white text-gray-700 border border-gray-300 hover:border-blue-400'
              }`}
            >
              {cat === 'all' ? 'Toutes' : cat}
            </button>
          ))}
        </div>
      </div>

      {/* Liste des factures */}
      <div className="px-4 pb-4">
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-4 border-gray-300 border-t-blue-600 mx-auto mb-3"></div>
              <p className="text-gray-600 text-sm">Chargement...</p>
            </div>
          </div>
        ) : filteredInvoices.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-6xl mb-4">📭</div>
            <p className="text-gray-600 font-medium">Aucune facture trouvée</p>
            <p className="text-gray-500 text-sm mt-1">
              {searchTerm || filterCategory !== 'all' ? 'Essayez de modifier vos filtres' : 'Commencez par ajouter une facture'}
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {filteredInvoices.map(invoice => (
              <div
                key={invoice.id}
                className="bg-white rounded-2xl shadow-lg p-4 border border-gray-100"
              >
                <div className="flex items-start gap-3">
                  {/* Image miniature */}
                  {invoice.image_url && (
                    <div
                      onClick={() => {
                        setSelectedInvoice(invoice);
                        setShowImageModal(true);
                      }}
                      className="w-16 h-20 flex-shrink-0 rounded-xl overflow-hidden border-2 border-gray-200 bg-gray-50 cursor-pointer hover:border-blue-400 transition-colors"
                    >
                      <img
                        src={invoice.image_url}
                        alt="Facture"
                        className="w-full h-full object-cover"
                      />
                    </div>
                  )}

                  {/* Informations */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex-1 min-w-0">
                        <h3 className="text-base font-bold text-gray-800 truncate">
                          {invoice.fournisseur}
                        </h3>
                        {invoice.numero_facture && (
                          <p className="text-xs text-gray-500">
                            N° {invoice.numero_facture}
                          </p>
                        )}
                      </div>
                      <span className="text-lg font-bold text-blue-600 ml-2">
                        {invoice.montant_ttc.toFixed(2)} €
                      </span>
                    </div>

                    <div className="grid grid-cols-2 gap-2 text-xs mb-3">
                      <div>
                        <span className="text-gray-500">Date:</span>
                        <span className="ml-1 font-medium text-gray-700">
                          {new Date(invoice.date_facture).toLocaleDateString('fr-FR')}
                        </span>
                      </div>
                      {invoice.categorie && (
                        <div>
                          <span className="text-gray-500">Catégorie:</span>
                          <span className="ml-1 font-medium text-gray-700">{invoice.categorie}</span>
                        </div>
                      )}
                      <div>
                        <span className="text-gray-500">HT:</span>
                        <span className="ml-1 font-medium text-gray-700">
                          {invoice.montant_valide.toFixed(2)} €
                        </span>
                      </div>
                      <div>
                        <span className="text-gray-500">TVA:</span>
                        <span className="ml-1 font-medium text-gray-700">
                          {invoice.tva.toFixed(2)} €
                        </span>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex gap-2">
                      {invoice.image_url && (
                        <button
                          onClick={() => {
                            setSelectedInvoice(invoice);
                            setShowImageModal(true);
                          }}
                          className="flex-1 py-2 px-3 bg-blue-50 text-blue-700 text-xs font-bold rounded-xl hover:bg-blue-100 transition-colors"
                        >
                          👁️ Voir
                        </button>
                      )}
                      <button
                        onClick={() => deleteInvoice(invoice.id)}
                        className="flex-1 py-2 px-3 bg-red-50 text-red-700 text-xs font-bold rounded-xl hover:bg-red-100 transition-colors"
                      >
                        🗑️ Supprimer
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Modal image plein écran */}
      {showImageModal && selectedInvoice?.image_url && (
        <div
          className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center p-4"
          onClick={() => setShowImageModal(false)}
        >
          <div className="relative max-w-4xl w-full">
            <button
              onClick={() => setShowImageModal(false)}
              className="absolute top-4 right-4 text-white text-3xl font-bold bg-black/50 rounded-full w-12 h-12 flex items-center justify-center hover:bg-black/70 transition-colors"
            >
              ×
            </button>
            <img
              src={selectedInvoice.image_url}
              alt="Facture"
              className="w-full h-auto rounded-lg"
            />
            <div className="absolute bottom-4 left-4 right-4 bg-black/70 backdrop-blur-sm rounded-xl p-4 text-white">
              <h3 className="font-bold text-lg mb-1">{selectedInvoice.fournisseur}</h3>
              <div className="flex justify-between text-sm">
                <span>{new Date(selectedInvoice.date_facture).toLocaleDateString('fr-FR')}</span>
                <span className="font-bold">{selectedInvoice.montant_ttc.toFixed(2)} €</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
