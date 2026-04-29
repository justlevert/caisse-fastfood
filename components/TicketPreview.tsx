'use client';

interface TicketPreviewProps {
  config: {
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
  };
}

export default function TicketPreview({ config }: TicketPreviewProps) {
  const { logo, entete, affichage, pied_page, mise_en_forme, options_avancees } = config;

  const separatorLine = mise_en_forme.separateur.repeat(mise_en_forme.largeur_ticket);
  const textSize = mise_en_forme.police_taille === 'grande' ? 'text-base' : 'text-sm';

  return (
    <div className="bg-white rounded-2xl shadow-lg p-6 border-2 border-gray-200 sticky top-6">
      <h3 className="text-xl font-bold text-gray-800 mb-4">👁️ Aperçu du ticket</h3>
      
      <div className="bg-gray-50 rounded-xl p-6 border-2 border-dashed border-gray-300 font-mono">
        {/* Logo */}
        {logo.actif && (
          <div className="text-center mb-4">
            {logo.url ? (
              <img src={logo.url} alt={logo.texte_alternatif} className="max-w-[200px] mx-auto mb-2" />
            ) : (
              <div className={`${textSize} font-bold ${mise_en_forme.gras_titre ? 'font-extrabold' : ''}`}>
                {logo.texte_alternatif}
              </div>
            )}
          </div>
        )}

        {/* En-tête */}
        {entete.actif && (
          <div className="text-center mb-4">
            {entete.ligne1 && (
              <div className={`${textSize} ${mise_en_forme.gras_titre ? 'font-bold' : ''}`}>
                {entete.ligne1}
              </div>
            )}
            {entete.ligne2 && <div className={textSize}>{entete.ligne2}</div>}
            {entete.ligne3 && <div className={textSize}>{entete.ligne3}</div>}
          </div>
        )}

        <div className={`${textSize} text-gray-600 mb-2`}>{separatorLine}</div>

        {/* Informations de commande */}
        <div className={`${textSize} space-y-1 mb-3`}>
          {affichage.numero_commande && (
            <div className="flex justify-between">
              <span>N° Commande:</span>
              <span className="font-bold">#12345</span>
            </div>
          )}
          {affichage.date_heure && (
            <div className="flex justify-between">
              <span>Date:</span>
              <span>{new Date().toLocaleDateString('fr-FR')} {new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}</span>
            </div>
          )}
          {affichage.nom_caissier && (
            <div className="flex justify-between">
              <span>Caissier:</span>
              <span>Admin</span>
            </div>
          )}
          {affichage.mode_consommation && (
            <div className="flex justify-between">
              <span>Mode:</span>
              <span>Sur place</span>
            </div>
          )}
        </div>

        <div className={`${textSize} text-gray-600 mb-2`}>{separatorLine}</div>

        {/* Produits (exemple) */}
        <div className={`${textSize} space-y-1 mb-3`}>
          <div className="flex justify-between">
            <span>1x Tacos L</span>
            <span>8.50€</span>
          </div>
          <div className="flex justify-between">
            <span>1x Burger</span>
            <span>7.00€</span>
          </div>
          <div className="flex justify-between">
            <span>1x Boisson</span>
            <span>2.50€</span>
          </div>
        </div>

        <div className={`${textSize} text-gray-600 mb-2`}>{separatorLine}</div>

        {/* Total */}
        <div className={`${textSize} space-y-1 mb-3`}>
          <div className="flex justify-between">
            <span>Sous-total:</span>
            <span>18.00€</span>
          </div>
          <div className="flex justify-between">
            <span>TVA (10%):</span>
            <span>1.80€</span>
          </div>
          <div className="flex justify-between font-bold text-base">
            <span>TOTAL:</span>
            <span>19.80€</span>
          </div>
          <div className="flex justify-between mt-2">
            <span>Paiement:</span>
            <span>Espèces</span>
          </div>
          <div className="flex justify-between">
            <span>Rendu:</span>
            <span>0.20€</span>
          </div>
        </div>

        {/* QR Code */}
        {options_avancees.qr_code.actif && (
          <div className="text-center my-3">
            <div className="inline-block bg-white p-2 border-2 border-gray-400">
              <div className="w-24 h-24 bg-gray-300 flex items-center justify-center text-xs">
                QR CODE
              </div>
            </div>
          </div>
        )}

        {/* Code-barres */}
        {options_avancees.code_barres.actif && (
          <div className="text-center my-3">
            <div className="inline-block bg-white p-2 border-2 border-gray-400">
              <div className="h-12 w-48 bg-gray-300 flex items-center justify-center text-xs">
                {options_avancees.code_barres.format}
              </div>
            </div>
            <div className={`${textSize} mt-1`}>123456789012</div>
          </div>
        )}

        <div className={`${textSize} text-gray-600 mb-2`}>{separatorLine}</div>

        {/* Pied de page */}
        {pied_page.actif && (
          <div className={`text-center ${mise_en_forme.italique_pied ? 'italic' : ''} mt-4`}>
            {pied_page.ligne1 && <div className={textSize}>{pied_page.ligne1}</div>}
            {pied_page.ligne2 && <div className={textSize}>{pied_page.ligne2}</div>}
            {pied_page.ligne3 && <div className={textSize}>{pied_page.ligne3}</div>}
          </div>
        )}
      </div>

      <div className="mt-4 text-xs text-gray-500 text-center">
        Aperçu avec données d&apos;exemple
      </div>
    </div>
  );
}
