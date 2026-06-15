'use client';

interface TicketCuisinePreviewProps {
  config: {
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
  };
}

export default function TicketCuisinePreview({ config }: TicketCuisinePreviewProps) {
  const { logo, entete, affichage, pied_page, mise_en_forme, options_production } = config;

  const separatorLine = mise_en_forme.separateur.repeat(mise_en_forme.largeur_ticket);
  
  const getTextSize = () => {
    switch (mise_en_forme.taille_police_cuisine) {
      case 'tres_grande': return 'text-xl';
      case 'grande': return 'text-lg';
      default: return 'text-base';
    }
  };
  
  const textSize = getTextSize();

  return (
    <div className="bg-white rounded-2xl shadow-lg p-6 border-2 border-gray-200 sticky top-6">
      <h3 className="text-xl font-bold text-gray-800 mb-4">👁️ Aperçu ticket cuisine</h3>
      
      <div className="bg-gray-50 rounded-xl p-6 border-2 border-dashed border-gray-300 font-mono">
        {/* Logo */}
        {logo.actif && (
          <div className="text-center mb-3">
            <div className={`${textSize} font-bold`}>
              {logo.texte_alternatif}
            </div>
          </div>
        )}

        {/* En-tête */}
        {entete.actif && (
          <div className="text-center mb-3">
            {entete.ligne1 && (
              <div className={`${textSize} font-bold`}>
                {entete.ligne1}
              </div>
            )}
            {entete.ligne2 && <div className={textSize}>{entete.ligne2}</div>}
          </div>
        )}

        <div className={`text-sm text-gray-600 mb-3`}>{separatorLine}</div>

        {/* Informations de commande */}
        <div className={`${textSize} space-y-1 mb-3`}>
          {affichage.numero_commande && (
            <div className="flex justify-between">
              <span className="font-bold">N° COMMANDE:</span>
              <span className="font-bold text-2xl">#00042</span>
            </div>
          )}
          {affichage.heure && (
            <div className="flex justify-between">
              <span className="font-bold">Heure:</span>
              <span className="font-bold text-xl">{new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}</span>
            </div>
          )}
          {affichage.buzzer && (
            <div className="flex justify-between">
              <span className="font-bold">Buzzer:</span>
              <span className="font-bold text-2xl text-orange-600">12</span>
            </div>
          )}
          {affichage.table_numero && (
            <div className="flex justify-between">
              <span>Table:</span>
              <span className="font-bold">5</span>
            </div>
          )}
          {affichage.mode_consommation && (
            <div className="flex justify-between">
              <span>Mode:</span>
              <span className="font-bold">SUR PLACE</span>
            </div>
          )}
        </div>

        {/* Remarque (exemple) */}
        <div className="mb-3">
          <div className={`${textSize} font-bold`}>*** REMARQUE ***</div>
          <div className={`${textSize} font-bold`}>Sans oignon, bien cuit</div>
        </div>

        <div className={`text-sm text-gray-600 mb-3`}>{separatorLine}</div>

        {/* Produits groupés par catégorie */}
        {options_production.grouper_par_categorie ? (
          <div className="space-y-4">
            {/* Catégorie Tacos */}
            <div>
              <div className={`${textSize} font-bold text-orange-600 mb-2`}>
                === TACOS ===
              </div>
              <div className={`${textSize} space-y-${mise_en_forme.espacement_produits ? '3' : '1'}`}>
                <div>
                  <div className="flex items-baseline gap-2">
                    {options_production.afficher_quantites_grandes && (
                      <span className="text-3xl font-black">2x</span>
                    )}
                    <span className={mise_en_forme.gras_produits ? 'font-bold text-lg' : ''}>
                      TACOS L
                    </span>
                  </div>
                  {affichage.options_supplements && (
                    <div className="ml-6 text-sm space-y-1">
                      <div>- Viandes: Poulet, Merguez</div>
                      <div>- Sauces: Blanche, Harissa</div>
                    </div>
                  )}
                  {affichage.ingredients_retires && (
                    <div className="ml-6 text-sm text-red-600 font-bold">
                      SANS: Tomate
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Catégorie Burgers */}
            <div>
              <div className={`${textSize} font-bold text-orange-600 mb-2`}>
                === BURGERS ===
              </div>
              <div className={`${textSize} space-y-${mise_en_forme.espacement_produits ? '3' : '1'}`}>
                <div>
                  <div className="flex items-baseline gap-2">
                    {options_production.afficher_quantites_grandes && (
                      <span className="text-3xl font-black">1x</span>
                    )}
                    <span className={mise_en_forme.gras_produits ? 'font-bold text-lg' : ''}>
                      BURGER CLASSIQUE
                    </span>
                  </div>
                  {affichage.options_supplements && (
                    <div className="ml-6 text-sm">
                      <div>- Cuisson: À point</div>
                    </div>
                  )}
                  {affichage.ingredients_retires && (
                    <div className="ml-6 text-sm text-red-600 font-bold">
                      SANS: Oignon
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Catégorie Accompagnements */}
            <div>
              <div className={`${textSize} font-bold text-orange-600 mb-2`}>
                === ACCOMPAGNEMENTS ===
              </div>
              <div className={`${textSize}`}>
                <div className="flex items-baseline gap-2">
                  {options_production.afficher_quantites_grandes && (
                    <span className="text-3xl font-black">1x</span>
                  )}
                  <span className={mise_en_forme.gras_produits ? 'font-bold text-lg' : ''}>
                    FRITES
                  </span>
                </div>
              </div>
            </div>
          </div>
        ) : (
          // Sans groupement par catégorie
          <div className={`${textSize} space-y-${mise_en_forme.espacement_produits ? '3' : '1'}`}>
            <div>
              <div className="flex items-baseline gap-2">
                {options_production.afficher_quantites_grandes && (
                  <span className="text-3xl font-black">2x</span>
                )}
                <span className={mise_en_forme.gras_produits ? 'font-bold text-lg' : ''}>
                  TACOS L
                </span>
              </div>
              {affichage.options_supplements && (
                <div className="ml-6 text-sm space-y-1">
                  <div>- Viandes: Poulet, Merguez</div>
                  <div>- Sauces: Blanche, Harissa</div>
                </div>
              )}
              {affichage.ingredients_retires && (
                <div className="ml-6 text-sm text-red-600 font-bold">
                  SANS: Tomate
                </div>
              )}
            </div>
            <div>
              <div className="flex items-baseline gap-2">
                {options_production.afficher_quantites_grandes && (
                  <span className="text-3xl font-black">1x</span>
                )}
                <span className={mise_en_forme.gras_produits ? 'font-bold text-lg' : ''}>
                  BURGER CLASSIQUE
                </span>
              </div>
              {affichage.options_supplements && (
                <div className="ml-6 text-sm">
                  <div>- Cuisson: À point</div>
                </div>
              )}
              {affichage.ingredients_retires && (
                <div className="ml-6 text-sm text-red-600 font-bold">
                  SANS: Oignon
                </div>
              )}
            </div>
            <div>
              <div className="flex items-baseline gap-2">
                {options_production.afficher_quantites_grandes && (
                  <span className="text-3xl font-black">1x</span>
                )}
                <span className={mise_en_forme.gras_produits ? 'font-bold text-lg' : ''}>
                  FRITES
                </span>
              </div>
            </div>
          </div>
        )}

        <div className={`text-sm text-gray-600 my-3`}>{separatorLine}</div>

        {/* Pied de page */}
        {pied_page.actif && (
          <div className="text-center mt-3">
            {pied_page.ligne1 && <div className={textSize}>{pied_page.ligne1}</div>}
            {pied_page.ligne2 && <div className={textSize}>{pied_page.ligne2}</div>}
          </div>
        )}
      </div>

      <div className="mt-4 text-xs text-gray-500 text-center">
        Aperçu avec données d&apos;exemple
      </div>
    </div>
  );
}
