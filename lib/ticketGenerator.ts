import { ThermalPrinter } from 'node-thermal-printer';

// Types pour les configurations
interface TicketConfig {
  logo: {
    actif: boolean;
    url: string;
    texte_alternatif: string;
    upload_actif: boolean;
  };
  entete: {
    actif: boolean;
    ligne1: string;
    ligne2: string;
    ligne3: string;
  };
  affichage: {
    numero_commande: boolean;
    date_heure: boolean;
    nom_caissier: boolean;
    mode_consommation: boolean;
  };
  pied_page: {
    actif: boolean;
    ligne1: string;
    ligne2: string;
    ligne3: string;
  };
  mise_en_forme: {
    largeur_ticket: number;
    police_taille: 'normale' | 'grande';
    separateur: string;
    gras_titre: boolean;
    italique_pied: boolean;
  };
  options_avancees: {
    qr_code: {
      actif: boolean;
      contenu: string;
    };
    code_barres: {
      actif: boolean;
      format: string;
    };
  };
  apercu: {
    actif: boolean;
  };
}

interface TicketCuisineConfig {
  logo: {
    actif: boolean;
    texte_alternatif: string;
  };
  entete: {
    actif: boolean;
    ligne1: string;
    ligne2: string;
  };
  affichage: {
    numero_commande: boolean;
    heure: boolean;
    buzzer: boolean;
    table_numero: boolean;
    mode_consommation: boolean;
    details_produits: boolean;
    options_supplements: boolean;
    ingredients_retires: boolean;
  };
  pied_page: {
    actif: boolean;
    ligne1: string;
    ligne2: string;
  };
  mise_en_forme: {
    largeur_ticket: number;
    police_taille: 'normale' | 'grande' | 'tres_grande';
    separateur: string;
    gras_produits: boolean;
    espacement_produits: boolean;
    taille_police_cuisine: 'normale' | 'grande' | 'tres_grande';
  };
  options_production: {
    grouper_par_categorie: boolean;
    afficher_quantites_grandes: boolean;
  };
  apercu: {
    actif: boolean;
  };
}

interface CommandeData {
  numero_commande: string;
  date: Date;
  caissier: string;
  mode_consommation: 'sur_place' | 'a_emporter';
  buzzer?: number;
  table?: number;
  remarque?: string;
  produits: Array<{
    nom: string;
    quantite: number;
    prix: number;
    categorie?: string;
    options?: string[];
    supplements?: string[];
    ingredients_retires?: string[];
  }>;
  sous_total: number;
  tva: number;
  total: number;
  paiement: string;
  rendu?: number;
}

/**
 * Génère un ticket de caisse avec la configuration personnalisée
 */
