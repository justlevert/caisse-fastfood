'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { useCurrency } from '@/lib/utils/currency';
import { Order, OrderItem, Product } from '@/types/database.types';

interface OrderWithItems extends Order {
  items: (OrderItem & { product: Product | null })[];
}

function HistoriqueContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { symbol: currencySymbol } = useCurrency();
  const [orders, setOrders] = useState<OrderWithItems[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedOrder, setSelectedOrder] = useState<OrderWithItems | null>(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deletePassword, setDeletePassword] = useState('');
  const [orderToDelete, setOrderToDelete] = useState<string | null>(null);
  const [filterSession, setFilterSession] = useState<'current' | 'all'>('current');
  const [clotureIdFilter, setClotureIdFilter] = useState<string | null>(null);

  useEffect(() => {
    // Vérifier si on a un paramètre cloture_id dans l'URL
    const clotureId = searchParams.get('cloture_id');
    if (clotureId) {
      setClotureIdFilter(clotureId);
      setFilterSession('all');
    }
    loadOrders();
  }, [searchParams]);

  useEffect(() => {
    loadOrders();
  }, [filterSession, clotureIdFilter]);

  const loadOrders = async () => {
    setIsLoading(true);

    let query = supabase.from('orders').select('*');

    // Filtrer selon la session
    if (clotureIdFilter) {
      // Afficher les commandes d'une clôture spécifique
      query = query.eq('cloture_id', clotureIdFilter);
    } else if (filterSession === 'current') {
      // Afficher uniquement la session en cours
      query = query.is('cloture_id', null);
    }
    // Si filterSession === 'all' et pas de clotureIdFilter, on affiche tout

    const { data: ordersData, error: ordersError } = await query.order('created_at', { ascending: false });

    if (ordersError || !ordersData) {
      setIsLoading(false);
      return;
    }

    const ordersWithItems = await Promise.all(
      ordersData.map(async (order) => {
        const { data: itemsData } = await supabase
          .from('order_items')
          .select('*')
          .eq('order_id', order.id);

        const itemsWithProducts = await Promise.all(
          (itemsData || []).map(async (item) => {
            const { data: productData } = await supabase
              .from('products')
              .select('*')
              .eq('id', item.product_id)
              .single();

            return {
              ...item,
              product: productData,
            };
          })
        );

        return {
          ...order,
          items: itemsWithProducts,
        };
      })
    );

    setOrders(ordersWithItems);
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

  const getStatutBadge = (statut: string) => {
    const styles = {
      en_cours: 'bg-blue-100 text-primary-600',
      termine: 'bg-green-100 text-green-700',
      annule: 'bg-red-100 text-red-700',
    };
    const labels = {
      en_cours: 'En cours',
      termine: 'Terminé',
      annule: 'Annulé',
    };
    return (
      <span className={`px-3 py-1 rounded-full text-xs font-semibold ${styles[statut as keyof typeof styles]}`}>
        {labels[statut as keyof typeof labels]}
      </span>
    );
  };

  const handleViewDetails = (order: OrderWithItems) => {
    setSelectedOrder(order);
    setShowDetailsModal(true);
  };

  const handleReopenOrder = async (order: OrderWithItems) => {
    if (order.statut !== 'en_cours') {
      alert('Seules les commandes en cours peuvent être rouvertes');
      return;
    }

    if (confirm('Voulez-vous rouvrir cette commande dans la page de commande ?')) {
      alert('Fonctionnalité de réouverture à implémenter avec la page commande');
    }
  };

  const handlePrintTicket = (order: OrderWithItems) => {
    alert('Fonctionnalité d\'impression à implémenter avec les imprimantes');
  };

  const handleDeleteRequest = (orderId: string) => {
    setOrderToDelete(orderId);
    setDeletePassword('');
    setShowDeleteModal(true);
  };

  const handleDeleteConfirm = async () => {
    if (deletePassword !== 'ADMIN2024') {
      alert('Mot de passe administrateur incorrect');
      return;
    }

    if (!orderToDelete) return;

    const { error } = await supabase
      .from('orders')
      .delete()
      .eq('id', orderToDelete);

    if (!error) {
      alert('Commande supprimée avec succès');
      setShowDeleteModal(false);
      setOrderToDelete(null);
      setDeletePassword('');
      loadOrders();
    } else {
      alert('Erreur lors de la suppression');
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold text-gray-800">Historique des Commandes</h1>
          <button
            onClick={() => router.push('/commande')}
            className="px-6 py-3 bg-gray-600 hover:bg-gray-700 text-white font-semibold rounded-2xl transition-all"
          >
            ← Retour
          </button>
        </div>

        {/* Filtre de session */}
        {!clotureIdFilter && (
          <div className="bg-white rounded-2xl shadow-md p-4 mb-6 border-2 border-gray-200">
            <div className="flex items-center gap-4">
              <span className="text-sm font-semibold text-gray-700">Afficher :</span>
              <div className="flex gap-2">
                <button
                  onClick={() => setFilterSession('current')}
                  className={`px-6 py-3 rounded-xl font-semibold transition-all ${
                    filterSession === 'current'
                      ? 'bg-orange-500 text-white shadow-lg'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  🔄 Session en cours
                </button>
                <button
                  onClick={() => setFilterSession('all')}
                  className={`px-6 py-3 rounded-xl font-semibold transition-all ${
                    filterSession === 'all'
                      ? 'bg-orange-500 text-white shadow-lg'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  📜 Toutes les commandes
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Indicateur de clôture spécifique */}
        {clotureIdFilter && (
          <div className="bg-blue-50 border-2 border-blue-300 rounded-2xl p-4 mb-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <span className="text-2xl">🔒</span>
                <div>
                  <p className="font-semibold text-blue-800">Commandes d&apos;une clôture spécifique</p>
                  <p className="text-sm text-blue-600">ID: {clotureIdFilter.slice(0, 8)}...</p>
                </div>
              </div>
              <button
                onClick={() => {
                  setClotureIdFilter(null);
                  setFilterSession('current');
                  router.push('/historique');
                }}
                className="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white font-semibold rounded-xl transition-all"
              >
                ✕ Retirer le filtre
              </button>
            </div>
          </div>
        )}

        {isLoading ? (
          <div className="text-center py-12">
            <p className="text-gray-500">Chargement...</p>
          </div>
        ) : orders.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-2xl shadow-md">
            <div className="text-6xl mb-4">📋</div>
            <p className="text-gray-500">Aucune commande enregistrée</p>
          </div>
        ) : (
          <div className="bg-white rounded-2xl shadow-md overflow-hidden">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">Date</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">Buzzer</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">Mode</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">Paiement</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">Total</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">Statut</th>
                  <th className="px-6 py-4 text-right text-sm font-semibold text-gray-700">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {orders.map((order) => (
                  <tr key={order.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 text-sm text-gray-900">{formatDate(order.created_at)}</td>
                    <td className="px-6 py-4 text-sm text-gray-900">
                      {order.buzzer ? `#${order.buzzer}` : '—'}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-900">
                      {order.mode === 'sur_place' ? 'Sur place' : 'À emporter'}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-900">
                      {order.paiement === 'especes' ? 'Espèces' : 'Carte'}
                    </td>
                    <td className="px-6 py-4 text-sm font-semibold text-gray-900">
                      {order.total.toFixed(2)} {currencySymbol}
                    </td>
                    <td className="px-6 py-4">{getStatutBadge(order.statut)}</td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex justify-end gap-2">
                        <button
                          onClick={() => handleViewDetails(order)}
                          className="px-3 py-2 bg-primary-50 hover:bg-primary-100 text-primary-500 font-semibold rounded-lg transition-all text-sm"
                        >
                          Détails
                        </button>
                        <button
                          onClick={() => handlePrintTicket(order)}
                          className="px-3 py-2 bg-green-50 hover:bg-green-100 text-green-600 font-semibold rounded-lg transition-all text-sm"
                        >
                          Imprimer
                        </button>
                        {order.statut === 'en_cours' && (
                          <button
                            onClick={() => handleReopenOrder(order)}
                            className="px-3 py-2 bg-orange-50 hover:bg-orange-100 text-orange-600 font-semibold rounded-lg transition-all text-sm"
                          >
                            Rouvrir
                          </button>
                        )}
                        <button
                          onClick={() => handleDeleteRequest(order.id)}
                          className="px-3 py-2 bg-red-50 hover:bg-red-100 text-red-600 font-semibold rounded-lg transition-all text-sm"
                        >
                          Supprimer
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal Détails */}
      {showDetailsModal && selectedOrder && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-8 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-start mb-6">
              <div>
                <h2 className="text-2xl font-bold text-gray-800">Détails de la commande</h2>
                <p className="text-sm text-gray-500 mt-1">{formatDate(selectedOrder.created_at)}</p>
              </div>
              <button
                onClick={() => setShowDetailsModal(false)}
                className="text-gray-400 hover:text-gray-600 text-2xl"
              >
                ×
              </button>
            </div>

            <div className="space-y-4 mb-6">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-500">Mode</p>
                  <p className="font-semibold">
                    {selectedOrder.mode === 'sur_place' ? 'Sur place' : 'À emporter'}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Paiement</p>
                  <p className="font-semibold">
                    {selectedOrder.paiement === 'especes' ? 'Espèces' : 'Carte'}
                  </p>
                </div>
                {selectedOrder.buzzer && (
                  <div>
                    <p className="text-sm text-gray-500">Buzzer</p>
                    <p className="font-semibold">#{selectedOrder.buzzer}</p>
                  </div>
                )}
                <div>
                  <p className="text-sm text-gray-500">Statut</p>
                  <div className="mt-1">{getStatutBadge(selectedOrder.statut)}</div>
                </div>
              </div>
            </div>

            <div className="border-t pt-4">
              <h3 className="font-bold text-gray-800 mb-3">Produits</h3>
              <div className="space-y-3">
                {selectedOrder.items.map((item, index) => (
                  <div key={index} className="bg-gray-50 rounded-lg p-4">
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <p className="font-semibold text-gray-800">
                          {item.product?.nom || 'Produit supprimé'}
                        </p>
                        {item.customization && (
                          <div className="text-xs text-gray-600 mt-1 space-y-1">
                            <p>• Taille: {item.customization.taille}</p>
                            <p>• Viandes: {item.customization.viandes.join(', ')}</p>
                            <p>• Sauces: {item.customization.sauces.join(', ')}</p>
                            {item.customization.extras?.length > 0 && (
                              <p>• Extras: {item.customization.extras.join(', ')}</p>
                            )}
                            {item.customization.retraits?.length > 0 && (
                              <p>• Sans: {item.customization.retraits.join(', ')}</p>
                            )}
                            {item.customization.gratin && (
                              <p>• Gratinage: {item.customization.gratin}</p>
                            )}
                          </div>
                        )}
                        <p className="text-sm text-gray-500 mt-1">
                          {item.prix_unitaire.toFixed(2)} {currencySymbol} × {item.quantite}
                        </p>
                      </div>
                      <p className="font-bold text-gray-800">
                        {(item.prix_unitaire * item.quantite).toFixed(2)} {currencySymbol}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="border-t mt-6 pt-4">
              <div className="flex justify-between items-center">
                <span className="text-lg font-bold text-gray-700">Total</span>
                <span className="text-2xl font-bold text-primary-500">
                  {selectedOrder.total.toFixed(2)} {currencySymbol}
                </span>
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setShowDetailsModal(false)}
                className="flex-1 py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold rounded-2xl transition-all"
              >
                Fermer
              </button>
              <button
                onClick={() => handlePrintTicket(selectedOrder)}
                className="flex-1 py-3 bg-primary-500 hover:bg-primary-600 text-white font-semibold rounded-2xl transition-all"
              >
                Imprimer
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Suppression */}
      {showDeleteModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-8 max-w-md w-full">
            <h2 className="text-2xl font-bold text-gray-800 mb-4">⚠️ Suppression de commande</h2>
            <p className="text-gray-600 mb-6">
              Cette action est irréversible. Veuillez entrer le mot de passe administrateur pour
              confirmer la suppression.
            </p>
            <div className="mb-6">
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Mot de passe administrateur
              </label>
              <input
                type="password"
                value={deletePassword}
                onChange={(e) => setDeletePassword(e.target.value)}
                className="w-full px-4 py-3 border-2 border-gray-300 rounded-2xl focus:border-red-500 focus:outline-none"
                placeholder="Entrez le mot de passe"
              />
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => {
                  setShowDeleteModal(false);
                  setOrderToDelete(null);
                  setDeletePassword('');
                }}
                className="flex-1 py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold rounded-2xl transition-all"
              >
                Annuler
              </button>
              <button
                onClick={handleDeleteConfirm}
                className="flex-1 py-3 bg-red-600 hover:bg-red-700 text-white font-semibold rounded-2xl transition-all"
              >
                Supprimer
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function HistoriquePage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gray-50 p-6 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-gray-300 border-t-orange-500 mb-4"></div>
          <p className="text-gray-500">Chargement...</p>
        </div>
      </div>
    }>
      <HistoriqueContent />
    </Suspense>
  );
}
