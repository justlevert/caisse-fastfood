/**
 * Hook pour gérer le mode plein écran
 */

import { useEffect } from 'react';

export function useFullscreen() {
  useEffect(() => {
    // Demander le mode plein écran au premier clic/touch
    const requestFullscreen = () => {
      const elem = document.documentElement;
      
      if (elem.requestFullscreen) {
        elem.requestFullscreen().catch(() => {
          // Ignorer l'erreur si déjà en plein écran
        });
      }
    };

    // Écouter le premier clic pour activer le plein écran
    const handleFirstInteraction = () => {
      requestFullscreen();
      // Retirer l'écouteur après la première interaction
      document.removeEventListener('click', handleFirstInteraction);
      document.removeEventListener('touchstart', handleFirstInteraction);
    };

    document.addEventListener('click', handleFirstInteraction);
    document.addEventListener('touchstart', handleFirstInteraction);

    return () => {
      document.removeEventListener('click', handleFirstInteraction);
      document.removeEventListener('touchstart', handleFirstInteraction);
    };
  }, []);
}
