'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { TacoExtra } from '@/types/database.types';
import ImageUploader from '@/components/ImageUploader';

export default function AdminTacoExtrasPage() {
  const [extras, setExtras] = useState<TacoExtra[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingExtra, setEditingExtra] = useState<TacoExtra | null>(null);
  const [formData, setFormData] = useState({
    nom: '',
    prix: 0,
    image_url: '',
    actif: true,
  });

  useEffect(() => {
    loadExtras();
  }, []);

  const loadExtras = async () => {
    setIsLoading(true);
    const { data, error } = await supabase
      .from('taco_extras')
      .select('*')
      .order('nom');

    if (data && !error) {
      setExtras(data);
    }
    setIsLoading(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const extraData = {
      nom: formData.nom,
      prix: formData.prix,
      image_url: formData.image_url || null,
      actif: formData.actif,
    };

    if (editingExtra) {
      const { error } = await supabase
        .from('taco_extras')
        .update(extraData)
        .eq('id', editingExtra.id);

      if (!error) {
        alert('Extra modifié avec succès');
        loadExtras();
        closeModal();
      } else {
        alert('Erreur lors de la modification');
      }
    } else {
      const { error } = await supabase.from('taco_extras').insert(extraData);

      if (!error) {
        alert('Extra ajouté avec succès');
        loadExtras();
        closeModal();
      } else {
        alert("Erreur lors de l'ajout");
      }
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Êtes-vous sûr de vouloir supprimer cet extra ?')) return;

    const { error } = await supabase.from('taco_extras').delete().eq('id', id);

    if (!error) {
      alert('Extra supprimé');
      loadExtras();
    } else {
      alert('Erreur lors de la suppression');
    }
  };

  const openModal = (extra?: TacoExtra) => {
    if (extra) {
      setEditingExtra(extra);
      setFormData({
        nom: extra.nom,
        prix: extra.prix,
        image_url: extra.image_url || '',
        actif: extra.actif,
      });
    } else {
      setEditingExtra(null);
      setFormData({
        nom: '',
        prix: 0,
        image_url: '',
        actif: true,
      });
    }
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setEditingExtra(null);
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-6xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold text-gray-800">Suppléments</h1>
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
              + Ajouter un supplément
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
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">Nom</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">Prix</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">Image URL</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">Statut</th>
                  <th className="px-6 py-4 text-right text-sm font-semibold text-gray-700">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {extras.map((extra) => (
                  <tr key={extra.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 text-sm font-medium text-gray-900">{extra.nom}</td>
                    <td className="px-6 py-4 text-sm text-gray-900">+{extra.prix.toFixed(2)} €</td>
                    <td className="px-6 py-4 text-sm text-gray-500 truncate max-w-xs">
                      {extra.image_url || '—'}
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={`px-3 py-1 rounded-full text-xs font-semibold ${
                          extra.actif ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                        }`}
                      >
                        {extra.actif ? 'Actif' : 'Inactif'}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button
                        onClick={() => openModal(extra)}
                        className="px-4 py-2 bg-primary-50 hover:bg-primary-100 text-primary-500 font-semibold rounded-lg mr-2 transition-all"
                      >
                        Modifier
                      </button>
                      <button
                        onClick={() => handleDelete(extra.id)}
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
              {editingExtra ? 'Modifier le supplément' : 'Ajouter un supplément'}
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
                  placeholder="Ex: Fromage"
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
                  Image du supplément
                </label>
                <ImageUploader
                  currentImageUrl={formData.image_url}
                  onImageUploaded={(url) => setFormData({ ...formData, image_url: url })}
                  onImageUrlChange={(url) => setFormData({ ...formData, image_url: url })}
                />
              </div>
              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="actif"
                  checked={formData.actif}
                  onChange={(e) => setFormData({ ...formData, actif: e.target.checked })}
                  className="w-5 h-5 text-primary-500 rounded focus:ring-blue-500"
                />
                <label htmlFor="actif" className="ml-3 text-sm font-semibold text-gray-700">
                  Supplément actif
                </label>
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
                  {editingExtra ? 'Modifier' : 'Ajouter'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

