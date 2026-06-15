'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { Category } from '@/types/database.types';
import { useAppData } from '@/lib/contexts/DataContext';
import ImageUploader from '@/components/ImageUploader';
import { getUserPin } from '@/lib/utils/auth';

export default function AdminCategoriesPage() {
  const router = useRouter();
  const { refreshData } = useAppData();
  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [deletingCategory, setDeletingCategory] = useState<Category | null>(null);
  const [formData, setFormData] = useState({ nom: '', ordre: 0, image_url: '' });
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    checkAdminAccess();
    loadCategories();
  }, []);

  const checkAdminAccess = async () => {
    const userPin = getUserPin();
    if (!userPin) {
      router.push('/');
      return;
    }

    const { data: user} = await supabase
      .from('users')
      .select('role')
      .eq('pin', userPin)
      .single();

    if (!user || user.role !== 'administrateur') {
      router.push('/commande');
    }
  };

  const loadCategories = async () => {
    setIsLoading(true);
    const { data, error } = await supabase
      .from('categories')
      .select('*')
      .order('ordre', { ascending: true });

    if (data && !error) {
      setCategories(data);
    }
    setIsLoading(false);
  };

  const showSuccess = (message: string) => {
    setSuccessMessage(message);
    setTimeout(() => setSuccessMessage(''), 3000);
  };

  const showError = (message: string) => {
    setErrorMessage(message);
    setTimeout(() => setErrorMessage(''), 3000);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (editingCategory) {
      // Modifier
      const { error } = await supabase
        .from('categories')
        .update({
          nom: formData.nom,
          ordre: formData.ordre,
          image_url: formData.image_url || null,
        })
        .eq('id', editingCategory.id);

      if (!error) {
        showSuccess('✅ Catégorie modifiée avec succès');
        await loadCategories();
        await refreshData(); // Rafraîchir le cache global
        closeModal();
      } else {
        showError('❌ Erreur lors de la modification');
      }
    } else {
      // Ajouter
      const { error } = await supabase
        .from('categories')
        .insert({
          nom: formData.nom,
          ordre: formData.ordre,
          image_url: formData.image_url || null,
        });

      if (!error) {
        showSuccess('✅ Catégorie ajoutée avec succès');
        await loadCategories();
        await refreshData(); // Rafraîchir le cache global
        closeModal();
      } else {
        showError('❌ Erreur lors de l\'ajout');
      }
    }
  };

  const confirmDelete = (category: Category) => {
    setDeletingCategory(category);
    setShowDeleteModal(true);
  };

  const handleDelete = async () => {
    if (!deletingCategory) return;

    const { error } = await supabase
      .from('categories')
      .delete()
      .eq('id', deletingCategory.id);

    if (!error) {
      showSuccess('✅ Catégorie supprimée');
      await loadCategories();
      await refreshData(); // Rafraîchir le cache global
      setShowDeleteModal(false);
      setDeletingCategory(null);
    } else {
      showError('❌ Erreur lors de la suppression');
    }
  };

  const moveCategory = async (index: number, direction: 'up' | 'down') => {
    if ((direction === 'up' && index === 0) || (direction === 'down' && index === categories.length - 1)) {
      return;
    }

    const newCategories = [...categories];
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    
    // Échanger les positions
    [newCategories[index], newCategories[targetIndex]] = [newCategories[targetIndex], newCategories[index]];
    
    // Mettre à jour les ordres
    const updates = newCategories.map((cat, idx) => ({
      id: cat.id,
      ordre: idx + 1
    }));

    // Sauvegarder dans la DB
    for (const update of updates) {
      await supabase
        .from('categories')
        .update({ ordre: update.ordre })
        .eq('id', update.id);
    }

    await loadCategories();
    await refreshData(); // Rafraîchir le cache global
  };

  const handleDragStart = (index: number) => {
    setDraggedIndex(index);
  };

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
  };

  const handleDrop = async (e: React.DragEvent, dropIndex: number) => {
    e.preventDefault();
    
    if (draggedIndex === null || draggedIndex === dropIndex) {
      setDraggedIndex(null);
      return;
    }

    const newCategories = [...categories];
    const draggedItem = newCategories[draggedIndex];
    
    // Retirer l'élément de sa position d'origine
    newCategories.splice(draggedIndex, 1);
    // L'insérer à la nouvelle position
    newCategories.splice(dropIndex, 0, draggedItem);
    
    // Mettre à jour les ordres
    const updates = newCategories.map((cat, idx) => ({
      id: cat.id,
      ordre: idx + 1
    }));

    // Sauvegarder dans la DB
    for (const update of updates) {
      await supabase
        .from('categories')
        .update({ ordre: update.ordre })
        .eq('id', update.id);
    }

    setDraggedIndex(null);
    await loadCategories();
    await refreshData(); // Rafraîchir le cache global
  };

  const openModal = (category?: Category) => {
    if (category) {
      setEditingCategory(category);
      setFormData({
        nom: category.nom,
        ordre: category.ordre,
        image_url: category.image_url || '',
      });
    } else {
      setEditingCategory(null);
      setFormData({ nom: '', ordre: categories.length + 1, image_url: '' });
    }
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setEditingCategory(null);
    setFormData({ nom: '', ordre: 0, image_url: '' });
  };

  const filteredCategories = categories.filter(cat => 
    cat.nom.toLowerCase().includes(searchTerm.toLowerCase())
  );

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

      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <h1 className="text-4xl font-bold text-gray-800">🏷️ Gestion des Catégories</h1>
            <button
              onClick={() => router.push('/commande')}
              className="px-6 py-4 bg-gray-200 hover:bg-gray-300 text-gray-800 font-semibold rounded-2xl transition-all"
            >
              ← Retour
            </button>
          </div>
          <p className="text-gray-600">Organisez vos catégories de produits</p>
        </div>

        {/* Barre d'actions */}
        <div className="bg-white rounded-2xl shadow-lg p-6 mb-6 border-2 border-gray-200">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="🔍 Rechercher une catégorie..."
                className="w-full px-6 py-4 border-2 border-gray-300 rounded-2xl focus:border-orange-500 focus:outline-none text-lg"
              />
            </div>
            <button
              onClick={() => openModal()}
              className="px-8 py-4 bg-gradient-to-br from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white font-bold text-lg rounded-2xl shadow-lg transition-all"
            >
              ➕ Nouvelle catégorie
            </button>
          </div>
          <div className="mt-4 text-sm text-gray-600">
            📊 {filteredCategories.length} catégorie{filteredCategories.length > 1 ? 's' : ''}
          </div>
        </div>

        {isLoading ? (
          <div className="text-center py-12">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-gray-300 border-t-orange-500"></div>
            <p className="text-gray-500 mt-4">Chargement...</p>
          </div>
        ) : filteredCategories.length === 0 ? (
          <div className="bg-white rounded-2xl shadow-lg p-12 text-center border-2 border-gray-200">
            <p className="text-gray-500 text-lg">Aucune catégorie trouvée</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredCategories.map((category, index) => (
              <div
                key={category.id}
                draggable
                onDragStart={() => handleDragStart(index)}
                onDragOver={(e) => handleDragOver(e, index)}
                onDrop={(e) => handleDrop(e, index)}
                className={`bg-white rounded-2xl shadow-lg border-2 overflow-hidden transition-all cursor-move hover:shadow-xl ${
                  draggedIndex === index ? 'opacity-50 scale-95' : 'opacity-100'
                } border-gray-200 hover:border-orange-300`}
              >
                {/* Image */}
                <div className="h-48 bg-gray-100 relative">
                  {category.image_url ? (
                    <img
                      src={category.image_url}
                      alt={category.nom}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        (e.target as HTMLImageElement).style.display = 'none';
                      }}
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-6xl">
                      🏷️
                    </div>
                  )}
                  <div className="absolute top-3 right-3 bg-white px-3 py-1 rounded-full text-sm font-bold text-gray-700 shadow-md">
                    #{category.ordre}
                  </div>
                </div>

                {/* Contenu */}
                <div className="p-6">
                  <h3 className="text-xl font-bold text-gray-800 mb-2">{category.nom}</h3>
                  
                  {/* Actions */}
                  <div className="flex gap-2 mt-4">
                    <button
                      onClick={() => moveCategory(index, 'up')}
                      disabled={index === 0}
                      className="flex-1 py-3 bg-gray-100 hover:bg-gray-200 disabled:opacity-30 disabled:cursor-not-allowed text-gray-700 font-semibold rounded-xl transition-all"
                    >
                      ↑
                    </button>
                    <button
                      onClick={() => moveCategory(index, 'down')}
                      disabled={index === filteredCategories.length - 1}
                      className="flex-1 py-3 bg-gray-100 hover:bg-gray-200 disabled:opacity-30 disabled:cursor-not-allowed text-gray-700 font-semibold rounded-xl transition-all"
                    >
                      ↓
                    </button>
                  </div>
                  
                  <div className="flex gap-2 mt-2">
                    <button
                      onClick={() => openModal(category)}
                      className="flex-1 py-3 bg-blue-50 hover:bg-blue-100 text-blue-600 font-semibold rounded-xl transition-all"
                    >
                      ✏️ Modifier
                    </button>
                    <button
                      onClick={() => confirmDelete(category)}
                      className="flex-1 py-3 bg-red-50 hover:bg-red-100 text-red-600 font-semibold rounded-xl transition-all"
                    >
                      🗑️ Supprimer
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Modal Ajout/Modification */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-8 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <h2 className="text-3xl font-bold text-gray-800 mb-6">
              {editingCategory ? '✏️ Modifier la catégorie' : '➕ Nouvelle catégorie'}
            </h2>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Nom de la catégorie *
                </label>
                <input
                  type="text"
                  value={formData.nom}
                  onChange={(e) => setFormData({ ...formData, nom: e.target.value })}
                  required
                  className="w-full px-6 py-4 border-2 border-gray-300 rounded-2xl focus:border-orange-500 focus:outline-none text-lg"
                  placeholder="Ex: Tacos, Burgers, Boissons..."
                />
              </div>
              
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Position (ordre d&apos;affichage) *
                </label>
                <input
                  type="number"
                  value={formData.ordre}
                  onChange={(e) => setFormData({ ...formData, ordre: parseInt(e.target.value) || 0 })}
                  required
                  min="1"
                  className="w-full px-6 py-4 border-2 border-gray-300 rounded-2xl focus:border-orange-500 focus:outline-none text-lg"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Image de la catégorie
                </label>
                <ImageUploader
                  currentImageUrl={formData.image_url}
                  onImageUploaded={(url) => setFormData({ ...formData, image_url: url })}
                  onImageUrlChange={(url) => setFormData({ ...formData, image_url: url })}
                />
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={closeModal}
                  className="flex-1 py-4 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold text-lg rounded-2xl transition-all"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="flex-1 py-4 bg-gradient-to-br from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white font-bold text-lg rounded-2xl transition-all"
                >
                  {editingCategory ? '✅ Modifier' : '✅ Créer'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Suppression */}
      {showDeleteModal && deletingCategory && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-8 max-w-md w-full">
            <h2 className="text-2xl font-bold text-gray-800 mb-4">⚠️ Confirmer la suppression</h2>
            <p className="text-gray-700 mb-6">
              Voulez-vous vraiment supprimer la catégorie <strong>&quot;{deletingCategory.nom}&quot;</strong> ?
            </p>
            <p className="text-sm text-orange-600 mb-6">
              ⚠️ Les produits associés à cette catégorie ne seront pas supprimés mais n&apos;auront plus de catégorie.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => {
                  setShowDeleteModal(false);
                  setDeletingCategory(null);
                }}
                className="flex-1 py-4 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold rounded-2xl transition-all"
              >
                Annuler
              </button>
              <button
                onClick={handleDelete}
                className="flex-1 py-4 bg-red-500 hover:bg-red-600 text-white font-bold rounded-2xl transition-all"
              >
                🗑️ Supprimer
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

