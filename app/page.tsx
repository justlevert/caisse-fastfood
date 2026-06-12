'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { 
  setSecureItem, 
  recordFailedAttempt, 
  resetLoginAttempts, 
  getRemainingLockoutTime,
  getFailedAttempts 
} from '@/lib/services/securityService';

export default function LoginPage() {
  const [pin, setPin] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [lockoutTime, setLockoutTime] = useState(0);
  const router = useRouter();

  const handleNumberClick = (num: string) => {
    if (pin.length < 4) {
      setPin(pin + num);
      setError(''); // Effacer l'erreur lors de la saisie
    }
  };

  const handleClear = () => {
    setPin('');
    setError('');
  };

  const handleDelete = () => {
    setPin(pin.slice(0, -1));
    setError('');
  };

  // Vérifier le verrouillage au chargement
  useEffect(() => {
    const remaining = getRemainingLockoutTime();
    if (remaining > 0) {
      setLockoutTime(remaining);
      setError(`Trop de tentatives. Réessayez dans ${remaining}s`);
      
      const interval = setInterval(() => {
        const newRemaining = getRemainingLockoutTime();
        setLockoutTime(newRemaining);
        if (newRemaining > 0) {
          setError(`Trop de tentatives. Réessayez dans ${newRemaining}s`);
        } else {
          setError('');
          clearInterval(interval);
        }
      }, 1000);
      
      return () => clearInterval(interval);
    }
  }, []);

  // Auto-submit quand 4 chiffres sont saisis
  useEffect(() => {
    if (pin.length === 4 && !loading && lockoutTime === 0) {
      handleLogin();
    }
  }, [pin, loading, lockoutTime]);

  const handleLogin = async () => {
    if (pin.length !== 4) {
      setError('Le code PIN doit contenir 4 chiffres');
      return;
    }

    // Vérifier le verrouillage
    const remaining = getRemainingLockoutTime();
    if (remaining > 0) {
      setError(`Compte verrouillé. Réessayez dans ${remaining}s`);
      setPin('');
      return;
    }

    setLoading(true);
    setError('');

    try {
      // Vérifier le PIN dans la base de données
      const { data: user, error: dbError } = await supabase
        .from('users')
        .select('*')
        .eq('pin', pin)
        .single();

      if (dbError || !user) {
        // Enregistrer tentative échouée
        const isLocked = recordFailedAttempt();
        const attempts = getFailedAttempts();
        
        if (isLocked) {
          const lockTime = getRemainingLockoutTime();
          setLockoutTime(lockTime);
          setError(`Trop de tentatives. Compte verrouillé pour ${lockTime}s`);
        } else {
          setError(`Code PIN incorrect (${attempts}/5 tentatives)`);
        }
        
        setPin('');
        setLoading(false);
        return;
      }

      // Connexion réussie - réinitialiser les tentatives
      resetLoginAttempts();
      
      // Sauvegarder le PIN de manière sécurisée (chiffré)
      setSecureItem('userPin', pin);
      setSecureItem('userId', user.id);
      setSecureItem('userRole', user.role || 'user');
      
      // Rediriger vers la page de commande
      router.push('/commande');
    } catch (err) {
      setError('Erreur de connexion');
      setPin('');
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 p-4">
      <div className="bg-white/95 backdrop-blur-sm rounded-3xl shadow-2xl p-8 sm:p-12 w-full max-w-md">
        {/* Logo et titre */}
        <div className="text-center mb-10">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-blue-600 to-blue-700 rounded-3xl shadow-xl mb-6">
            <span className="text-4xl">🍔</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-bold bg-gradient-to-r from-blue-600 to-blue-800 bg-clip-text text-transparent mb-2">
            Caisse Fast-Food
          </h1>
          <p className="text-gray-600 font-medium">Authentification sécurisée</p>
        </div>

        {/* Affichage PIN */}
        <div className="mb-8">
          <label className="block text-sm font-semibold text-gray-700 mb-3 text-center uppercase tracking-wide">
            Code PIN
          </label>
          <div className="flex justify-center gap-3 sm:gap-4 mb-4">
            {[0, 1, 2, 3].map((index) => (
              <div
                key={index}
                className={`w-14 h-14 sm:w-16 sm:h-16 rounded-2xl border-2 flex items-center justify-center transition-all duration-200 ${
                  pin[index] 
                    ? 'border-blue-500 bg-blue-50 shadow-lg shadow-blue-500/20' 
                    : 'border-gray-300 bg-gray-50'
                }`}
              >
                {pin[index] && (
                  <div className="w-4 h-4 rounded-full bg-gradient-to-br from-blue-600 to-blue-700 animate-scale-in"></div>
                )}
              </div>
            ))}
          </div>
          {error && (
            <div className="bg-red-50 border-2 border-red-200 rounded-xl p-3 mt-3">
              <p className="text-red-600 text-center text-sm font-semibold flex items-center justify-center gap-2">
                <span>⚠️</span>
                <span>{error}</span>
              </p>
            </div>
          )}
        </div>

        {/* Clavier numérique */}
        <div className="grid grid-cols-3 gap-3 sm:gap-4 mb-6">
          {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((num) => (
            <button
              key={num}
              onClick={() => handleNumberClick(num.toString())}
              disabled={loading}
              className="h-16 sm:h-20 text-2xl sm:text-3xl font-bold rounded-2xl bg-white border-2 border-gray-200 hover:border-blue-500 hover:bg-blue-50 hover:shadow-lg active:scale-95 transition-all duration-200 shadow-md disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {num}
            </button>
          ))}
          <button
            onClick={handleClear}
            disabled={loading}
            className="h-16 sm:h-20 text-base sm:text-lg font-bold rounded-2xl bg-gradient-to-br from-red-50 to-red-100 border-2 border-red-200 hover:border-red-400 hover:from-red-100 hover:to-red-200 hover:shadow-lg active:scale-95 transition-all duration-200 text-red-600 shadow-md disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <span className="text-xl sm:text-2xl">🗑️</span>
          </button>
          <button
            onClick={() => handleNumberClick('0')}
            disabled={loading}
            className="h-16 sm:h-20 text-2xl sm:text-3xl font-bold rounded-2xl bg-white border-2 border-gray-200 hover:border-blue-500 hover:bg-blue-50 hover:shadow-lg active:scale-95 transition-all duration-200 shadow-md disabled:opacity-50 disabled:cursor-not-allowed"
          >
            0
          </button>
          <button
            onClick={handleDelete}
            disabled={loading}
            className="h-16 sm:h-20 text-xl sm:text-2xl font-bold rounded-2xl bg-gradient-to-br from-gray-100 to-gray-200 border-2 border-gray-300 hover:border-gray-400 hover:from-gray-200 hover:to-gray-300 hover:shadow-lg active:scale-95 transition-all duration-200 text-gray-700 shadow-md disabled:opacity-50 disabled:cursor-not-allowed"
          >
            ⌫
          </button>
        </div>

        {/* Bouton de connexion */}
        <button
          onClick={handleLogin}
          disabled={pin.length !== 4 || loading}
          className="w-full h-14 sm:h-16 text-lg sm:text-xl font-bold rounded-2xl bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 active:scale-[0.98] disabled:from-gray-300 disabled:to-gray-400 disabled:cursor-not-allowed text-white transition-all duration-200 shadow-xl hover:shadow-2xl flex items-center justify-center gap-3"
        >
          {loading ? (
            <>
              <div className="inline-block animate-spin rounded-full h-5 w-5 border-3 border-white border-t-transparent"></div>
              <span>Connexion en cours...</span>
            </>
          ) : (
            <>
              <span className="text-2xl">🔓</span>
              <span>Se connecter</span>
            </>
          )}
        </button>

        {/* Footer */}
        <p className="text-xs text-gray-500 text-center mt-6">
          Accès réservé au personnel autorisé
        </p>
      </div>

      {/* Animation CSS */}
      <style jsx global>{`
        @keyframes scale-in {
          from {
            transform: scale(0);
            opacity: 0;
          }
          to {
            transform: scale(1);
            opacity: 1;
          }
        }
        .animate-scale-in {
          animation: scale-in 0.2s ease-out;
        }
      `}</style>
    </div>
  );
}

