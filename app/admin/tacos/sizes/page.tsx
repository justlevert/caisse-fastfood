'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { TacoSize } from '@/types/database.types';

export default function AdminTacoSizesPage() {
  const [sizes, setSizes] = useState<TacoSize[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingSize, setEditingSize] = useState<TacoSize | null>(null);
  const [formData, setFormData] = useState({
    nom: '',
    prix: 0,
    max_viandes: 1,
    max_sauces: 1,
    ordre: 0,
  });

  useEffect(() => {
    loadSizes();
  }, []);

  const loadSizes = async () => {
    setIsLoading(true);
    const { data, error } = await supabase
      .from('taco_sizes')
      .select('*')
      .order('ordre', { ascending: true });

    if (data && !error) {
      setSizes(data);
    }
    setIsLoading(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (editingSize) {
      const { error } = await supabase
        .from('taco_sizes')
        .update({
          nom: formData.nom,
          prix: formData.prix,
          max_viandes: formData.max_viandes,
          max_sauces: formData.max_sauces,
          ordre: formData.ordre,
        })
        .eq('id', editingSize.id);

      if (!error) {
        alert('Taille modifiée avec succès');
        loadSizes();
        closeModal();
      } else {
        alert('Erreur lors de la modification');
      }
    } else {
      const { error } = await supabase.from('taco_sizes').insert({
        nom: formData.nom,
        prix: formData.prix,
        max_viandes: formData.max_viandes,
        max_sauces: formData.max_sauces,
        ordre: formData.ordre,
      });

      if (!error) {
        alert('Taille ajoutée avec succès');
        loadSizes();
        closeModal();
      } else {
        alert("Erreur lors de l'ajout");
      }
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Êtes-vous sûr de vouloir supprimer cette taille ?')) return;

    const { error } = await supabase.from('taco_sizes').delete().eq('id', id);

    if (!error) {
      alert('Taille supprimée');
      loadSizes();
    } else {
      alert('Erreur lors de la suppression');
    }
  };

  const openModal = (size?: TacoSize) => {
    if (size) {
      setEditingSize(size);
      setFormData({
        nom: size.nom,
        prix: size.prix,
        max_viandes: size.max_viandes,
        max_sauces: size.max_sauces,
        ordre: size.ordre,
      });
    } else {
      setEditingSize(null);
      setFormData({
        nom: '',
        prix: 0,
        max_viandes: 1,
        max_sauces: 1,
        ordre: sizes.length + 1,
      });
    }
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setEditingSize(null);
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-6xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold text-gray-800">Tailles de Tacos</h1>
          <div className="flex gap-3">
            <button
              onClick={() => (window.location.href = '/admin/products')}
              className="px-6 py-3 bg-gray-600 hover:bg-gray-700 text-white font-semibold rounded-2xl transition-all"
            >
              ← Retour
            </button>
            <button
              onClick={() => openModal()}
              className="px-6 py-3 bg-primary-500 hover:bg-primary-600 text-white font-semibold rounded-2xl transition-all"
            >
              + Ajouter une taille
            </button>
          </div>
        </div>

        {isLoading ? (
          <div className="text-center py-12">
            <p className="text-gray-500">Chargement...</p>
          </div>
        ) : (
          <div className="bg-white rounded-2xl shadow-md overflow-hidden">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">Ordre</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">Nom</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">Prix</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">Max Viandes</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">Max Sauces</th>
                  <th className="px-6 py-4 text-right text-sm font-semibold text-gray-700">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {sizes.map((size) => (
                  <tr key={size.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 text-sm text-gray-900">{size.ordre}</td>
                    <td className="px-6 py-4 text-sm font-medium text-gray-900">{size.nom}</td>
                    <td className="px-6 py-4 text-sm text-gray-900">{size.prix.toFixed(2)} €</td>
                    <td className="px-6 py-4 text-sm text-gray-900">{size.max_viandes}</td>
                    <td className="px-6 py-4 text-sm text-gray-900">{size.max_sauces}</td>
                    <td className="px-6 py-4 text-right">
                      <button
                        onClick={() => openModal(size)}
                        className="px-4 py-2 bg-primary-50 hover:bg-primary-100 text-primary-500 font-semibold rounded-lg mr-2 transition-all"
                      >
                        Modifier
                      </button>
                      <button
                        onClick={() => handleDelete(size.id)}
                        className="px-4 py-2 bg-red-50 hover:bg-red-100 text-red-600 font-semibold rounded-lg transition-all"
                      >
                        Supprimer
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl p-8 max-w-md w-full mx-4">
            <h2 className="text-2xl font-bold text-gray-800 mb-6">
              {editingSize ? 'Modifier la taille' : 'Ajouter une taille'}
            </h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Nom *</label>
                <input
                  type="text"
                  value={formData.nom}
                  onChange={(e) => setFormData({ ...formData, nom: e.target.value })}
                  required
                  className="w-full px-4 py-3 border-2 border-gray-300 rounded-2xl focus:border-primary-500 focus:outline-none"
                  placeholder="Ex: M"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Prix (€) *</label>
                <input
                  type="number"
                  step="0.01"
                  value={formData.prix}
                  onChange={(e) => setFormData({ ...formData, prix: parseFloat(e.target.value) })}
                  required
                  className="w-full px-4 py-3 border-2 border-gray-300 rounded-2xl focus:border-primary-500 focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Nombre max de viandes *
                </label>
                <input
                  type="number"
                  value={formData.max_viandes}
                  onChange={(e) => setFormData({ ...formData, max_viandes: parseInt(e.target.value) })}
                  required
                  min="1"
                  className="w-full px-4 py-3 border-2 border-gray-300 rounded-2xl focus:border-primary-500 focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Nombre max de sauces *
                </label>
                <input
                  type="number"
                  value={formData.max_sauces}
                  onChange={(e) => setFormData({ ...formData, max_sauces: parseInt(e.target.value) })}
                  required
                  min="1"
                  className="w-full px-4 py-3 border-2 border-gray-300 rounded-2xl focus:border-primary-500 focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Ordre *</label>
                <input
                  type="number"
                  value={formData.ordre}
                  onChange={(e) => setFormData({ ...formData, ordre: parseInt(e.target.value) })}
                  required
                  className="w-full px-4 py-3 border-2 border-gray-300 rounded-2xl focus:border-primary-500 focus:outline-none"
                />
              </div>
              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={closeModal}
                  className="flex-1 py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold rounded-2xl transition-all"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="flex-1 py-3 bg-primary-500 hover:bg-primary-600 text-white font-semibold rounded-2xl transition-all"
                >
                  {editingSize ? 'Modifier' : 'Ajouter'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

