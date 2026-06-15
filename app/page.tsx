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
  const [logoConfig, setLogoConfig] = useState<{ actif: boolean; url: string }>({ actif: false, url: '' });
  const router = useRouter();

  // Charger le logo personnalisé de l'application
  useEffect(() => {
    const loadLogo = async () => {
      try {
        const { data } = await supabase
          .from('settings')
          .select('value')
          .eq('key', 'app_logo_config')
          .single();
        if (data?.value) {
          setLogoConfig(JSON.parse(data.value));
        }
      } catch (e) {
        // Pas de logo configuré, on garde l'icône par défaut
      }
    };
    loadLogo();
  }, []);

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
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
      <div className="bg-white shadow-premium rounded-3xl p-8 sm:p-12 w-full max-w-md animate-fade-in border border-gray-100">
        {/* Logo et titre */}
        <div className="text-center mb-10">
          {logoConfig.actif && logoConfig.url && (
            <div className="inline-flex items-center justify-center w-24 h-24 rounded-3xl shadow-lg mb-6 overflow-hidden bg-white border border-gray-100">
              <img src={logoConfig.url} alt="Logo" className="w-full h-full object-contain" />
            </div>
          )}
          <h1 className="text-4xl sm:text-5xl font-extrabold bg-gradient-to-r from-orange-500 to-orange-600 bg-clip-text text-transparent mb-3 tracking-tight">
            LevertOS
          </h1>
          <p className="text-gray-500 font-semibold text-sm uppercase tracking-wider">Authentification sécurisée</p>
        </div>

        {/* Affichage PIN */}
        <div className="mb-8">
          <label className="block text-xs font-bold text-gray-600 mb-4 text-center uppercase tracking-widest">
            Code PIN
          </label>
          <div className="flex justify-center gap-4 mb-4">
            {[0, 1, 2, 3].map((index) => (
              <div
                key={index}
                className={`w-16 h-16 sm:w-20 sm:h-20 rounded-2xl border-2 flex items-center justify-center transition-all duration-300 ${
                  pin[index] 
                    ? 'border-orange-500 bg-orange-50 shadow-lg shadow-orange-500/20 scale-105' 
                    : 'border-gray-200 bg-gray-50 shadow-sm'
                }`}
              >
                {pin[index] && (
                  <div className="w-4 h-4 rounded-full bg-gradient-to-br from-orange-500 to-orange-600 animate-scale-in"></div>
                )}
              </div>
            ))}
          </div>
          {error && (
            <div className="bg-gradient-to-r from-red-50 to-red-100 border-2 border-red-300 rounded-xl p-3 mt-3 animate-shake shadow-lg">
              <p className="text-red-700 text-center text-sm font-bold flex items-center justify-center gap-2">
                <span className="text-lg">⚠️</span>
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
              className="h-20 sm:h-20 text-2xl sm:text-3xl font-bold rounded-2xl bg-white border-2 border-gray-200 hover:border-orange-400 hover:bg-orange-50 hover:shadow-md hover:scale-105 active:scale-95 transition-all duration-200 shadow-sm text-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {num}
            </button>
          ))}
          <button
            onClick={handleClear}
            disabled={loading}
            className="h-20 sm:h-20 text-base sm:text-lg font-bold rounded-2xl bg-gradient-to-br from-red-50 to-red-100 border-2 border-red-200 hover:border-red-400 hover:from-red-100 hover:to-red-200 hover:shadow-lg hover:scale-105 active:scale-95 transition-all duration-300 text-red-600 shadow-md disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <span className="text-xl sm:text-2xl">🗑️</span>
          </button>
          <button
            onClick={() => handleNumberClick('0')}
            disabled={loading}
            className="h-20 sm:h-20 text-2xl sm:text-3xl font-bold rounded-2xl bg-white border-2 border-gray-200 hover:border-orange-400 hover:bg-orange-50 hover:shadow-md hover:scale-105 active:scale-95 transition-all duration-200 shadow-sm text-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            0
          </button>
          <button
            onClick={handleDelete}
            disabled={loading}
            className="h-20 sm:h-20 text-xl sm:text-2xl font-bold rounded-2xl bg-gradient-to-br from-gray-100 to-gray-200 border-2 border-gray-300 hover:border-gray-400 hover:from-gray-200 hover:to-gray-300 hover:shadow-lg hover:scale-105 active:scale-95 transition-all duration-300 text-gray-700 shadow-md disabled:opacity-50 disabled:cursor-not-allowed"
          >
            ⌫
          </button>
        </div>

        {/* Bouton de connexion */}
        <button
          onClick={handleLogin}
          disabled={pin.length !== 4 || loading}
          className="w-full h-16 sm:h-20 text-lg sm:text-xl font-bold rounded-2xl bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 hover:shadow-lg hover:shadow-orange-500/40 active:scale-95 disabled:from-gray-300 disabled:to-gray-400 disabled:cursor-not-allowed text-white transition-all duration-200 shadow-md flex items-center justify-center gap-3"
        >
          {loading ? (
            <>
              <div className="inline-block animate-spin rounded-full h-6 w-6 border-3 border-white border-t-transparent relative z-10"></div>
              <span className="relative z-10">Connexion en cours...</span>
            </>
          ) : (
            <>
              <span className="text-2xl relative z-10">🔓</span>
              <span className="relative z-10">Se connecter</span>
            </>
          )}
        </button>

        {/* Footer */}
        <div className="mt-8 text-center">
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider flex items-center justify-center gap-2">
            <span className="text-sm">🔒</span>
            <span>Accès réservé au personnel autorisé</span>
          </p>
        </div>
      </div>
    </div>
  );
}

