'use client';

import { useRouter } from 'next/navigation';

export default function TacosAdminPage() {
  const router = useRouter();

  const sections = [
    { id: 'sizes', label: 'Tailles', icon: '📏', description: 'Gérer les tailles de tacos (M, L, XL)', path: '/admin/tacos/sizes' },
    { id: 'meats', label: 'Viandes', icon: '🥩', description: 'Gérer les viandes disponibles', path: '/admin/tacos/meats' },
    { id: 'sauces', label: 'Sauces', icon: '🌶️', description: 'Gérer les sauces disponibles', path: '/admin/tacos/sauces' },
    { id: 'extras', label: 'Suppléments', icon: '➕', description: 'Gérer les suppléments (frites, boissons)', path: '/admin/tacos/extras' },
    { id: 'ingredients', label: 'Ingrédients', icon: '🥬', description: 'Gérer les ingrédients à retirer', path: '/admin/tacos/ingredients' },
    { id: 'gratins', label: 'Gratinage', icon: '🧀', description: 'Gérer les options de gratinage', path: '/admin/tacos/gratins' }
  ];

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      {/* Header */}
      <div className="max-w-7xl mx-auto mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-bold text-gray-800">🌮 Gestion des Tacos</h1>
            <p className="text-gray-600 mt-2">Configuration des éléments de personnalisation des tacos</p>
          </div>
          <button
            onClick={() => router.push('/commande')}
            className="px-6 py-3 bg-gray-200 hover:bg-gray-300 text-gray-800 font-semibold rounded-2xl transition-all"
          >
            ← Retour
          </button>
        </div>
      </div>

      {/* Grille des sections */}
      <div className="max-w-7xl mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {sections.map((section) => (
            <button
              key={section.id}
              onClick={() => router.push(section.path)}
              className="bg-white rounded-2xl shadow-lg p-8 border-2 border-gray-200 hover:border-orange-400 hover:shadow-xl transition-all duration-200 text-left group"
            >
              <div className="flex items-center gap-4 mb-4">
                <div className="text-5xl">{section.icon}</div>
                <h2 className="text-2xl font-bold text-gray-800 group-hover:text-orange-600 transition-colors">
                  {section.label}
                </h2>
              </div>
              <p className="text-gray-600">{section.description}</p>
              <div className="mt-4 flex items-center text-orange-600 font-semibold">
                <span>Gérer</span>
                <span className="ml-2 group-hover:translate-x-2 transition-transform">→</span>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Info box */}
      <div className="max-w-7xl mx-auto mt-8">
        <div className="bg-blue-50 border-2 border-blue-300 rounded-2xl p-6">
          <h3 className="text-lg font-bold text-blue-800 mb-2">ℹ️ Information</h3>
          <p className="text-blue-700">
            Ces paramètres définissent les options disponibles lors de la personnalisation d&apos;un tacos. 
            Modifiez-les avec précaution car ils impactent directement l&apos;expérience client et le calcul des prix.
          </p>
        </div>
      </div>
    </div>
  );
}