export function generateTicketCaisse(
  printer: ThermalPrinter,
  config: TicketConfig,
  commande: CommandeData
): void {
  const separatorLine = config.mise_en_forme.separateur.repeat(config.mise_en_forme.largeur_ticket);

  // Logo
  if (config.logo.actif) {
    printer.alignCenter();
    if (config.logo.url) {
      // TODO: Implémenter l'impression d'image depuis URL
      printer.println(config.logo.texte_alternatif);
    } else {
      if (config.mise_en_forme.gras_titre) {
        printer.bold(true);
      }
      printer.println(config.logo.texte_alternatif);
      if (config.mise_en_forme.gras_titre) {
        printer.bold(false);
      }
    }
    printer.newLine();
  }

  // En-tête
  if (config.entete.actif) {
    printer.alignCenter();
    if (config.mise_en_forme.gras_titre) {
      printer.bold(true);
    }
    if (config.entete.ligne1) printer.println(config.entete.ligne1);
    if (config.mise_en_forme.gras_titre) {
      printer.bold(false);
    }
    if (config.entete.ligne2) printer.println(config.entete.ligne2);
    if (config.entete.ligne3) printer.println(config.entete.ligne3);
    printer.newLine();
  }

  printer.println(separatorLine);

  // Informations de commande
  printer.alignLeft();
  if (config.mise_en_forme.police_taille === 'grande') {
    printer.setTextSize(1, 1);
  }

  if (config.affichage.numero_commande) {
    printer.println(`N° Commande: ${commande.numero_commande}`);
  }

  if (config.affichage.date_heure) {
    printer.println(`Date: ${commande.date.toLocaleDateString('fr-FR')}`);
    printer.println(`Heure: ${commande.date.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}`);
  }

  if (config.affichage.nom_caissier) {
    printer.println(`Caissier: ${commande.caissier}`);
  }

  if (config.affichage.mode_consommation) {
    printer.println(`Mode: ${commande.mode_consommation === 'sur_place' ? 'Sur place' : 'À emporter'}`);
  }

  printer.newLine();
  printer.println(separatorLine);

  // Produits
  printer.setTextNormal();
  commande.produits.forEach((produit) => {
    const ligne = `${produit.quantite}x ${produit.nom}`;
    const prix = `${produit.prix.toFixed(2)}€`;
    const espacesNecessaires = config.mise_en_forme.largeur_ticket - ligne.length - prix.length;
    printer.println(ligne + ' '.repeat(Math.max(espacesNecessaires, 1)) + prix);
  });

  printer.newLine();
  printer.println(separatorLine);

  // Totaux
  printer.println(`Sous-total: ${' '.repeat(config.mise_en_forme.largeur_ticket - 25)}${commande.sous_total.toFixed(2)}€`);
  printer.println(`TVA (${commande.mode_consommation === 'sur_place' ? '10' : '5.5'}%): ${' '.repeat(config.mise_en_forme.largeur_ticket - 25)}${commande.tva.toFixed(2)}€`);
  
  printer.bold(true);
  printer.setTextSize(1, 1);
  printer.println(`TOTAL: ${' '.repeat(config.mise_en_forme.largeur_ticket - 20)}${commande.total.toFixed(2)}€`);
  printer.bold(false);
  printer.setTextNormal();

  printer.newLine();
  printer.println(`Paiement: ${commande.paiement}`);
  if (commande.rendu !== undefined && commande.rendu > 0) {
    printer.println(`Rendu: ${commande.rendu.toFixed(2)}€`);
  }

  // QR Code
  if (config.options_avancees.qr_code.actif) {
    printer.newLine();
    printer.alignCenter();
    // TODO: Implémenter QR code
    printer.println('[QR CODE]');
  }

  // Code-barres
  if (config.options_avancees.code_barres.actif) {
    printer.newLine();
    printer.alignCenter();
    // TODO: Implémenter code-barres
    printer.println(`[${config.options_avancees.code_barres.format}]`);
  }

  printer.println(separatorLine);

  // Pied de page
  if (config.pied_page.actif) {
    printer.alignCenter();
    if (config.mise_en_forme.italique_pied) {
      printer.invert(true);
    }
    if (config.pied_page.ligne1) printer.println(config.pied_page.ligne1);
    if (config.pied_page.ligne2) printer.println(config.pied_page.ligne2);
    if (config.pied_page.ligne3) printer.println(config.pied_page.ligne3);
    if (config.mise_en_forme.italique_pied) {
      printer.invert(false);
    }
  }

  printer.newLine();
  printer.newLine();
  printer.newLine();
}

/**
 * Génère un ticket de cuisine avec la configuration personnalisée
 */
