'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { Product, Category } from '@/types/database.types';
import ImageUploader from '@/components/ImageUploader';

export default function AdminProductsPage() {
  const router = useRouter();
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [deletingProduct, setDeletingProduct] = useState<Product | null>(null);
  const [formData, setFormData] = useState({
    nom: '',
    prix: 0,
    category_id: '',
    image_url: '',
    actif: true,
    is_customizable: false,
  });
  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCategory, setFilterCategory] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');

  useEffect(() => {
    checkAdminAccess();
    loadData();
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

  const showSuccess = (message: string) => {
    setSuccessMessage(message);
    setTimeout(() => setSuccessMessage(''), 3000);
  };

  const showError = (message: string) => {
    setErrorMessage(message);
    setTimeout(() => setErrorMessage(''), 3000);
  };

  const loadData = async () => {
    setIsLoading(true);
    const [productsRes, categoriesRes] = await Promise.all([
      supabase.from('products').select('*').order('nom'),
      supabase.from('categories').select('*').order('ordre'),
    ]);

    if (productsRes.data) setProducts(productsRes.data);
    if (categoriesRes.data) setCategories(categoriesRes.data);
    setIsLoading(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const productData = {
      nom: formData.nom,
      prix: formData.prix,
      category_id: formData.category_id,
      image_url: formData.image_url || null,
      actif: formData.actif,
      is_customizable: formData.is_customizable,
    };

    if (editingProduct) {
      const { error } = await supabase
        .from('products')
        .update(productData)
        .eq('id', editingProduct.id);

      if (!error) {
        showSuccess('✅ Produit modifié avec succès');
        loadData();
        closeModal();
      } else {
        showError('❌ Erreur lors de la modification');
      }
    } else {
      const { error } = await supabase.from('products').insert(productData);

      if (!error) {
        showSuccess('✅ Produit ajouté avec succès');
        loadData();
        closeModal();
      } else {
        showError('❌ Erreur lors de l\'ajout');
      }
    }
  };

  const confirmDelete = (product: Product) => {
    setDeletingProduct(product);
    setShowDeleteModal(true);
  };

  const handleDelete = async () => {
    if (!deletingProduct) return;

    const { error } = await supabase
      .from('products')
      .delete()
      .eq('id', deletingProduct.id);

    if (!error) {
      showSuccess('✅ Produit supprimé');
      loadData();
      setShowDeleteModal(false);
      setDeletingProduct(null);
    } else {
      showError('❌ Erreur lors de la suppression');
    }
  };

  const handleDuplicate = (product: Product) => {
    setEditingProduct(null);
    setFormData({
      nom: `${product.nom} (copie)`,
      prix: product.prix,
      category_id: product.category_id,
      image_url: product.image_url || '',
      actif: true,
      is_customizable: product.is_customizable || false,
    });
    setShowModal(true);
  };

  const toggleActif = async (productId: string, currentState: boolean) => {
    const { error } = await supabase
      .from('products')
      .update({ actif: !currentState })
      .eq('id', productId);

    if (!error) {
      showSuccess(!currentState ? '✅ Produit activé' : '⚠️ Produit désactivé');
      loadData();
    } else {
      showError('❌ Erreur lors de la modification');
    }
  };

  const openModal = (product?: Product) => {
    if (product) {
      setEditingProduct(product);
      setFormData({
        nom: product.nom,
        prix: product.prix,
        category_id: product.category_id,
        image_url: product.image_url || '',
        actif: product.actif,
        is_customizable: product.is_customizable || false,
      });
    } else {
      setEditingProduct(null);
      setFormData({
        nom: '',
        prix: 0,
        category_id: categories[0]?.id || '',
        image_url: '',
        actif: true,
        is_customizable: false,
      });
    }
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setEditingProduct(null);
  };

  const getCategoryName = (categoryId: string) => {
    return categories.find((c) => c.id === categoryId)?.nom || '—';
  };

  const filteredProducts = products.filter(product => {
    const matchesSearch = product.nom.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = filterCategory === 'all' || product.category_id === filterCategory;
    const matchesStatus = filterStatus === 'all' || 
      (filterStatus === 'actif' && product.actif) ||
      (filterStatus === 'inactif' && !product.actif);
    return matchesSearch && matchesCategory && matchesStatus;
  });

  const activeCount = products.filter(p => p.actif).length;
  const inactiveCount = products.filter(p => !p.actif).length;

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
            <h1 className="text-4xl font-bold text-gray-800">📦 Gestion des Produits</h1>
            <div className="flex gap-3">
              <button
                onClick={() => router.push('/admin/categories')}
                className="px-6 py-4 bg-gray-200 hover:bg-gray-300 text-gray-800 font-semibold rounded-2xl transition-all"
              >
                🏷️ Catégories
              </button>
              <button
                onClick={() => router.push('/commande')}
                className="px-6 py-4 bg-gray-200 hover:bg-gray-300 text-gray-800 font-semibold rounded-2xl transition-all"
              >
                ← Retour
              </button>
            </div>
          </div>
          <p className="text-gray-600">Gérez votre catalogue de produits</p>
        </div>

        {/* Navigation Tacos */}
        <div className="bg-blue-50 border-2 border-blue-200 rounded-2xl p-6 mb-6">
          <h2 className="text-sm font-bold text-gray-700 mb-3">🌮 Configuration des Tacos Personnalisables</h2>
          <div className="flex flex-wrap gap-2">
            <button onClick={() => router.push('/admin/tacos/sizes')} className="px-4 py-2 bg-white hover:bg-blue-100 text-blue-600 font-semibold rounded-lg border-2 border-blue-300 transition-all">Tailles</button>
            <button onClick={() => router.push('/admin/tacos/meats')} className="px-4 py-2 bg-white hover:bg-blue-100 text-blue-600 font-semibold rounded-lg border-2 border-blue-300 transition-all">Viandes</button>
            <button onClick={() => router.push('/admin/tacos/sauces')} className="px-4 py-2 bg-white hover:bg-blue-100 text-blue-600 font-semibold rounded-lg border-2 border-blue-300 transition-all">Sauces</button>
            <button onClick={() => router.push('/admin/tacos/extras')} className="px-4 py-2 bg-white hover:bg-blue-100 text-blue-600 font-semibold rounded-lg border-2 border-blue-300 transition-all">Suppléments</button>
            <button onClick={() => router.push('/admin/tacos/ingredients')} className="px-4 py-2 bg-white hover:bg-blue-100 text-blue-600 font-semibold rounded-lg border-2 border-blue-300 transition-all">Ingrédients</button>
            <button onClick={() => router.push('/admin/tacos/gratins')} className="px-4 py-2 bg-white hover:bg-blue-100 text-blue-600 font-semibold rounded-lg border-2 border-blue-300 transition-all">Gratinage</button>
          </div>
        </div>

        {/* Barre d'actions */}
        <div className="bg-white rounded-2xl shadow-lg p-6 mb-6 border-2 border-gray-200">
          <div className="flex flex-col md:flex-row gap-4 mb-4">
            <div className="flex-1">
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="🔍 Rechercher un produit..."
                className="w-full px-6 py-4 border-2 border-gray-300 rounded-2xl focus:border-orange-500 focus:outline-none text-lg"
              />
            </div>
            <select
              value={filterCategory}
              onChange={(e) => setFilterCategory(e.target.value)}
              className="px-6 py-4 border-2 border-gray-300 rounded-2xl focus:border-orange-500 focus:outline-none text-lg"
            >
              <option value="all">Toutes les catégories</option>
              {categories.map(cat => (
                <option key={cat.id} value={cat.id}>{cat.nom}</option>
              ))}
            </select>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="px-6 py-4 border-2 border-gray-300 rounded-2xl focus:border-orange-500 focus:outline-none text-lg"
            >
              <option value="all">Tous les statuts</option>
              <option value="actif">Actifs</option>
              <option value="inactif">Inactifs</option>
            </select>
            <button
              onClick={() => openModal()}
              className="px-8 py-4 bg-gradient-to-br from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white font-bold text-lg rounded-2xl shadow-lg transition-all whitespace-nowrap"
            >
              ➕ Nouveau produit
            </button>
          </div>
          <div className="flex gap-4 text-sm text-gray-600">
            <span>📊 {filteredProducts.length} produit{filteredProducts.length > 1 ? 's' : ''}</span>
            <span>•</span>
            <span>✅ {activeCount} actif{activeCount > 1 ? 's' : ''}</span>
            <span>•</span>
            <span>❌ {inactiveCount} inactif{inactiveCount > 1 ? 's' : ''}</span>
          </div>
        </div>

        {isLoading ? (
          <div className="text-center py-12">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-gray-300 border-t-orange-500"></div>
            <p className="text-gray-500 mt-4">Chargement...</p>
          </div>
        ) : filteredProducts.length === 0 ? (
          <div className="bg-white rounded-2xl shadow-lg p-12 text-center border-2 border-gray-200">
            <p className="text-gray-500 text-lg">Aucun produit trouvé</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredProducts.map((product) => (
              <div key={product.id} className="bg-white rounded-2xl shadow-lg border-2 border-gray-200 hover:border-orange-300 overflow-hidden transition-all hover:shadow-xl">
                {/* Image */}
                <div className="h-48 bg-gray-100 relative">
                  {product.image_url ? (
                    <img src={product.image_url} alt={product.nom} className="w-full h-full object-cover" onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }} />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-6xl">🍽️</div>
                  )}
                  <div className="absolute top-3 right-3 bg-white px-3 py-1 rounded-full text-sm font-bold text-gray-700 shadow-md">
                    {product.prix.toFixed(2)}€
                  </div>
                </div>

                {/* Contenu */}
                <div className="p-6">
                  <h3 className="text-xl font-bold text-gray-800 mb-2">{product.nom}</h3>
                  <p className="text-sm text-gray-600 mb-4">🏷️ {getCategoryName(product.category_id)}</p>
                  
                  {/* Toggle Actif */}
                  <div className="flex items-center justify-between mb-4 p-3 bg-gray-50 rounded-xl">
                    <span className="text-sm font-semibold text-gray-700">Statut</span>
                    <button
                      onClick={() => toggleActif(product.id, product.actif)}
                      className={`px-4 py-2 rounded-xl font-bold transition-all ${
                        product.actif 
                          ? 'bg-green-100 text-green-700 hover:bg-green-200' 
                          : 'bg-red-100 text-red-700 hover:bg-red-200'
                      }`}
                    >
                      {product.actif ? '✅ Actif' : '❌ Inactif'}
                    </button>
                  </div>
                  
                  {/* Actions */}
                  <div className="flex gap-2">
                    <button
                      onClick={() => openModal(product)}
                      className="flex-1 py-3 bg-blue-50 hover:bg-blue-100 text-blue-600 font-semibold rounded-xl transition-all"
                    >
                      ✏️ Modifier
                    </button>
                    <button
                      onClick={() => handleDuplicate(product)}
                      className="flex-1 py-3 bg-purple-50 hover:bg-purple-100 text-purple-600 font-semibold rounded-xl transition-all"
                    >
                      📋 Dupliquer
                    </button>
                    <button
                      onClick={() => confirmDelete(product)}
                      className="py-3 px-4 bg-red-50 hover:bg-red-100 text-red-600 font-semibold rounded-xl transition-all"
                    >
                      🗑️
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Modale */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl p-8 max-w-md w-full mx-4">
            <h2 className="text-2xl font-bold text-gray-800 mb-6">
              {editingProduct ? 'Modifier le produit' : 'Ajouter un produit'}
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
                  placeholder="Ex: Tacos M"
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
                <label className="block text-sm font-semibold text-gray-700 mb-2">Catégorie *</label>
                <select
                  value={formData.category_id}
                  onChange={(e) => setFormData({ ...formData, category_id: e.target.value })}
                  required
                  className="w-full px-4 py-3 border-2 border-gray-300 rounded-2xl focus:border-primary-500 focus:outline-none"
                >
                  {categories.map((cat) => (
                    <option key={cat.id} value={cat.id}>
                      {cat.nom}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Image du produit
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
                  className="w-5 h-5 text-orange-500 rounded focus:ring-orange-500"
                />
                <label htmlFor="actif" className="ml-3 text-sm font-semibold text-gray-700">
                  Produit actif
                </label>
              </div>
              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="is_customizable"
                  checked={formData.is_customizable}
                  onChange={(e) => setFormData({ ...formData, is_customizable: e.target.checked })}
                  className="w-5 h-5 text-orange-500 rounded focus:ring-orange-500"
                />
                <label htmlFor="is_customizable" className="ml-3 text-sm font-semibold text-gray-700">
                  Produit personnalisable (Tacos)
                </label>
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
                  {editingProduct ? '✅ Modifier' : '✅ Créer'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Suppression */}
      {showDeleteModal && deletingProduct && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-8 max-w-md w-full">
            <h2 className="text-2xl font-bold text-gray-800 mb-4">⚠️ Confirmer la suppression</h2>
            <p className="text-gray-700 mb-6">
              Voulez-vous vraiment supprimer le produit <strong>&quot;{deletingProduct.nom}&quot;</strong> ?
            </p>
            <p className="text-sm text-orange-600 mb-6">
              ⚠️ Cette action est irréversible.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => {
                  setShowDeleteModal(false);
                  setDeletingProduct(null);
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

