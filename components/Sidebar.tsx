'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function Sidebar({ isOpen, onClose }: SidebarProps) {
  const router = useRouter();
  const [userName, setUserName] = useState('');
  const [userRole, setUserRole] = useState('');
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    loadUserInfo();
  }, []);

  useEffect(() => {
    if (isOpen) {
      loadUserInfo();
    }
  }, [isOpen]);

  const loadUserInfo = async () => {
    const { getSecureItem } = await import('@/lib/services/securityService');
    const userPin = getSecureItem('userPin');
    if (!userPin) return;

    const { data: user, error } = await supabase
      .from('users')
      .select('nom, role')
      .eq('pin', userPin)
      .single();

    if (user) {
      
      setUserName(user.nom);
      setUserRole(user.role);
      setIsAdmin(user.role === 'administrateur');
    }
  };

  const handleNavigation = (path: string) => {
    router.push(path);
    onClose();
  };

  const handleLock = () => {
    // Verrouiller sans déconnecter (garde le PIN en localStorage)
    router.push('/');
    onClose();
  };

  const handleLogout = () => {
    // Déconnexion complète
    localStorage.removeItem('userPin');
    router.push('/');
    onClose();
  };

  return (
    <>
      {/* Overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-40 transition-opacity duration-300"
          onClick={onClose}
        />
      )}

      {/* Sidebar */}
      <div
        className={`fixed top-0 left-0 h-full w-80 bg-white shadow-2xl z-50 transform transition-transform duration-300 ease-in-out ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="bg-gradient-to-br from-orange-500 to-orange-600 p-6 text-white">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-2xl font-bold">Menu</h2>
              <button
                onClick={onClose}
                className="text-white hover:text-gray-200 text-3xl w-10 h-10 flex items-center justify-center"
              >
                ✕
              </button>
            </div>
            
            {/* User Info */}
            <div className="border-t border-orange-400 pt-4">
              <p className="text-lg font-semibold">{userName}</p>
              <p className="text-sm opacity-90">
                {isAdmin ? '👑 Administrateur' : '👤 Utilisateur'}
              </p>
            </div>
          </div>

          {/* Navigation */}
          <div className="flex-1 overflow-y-auto p-4">
            <nav className="space-y-2">
              {/* Commande */}
              <button
                onClick={() => handleNavigation('/commande')}
                className="w-full flex items-center gap-4 px-6 py-4 text-left text-gray-800 hover:bg-orange-50 rounded-2xl transition-all font-semibold text-lg border-2 border-transparent hover:border-orange-400"
              >
                <span className="text-2xl">🏠</span>
                <span>Commande</span>
              </button>

              {/* Historique */}
              <button
                onClick={() => handleNavigation('/historique')}
                className="w-full flex items-center gap-4 px-6 py-4 text-left text-gray-800 hover:bg-orange-50 rounded-2xl transition-all font-semibold text-lg border-2 border-transparent hover:border-orange-400"
              >
                <span className="text-2xl">�</span>
                <span>Historique</span>
              </button>

              {/* Séparateur Admin */}
              {isAdmin && (
                <div className="border-t-2 border-gray-300 my-4 pt-4">
                  <p className="text-sm text-gray-500 font-semibold px-2 mb-2">ADMINISTRATION</p>
                </div>
              )}

              {/* Dashboard (Admin only) */}
              {isAdmin && (
                <button
                  onClick={() => handleNavigation('/dashboard')}
                  className="w-full flex items-center gap-4 px-6 py-4 text-left text-gray-800 hover:bg-orange-50 rounded-2xl transition-all font-semibold text-lg border-2 border-transparent hover:border-orange-400"
                >
                  <span className="text-2xl">�</span>
                  <span>Dashboard</span>
                </button>
              )}

              {/* Paramètres (Admin only) */}
              {isAdmin && (
                <button
                  onClick={() => handleNavigation('/parametres')}
                  className="w-full flex items-center gap-4 px-6 py-4 text-left text-gray-800 hover:bg-orange-50 rounded-2xl transition-all font-semibold text-lg border-2 border-transparent hover:border-orange-400"
                >
                  <span className="text-2xl">⚙️</span>
                  <span>Paramètres</span>
                </button>
              )}

              {/* Gestion Produits (Admin only) */}
              {isAdmin && (
                <button
                  onClick={() => handleNavigation('/admin/products')}
                  className="w-full flex items-center gap-4 px-6 py-4 text-left text-gray-800 hover:bg-orange-50 rounded-2xl transition-all font-semibold text-lg border-2 border-transparent hover:border-orange-400"
                >
                  <span className="text-2xl">🛠️</span>
                  <span>Gestion Produits</span>
                </button>
              )}

              {/* Gestion Catégories (Admin only) */}
              {isAdmin && (
                <button
                  onClick={() => handleNavigation('/admin/categories')}
                  className="w-full flex items-center gap-4 px-6 py-4 text-left text-gray-800 hover:bg-orange-50 rounded-2xl transition-all font-semibold text-lg border-2 border-transparent hover:border-orange-400"
                >
                  <span className="text-2xl">🏷️</span>
                  <span>Gestion Catégories</span>
                </button>
              )}

              {/* Gestion Tacos (Admin only) */}
              {isAdmin && (
                <button
                  onClick={() => handleNavigation('/admin/tacos')}
                  className="w-full flex items-center gap-4 px-6 py-4 text-left text-gray-800 hover:bg-orange-50 rounded-2xl transition-all font-semibold text-lg border-2 border-transparent hover:border-orange-400"
                >
                  <span className="text-2xl">🌮</span>
                  <span>Gestion Tacos</span>
                </button>
              )}

              {/* Clôture de caisse (Admin only) */}
              {isAdmin && (
                <button
                  onClick={() => handleNavigation('/admin/cloture')}
                  className="w-full flex items-center gap-4 px-6 py-4 text-left text-gray-800 hover:bg-orange-50 rounded-2xl transition-all font-semibold text-lg border-2 border-transparent hover:border-orange-400"
                >
                  <span className="text-2xl">🔒</span>
                  <span>Clôture de caisse</span>
                </button>
              )}
            </nav>
          </div>

          {/* Footer Actions */}
          <div className="border-t-2 border-gray-300 p-4 space-y-2">
            {/* Verrouiller */}
            <button
              onClick={handleLock}
              className="w-full flex items-center gap-4 px-6 py-4 text-left bg-yellow-100 hover:bg-yellow-200 text-yellow-800 rounded-2xl transition-all font-semibold text-lg border-2 border-yellow-400"
            >
              <span className="text-2xl">🔒</span>
              <span>Verrouiller</span>
            </button>

            {/* Déconnexion */}
            <button
              onClick={handleLogout}
              className="w-full flex items-center gap-4 px-6 py-4 text-left bg-red-100 hover:bg-red-200 text-red-800 rounded-2xl transition-all font-semibold text-lg border-2 border-red-400"
            >
              <span className="text-2xl">🚪</span>
              <span>Déconnexion</span>
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