export function generateTicketCuisine(
  printer: ThermalPrinter,
  config: TicketCuisineConfig,
  commande: CommandeData
): void {
  const separatorLine = config.mise_en_forme.separateur.repeat(config.mise_en_forme.largeur_ticket);

  // Définir la taille de police selon la config
  const setPoliceSize = () => {
    switch (config.mise_en_forme.taille_police_cuisine) {
      case 'tres_grande':
        printer.setTextSize(2, 2);
        break;
      case 'grande':
        printer.setTextSize(1, 1);
        break;
      default:
        printer.setTextNormal();
    }
  };

  // Logo/Titre
  if (config.logo.actif) {
    printer.alignCenter();
    printer.bold(true);
    setPoliceSize();
    printer.println(config.logo.texte_alternatif);
    printer.bold(false);
    printer.setTextNormal();
    printer.newLine();
  }

  // En-tête
  if (config.entete.actif) {
    printer.alignCenter();
    printer.bold(true);
    setPoliceSize();
    if (config.entete.ligne1) printer.println(config.entete.ligne1);
    printer.bold(false);
    printer.setTextNormal();
    if (config.entete.ligne2) printer.println(config.entete.ligne2);
    printer.newLine();
  }

  printer.println(separatorLine);
  printer.newLine();

  // Informations de commande
  printer.alignLeft();
  setPoliceSize();

  if (config.affichage.numero_commande) {
    printer.bold(true);
    printer.setTextSize(2, 2);
    printer.println(`N° COMMANDE: ${commande.numero_commande}`);
    printer.bold(false);
    setPoliceSize();
  }

  if (config.affichage.heure) {
    printer.bold(true);
    printer.setTextSize(1, 1);
    printer.println(`Heure: ${commande.date.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}`);
    printer.bold(false);
    setPoliceSize();
  }

  if (config.affichage.buzzer && commande.buzzer) {
    printer.bold(true);
    printer.setTextSize(2, 2);
    printer.println(`Buzzer: ${commande.buzzer}`);
    printer.bold(false);
    setPoliceSize();
  }

  if (config.affichage.table_numero && commande.table) {
    printer.println(`Table: ${commande.table}`);
  }

  if (config.affichage.mode_consommation) {
    printer.bold(true);
    printer.println(`Mode: ${commande.mode_consommation === 'sur_place' ? 'SUR PLACE' : 'À EMPORTER'}`);
    printer.bold(false);
  }

  // Remarque cuisine
  if (commande.remarque && commande.remarque.trim()) {
    printer.newLine();
    printer.alignLeft();
    printer.bold(true);
    printer.setTextSize(1, 1);
    printer.println('*** REMARQUE ***');
    printer.bold(false);
    printer.setTextNormal();
    printer.bold(true);
    printer.println(commande.remarque.trim());
    printer.bold(false);
    setPoliceSize();
  }

  printer.newLine();
  printer.println(separatorLine);
  printer.newLine();

  // Produits
  if (config.options_production.grouper_par_categorie) {
    // Grouper par catégorie
    const produitsParCategorie: { [key: string]: typeof commande.produits } = {};
    commande.produits.forEach((produit) => {
      const categorie = produit.categorie || 'Autres';
      if (!produitsParCategorie[categorie]) {
        produitsParCategorie[categorie] = [];
      }
      produitsParCategorie[categorie].push(produit);
    });

    // Afficher par catégorie
    Object.entries(produitsParCategorie).forEach(([categorie, produits]) => {
      printer.bold(true);
      setPoliceSize();
      printer.println(`=== ${categorie.toUpperCase()} ===`);
      printer.bold(false);
      printer.newLine();

      produits.forEach((produit) => {
        afficherProduit(printer, config, produit);
        if (config.mise_en_forme.espacement_produits) {
          printer.newLine();
        }
      });

      printer.newLine();
    });
  } else {
    // Sans groupement
    commande.produits.forEach((produit) => {
      afficherProduit(printer, config, produit);
      if (config.mise_en_forme.espacement_produits) {
        printer.newLine();
      }
    });
  }

  printer.println(separatorLine);

  // Pied de page
  if (config.pied_page.actif) {
    printer.newLine();
    printer.alignCenter();
    setPoliceSize();
    if (config.pied_page.ligne1) printer.println(config.pied_page.ligne1);
    if (config.pied_page.ligne2) printer.println(config.pied_page.ligne2);
  }

  printer.newLine();
  printer.newLine();
  printer.newLine();
}

/**
 * Fonction helper pour afficher un produit
 */
function afficherProduit(
  printer: ThermalPrinter,
  config: TicketCuisineConfig,
  produit: CommandeData['produits'][0]
): void {
  // Quantité
  if (config.options_production.afficher_quantites_grandes) {
    printer.bold(true);
    printer.setTextSize(2, 2);
    printer.print(`${produit.quantite}x `);
    printer.bold(false);
  }

  // Nom du produit
  if (config.mise_en_forme.gras_produits) {
    printer.bold(true);
  }
  
  const taillePolice = config.mise_en_forme.taille_police_cuisine;
  if (taillePolice === 'grande') {
    printer.setTextSize(1, 1);
  } else if (taillePolice === 'tres_grande') {
    printer.setTextSize(2, 2);
  }
  
  printer.println(produit.nom);
  
  if (config.mise_en_forme.gras_produits) {
    printer.bold(false);
  }
  printer.setTextNormal();

  // Options et suppléments
  if (config.affichage.options_supplements && (produit.options || produit.supplements)) {
    printer.setTextNormal();
    if (produit.options && produit.options.length > 0) {
      produit.options.forEach((option) => {
        printer.println(`  - ${option}`);
      });
    }
    if (produit.supplements && produit.supplements.length > 0) {
      produit.supplements.forEach((supplement) => {
        printer.println(`  + ${supplement}`);
      });
    }
  }

  // Ingrédients retirés
  if (config.affichage.ingredients_retires && produit.ingredients_retires && produit.ingredients_retires.length > 0) {
    printer.bold(true);
    printer.invert(true);
    produit.ingredients_retires.forEach((ingredient) => {
      printer.println(`  SANS: ${ingredient}`);
    });
    printer.invert(false);
    printer.bold(false);
  }
}
