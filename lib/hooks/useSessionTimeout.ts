/**
 * Hook pour gérer le timeout de session automatique
 */

import { useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { clearSecureStorage } from '@/lib/services/securityService';

const TIMEOUT_DURATION = 30 * 60 * 1000; // 30 minutes par défaut

export function useSessionTimeout(timeoutMinutes: number = 30) {
  const router = useRouter();
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  const resetTimeout = () => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    timeoutRef.current = setTimeout(() => {
      // Session expirée - déconnecter l'utilisateur
      clearSecureStorage();
      router.push('/');
    }, timeoutMinutes * 60 * 1000);
  };

  useEffect(() => {
    // Événements qui réinitialisent le timer
    const events = ['mousedown', 'keydown', 'scroll', 'touchstart', 'click'];

    const handleActivity = () => {
      resetTimeout();
    };

    // Initialiser le timeout
    resetTimeout();

    // Écouter les événements d'activité
    events.forEach(event => {
      document.addEventListener(event, handleActivity);
    });

    // Nettoyage
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
      events.forEach(event => {
        document.removeEventListener(event, handleActivity);
      });
    };
  }, [timeoutMinutes, router]);
}
