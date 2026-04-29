/**
 * EXEMPLE D'UTILISATION DE L'IMPRESSION DE TICKETS
 * 
 * Ce fichier montre comment utiliser l'API d'impression avec les configurations personnalisées
 */

// Exemple de données de commande
const exempleCommande = {
  numero_commande: '#00042',
  date: new Date(),
  caissier: 'Admin',
  mode_consommation: 'sur_place' as const,
  buzzer: 12,
  table: 5,
  produits: [
    {
      nom: 'TACOS L',
      quantite: 2,
      prix: 17.00,
      categorie: 'Tacos',
      options: ['Viandes: Poulet, Merguez', 'Sauces: Blanche, Harissa'],
      supplements: [],
      ingredients_retires: ['Tomate']
    },
    {
      nom: 'BURGER CLASSIQUE',
      quantite: 1,
      prix: 7.00,
      categorie: 'Burgers',
      options: ['Cuisson: À point'],
      supplements: [],
      ingredients_retires: ['Oignon']
    },
    {
      nom: 'FRITES',
      quantite: 1,
      prix: 2.50,
      categorie: 'Accompagnements',
      options: [],
      supplements: [],
      ingredients_retires: []
    }
  ],
  sous_total: 26.50,
  tva: 2.65,
  total: 29.15,
  paiement: 'Espèces',
  rendu: 0.85
};

/**
 * Fonction pour imprimer un ticket de caisse
 */
export async function imprimerTicketCaisse(
  ipImprimante: string,
  portImprimante: number,
  commande: typeof exempleCommande
) {
  try {
    const response = await fetch('/api/printer/print-commande', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ip: ipImprimante,
        port: portImprimante,
        type: 'caisse',
        commande: commande
      }),
    });

    const data = await response.json();

    if (data.success) {
      console.log('✅ Ticket caisse imprimé avec succès');
      return { success: true, message: data.message };
    } else {
      console.error('❌ Erreur impression:', data.message);
      return { success: false, message: data.message };
    }
  } catch (error) {
    console.error('❌ Erreur réseau:', error);
    return { success: false, message: 'Erreur de connexion' };
  }
}

/**
 * Fonction pour imprimer un ticket de cuisine
 */
export async function imprimerTicketCuisine(
  ipImprimante: string,
  portImprimante: number,
  commande: typeof exempleCommande
) {
  try {
    const response = await fetch('/api/printer/print-commande', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ip: ipImprimante,
        port: portImprimante,
        type: 'cuisine',
        commande: commande
      }),
    });

    const data = await response.json();

    if (data.success) {
      console.log('✅ Ticket cuisine imprimé avec succès');
      return { success: true, message: data.message };
    } else {
      console.error('❌ Erreur impression:', data.message);
      return { success: false, message: data.message };
    }
  } catch (error) {
    console.error('❌ Erreur réseau:', error);
    return { success: false, message: 'Erreur de connexion' };
  }
}

/**
 * Fonction pour imprimer les deux tickets (caisse + cuisine) pour une commande
 */
export async function imprimerCommandeComplete(
  configImprimantes: {
    caisse: { ip: string; port: number };
    cuisine: { ip: string; port: number };
  },
  commande: typeof exempleCommande
) {
  const resultats = {
    caisse: { success: false, message: '' },
    cuisine: { success: false, message: '' }
  };

  // Imprimer ticket caisse
  if (configImprimantes.caisse.ip) {
    resultats.caisse = await imprimerTicketCaisse(
      configImprimantes.caisse.ip,
      configImprimantes.caisse.port,
      commande
    );
  }

  // Imprimer ticket cuisine
  if (configImprimantes.cuisine.ip) {
    resultats.cuisine = await imprimerTicketCuisine(
      configImprimantes.cuisine.ip,
      configImprimantes.cuisine.port,
      commande
    );
  }

  return resultats;
}

// Export de l'exemple de commande pour les tests
export { exempleCommande };
