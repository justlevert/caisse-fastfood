'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';

interface SessionStats {
  nombre_commandes: number;
  total_especes: number;
  total_carte: number;
  total_general: number;
  date_debut: string | null;
  date_fin: string | null;
}

export default function CloturePage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [stats, setStats] = useState<SessionStats>({
    nombre_commandes: 0,
    total_especes: 0,
    total_carte: 0,
    total_general: 0,
    date_debut: null,
    date_fin: null,
  });
  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    checkAdminAccess();
    loadSessionStats();
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

  const loadSessionStats = async () => {
    setIsLoading(true);

    // Récupérer toutes les commandes de la session en cours (cloture_id = NULL)
    // Si le champ cloture_id n'existe pas encore, on récupère toutes les commandes
    const { data: orders, error } = await supabase
      .from('orders')
      .select('*')
      .order('created_at', { ascending: true });

    console.log('📊 Commandes récupérées:', orders);
    console.log('❌ Erreur:', error);

    if (error) {
      console.error('Erreur lors du chargement des commandes:', error);
      setErrorMessage('❌ Erreur lors du chargement des statistiques');
      setTimeout(() => setErrorMessage(''), 3000);
      setIsLoading(false);
      return;
    }

    if (!orders) {
      setIsLoading(false);
      return;
    }

    // Filtrer les commandes sans cloture_id (session en cours)
    // Si le champ n'existe pas, on prend toutes les commandes
    const sessionOrders = orders.filter(o => !o.cloture_id);

    console.log('📊 Commandes de la session:', sessionOrders);

    // Calculer les statistiques
    const nombre_commandes = sessionOrders.length;
    const total_especes = sessionOrders
      .filter(o => o.paiement === 'especes')
      .reduce((sum, o) => sum + parseFloat(o.total), 0);
    const total_carte = sessionOrders
      .filter(o => o.paiement === 'carte')
      .reduce((sum, o) => sum + parseFloat(o.total), 0);
    const total_general = total_especes + total_carte;
    const date_debut = sessionOrders.length > 0 ? sessionOrders[0].created_at : null;
    const date_fin = sessionOrders.length > 0 ? sessionOrders[sessionOrders.length - 1].created_at : null;

    console.log('📊 Statistiques calculées:', {
      nombre_commandes,
      total_especes,
      total_carte,
      total_general,
      date_debut,
      date_fin
    });

    setStats({
      nombre_commandes,
      total_especes,
      total_carte,
      total_general,
      date_debut,
      date_fin,
    });

    setIsLoading(false);
  };

  const handleCloture = async () => {
    if (stats.nombre_commandes === 0) {
      setErrorMessage('❌ Aucune commande à clôturer');
      setTimeout(() => setErrorMessage(''), 3000);
      return;
    }

    setIsProcessing(true);

    try {
      // 1. Créer l'enregistrement de clôture
      const userPin = localStorage.getItem('userPin');
      const { data: user } = await supabase
        .from('users')
        .select('id')
        .eq('pin', userPin)
        .single();

      const { data: cloture, error: clotureError } = await supabase
        .from('clotures')
        .insert({
          user_id: user?.id,
          nombre_commandes: stats.nombre_commandes,
          total_especes: stats.total_especes,
          total_carte: stats.total_carte,
          total_general: stats.total_general,
          date_debut: stats.date_debut,
          date_fin: stats.date_fin,
        })
        .select()
        .single();

      if (clotureError || !cloture) {
        throw new Error('Erreur lors de la création de la clôture');
      }

      // 2. Marquer toutes les commandes de la session avec l'ID de la clôture
      const { error: updateError } = await supabase
        .from('orders')
        .update({ cloture_id: cloture.id })
        .is('cloture_id', null);

      if (updateError) {
        throw new Error('Erreur lors du marquage des commandes');
      }

      // 3. Succès
      setSuccessMessage('✅ Clôture effectuée avec succès !');
      setShowModal(false);
      
      // Recharger les stats (devrait être à zéro maintenant)
      setTimeout(() => {
        loadSessionStats();
        setSuccessMessage('');
      }, 2000);

    } catch (error: any) {
      setErrorMessage(`❌ ${error.message}`);
      setTimeout(() => setErrorMessage(''), 3000);
    } finally {
      setIsProcessing(false);
    }
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return '—';
    const date = new Date(dateString);
    return date.toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      {/* Messages */}
      {successMessage && (
        <div className="fixed top-6 right-6 z-50 bg-green-100 border-2 border-green-500 text-green-800 px-6 py-4 rounded-2xl shadow-lg animate-fade-in">
          {successMessage}
        </div>
      )}
      {errorMessage && (
        <div className="fixed top-6 right-6 z-50 bg-red-100 border-2 border-red-500 text-red-800 px-6 py-4 rounded-2xl shadow-lg animate-fade-in">
          {errorMessage}
        </div>
      )}

      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <h1 className="text-4xl font-bold text-gray-800">🔒 Clôture de caisse</h1>
            <div className="flex gap-3">
              <button
                onClick={() => router.push('/admin/clotures')}
                className="px-6 py-4 bg-gray-200 hover:bg-gray-300 text-gray-800 font-semibold rounded-2xl transition-all"
              >
                📜 Historique
              </button>
              <button
                onClick={() => router.push('/commande')}
                className="px-6 py-4 bg-gray-200 hover:bg-gray-300 text-gray-800 font-semibold rounded-2xl transition-all"
              >
                ← Retour
              </button>
            </div>
          </div>
          <p className="text-gray-600">Clôturez la session de caisse en cours</p>
        </div>

        {isLoading ? (
          <div className="text-center py-12">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-gray-300 border-t-orange-500"></div>
            <p className="text-gray-500 mt-4">Chargement...</p>
          </div>
        ) : (
          <>
            {/* Statistiques de la session */}
            <div className="bg-white rounded-2xl shadow-lg p-8 mb-6 border-2 border-gray-200">
              <h2 className="text-2xl font-bold text-gray-800 mb-6">📊 Session en cours</h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                <div className="bg-blue-50 rounded-xl p-6 border-2 border-blue-200">
                  <p className="text-sm text-blue-600 font-semibold mb-2">Nombre de commandes</p>
                  <p className="text-4xl font-bold text-blue-700">{stats.nombre_commandes}</p>
                </div>
                
                <div className="bg-green-50 rounded-xl p-6 border-2 border-green-200">
                  <p className="text-sm text-green-600 font-semibold mb-2">Total général</p>
                  <p className="text-4xl font-bold text-green-700">{stats.total_general.toFixed(2)}€</p>
                </div>
                
                <div className="bg-purple-50 rounded-xl p-6 border-2 border-purple-200">
                  <p className="text-sm text-purple-600 font-semibold mb-2">💵 Espèces</p>
                  <p className="text-3xl font-bold text-purple-700">{stats.total_especes.toFixed(2)}€</p>
                </div>
                
                <div className="bg-orange-50 rounded-xl p-6 border-2 border-orange-200">
                  <p className="text-sm text-orange-600 font-semibold mb-2">💳 Carte</p>
                  <p className="text-3xl font-bold text-orange-700">{stats.total_carte.toFixed(2)}€</p>
                </div>
              </div>

              <div className="border-t-2 border-gray-200 pt-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-gray-600">
                  <div>
                    <span className="font-semibold">Début de session :</span>
                    <p className="text-gray-800 mt-1">{formatDate(stats.date_debut)}</p>
                  </div>
                  <div>
                    <span className="font-semibold">Dernière commande :</span>
                    <p className="text-gray-800 mt-1">{formatDate(stats.date_fin)}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Bouton de clôture */}
            <div className="bg-white rounded-2xl shadow-lg p-8 border-2 border-gray-200">
              <div className="flex items-start gap-4 mb-6">
                <div className="text-4xl">⚠️</div>
                <div>
                  <h3 className="text-xl font-bold text-gray-800 mb-2">Attention</h3>
                  <p className="text-gray-600">
                    La clôture de caisse est une action <strong>irréversible</strong>. 
                    Toutes les commandes de la session en cours seront archivées et la caisse repartira à zéro.
                  </p>
                </div>
              </div>

              <button
                onClick={() => setShowModal(true)}
                disabled={stats.nombre_commandes === 0}
                className="w-full py-6 bg-gradient-to-br from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 disabled:from-gray-300 disabled:to-gray-400 text-white font-bold text-xl rounded-2xl shadow-lg transition-all disabled:cursor-not-allowed"
              >
                {stats.nombre_commandes === 0 ? '❌ Aucune commande à clôturer' : '🔒 Clôturer la caisse'}
              </button>
            </div>
          </>
        )}
      </div>

      {/* Modal de confirmation */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-8 max-w-md w-full">
            <h2 className="text-2xl font-bold text-gray-800 mb-4">⚠️ Confirmer la clôture</h2>
            
            <div className="bg-yellow-50 border-2 border-yellow-300 rounded-xl p-4 mb-6">
              <p className="text-yellow-800 font-semibold mb-2">Résumé de la session :</p>
              <ul className="text-sm text-yellow-700 space-y-1">
                <li>• {stats.nombre_commandes} commande{stats.nombre_commandes > 1 ? 's' : ''}</li>
                <li>• Espèces : {stats.total_especes.toFixed(2)}€</li>
                <li>• Carte : {stats.total_carte.toFixed(2)}€</li>
                <li>• <strong>Total : {stats.total_general.toFixed(2)}€</strong></li>
              </ul>
            </div>

            <p className="text-red-600 text-sm mb-6">
              ⚠️ Cette action est irréversible. La caisse repartira à zéro après la clôture.
            </p>

            <div className="flex gap-3">
              <button
                onClick={() => setShowModal(false)}
                disabled={isProcessing}
                className="flex-1 py-4 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold rounded-2xl transition-all disabled:opacity-50"
              >
                Annuler
              </button>
              <button
                onClick={handleCloture}
                disabled={isProcessing}
                className="flex-1 py-4 bg-red-500 hover:bg-red-600 text-white font-bold rounded-2xl transition-all disabled:opacity-50"
              >
                {isProcessing ? '⏳ Clôture...' : '🔒 Clôturer'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
