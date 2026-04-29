'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';

interface Cloture {
  id: string;
  date_cloture: string;
  user_id: string;
  nombre_commandes: number;
  total_especes: number;
  total_carte: number;
  total_general: number;
  date_debut: string;
  date_fin: string;
  notes: string | null;
  created_at: string;
}

interface ClotureWithUser extends Cloture {
  user_nom: string;
}

export default function CloturesHistoriquePage() {
  const router = useRouter();
  const [clotures, setClotures] = useState<ClotureWithUser[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedCloture, setSelectedCloture] = useState<ClotureWithUser | null>(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);

  useEffect(() => {
    checkAdminAccess();
    loadClotures();
  }, []);

  const checkAdminAccess = async () => {
    const userPin = localStorage.getItem('userPin');
    if (!userPin) {
      router.push('/');
      return;
    }

    const { data: user } = await supabase
      .from('users')
      .select('role')
      .eq('pin', userPin)
      .single();

    if (!user || user.role !== 'administrateur') {
      router.push('/commande');
    }
  };

  const loadClotures = async () => {
    setIsLoading(true);

    const { data: cloturesData, error } = await supabase
      .from('clotures')
      .select('*')
      .order('date_cloture', { ascending: false });

    if (error || !cloturesData) {
      setIsLoading(false);
      return;
    }

    // Récupérer les noms des utilisateurs
    const cloturesWithUsers = await Promise.all(
      cloturesData.map(async (cloture) => {
        const { data: userData } = await supabase
          .from('users')
          .select('nom')
          .eq('id', cloture.user_id)
          .single();

        return {
          ...cloture,
          user_nom: userData?.nom || 'Inconnu',
        };
      })
    );

    setClotures(cloturesWithUsers);
    setIsLoading(false);
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const handleViewDetails = (cloture: ClotureWithUser) => {
    setSelectedCloture(cloture);
    setShowDetailsModal(true);
  };

  const handleViewOrders = (clotureId: string) => {
    router.push(`/historique?cloture_id=${clotureId}`);
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <h1 className="text-4xl font-bold text-gray-800">📜 Historique des clôtures</h1>
            <div className="flex gap-3">
              <button
                onClick={() => router.push('/admin/cloture')}
                className="px-6 py-4 bg-orange-500 hover:bg-orange-600 text-white font-semibold rounded-2xl transition-all"
              >
                🔒 Nouvelle clôture
              </button>
              <button
                onClick={() => router.push('/commande')}
                className="px-6 py-4 bg-gray-200 hover:bg-gray-300 text-gray-800 font-semibold rounded-2xl transition-all"
              >
                ← Retour
              </button>
            </div>
          </div>
          <p className="text-gray-600">Consultez l&apos;historique de toutes les clôtures de caisse</p>
        </div>

        {isLoading ? (
          <div className="text-center py-12">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-gray-300 border-t-orange-500"></div>
            <p className="text-gray-500 mt-4">Chargement...</p>
          </div>
        ) : clotures.length === 0 ? (
          <div className="bg-white rounded-2xl shadow-lg p-12 text-center border-2 border-gray-200">
            <div className="text-6xl mb-4">📭</div>
            <p className="text-gray-500 text-lg">Aucune clôture enregistrée</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {clotures.map((cloture) => (
              <div
                key={cloture.id}
                className="bg-white rounded-2xl shadow-lg border-2 border-gray-200 hover:border-orange-300 overflow-hidden transition-all hover:shadow-xl"
              >
                {/* Header */}
                <div className="bg-gradient-to-br from-orange-500 to-orange-600 p-6 text-white">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-3xl">🔒</span>
                    <span className="text-sm opacity-90">#{cloture.id.slice(0, 8)}</span>
                  </div>
                  <h3 className="text-xl font-bold">{formatDate(cloture.date_cloture)}</h3>
                  <p className="text-sm opacity-90 mt-1">Par {cloture.user_nom}</p>
                </div>

                {/* Contenu */}
                <div className="p-6">
                  <div className="space-y-3 mb-4">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">Commandes</span>
                      <span className="font-bold text-gray-800">{cloture.nombre_commandes}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">💵 Espèces</span>
                      <span className="font-bold text-gray-800">{cloture.total_especes.toFixed(2)}€</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">💳 Carte</span>
                      <span className="font-bold text-gray-800">{cloture.total_carte.toFixed(2)}€</span>
                    </div>
                    <div className="border-t-2 border-gray-200 pt-3 flex justify-between items-center">
                      <span className="text-sm font-semibold text-gray-700">Total</span>
                      <span className="text-xl font-bold text-green-600">{cloture.total_general.toFixed(2)}€</span>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleViewDetails(cloture)}
                      className="flex-1 py-3 bg-blue-50 hover:bg-blue-100 text-blue-600 font-semibold rounded-xl transition-all"
                    >
                      📊 Détails
                    </button>
                    <button
                      onClick={() => handleViewOrders(cloture.id)}
                      className="flex-1 py-3 bg-purple-50 hover:bg-purple-100 text-purple-600 font-semibold rounded-xl transition-all"
                    >
                      📜 Commandes
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Modal Détails */}
      {showDetailsModal && selectedCloture && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-8 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-3xl font-bold text-gray-800">🔒 Détails de la clôture</h2>
              <button
                onClick={() => setShowDetailsModal(false)}
                className="text-gray-400 hover:text-gray-600 text-3xl"
              >
                ×
              </button>
            </div>

            <div className="space-y-6">
              {/* Informations générales */}
              <div className="bg-gray-50 rounded-xl p-6">
                <h3 className="font-bold text-gray-800 mb-4">Informations générales</h3>
                <div className="space-y-3 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Date de clôture :</span>
                    <span className="font-semibold text-gray-800">{formatDate(selectedCloture.date_cloture)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Clôturée par :</span>
                    <span className="font-semibold text-gray-800">{selectedCloture.user_nom}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">ID de clôture :</span>
                    <span className="font-mono text-xs text-gray-600">{selectedCloture.id}</span>
                  </div>
                </div>
              </div>

              {/* Période */}
              <div className="bg-blue-50 rounded-xl p-6">
                <h3 className="font-bold text-blue-800 mb-4">📅 Période couverte</h3>
                <div className="space-y-3 text-sm">
                  <div className="flex justify-between">
                    <span className="text-blue-600">Début de session :</span>
                    <span className="font-semibold text-blue-800">{formatDate(selectedCloture.date_debut)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-blue-600">Fin de session :</span>
                    <span className="font-semibold text-blue-800">{formatDate(selectedCloture.date_fin)}</span>
                  </div>
                </div>
              </div>

              {/* Statistiques */}
              <div className="bg-green-50 rounded-xl p-6">
                <h3 className="font-bold text-green-800 mb-4">💰 Statistiques</h3>
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-green-600">Nombre de commandes</span>
                    <span className="text-2xl font-bold text-green-800">{selectedCloture.nombre_commandes}</span>
                  </div>
                  <div className="border-t-2 border-green-200 pt-3 space-y-2">
                    <div className="flex justify-between">
                      <span className="text-sm text-green-600">💵 Espèces</span>
                      <span className="font-bold text-green-800">{selectedCloture.total_especes.toFixed(2)}€</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-green-600">💳 Carte</span>
                      <span className="font-bold text-green-800">{selectedCloture.total_carte.toFixed(2)}€</span>
                    </div>
                    <div className="border-t-2 border-green-300 pt-2 flex justify-between">
                      <span className="text-sm font-semibold text-green-700">Total général</span>
                      <span className="text-3xl font-bold text-green-700">{selectedCloture.total_general.toFixed(2)}€</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="flex gap-3">
                <button
                  onClick={() => handleViewOrders(selectedCloture.id)}
                  className="flex-1 py-4 bg-purple-500 hover:bg-purple-600 text-white font-bold rounded-2xl transition-all"
                >
                  📜 Voir les commandes
                </button>
                <button
                  onClick={() => setShowDetailsModal(false)}
                  className="flex-1 py-4 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold rounded-2xl transition-all"
                >
                  Fermer
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
