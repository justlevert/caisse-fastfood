'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { exempleCommande } from '@/lib/exempleImpression';

export default function TestImpressionPage() {
  const router = useRouter();
  const [ipCaisse, setIpCaisse] = useState('');
  const [portCaisse, setPortCaisse] = useState('9100');
  const [ipCuisine, setIpCuisine] = useState('');
  const [portCuisine, setPortCuisine] = useState('9100');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState<'success' | 'error'>('success');

  const imprimerTicket = async (type: 'caisse' | 'cuisine') => {
    const ip = type === 'caisse' ? ipCaisse : ipCuisine;
    const port = type === 'caisse' ? portCaisse : portCuisine;

    if (!ip) {
      setMessage(`Veuillez entrer l'adresse IP de l'imprimante ${type}`);
      setMessageType('error');
      return;
    }

    setLoading(true);
    setMessage(`Impression du ticket ${type}...`);
    setMessageType('success');

    try {
      const response = await fetch('/api/printer/print-commande', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ip: ip,
          port: parseInt(port),
          type: type,
          commande: exempleCommande
        }),
      });

      const data = await response.json();

      if (data.success) {
        setMessage(`✅ ${data.message}`);
        setMessageType('success');
      } else {
        setMessage(`❌ ${data.message}`);
        setMessageType('error');
      }
    } catch (error) {
      setMessage(`❌ Erreur de connexion`);
      setMessageType('error');
    } finally {
      setLoading(false);
    }
  };

  const imprimerLesDeuxTickets = async () => {
    if (!ipCaisse || !ipCuisine) {
      setMessage('Veuillez configurer les deux imprimantes');
      setMessageType('error');
      return;
    }

    setLoading(true);
    setMessage('Impression des deux tickets...');
    setMessageType('success');

    // Imprimer caisse
    await imprimerTicket('caisse');
    
    // Attendre un peu
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Imprimer cuisine
    await imprimerTicket('cuisine');

    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      {/* Header */}
      <div className="max-w-4xl mx-auto mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-bold text-gray-800">🖨️ Test d&apos;impression</h1>
            <p className="text-gray-600 mt-2">Testez l&apos;impression avec vos configurations personnalisées</p>
          </div>
          <button
            onClick={() => router.push('/parametres')}
            className="px-6 py-3 bg-gray-200 hover:bg-gray-300 text-gray-800 font-semibold rounded-2xl transition-all"
          >
            ← Paramètres
          </button>
        </div>
      </div>

      {/* Message */}
      {message && (
        <div className="max-w-4xl mx-auto mb-6">
          <div className={`${messageType === 'success' ? 'bg-green-100 border-green-500 text-green-800' : 'bg-red-100 border-red-500 text-red-800'} border-2 px-6 py-4 rounded-2xl`}>
            {message}
          </div>
        </div>
      )}

      {/* Configuration */}
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Imprimante Caisse */}
        <div className="bg-white rounded-2xl shadow-lg p-6 border-2 border-gray-200">
          <h3 className="text-xl font-bold text-gray-800 mb-4">🎫 Imprimante Caisse</h3>
          <div className="grid grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Adresse IP
              </label>
              <input
                type="text"
                value={ipCaisse}
                onChange={(e) => setIpCaisse(e.target.value)}
                placeholder="192.168.1.100"
                className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:border-orange-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Port
              </label>
              <input
                type="text"
                value={portCaisse}
                onChange={(e) => setPortCaisse(e.target.value)}
                className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:border-orange-500 focus:outline-none"
              />
            </div>
          </div>
          <button
            onClick={() => imprimerTicket('caisse')}
            disabled={loading}
            className="w-full py-4 bg-blue-500 hover:bg-blue-600 disabled:bg-gray-400 text-white font-bold rounded-2xl transition-all"
          >
            {loading ? 'Impression...' : '🖨️ Imprimer ticket caisse'}
          </button>
        </div>

        {/* Imprimante Cuisine */}
        <div className="bg-white rounded-2xl shadow-lg p-6 border-2 border-gray-200">
          <h3 className="text-xl font-bold text-gray-800 mb-4">🍳 Imprimante Cuisine</h3>
          <div className="grid grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Adresse IP
              </label>
              <input
                type="text"
                value={ipCuisine}
                onChange={(e) => setIpCuisine(e.target.value)}
                placeholder="192.168.1.101"
                className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:border-orange-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Port
              </label>
              <input
                type="text"
                value={portCuisine}
                onChange={(e) => setPortCuisine(e.target.value)}
                className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:border-orange-500 focus:outline-none"
              />
            </div>
          </div>
          <button
            onClick={() => imprimerTicket('cuisine')}
            disabled={loading}
            className="w-full py-4 bg-orange-500 hover:bg-orange-600 disabled:bg-gray-400 text-white font-bold rounded-2xl transition-all"
          >
            {loading ? 'Impression...' : '🖨️ Imprimer ticket cuisine'}
          </button>
        </div>

        {/* Imprimer les deux */}
        <div className="bg-white rounded-2xl shadow-lg p-6 border-2 border-gray-200">
          <h3 className="text-xl font-bold text-gray-800 mb-4">🎯 Impression complète</h3>
          <p className="text-gray-600 mb-4">
            Imprime les deux tickets (caisse + cuisine) avec la commande d&apos;exemple
          </p>
          <button
            onClick={imprimerLesDeuxTickets}
            disabled={loading}
            className="w-full py-4 bg-gradient-to-br from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 disabled:from-gray-300 disabled:to-gray-400 text-white font-bold rounded-2xl transition-all"
          >
            {loading ? 'Impression...' : '🖨️🖨️ Imprimer les deux tickets'}
          </button>
        </div>

        {/* Commande d&apos;exemple */}
        <div className="bg-white rounded-2xl shadow-lg p-6 border-2 border-gray-200">
          <h3 className="text-xl font-bold text-gray-800 mb-4">📋 Commande d&apos;exemple</h3>
          <div className="bg-gray-50 rounded-xl p-4 font-mono text-sm">
            <pre>{JSON.stringify(exempleCommande, null, 2)}</pre>
          </div>
        </div>
      </div>
    </div>
  );
}
