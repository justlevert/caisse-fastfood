'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { getUserPin } from '@/lib/utils/auth';
import * as XLSX from 'xlsx';
import TicketPreview from '@/components/TicketPreview';
import TicketCuisinePreview from '@/components/TicketCuisinePreview';
import { getOpenAIApiKey, setOpenAIApiKey, removeOpenAIApiKey, testOpenAIApiKey } from '@/lib/services/aiOcrService';

interface Setting {
  id: string;
  key: string;
  value: string;
  description: string | null;
}

interface PrinterConfig {
  nom: string;
  ip: string;
  port: number;
  statut: 'active' | 'inactive';
  type_ticket: 'standard' | 'preparation';
}

interface PrintersConfig {
  caisse: PrinterConfig;
  cuisine: PrinterConfig;
  print_server_url?: string;
}

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

export default function ParametresPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [activeSection, setActiveSection] = useState<string>('tva');

  // États pour les paramètres
  const [tvaSurPlace, setTvaSurPlace] = useState('10.0');
  const [tvaEmporter, setTvaEmporter] = useState('5.5');
  const [timerVerrouillage, setTimerVerrouillage] = useState('300');
  const [devise, setDevise] = useState<'EUR' | 'CHF'>('EUR');

  // État pour le logo de l'application
  const [appLogoConfig, setAppLogoConfig] = useState<{ actif: boolean; url: string }>({
    actif: false,
    url: '',
  });
  
  // États pour les imprimantes
  const [printersConfig, setPrintersConfig] = useState<PrintersConfig>({
    caisse: { nom: 'Imprimante Caisse', ip: '', port: 9100, statut: 'inactive', type_ticket: 'standard' },
    cuisine: { nom: 'Imprimante Cuisine', ip: '', port: 9100, statut: 'inactive', type_ticket: 'preparation' },
    print_server_url: ''
  });
  const [testingPrinter, setTestingPrinter] = useState<string | null>(null);
  
  // États pour la détection des imprimantes
  const [availablePrinters, setAvailablePrinters] = useState<Array<{ip: string; port: number; name: string; status: 'online' | 'offline'}>>([]);
  const [scanningPrinters, setScanningPrinters] = useState(false);
  const [showPrinterSelector, setShowPrinterSelector] = useState(false);
  const [printerToAssign, setPrinterToAssign] = useState<'caisse' | 'cuisine' | null>(null);

  // États pour le changement de mot de passe
  const [ancienPassword, setAncienPassword] = useState('');
  const [nouveauPassword, setNouveauPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  // États pour l'export
  const [dateDebut, setDateDebut] = useState('');
  const [dateFin, setDateFin] = useState('');
  const [typeCommande, setTypeCommande] = useState('tous');
  const [nbCommandes, setNbCommandes] = useState(0);

  // États pour la configuration des tickets
  const [ticketConfig, setTicketConfig] = useState<TicketConfig>({
    logo: { actif: false, url: '', texte_alternatif: 'Mon Restaurant', upload_actif: false },
    entete: { actif: true, ligne1: 'FAST-FOOD TACOS & BURGERS', ligne2: '123 Rue de la Paix, 75000 Paris', ligne3: 'Tél: 01 23 45 67 89' },
    affichage: { numero_commande: true, date_heure: true, nom_caissier: true, mode_consommation: true },
    pied_page: { actif: true, ligne1: 'Merci de votre visite !', ligne2: 'À bientôt', ligne3: 'www.monrestaurant.fr' },
    mise_en_forme: { largeur_ticket: 48, police_taille: 'normale', separateur: '=', gras_titre: true, italique_pied: false },
    options_avancees: { qr_code: { actif: false, contenu: 'url_commande' }, code_barres: { actif: false, format: 'CODE128' } },
    apercu: { actif: true }
  });

  // États pour la configuration des tickets cuisine
  const [ticketCuisineConfig, setTicketCuisineConfig] = useState<TicketCuisineConfig>({
    logo: { actif: true, texte_alternatif: '🍔 CUISINE' },
    entete: { actif: true, ligne1: 'BON DE PREPARATION', ligne2: '' },
    affichage: { numero_commande: true, heure: true, buzzer: true, table_numero: false, mode_consommation: true, details_produits: true, options_supplements: true, ingredients_retires: true },
    pied_page: { actif: false, ligne1: '', ligne2: '' },
    mise_en_forme: { largeur_ticket: 48, police_taille: 'grande', separateur: '=', gras_produits: true, espacement_produits: true, taille_police_cuisine: 'grande' },
    options_production: { grouper_par_categorie: true, afficher_quantites_grandes: true },
    apercu: { actif: true }
  });

  // États pour la clé API IA
  const [openaiKey, setOpenaiKey] = useState('');
  const [openaiKeyMasked, setOpenaiKeyMasked] = useState('');
  const [openaiTesting, setOpenaiTesting] = useState(false);
  const [openaiConfigured, setOpenaiConfigured] = useState(false);

  // Messages
  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    checkAdminAccess();
    loadSettings();
    // Charger la clé API OpenAI
    const savedKey = getOpenAIApiKey();
    if (savedKey) {
      setOpenaiConfigured(true);
      setOpenaiKeyMasked('sk-...' + savedKey.slice(-8));
    }
  }, []);

  const checkAdminAccess = async () => {
    const userPin = getUserPin();
    if (!userPin) {
      router.push('/');
      return;
    }

    const { data: user } = await supabase
      .from('users')
      .select('role')
      .eq('pin', userPin)
      .single();

    if (!user || user.role !== 'administrateur') {
      router.push('/commande');
    }
  };

  const loadSettings = async () => {
    try {
      const { data, error } = await supabase
        .from('settings')
        .select('*');

      if (error) throw error;

      if (data) {
        data.forEach((setting: Setting) => {
          switch (setting.key) {
            case 'tva_sur_place':
              setTvaSurPlace(setting.value);
              break;
            case 'tva_a_emporter':
              setTvaEmporter(setting.value);
              break;
            case 'timer_verrouillage':
              setTimerVerrouillage(setting.value);
              break;
            case 'app_logo_config':
              try {
                const config = JSON.parse(setting.value);
                setAppLogoConfig(config);
              } catch (e) {
                console.error('Erreur parsing config logo app:', e);
              }
              break;
            case 'imprimantes_config':
              try {
                const config = JSON.parse(setting.value);
                setPrintersConfig(config);
              } catch (e) {
                console.error('Erreur parsing config imprimantes:', e);
              }
              break;
            case 'ticket_config':
              try {
                const config = JSON.parse(setting.value);
                setTicketConfig(config);
              } catch (e) {
                console.error('Erreur parsing config tickets:', e);
              }
              break;
            case 'ticket_cuisine_config':
              try {
                const config = JSON.parse(setting.value);
                setTicketCuisineConfig(config);
              } catch (e) {
                console.error('Erreur parsing config tickets cuisine:', e);
              }
              break;
            case 'devise':
              setDevise(setting.value as 'EUR' | 'CHF');
              break;
          }
        });
      }
    } catch (error) {
      console.error('Erreur chargement paramètres:', error);
    } finally {
      setLoading(false);
    }
  };

  const updateSetting = async (key: string, value: string) => {
    const { error } = await supabase
      .from('settings')
      .update({ value, updated_at: new Date().toISOString() })
      .eq('key', key);

    if (error) throw error;
  };

  const handleSaveTVA = async () => {
    setSaving(true);
    setErrorMessage('');
    setSuccessMessage('');

    try {
      await updateSetting('tva_sur_place', tvaSurPlace);
      await updateSetting('tva_a_emporter', tvaEmporter);
      await updateSetting('devise', devise);
      setSuccessMessage('Configuration TVA et devise enregistrée avec succès !');
    } catch (error) {
      setErrorMessage('Erreur lors de l\'enregistrement de la TVA');
      console.error(error);
    } finally {
      setSaving(false);
    }
  };

  const handleSaveTimer = async () => {
    setSaving(true);
    setErrorMessage('');
    setSuccessMessage('');

    try {
      await updateSetting('timer_verrouillage', timerVerrouillage);
      setSuccessMessage('Timer de verrouillage enregistré avec succès !');
    } catch (error) {
      setErrorMessage('Erreur lors de l\'enregistrement du timer');
      console.error(error);
    } finally {
      setSaving(false);
    }
  };

  const handleSaveLogo = async () => {
    setSaving(true);
    setErrorMessage('');
    setSuccessMessage('');

    try {
      const configJson = JSON.stringify(appLogoConfig);
      const { error } = await supabase
        .from('settings')
        .upsert(
          { key: 'app_logo_config', value: configJson, description: 'Logo de l\'application (page de connexion)', updated_at: new Date().toISOString() },
          { onConflict: 'key' }
        );
      if (error) throw error;
      setSuccessMessage('Configuration du logo enregistrée avec succès !');
    } catch (error) {
      setErrorMessage('Erreur lors de l\'enregistrement du logo');
      console.error(error);
    } finally {
      setSaving(false);
    }
  };

  const handleLogoFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setErrorMessage('Veuillez sélectionner un fichier image');
      return;
    }

    if (file.size > 1024 * 1024) {
      setErrorMessage('L\'image ne doit pas dépasser 1 Mo');
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      setAppLogoConfig(prev => ({ ...prev, url: reader.result as string }));
    };
    reader.readAsDataURL(file);
  };

  const handleSaveImprimantes = async () => {
    setSaving(true);
    setErrorMessage('');
    setSuccessMessage('');

    try {
      const configJson = JSON.stringify(printersConfig);
      await updateSetting('imprimantes_config', configJson);
      setSuccessMessage('Configuration imprimantes enregistrée avec succès !');
    } catch (error) {
      setErrorMessage('Erreur lors de l\'enregistrement des imprimantes');
      console.error(error);
    } finally {
      setSaving(false);
    }
  };

  const handleSaveTickets = async () => {
    setSaving(true);
    setErrorMessage('');
    setSuccessMessage('');

    try {
      const configJson = JSON.stringify(ticketConfig);
      await updateSetting('ticket_config', configJson);
      setSuccessMessage('Configuration des tickets enregistrée avec succès !');
    } catch (error) {
      setErrorMessage('Erreur lors de l\'enregistrement de la configuration des tickets');
      console.error(error);
    } finally {
      setSaving(false);
    }
  };

  const handleSaveTicketsCuisine = async () => {
    setSaving(true);
    setErrorMessage('');
    setSuccessMessage('');

    try {
      const configJson = JSON.stringify(ticketCuisineConfig);
      await updateSetting('ticket_cuisine_config', configJson);
      setSuccessMessage('Configuration des tickets cuisine enregistrée avec succès !');
    } catch (error) {
      setErrorMessage('Erreur lors de l\'enregistrement de la configuration des tickets cuisine');
      console.error(error);
    } finally {
      setSaving(false);
    }
  };

  const updatePrinterConfig = (type: 'caisse' | 'cuisine', field: keyof PrinterConfig, value: any) => {
    setPrintersConfig(prev => ({
      ...prev,
      [type]: {
        ...prev[type],
        [field]: value
      }
    }));
  };

  const testImprimante = async (type: 'caisse' | 'cuisine') => {
    const printer = printersConfig[type];
    
    if (!printer.ip) {
      setErrorMessage('Veuillez entrer une adresse IP');
      return;
    }

    setTestingPrinter(type);
    setErrorMessage('');
    
    const useRemoteServer = printersConfig.print_server_url && printersConfig.print_server_url.trim() !== '';
    
    if (useRemoteServer) {
      setSuccessMessage(`📱 Test de connexion via serveur distant (${printersConfig.print_server_url})...`);
    } else {
      setSuccessMessage(`Test de connexion à l&apos;imprimante ${type} (${printer.ip}:${printer.port})...`);
    }
    
    try {
      const { testPrinterConnection } = await import('@/lib/services/unifiedPrintService');
      const result = await testPrinterConnection(type);

      if (result.success) {
        setSuccessMessage(`✅ ${result.message}`);
      } else {
        setErrorMessage(`❌ ${result.message}`);
      }
    } catch (error: any) {
      setErrorMessage(`❌ Erreur: ${error.message || 'Erreur inconnue'}`);
      console.error('Erreur test imprimante:', error);
    } finally {
      setTestingPrinter(null);
    }
  };

  // Fonction pour scanner les imprimantes disponibles
  const scanAvailablePrinters = async () => {
    setScanningPrinters(true);
    setErrorMessage('');
    setSuccessMessage('🔍 Recherche des imprimantes sur le réseau...');
    
    try {
      const serverUrl = printersConfig.print_server_url;
      
      if (!serverUrl || serverUrl.trim() === '') {
        setErrorMessage('❌ Veuillez configurer l\'URL du serveur d\'impression d\'abord');
        setScanningPrinters(false);
        return;
      }

      // Appeler le serveur d'impression pour scanner le réseau
      const response = await fetch(`${serverUrl}/scan-printers`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          subnet: '192.168.1', // Peut être configuré
          startIp: 1,
          endIp: 254,
          port: 9100
        })
      });

      if (!response.ok) {
        throw new Error('Erreur lors du scan du réseau');
      }

      const data = await response.json();
      
      if (data.success && data.printers) {
        setAvailablePrinters(data.printers);
        setSuccessMessage(`✅ ${data.printers.length} imprimante(s) trouvée(s) !`);
      } else {
        setAvailablePrinters([]);
        setSuccessMessage('ℹ️ Aucune imprimante trouvée sur le réseau');
      }
    } catch (error: any) {
      setErrorMessage(`❌ Erreur lors du scan: ${error.message}`);
      console.error('Erreur scan imprimantes:', error);
    } finally {
      setScanningPrinters(false);
    }
  };

  // Fonction pour assigner une imprimante détectée
  const assignPrinter = (printerIp: string, printerPort: number, targetType: 'caisse' | 'cuisine') => {
    updatePrinterConfig(targetType, 'ip', printerIp);
    updatePrinterConfig(targetType, 'port', printerPort);
    updatePrinterConfig(targetType, 'statut', 'active');
    setShowPrinterSelector(false);
    setPrinterToAssign(null);
    setSuccessMessage(`✅ Imprimante ${printerIp} assignée à ${targetType === 'caisse' ? 'Caisse' : 'Cuisine'}`);
  };

  const printTest = async (type: 'caisse' | 'cuisine') => {
    const printer = printersConfig[type];
    
    if (!printer.ip) {
      setErrorMessage('Veuillez configurer l\'adresse IP avant d\'imprimer');
      return;
    }

    if (printer.statut === 'inactive') {
      setErrorMessage('L\'imprimante doit être active pour imprimer un test');
      return;
    }

    setErrorMessage('');
    
    const useRemoteServer = printersConfig.print_server_url && printersConfig.print_server_url.trim() !== '';
    
    if (useRemoteServer) {
      setSuccessMessage(`📱 Impression via serveur distant (${printersConfig.print_server_url})...`);
    } else {
      setSuccessMessage(`🖨️ Impression d&apos;un ticket de test sur l&apos;imprimante ${type}...`);
    }
    
    try {
      const { printTestTicket } = await import('@/lib/services/unifiedPrintService');
      const result = await printTestTicket(type);

      if (result.success) {
        setSuccessMessage(`✅ ${result.message}`);
      } else {
        setErrorMessage(`❌ ${result.message}`);
      }
    } catch (error: any) {
      setErrorMessage(`❌ Erreur: ${error.message || 'Erreur inconnue'}`);
      console.error('Erreur impression:', error);
    }
  };

  const handleChangePassword = async () => {
    setErrorMessage('');
    setSuccessMessage('');

    if (!ancienPassword || !nouveauPassword || !confirmPassword) {
      setErrorMessage('Tous les champs sont requis');
      return;
    }

    if (nouveauPassword !== confirmPassword) {
      setErrorMessage('Les mots de passe ne correspondent pas');
      return;
    }

    if (nouveauPassword.length < 6) {
      setErrorMessage('Le mot de passe doit contenir au moins 6 caractères');
      return;
    }

    setSaving(true);

    try {
      // Vérifier l'ancien mot de passe
      const { data: currentHash } = await supabase
        .from('settings')
        .select('value')
        .eq('key', 'admin_password_hash')
        .single();

      // Pour simplifier, on utilise un hash simple (à améliorer avec bcrypt en production)
      const oldHash = btoa(ancienPassword);
      
      if (currentHash && currentHash.value && currentHash.value !== oldHash) {
        setErrorMessage('Ancien mot de passe incorrect');
        setSaving(false);
        return;
      }

      // Enregistrer le nouveau mot de passe
      const newHash = btoa(nouveauPassword);
      await updateSetting('admin_password_hash', newHash);

      setSuccessMessage('Mot de passe modifié avec succès !');
      setAncienPassword('');
      setNouveauPassword('');
      setConfirmPassword('');
    } catch (error) {
      setErrorMessage('Erreur lors du changement de mot de passe');
      console.error(error);
    } finally {
      setSaving(false);
    }
  };

  const loadCommandesForExport = async () => {
    let query = supabase
      .from('orders')
      .select('*', { count: 'exact' });

    if (dateDebut) {
      query = query.gte('created_at', new Date(dateDebut).toISOString());
    }
    if (dateFin) {
      const endDate = new Date(dateFin);
      endDate.setHours(23, 59, 59);
      query = query.lte('created_at', endDate.toISOString());
    }
    if (typeCommande !== 'tous') {
      query = query.eq('mode', typeCommande);
    }

    const { count } = await query;
    setNbCommandes(count || 0);
  };

  useEffect(() => {
    if (dateDebut || dateFin || typeCommande !== 'tous') {
      loadCommandesForExport();
    }
  }, [dateDebut, dateFin, typeCommande]);

  const handleExportCSV = async () => {
    try {
      let query = supabase
        .from('orders')
        .select('*, order_items(*, product_id(*))');

      if (dateDebut) {
        query = query.gte('created_at', new Date(dateDebut).toISOString());
      }
      if (dateFin) {
        const endDate = new Date(dateFin);
        endDate.setHours(23, 59, 59);
        query = query.lte('created_at', endDate.toISOString());
      }
      if (typeCommande !== 'tous') {
        query = query.eq('mode', typeCommande);
      }

      const { data: orders } = await query;

      if (!orders || orders.length === 0) {
        setErrorMessage('Aucune commande à exporter');
        return;
      }

      // Créer le CSV
      let csv = 'Date,Heure,Mode,Paiement,Buzzer,Total,Statut\n';
      orders.forEach((order: any) => {
        const date = new Date(order.created_at);
        csv += `${date.toLocaleDateString()},${date.toLocaleTimeString()},${order.mode},${order.paiement},${order.buzzer || ''},${order.total},${order.statut}\n`;
      });

      // Télécharger
      const blob = new Blob([csv], { type: 'text/csv' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `commandes_${new Date().toISOString().split('T')[0]}.csv`;
      a.click();

      setSuccessMessage('Export CSV réussi !');
    } catch (error) {
      setErrorMessage('Erreur lors de l\'export CSV');
      console.error(error);
    }
  };

  const handleExportExcel = async () => {
    try {
      let query = supabase
        .from('orders')
        .select('*, order_items(*, product_id(*))');

      if (dateDebut) {
        query = query.gte('created_at', new Date(dateDebut).toISOString());
      }
      if (dateFin) {
        const endDate = new Date(dateFin);
        endDate.setHours(23, 59, 59);
        query = query.lte('created_at', endDate.toISOString());
      }
      if (typeCommande !== 'tous') {
        query = query.eq('mode', typeCommande);
      }

      const { data: orders } = await query;

      if (!orders || orders.length === 0) {
        setErrorMessage('Aucune commande à exporter');
        return;
      }

      // Préparer les données pour Excel
      const excelData = orders.map((order: any) => {
        const date = new Date(order.created_at);
        return {
          Date: date.toLocaleDateString(),
          Heure: date.toLocaleTimeString(),
          Mode: order.mode,
          Paiement: order.paiement,
          Buzzer: order.buzzer || '',
          Total: order.total,
          Statut: order.statut
        };
      });

      // Créer le fichier Excel
      const ws = XLSX.utils.json_to_sheet(excelData);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, 'Commandes');

      // Télécharger
      XLSX.writeFile(wb, `commandes_${new Date().toISOString().split('T')[0]}.xlsx`);

      setSuccessMessage('Export Excel réussi !');
    } catch (error) {
      setErrorMessage('Erreur lors de l\'export Excel');
      console.error(error);
    }
  };


  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-2xl text-gray-600">Chargement...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      {/* Header */}
      <div className="max-w-7xl mx-auto mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-bold text-gray-800">⚙️ Paramètres</h1>
            <p className="text-gray-600 mt-2">Configuration de l&apos;application</p>
          </div>
          <button
            onClick={() => router.push('/commande')}
            className="px-6 py-3 bg-gray-200 hover:bg-gray-300 text-gray-800 font-semibold rounded-2xl transition-all"
          >
            ← Retour
          </button>
        </div>
      </div>

      {/* Messages */}
      {successMessage && (
        <div className="max-w-7xl mx-auto mb-6">
          <div className="bg-green-100 border-2 border-green-500 text-green-800 px-6 py-4 rounded-2xl">
            ✅ {successMessage}
          </div>
        </div>
      )}

      {errorMessage && (
        <div className="max-w-7xl mx-auto mb-6">
          <div className="bg-red-100 border-2 border-red-500 text-red-800 px-6 py-4 rounded-2xl">
            ❌ {errorMessage}
          </div>
        </div>
      )}

      {/* Navigation par onglets */}
      <div className="max-w-7xl mx-auto mb-6">
        <div className="flex gap-2 overflow-x-auto pb-2">
          {[
            { id: 'tva', label: '💰 TVA', icon: '💰' },
            { id: 'logo', label: '🖼️ Logo App', icon: '🖼️' },
            { id: 'password', label: '🔐 Mot de passe', icon: '🔐' },
            { id: 'timer', label: '⏱️ Verrouillage', icon: '⏱️' },
            { id: 'export', label: '📊 Export', icon: '📊' },
            { id: 'imprimantes', label: '🖨️ Imprimantes', icon: '🖨️' },
            { id: 'tickets', label: '🎫 Tickets Caisse', icon: '🎫' },
            { id: 'tickets_cuisine', label: '🍳 Tickets Cuisine', icon: '🍳' },
            { id: 'ia_factures', label: '🧠 IA Factures', icon: '🧠' }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveSection(tab.id)}
              className={`flex-shrink-0 px-6 py-4 rounded-2xl font-bold whitespace-nowrap transition-all duration-200 ${
                activeSection === tab.id
                  ? 'bg-gradient-to-br from-orange-500 to-orange-600 text-white shadow-lg scale-105'
                  : 'bg-white text-gray-700 border-2 border-gray-300 hover:border-orange-400 hover:shadow-md'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Contenu des sections */}
      <div className="max-w-7xl mx-auto">
        {/* Section TVA */}
        {activeSection === 'tva' && (
          <div className="bg-white rounded-2xl shadow-lg p-8 border-2 border-gray-200">
            <h2 className="text-2xl font-bold text-gray-800 mb-6">💰 Configuration TVA</h2>
            
            <div className="space-y-6">
              <div>
                <label className="block text-lg font-semibold text-gray-700 mb-2">
                  TVA Sur Place (%)
                </label>
                <input
                  type="number"
                  step="0.1"
                  value={tvaSurPlace}
                  onChange={(e) => setTvaSurPlace(e.target.value)}
                  className="w-full px-6 py-4 text-xl border-2 border-gray-300 rounded-2xl focus:border-orange-500 focus:outline-none"
                  placeholder="10.0"
                />
              </div>

              <div>
                <label className="block text-lg font-semibold text-gray-700 mb-2">
                  TVA À Emporter (%)
                </label>
                <input
                  type="number"
                  step="0.1"
                  value={tvaEmporter}
                  onChange={(e) => setTvaEmporter(e.target.value)}
                  className="w-full px-6 py-4 text-xl border-2 border-gray-300 rounded-2xl focus:border-orange-500 focus:outline-none"
                  placeholder="5.5"
                />
              </div>

              <div>
                <label className="block text-lg font-semibold text-gray-700 mb-2">
                  Devise
                </label>
                <div className="grid grid-cols-2 gap-4">
                  <button
                    type="button"
                    onClick={() => setDevise('EUR')}
                    className={`py-4 px-6 text-xl font-bold rounded-2xl border-2 transition-all ${
                      devise === 'EUR'
                        ? 'bg-orange-500 text-white border-orange-600 shadow-lg'
                        : 'bg-white text-gray-700 border-gray-300 hover:border-orange-400'
                    }`}
                  >
                    💶 Euro (EUR)
                  </button>
                  <button
                    type="button"
                    onClick={() => setDevise('CHF')}
                    className={`py-4 px-6 text-xl font-bold rounded-2xl border-2 transition-all ${
                      devise === 'CHF'
                        ? 'bg-orange-500 text-white border-orange-600 shadow-lg'
                        : 'bg-white text-gray-700 border-gray-300 hover:border-orange-400'
                    }`}
                  >
                    🇨🇭 Franc Suisse (CHF)
                  </button>
                </div>
                <p className="text-sm text-gray-500 mt-2">
                  Symbole affiché : {devise === 'EUR' ? '€' : 'CHF'}
                </p>
              </div>

              <button
                onClick={handleSaveTVA}
                disabled={saving}
                className="w-full py-5 bg-gradient-to-br from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 disabled:from-gray-300 disabled:to-gray-400 text-white font-bold text-xl rounded-2xl shadow-lg transition-all"
              >
                {saving ? 'Enregistrement...' : 'Enregistrer TVA et Devise'}
              </button>
            </div>
          </div>
        )}

        {/* Section Logo App */}
        {activeSection === 'logo' && (
          <div className="bg-white rounded-2xl shadow-lg p-8 border-2 border-gray-200">
            <h2 className="text-2xl font-bold text-gray-800 mb-6">🖼️ Logo de l&apos;application</h2>
            <p className="text-gray-500 mb-6">Ce logo s&apos;affiche sur la page de connexion à la place de l&apos;icône par défaut.</p>

            <div className="space-y-6">
              {/* Activation */}
              <div className="flex items-center justify-between bg-gray-50 rounded-2xl p-4 border-2 border-gray-200">
                <div>
                  <p className="text-lg font-bold text-gray-800">Activer le logo personnalisé</p>
                  <p className="text-sm text-gray-500">Si désactivé, l&apos;icône par défaut 🍔 est utilisée</p>
                </div>
                <label className="flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={appLogoConfig.actif}
                    onChange={(e) => setAppLogoConfig(prev => ({ ...prev, actif: e.target.checked }))}
                    className="sr-only peer"
                  />
                  <div className="relative w-14 h-8 bg-gray-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[4px] after:left-[4px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-6 after:w-6 after:transition-all peer-checked:bg-orange-500"></div>
                </label>
              </div>

              {appLogoConfig.actif && (
                <>
                  {/* URL */}
                  <div>
                    <label className="block text-lg font-semibold text-gray-700 mb-2">
                      URL du logo
                    </label>
                    <input
                      type="text"
                      value={appLogoConfig.url.startsWith('data:') ? '' : appLogoConfig.url}
                      onChange={(e) => setAppLogoConfig(prev => ({ ...prev, url: e.target.value }))}
                      placeholder="https://exemple.com/logo.png"
                      className="w-full px-6 py-4 text-lg border-2 border-gray-300 rounded-2xl focus:border-orange-500 focus:outline-none"
                    />
                  </div>

                  {/* Upload fichier */}
                  <div>
                    <label className="block text-lg font-semibold text-gray-700 mb-2">
                      Ou importer une image (max 1 Mo)
                    </label>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleLogoFileChange}
                      className="w-full px-6 py-4 text-base border-2 border-gray-300 rounded-2xl focus:border-orange-500 focus:outline-none file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:bg-orange-500 file:text-white file:font-semibold file:cursor-pointer hover:file:bg-orange-600"
                    />
                  </div>

                  {/* Aperçu */}
                  {appLogoConfig.url && (
                    <div className="flex flex-col items-center gap-3 bg-gray-50 rounded-2xl p-6 border-2 border-gray-200">
                      <p className="text-sm font-semibold text-gray-600 uppercase tracking-wide">Aperçu</p>
                      <div className="w-24 h-24 rounded-3xl overflow-hidden bg-white border-2 border-gray-200 flex items-center justify-center">
                        <img src={appLogoConfig.url} alt="Aperçu logo" className="w-full h-full object-contain" />
                      </div>
                      <button
                        onClick={() => setAppLogoConfig(prev => ({ ...prev, url: '' }))}
                        className="text-sm text-red-600 font-semibold hover:underline"
                      >
                        Supprimer l&apos;image
                      </button>
                    </div>
                  )}
                </>
              )}

              <button
                onClick={handleSaveLogo}
                disabled={saving}
                className="w-full py-5 bg-gradient-to-br from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 disabled:from-gray-300 disabled:to-gray-400 text-white font-bold text-xl rounded-2xl shadow-lg transition-all"
              >
                {saving ? 'Enregistrement...' : '💾 Enregistrer le logo'}
              </button>
            </div>
          </div>
        )}

        {/* Section Mot de passe */}
        {activeSection === 'password' && (
          <div className="bg-white rounded-2xl shadow-lg p-8 border-2 border-gray-200">
            <h2 className="text-2xl font-bold text-gray-800 mb-6">🔐 Changement de mot de passe</h2>
            
            <div className="space-y-6">
              <div>
                <label className="block text-lg font-semibold text-gray-700 mb-2">
                  Ancien mot de passe *
                </label>
                <input
                  type="password"
                  value={ancienPassword}
                  onChange={(e) => setAncienPassword(e.target.value)}
                  className="w-full px-6 py-4 text-xl border-2 border-gray-300 rounded-2xl focus:border-orange-500 focus:outline-none"
                  placeholder="••••••"
                />
              </div>

              <div>
                <label className="block text-lg font-semibold text-gray-700 mb-2">
                  Nouveau mot de passe *
                </label>
                <input
                  type="password"
                  value={nouveauPassword}
                  onChange={(e) => setNouveauPassword(e.target.value)}
                  className="w-full px-6 py-4 text-xl border-2 border-gray-300 rounded-2xl focus:border-orange-500 focus:outline-none"
                  placeholder="••••••"
                />
              </div>

              <div>
                <label className="block text-lg font-semibold text-gray-700 mb-2">
                  Confirmer le mot de passe *
                </label>
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full px-6 py-4 text-xl border-2 border-gray-300 rounded-2xl focus:border-orange-500 focus:outline-none"
                  placeholder="••••••"
                />
              </div>

              <button
                onClick={handleChangePassword}
                disabled={saving}
                className="w-full py-5 bg-gradient-to-br from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 disabled:from-gray-300 disabled:to-gray-400 text-white font-bold text-xl rounded-2xl shadow-lg transition-all"
              >
                {saving ? 'Enregistrement...' : 'Modifier le mot de passe'}
              </button>
            </div>
          </div>
        )}

        {/* Section Timer */}
        {activeSection === 'timer' && (
          <div className="bg-white rounded-2xl shadow-lg p-8 border-2 border-gray-200">
            <h2 className="text-2xl font-bold text-gray-800 mb-6">⏱️ Timer de verrouillage</h2>
            
            <div className="space-y-6">
              <div>
                <label className="block text-lg font-semibold text-gray-700 mb-2">
                  Durée d&apos;inactivité avant verrouillage
                </label>
                <select
                  value={timerVerrouillage}
                  onChange={(e) => setTimerVerrouillage(e.target.value)}
                  className="w-full px-6 py-4 text-xl border-2 border-gray-300 rounded-2xl focus:border-orange-500 focus:outline-none"
                >
                  <option value="300">5 minutes</option>
                  <option value="600">10 minutes</option>
                  <option value="900">15 minutes</option>
                  <option value="1800">30 minutes</option>
                  <option value="3600">60 minutes</option>
                </select>
              </div>

              <div className="bg-blue-50 border-2 border-blue-300 rounded-2xl p-4">
                <p className="text-blue-800">
                  ℹ️ L&apos;application redirigera automatiquement vers la page de connexion après la durée d&apos;inactivité définie.
                </p>
              </div>

              <button
                onClick={handleSaveTimer}
                disabled={saving}
                className="w-full py-5 bg-gradient-to-br from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 disabled:from-gray-300 disabled:to-gray-400 text-white font-bold text-xl rounded-2xl shadow-lg transition-all"
              >
                {saving ? 'Enregistrement...' : 'Enregistrer le timer'}
              </button>
            </div>
          </div>
        )}

        {/* Section Export */}
        {activeSection === 'export' && (
          <div className="bg-white rounded-2xl shadow-lg p-8 border-2 border-gray-200">
            <h2 className="text-2xl font-bold text-gray-800 mb-6">📊 Export de l&apos;historique</h2>
            
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-lg font-semibold text-gray-700 mb-2">
                    Date de début
                  </label>
                  <input
                    type="date"
                    value={dateDebut}
                    onChange={(e) => setDateDebut(e.target.value)}
                    className="w-full px-6 py-4 text-xl border-2 border-gray-300 rounded-2xl focus:border-orange-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-lg font-semibold text-gray-700 mb-2">
                    Date de fin
                  </label>
                  <input
                    type="date"
                    value={dateFin}
                    onChange={(e) => setDateFin(e.target.value)}
                    className="w-full px-6 py-4 text-xl border-2 border-gray-300 rounded-2xl focus:border-orange-500 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-lg font-semibold text-gray-700 mb-2">
                  Type de commande
                </label>
                <select
                  value={typeCommande}
                  onChange={(e) => setTypeCommande(e.target.value)}
                  className="w-full px-6 py-4 text-xl border-2 border-gray-300 rounded-2xl focus:border-orange-500 focus:outline-none"
                >
                  <option value="tous">Toutes les commandes</option>
                  <option value="sur_place">Sur place uniquement</option>
                  <option value="a_emporter">À emporter uniquement</option>
                </select>
              </div>

              <div className="bg-gray-50 border-2 border-gray-300 rounded-2xl p-6">
                <p className="text-2xl font-bold text-gray-800">
                  📋 {nbCommandes} commande{nbCommandes > 1 ? 's' : ''} à exporter
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <button
                  onClick={handleExportCSV}
                  className="py-5 bg-gradient-to-br from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white font-bold text-xl rounded-2xl shadow-lg transition-all"
                >
                  📄 Exporter CSV
                </button>

                <button
                  onClick={handleExportExcel}
                  className="py-5 bg-gradient-to-br from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white font-bold text-xl rounded-2xl shadow-lg transition-all"
                >
                  📗 Exporter Excel
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Section Imprimantes */}
        {activeSection === 'imprimantes' && (
          <div className="bg-white rounded-2xl shadow-lg p-8 border-2 border-gray-200">
            <h2 className="text-2xl font-bold text-gray-800 mb-6">🖨️ Configuration des imprimantes thermiques WiFi 80mm</h2>
            
            <div className="space-y-8">
              {/* Serveur d'impression (pour iPad/tablettes) */}
              <div className="border-2 border-blue-300 rounded-2xl p-6 bg-blue-50">
                <h3 className="text-xl font-bold text-gray-800 mb-4">🌐 Serveur d&apos;impression (iPad/Tablettes)</h3>
                <p className="text-sm text-gray-600 mb-4">
                  Si vous utilisez l&apos;application depuis un iPad ou une tablette, vous devez configurer un serveur d&apos;impression sur un ordinateur du réseau local.
                </p>
                <div>
                  <label className="block text-lg font-semibold text-gray-700 mb-2">
                    URL du serveur d&apos;impression
                  </label>
                  <input
                    type="text"
                    value={printersConfig.print_server_url || ''}
                    onChange={(e) => setPrintersConfig(prev => ({ ...prev, print_server_url: e.target.value }))}
                    className="w-full px-6 py-4 text-xl border-2 border-gray-300 rounded-2xl focus:border-blue-500 focus:outline-none bg-white"
                    placeholder="http://192.168.1.100:3001"
                  />
                  <p className="text-xs text-gray-500 mt-2">
                    💡 Exemple: http://192.168.1.100:3001 (IP de l&apos;ordinateur qui exécute le serveur d&apos;impression)
                  </p>
                  <p className="text-xs text-gray-500 mt-1">
                    📖 Voir le dossier <code className="bg-gray-200 px-2 py-1 rounded">print-server/</code> pour installer le serveur
                  </p>
                  <p className="text-xs text-gray-500 mt-1">
                    📱 Ou consultez <code className="bg-gray-200 px-2 py-1 rounded">GUIDE_IMPRESSION_ANDROID.md</code> pour utiliser un smartphone Android
                  </p>
                  {printersConfig.print_server_url && printersConfig.print_server_url.trim() !== '' && (
                    <button
                      onClick={async () => {
                        setErrorMessage('');
                        setSuccessMessage('🔍 Test de connexion au serveur d\'impression...');
                        try {
                          const { testPrintServer } = await import('@/lib/services/printService');
                          const isOnline = await testPrintServer(printersConfig.print_server_url!);
                          if (isOnline) {
                            setSuccessMessage('✅ Serveur d\'impression accessible !');
                          } else {
                            setErrorMessage('❌ Impossible de se connecter au serveur d\'impression');
                          }
                        } catch (error: any) {
                          setErrorMessage(`❌ Erreur: ${error.message || 'Connexion échouée'}`);
                        }
                      }}
                      className="mt-4 w-full py-3 bg-blue-500 hover:bg-blue-600 text-white font-semibold rounded-2xl transition-all"
                    >
                      🔍 Tester la connexion au serveur
                    </button>
                  )}
                </div>
              </div>

              {/* Détection automatique des imprimantes */}
              <div className="border-2 border-purple-300 rounded-2xl p-6 bg-purple-50">
                <h3 className="text-xl font-bold text-gray-800 mb-4">🔍 Détection automatique des imprimantes</h3>
                <p className="text-sm text-gray-600 mb-4">
                  Scannez votre réseau local pour détecter automatiquement les imprimantes thermiques disponibles.
                </p>
                
                <button
                  onClick={scanAvailablePrinters}
                  disabled={scanningPrinters || !printersConfig.print_server_url}
                  className="w-full py-4 bg-purple-500 hover:bg-purple-600 disabled:bg-gray-400 text-white font-semibold rounded-2xl transition-all mb-4"
                >
                  {scanningPrinters ? '⏳ Scan en cours...' : '🔍 Scanner le réseau'}
                </button>

                {!printersConfig.print_server_url && (
                  <p className="text-xs text-orange-600 mb-4">
                    ⚠️ Veuillez configurer l&apos;URL du serveur d&apos;impression d&apos;abord
                  </p>
                )}

                {/* Liste des imprimantes détectées */}
                {availablePrinters.length > 0 && (
                  <div className="space-y-3">
                    <h4 className="font-semibold text-gray-700 mb-2">
                      📋 Imprimantes détectées ({availablePrinters.length})
                    </h4>
                    {availablePrinters.map((printer, index) => (
                      <div 
                        key={index}
                        className="bg-white border-2 border-purple-200 rounded-xl p-4 hover:border-purple-400 transition-all"
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex-1">
                            <p className="font-bold text-gray-800">
                              {printer.name || `Imprimante ${index + 1}`}
                            </p>
                            <p className="text-sm text-gray-600">
                              📍 IP: {printer.ip}:{printer.port}
                            </p>
                            <p className="text-xs text-gray-500">
                              {printer.status === 'online' ? '🟢 En ligne' : '🔴 Hors ligne'}
                            </p>
                          </div>
                          <div className="flex gap-2">
                            <button
                              onClick={() => assignPrinter(printer.ip, printer.port, 'caisse')}
                              className="px-4 py-2 bg-orange-500 hover:bg-orange-600 text-white text-sm font-semibold rounded-lg transition-all"
                              title="Assigner à la caisse"
                            >
                              🖨️ Caisse
                            </button>
                            <button
                              onClick={() => assignPrinter(printer.ip, printer.port, 'cuisine')}
                              className="px-4 py-2 bg-green-500 hover:bg-green-600 text-white text-sm font-semibold rounded-lg transition-all"
                              title="Assigner à la cuisine"
                            >
                              👨‍🍳 Cuisine
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {availablePrinters.length === 0 && !scanningPrinters && (
                  <div className="text-center py-6 text-gray-500">
                    <p className="text-sm">Aucune imprimante détectée</p>
                    <p className="text-xs mt-1">Cliquez sur &quot;Scanner le réseau&quot; pour rechercher</p>
                  </div>
                )}
              </div>

              {/* Imprimante Caisse */}
              <div className="border-2 border-orange-300 rounded-2xl p-6 bg-orange-50">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-2xl font-bold text-gray-800">🖨️ Imprimante Caisse</h3>
                  <div className={`px-4 py-2 rounded-full font-bold ${
                    printersConfig.caisse.statut === 'active' 
                      ? 'bg-green-500 text-white' 
                      : 'bg-gray-400 text-white'
                  }`}>
                    {printersConfig.caisse.statut === 'active' ? '🟢 Active' : '🔴 Inactive'}
                  </div>
                </div>
                
                <div className="space-y-4">
                  {/* Nom */}
                  <div>
                    <label className="block text-lg font-semibold text-gray-700 mb-2">
                      Nom de l&apos;imprimante
                    </label>
                    <input
                      type="text"
                      value={printersConfig.caisse.nom}
                      onChange={(e) => updatePrinterConfig('caisse', 'nom', e.target.value)}
                      className="w-full px-6 py-4 text-xl border-2 border-gray-300 rounded-2xl focus:border-orange-500 focus:outline-none bg-white"
                      placeholder="Imprimante Caisse Principale"
                    />
                  </div>

                  {/* IP et Port */}
                  <div className="grid grid-cols-3 gap-4">
                    <div className="col-span-2">
                      <label className="block text-lg font-semibold text-gray-700 mb-2">
                        Adresse IP
                      </label>
                      <input
                        type="text"
                        value={printersConfig.caisse.ip}
                        onChange={(e) => updatePrinterConfig('caisse', 'ip', e.target.value)}
                        className="w-full px-6 py-4 text-xl border-2 border-gray-300 rounded-2xl focus:border-orange-500 focus:outline-none bg-white"
                        placeholder="192.168.1.100"
                      />
                    </div>
                    <div>
                      <label className="block text-lg font-semibold text-gray-700 mb-2">
                        Port
                      </label>
                      <input
                        type="number"
                        value={printersConfig.caisse.port}
                        onChange={(e) => updatePrinterConfig('caisse', 'port', parseInt(e.target.value))}
                        className="w-full px-6 py-4 text-xl border-2 border-gray-300 rounded-2xl focus:border-orange-500 focus:outline-none bg-white"
                        placeholder="9100"
                      />
                    </div>
                  </div>

                  {/* Statut */}
                  <div>
                    <label className="block text-lg font-semibold text-gray-700 mb-2">
                      Statut
                    </label>
                    <select
                      value={printersConfig.caisse.statut}
                      onChange={(e) => updatePrinterConfig('caisse', 'statut', e.target.value)}
                      className="w-full px-6 py-4 text-xl border-2 border-gray-300 rounded-2xl focus:border-orange-500 focus:outline-none bg-white"
                    >
                      <option value="active">Active</option>
                      <option value="inactive">Inactive</option>
                    </select>
                  </div>

                  {/* Type de ticket */}
                  <div className="bg-blue-50 border-2 border-blue-300 rounded-2xl p-4">
                    <p className="text-sm font-semibold text-blue-800 mb-2">📄 Type de ticket :</p>
                    <p className="text-blue-700">
                      ✓ Ticket standard avec TVA, total, mode de paiement<br/>
                      ✓ Logo, date, heure<br/>
                      ✓ Détail des produits et prix
                    </p>
                  </div>

                  {/* Actions */}
                  <div className="grid grid-cols-2 gap-4">
                    <button
                      onClick={() => testImprimante('caisse')}
                      disabled={testingPrinter === 'caisse'}
                      className="py-4 bg-blue-500 hover:bg-blue-600 disabled:bg-gray-400 text-white font-semibold rounded-2xl transition-all"
                    >
                      {testingPrinter === 'caisse' ? '⏳ Test...' : '🔍 Tester connexion'}
                    </button>
                    <button
                      onClick={() => printTest('caisse')}
                      className="py-4 bg-green-500 hover:bg-green-600 text-white font-semibold rounded-2xl transition-all"
                    >
                      🖨️ Imprimer test
                    </button>
                  </div>
                </div>
              </div>

              {/* Imprimante Cuisine */}
              <div className="border-2 border-orange-300 rounded-2xl p-6 bg-orange-50">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-2xl font-bold text-gray-800">🖨️ Imprimante Cuisine</h3>
                  <div className={`px-4 py-2 rounded-full font-bold ${
                    printersConfig.cuisine.statut === 'active' 
                      ? 'bg-green-500 text-white' 
                      : 'bg-gray-400 text-white'
                  }`}>
                    {printersConfig.cuisine.statut === 'active' ? '🟢 Active' : '🔴 Inactive'}
                  </div>
                </div>
                
                <div className="space-y-4">
                  {/* Nom */}
                  <div>
                    <label className="block text-lg font-semibold text-gray-700 mb-2">
                      Nom de l&apos;imprimante
                    </label>
                    <input
                      type="text"
                      value={printersConfig.cuisine.nom}
                      onChange={(e) => updatePrinterConfig('cuisine', 'nom', e.target.value)}
                      className="w-full px-6 py-4 text-xl border-2 border-gray-300 rounded-2xl focus:border-orange-500 focus:outline-none bg-white"
                      placeholder="Imprimante Cuisine"
                    />
                  </div>

                  {/* IP et Port */}
                  <div className="grid grid-cols-3 gap-4">
                    <div className="col-span-2">
                      <label className="block text-lg font-semibold text-gray-700 mb-2">
                        Adresse IP
                      </label>
                      <input
                        type="text"
                        value={printersConfig.cuisine.ip}
                        onChange={(e) => updatePrinterConfig('cuisine', 'ip', e.target.value)}
                        className="w-full px-6 py-4 text-xl border-2 border-gray-300 rounded-2xl focus:border-orange-500 focus:outline-none bg-white"
                        placeholder="192.168.1.101"
                      />
                    </div>
                    <div>
                      <label className="block text-lg font-semibold text-gray-700 mb-2">
                        Port
                      </label>
                      <input
                        type="number"
                        value={printersConfig.cuisine.port}
                        onChange={(e) => updatePrinterConfig('cuisine', 'port', parseInt(e.target.value))}
                        className="w-full px-6 py-4 text-xl border-2 border-gray-300 rounded-2xl focus:border-orange-500 focus:outline-none bg-white"
                        placeholder="9100"
                      />
                    </div>
                  </div>

                  {/* Statut */}
                  <div>
                    <label className="block text-lg font-semibold text-gray-700 mb-2">
                      Statut
                    </label>
                    <select
                      value={printersConfig.cuisine.statut}
                      onChange={(e) => updatePrinterConfig('cuisine', 'statut', e.target.value)}
                      className="w-full px-6 py-4 text-xl border-2 border-gray-300 rounded-2xl focus:border-orange-500 focus:outline-none bg-white"
                    >
                      <option value="active">Active</option>
                      <option value="inactive">Inactive</option>
                    </select>
                  </div>

                  {/* Type de ticket */}
                  <div className="bg-blue-50 border-2 border-blue-300 rounded-2xl p-4">
                    <p className="text-sm font-semibold text-blue-800 mb-2">📄 Type de ticket :</p>
                    <p className="text-blue-700">
                      ✓ Ticket de préparation pour la cuisine<br/>
                      ✓ Liste des produits à préparer<br/>
                      ✓ Heure, date, numéro de buzzer<br/>
                      ✓ Numéro de commande
                    </p>
                  </div>

                  {/* Actions */}
                  <div className="grid grid-cols-2 gap-4">
                    <button
                      onClick={() => testImprimante('cuisine')}
                      disabled={testingPrinter === 'cuisine'}
                      className="py-4 bg-blue-500 hover:bg-blue-600 disabled:bg-gray-400 text-white font-semibold rounded-2xl transition-all"
                    >
                      {testingPrinter === 'cuisine' ? '⏳ Test...' : '🔍 Tester connexion'}
                    </button>
                    <button
                      onClick={() => printTest('cuisine')}
                      className="py-4 bg-green-500 hover:bg-green-600 text-white font-semibold rounded-2xl transition-all"
                    >
                      🖨️ Imprimer test
                    </button>
                  </div>
                </div>
              </div>

              {/* Bouton de sauvegarde global */}
              <button
                onClick={handleSaveImprimantes}
                disabled={saving}
                className="w-full py-5 bg-gradient-to-br from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 disabled:from-gray-300 disabled:to-gray-400 text-white font-bold text-xl rounded-2xl shadow-lg transition-all"
              >
                {saving ? 'Enregistrement...' : '💾 Enregistrer la configuration des imprimantes'}
              </button>
            </div>
          </div>
        )}

        {/* Section Configuration des Tickets */}
        {activeSection === 'tickets' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Configuration */}
            <div className="space-y-6">
              {/* Logo */}
              <div className="bg-white rounded-2xl shadow-lg p-6 border-2 border-gray-200">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-xl font-bold text-gray-800">📷 Logo</h3>
                  <label className="flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={ticketConfig.logo.actif}
                      onChange={(e) => setTicketConfig(prev => ({
                        ...prev,
                        logo: { ...prev.logo, actif: e.target.checked }
                      }))}
                      className="sr-only peer"
                    />
                    <div className="relative w-14 h-8 bg-gray-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[4px] after:left-[4px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-6 after:w-6 after:transition-all peer-checked:bg-orange-500"></div>
                  </label>
                </div>

                {ticketConfig.logo.actif && (
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">
                        URL du logo
                      </label>
                      <input
                        type="text"
                        value={ticketConfig.logo.url}
                        onChange={(e) => setTicketConfig(prev => ({
                          ...prev,
                          logo: { ...prev.logo, url: e.target.value }
                        }))}
                        placeholder="https://exemple.com/logo.png"
                        className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:border-orange-500 focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">
                        Texte alternatif (si pas de logo)
                      </label>
                      <input
                        type="text"
                        value={ticketConfig.logo.texte_alternatif}
                        onChange={(e) => setTicketConfig(prev => ({
                          ...prev,
                          logo: { ...prev.logo, texte_alternatif: e.target.value }
                        }))}
                        className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:border-orange-500 focus:outline-none"
                      />
                    </div>
                    <div className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        id="upload-actif"
                        checked={ticketConfig.logo.upload_actif}
                        onChange={(e) => setTicketConfig(prev => ({
                          ...prev,
                          logo: { ...prev.logo, upload_actif: e.target.checked }
                        }))}
                        className="w-5 h-5 text-orange-500 border-gray-300 rounded focus:ring-orange-500"
                      />
                      <label htmlFor="upload-actif" className="text-sm font-medium text-gray-700">
                        Activer l&apos;upload de fichier (à venir)
                      </label>
                    </div>
                  </div>
                )}
              </div>

              {/* En-tête */}
              <div className="bg-white rounded-2xl shadow-lg p-6 border-2 border-gray-200">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-xl font-bold text-gray-800">📄 En-tête</h3>
                  <label className="flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={ticketConfig.entete.actif}
                      onChange={(e) => setTicketConfig(prev => ({
                        ...prev,
                        entete: { ...prev.entete, actif: e.target.checked }
                      }))}
                      className="sr-only peer"
                    />
                    <div className="relative w-14 h-8 bg-gray-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[4px] after:left-[4px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-6 after:w-6 after:transition-all peer-checked:bg-orange-500"></div>
                  </label>
                </div>

                {ticketConfig.entete.actif && (
                  <div className="space-y-3">
                    <input
                      type="text"
                      value={ticketConfig.entete.ligne1}
                      onChange={(e) => setTicketConfig(prev => ({
                        ...prev,
                        entete: { ...prev.entete, ligne1: e.target.value }
                      }))}
                      placeholder="Ligne 1"
                      className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:border-orange-500 focus:outline-none"
                    />
                    <input
                      type="text"
                      value={ticketConfig.entete.ligne2}
                      onChange={(e) => setTicketConfig(prev => ({
                        ...prev,
                        entete: { ...prev.entete, ligne2: e.target.value }
                      }))}
                      placeholder="Ligne 2"
                      className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:border-orange-500 focus:outline-none"
                    />
                    <input
                      type="text"
                      value={ticketConfig.entete.ligne3}
                      onChange={(e) => setTicketConfig(prev => ({
                        ...prev,
                        entete: { ...prev.entete, ligne3: e.target.value }
                      }))}
                      placeholder="Ligne 3"
                      className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:border-orange-500 focus:outline-none"
                    />
                  </div>
                )}
              </div>

              {/* Affichage */}
              <div className="bg-white rounded-2xl shadow-lg p-6 border-2 border-gray-200">
                <h3 className="text-xl font-bold text-gray-800 mb-4">👁️ Affichage</h3>
                <div className="space-y-3">
                  {[
                    { key: 'numero_commande', label: 'Numéro de commande' },
                    { key: 'date_heure', label: 'Date et heure' },
                    { key: 'nom_caissier', label: 'Nom du caissier' },
                    { key: 'mode_consommation', label: 'Mode de consommation' }
                  ].map(({ key, label }) => (
                    <div key={key} className="flex items-center gap-3">
                      <input
                        type="checkbox"
                        id={key}
                        checked={ticketConfig.affichage[key as keyof typeof ticketConfig.affichage]}
                        onChange={(e) => setTicketConfig(prev => ({
                          ...prev,
                          affichage: { ...prev.affichage, [key]: e.target.checked }
                        }))}
                        className="w-5 h-5 text-orange-500 border-gray-300 rounded focus:ring-orange-500"
                      />
                      <label htmlFor={key} className="text-sm font-medium text-gray-700">
                        {label}
                      </label>
                    </div>
                  ))}
                </div>
              </div>

              {/* Pied de page */}
              <div className="bg-white rounded-2xl shadow-lg p-6 border-2 border-gray-200">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-xl font-bold text-gray-800">📝 Pied de page</h3>
                  <label className="flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={ticketConfig.pied_page.actif}
                      onChange={(e) => setTicketConfig(prev => ({
                        ...prev,
                        pied_page: { ...prev.pied_page, actif: e.target.checked }
                      }))}
                      className="sr-only peer"
                    />
                    <div className="relative w-14 h-8 bg-gray-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[4px] after:left-[4px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-6 after:w-6 after:transition-all peer-checked:bg-orange-500"></div>
                  </label>
                </div>

                {ticketConfig.pied_page.actif && (
                  <div className="space-y-3">
                    <input
                      type="text"
                      value={ticketConfig.pied_page.ligne1}
                      onChange={(e) => setTicketConfig(prev => ({
                        ...prev,
                        pied_page: { ...prev.pied_page, ligne1: e.target.value }
                      }))}
                      placeholder="Ligne 1"
                      className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:border-orange-500 focus:outline-none"
                    />
                    <input
                      type="text"
                      value={ticketConfig.pied_page.ligne2}
                      onChange={(e) => setTicketConfig(prev => ({
                        ...prev,
                        pied_page: { ...prev.pied_page, ligne2: e.target.value }
                      }))}
                      placeholder="Ligne 2"
                      className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:border-orange-500 focus:outline-none"
                    />
                    <input
                      type="text"
                      value={ticketConfig.pied_page.ligne3}
                      onChange={(e) => setTicketConfig(prev => ({
                        ...prev,
                        pied_page: { ...prev.pied_page, ligne3: e.target.value }
                      }))}
                      placeholder="Ligne 3"
                      className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:border-orange-500 focus:outline-none"
                    />
                  </div>
                )}
              </div>

              {/* Mise en forme */}
              <div className="bg-white rounded-2xl shadow-lg p-6 border-2 border-gray-200">
                <h3 className="text-xl font-bold text-gray-800 mb-4">🎨 Mise en forme</h3>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Largeur du ticket (caractères)
                    </label>
                    <input
                      type="number"
                      value={ticketConfig.mise_en_forme.largeur_ticket}
                      onChange={(e) => setTicketConfig(prev => ({
                        ...prev,
                        mise_en_forme: { ...prev.mise_en_forme, largeur_ticket: parseInt(e.target.value) || 48 }
                      }))}
                      min="32"
                      max="80"
                      className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:border-orange-500 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Taille de police
                    </label>
                    <select
                      value={ticketConfig.mise_en_forme.police_taille}
                      onChange={(e) => setTicketConfig(prev => ({
                        ...prev,
                        mise_en_forme: { ...prev.mise_en_forme, police_taille: e.target.value as 'normale' | 'grande' }
                      }))}
                      className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:border-orange-500 focus:outline-none"
                    >
                      <option value="normale">Normale</option>
                      <option value="grande">Grande</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Caractère de séparation
                    </label>
                    <input
                      type="text"
                      value={ticketConfig.mise_en_forme.separateur}
                      onChange={(e) => setTicketConfig(prev => ({
                        ...prev,
                        mise_en_forme: { ...prev.mise_en_forme, separateur: e.target.value.charAt(0) || '=' }
                      }))}
                      maxLength={1}
                      className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:border-orange-500 focus:outline-none"
                    />
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-center gap-3">
                      <input
                        type="checkbox"
                        id="gras-titre"
                        checked={ticketConfig.mise_en_forme.gras_titre}
                        onChange={(e) => setTicketConfig(prev => ({
                          ...prev,
                          mise_en_forme: { ...prev.mise_en_forme, gras_titre: e.target.checked }
                        }))}
                        className="w-5 h-5 text-orange-500 border-gray-300 rounded focus:ring-orange-500"
                      />
                      <label htmlFor="gras-titre" className="text-sm font-medium text-gray-700">
                        Titre en gras
                      </label>
                    </div>
                    <div className="flex items-center gap-3">
                      <input
                        type="checkbox"
                        id="italique-pied"
                        checked={ticketConfig.mise_en_forme.italique_pied}
                        onChange={(e) => setTicketConfig(prev => ({
                          ...prev,
                          mise_en_forme: { ...prev.mise_en_forme, italique_pied: e.target.checked }
                        }))}
                        className="w-5 h-5 text-orange-500 border-gray-300 rounded focus:ring-orange-500"
                      />
                      <label htmlFor="italique-pied" className="text-sm font-medium text-gray-700">
                        Pied de page en italique
                      </label>
                    </div>
                  </div>
                </div>
              </div>

              {/* Options avancées */}
              <div className="bg-white rounded-2xl shadow-lg p-6 border-2 border-gray-200">
                <h3 className="text-xl font-bold text-gray-800 mb-4">⚙️ Options avancées</h3>
                <div className="space-y-4">
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <label className="text-sm font-semibold text-gray-700">QR Code</label>
                      <input
                        type="checkbox"
                        checked={ticketConfig.options_avancees.qr_code.actif}
                        onChange={(e) => setTicketConfig(prev => ({
                          ...prev,
                          options_avancees: {
                            ...prev.options_avancees,
                            qr_code: { ...prev.options_avancees.qr_code, actif: e.target.checked }
                          }
                        }))}
                        className="w-5 h-5 text-orange-500 border-gray-300 rounded focus:ring-orange-500"
                      />
                    </div>
                    {ticketConfig.options_avancees.qr_code.actif && (
                      <input
                        type="text"
                        value={ticketConfig.options_avancees.qr_code.contenu}
                        onChange={(e) => setTicketConfig(prev => ({
                          ...prev,
                          options_avancees: {
                            ...prev.options_avancees,
                            qr_code: { ...prev.options_avancees.qr_code, contenu: e.target.value }
                          }
                        }))}
                        placeholder="URL ou contenu du QR code"
                        className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:border-orange-500 focus:outline-none"
                      />
                    )}
                  </div>
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <label className="text-sm font-semibold text-gray-700">Code-barres</label>
                      <input
                        type="checkbox"
                        checked={ticketConfig.options_avancees.code_barres.actif}
                        onChange={(e) => setTicketConfig(prev => ({
                          ...prev,
                          options_avancees: {
                            ...prev.options_avancees,
                            code_barres: { ...prev.options_avancees.code_barres, actif: e.target.checked }
                          }
                        }))}
                        className="w-5 h-5 text-orange-500 border-gray-300 rounded focus:ring-orange-500"
                      />
                    </div>
                    {ticketConfig.options_avancees.code_barres.actif && (
                      <select
                        value={ticketConfig.options_avancees.code_barres.format}
                        onChange={(e) => setTicketConfig(prev => ({
                          ...prev,
                          options_avancees: {
                            ...prev.options_avancees,
                            code_barres: { ...prev.options_avancees.code_barres, format: e.target.value }
                          }
                        }))}
                        className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:border-orange-500 focus:outline-none"
                      >
                        <option value="CODE128">CODE128</option>
                        <option value="EAN13">EAN13</option>
                        <option value="QR">QR Code</option>
                      </select>
                    )}
                  </div>
                </div>
              </div>

              {/* Bouton de sauvegarde */}
              <button
                onClick={handleSaveTickets}
                disabled={saving}
                className="w-full py-5 bg-gradient-to-br from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 disabled:from-gray-300 disabled:to-gray-400 text-white font-bold text-xl rounded-2xl shadow-lg transition-all"
              >
                {saving ? 'Enregistrement...' : '💾 Enregistrer la configuration des tickets'}
              </button>
            </div>

            {/* Aperçu */}
            {ticketConfig.apercu.actif && (
              <div>
                <TicketPreview config={ticketConfig} />
              </div>
            )}
          </div>
        )}

        {/* Section Configuration des Tickets Cuisine */}
        {activeSection === 'tickets_cuisine' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Configuration */}
            <div className="space-y-6">
              {/* Logo */}
              <div className="bg-white rounded-2xl shadow-lg p-6 border-2 border-gray-200">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-xl font-bold text-gray-800">📷 Logo/Titre</h3>
                  <label className="flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={ticketCuisineConfig.logo.actif}
                      onChange={(e) => setTicketCuisineConfig(prev => ({
                        ...prev,
                        logo: { ...prev.logo, actif: e.target.checked }
                      }))}
                      className="sr-only peer"
                    />
                    <div className="relative w-14 h-8 bg-gray-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[4px] after:left-[4px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-6 after:w-6 after:transition-all peer-checked:bg-orange-500"></div>
                  </label>
                </div>

                {ticketCuisineConfig.logo.actif && (
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Texte du titre (ex: 🍔 CUISINE)
                    </label>
                    <input
                      type="text"
                      value={ticketCuisineConfig.logo.texte_alternatif}
                      onChange={(e) => setTicketCuisineConfig(prev => ({
                        ...prev,
                        logo: { ...prev.logo, texte_alternatif: e.target.value }
                      }))}
                      className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:border-orange-500 focus:outline-none"
                    />
                  </div>
                )}
              </div>

              {/* En-tête */}
              <div className="bg-white rounded-2xl shadow-lg p-6 border-2 border-gray-200">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-xl font-bold text-gray-800">📄 En-tête</h3>
                  <label className="flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={ticketCuisineConfig.entete.actif}
                      onChange={(e) => setTicketCuisineConfig(prev => ({
                        ...prev,
                        entete: { ...prev.entete, actif: e.target.checked }
                      }))}
                      className="sr-only peer"
                    />
                    <div className="relative w-14 h-8 bg-gray-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[4px] after:left-[4px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-6 after:w-6 after:transition-all peer-checked:bg-orange-500"></div>
                  </label>
                </div>

                {ticketCuisineConfig.entete.actif && (
                  <div className="space-y-3">
                    <input
                      type="text"
                      value={ticketCuisineConfig.entete.ligne1}
                      onChange={(e) => setTicketCuisineConfig(prev => ({
                        ...prev,
                        entete: { ...prev.entete, ligne1: e.target.value }
                      }))}
                      placeholder="Ligne 1 (ex: BON DE PREPARATION)"
                      className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:border-orange-500 focus:outline-none"
                    />
                    <input
                      type="text"
                      value={ticketCuisineConfig.entete.ligne2}
                      onChange={(e) => setTicketCuisineConfig(prev => ({
                        ...prev,
                        entete: { ...prev.entete, ligne2: e.target.value }
                      }))}
                      placeholder="Ligne 2 (optionnel)"
                      className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:border-orange-500 focus:outline-none"
                    />
                  </div>
                )}
              </div>

              {/* Affichage */}
              <div className="bg-white rounded-2xl shadow-lg p-6 border-2 border-gray-200">
                <h3 className="text-xl font-bold text-gray-800 mb-4">👁️ Affichage</h3>
                <div className="space-y-3">
                  {[
                    { key: 'numero_commande', label: 'Numéro de commande' },
                    { key: 'heure', label: 'Heure' },
                    { key: 'buzzer', label: 'Buzzer' },
                    { key: 'table_numero', label: 'Numéro de table' },
                    { key: 'mode_consommation', label: 'Mode de consommation' },
                    { key: 'details_produits', label: 'Détails des produits' },
                    { key: 'options_supplements', label: 'Options et suppléments' },
                    { key: 'ingredients_retires', label: 'Ingrédients retirés (SANS)' }
                  ].map(({ key, label }) => (
                    <div key={key} className="flex items-center gap-3">
                      <input
                        type="checkbox"
                        id={`cuisine_${key}`}
                        checked={ticketCuisineConfig.affichage[key as keyof typeof ticketCuisineConfig.affichage]}
                        onChange={(e) => setTicketCuisineConfig(prev => ({
                          ...prev,
                          affichage: { ...prev.affichage, [key]: e.target.checked }
                        }))}
                        className="w-5 h-5 text-orange-500 border-gray-300 rounded focus:ring-orange-500"
                      />
                      <label htmlFor={`cuisine_${key}`} className="text-sm font-medium text-gray-700">
                        {label}
                      </label>
                    </div>
                  ))}
                </div>
              </div>

              {/* Pied de page */}
              <div className="bg-white rounded-2xl shadow-lg p-6 border-2 border-gray-200">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-xl font-bold text-gray-800">📝 Pied de page</h3>
                  <label className="flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={ticketCuisineConfig.pied_page.actif}
                      onChange={(e) => setTicketCuisineConfig(prev => ({
                        ...prev,
                        pied_page: { ...prev.pied_page, actif: e.target.checked }
                      }))}
                      className="sr-only peer"
                    />
                    <div className="relative w-14 h-8 bg-gray-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[4px] after:left-[4px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-6 after:w-6 after:transition-all peer-checked:bg-orange-500"></div>
                  </label>
                </div>

                {ticketCuisineConfig.pied_page.actif && (
                  <div className="space-y-3">
                    <input
                      type="text"
                      value={ticketCuisineConfig.pied_page.ligne1}
                      onChange={(e) => setTicketCuisineConfig(prev => ({
                        ...prev,
                        pied_page: { ...prev.pied_page, ligne1: e.target.value }
                      }))}
                      placeholder="Ligne 1"
                      className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:border-orange-500 focus:outline-none"
                    />
                    <input
                      type="text"
                      value={ticketCuisineConfig.pied_page.ligne2}
                      onChange={(e) => setTicketCuisineConfig(prev => ({
                        ...prev,
                        pied_page: { ...prev.pied_page, ligne2: e.target.value }
                      }))}
                      placeholder="Ligne 2"
                      className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:border-orange-500 focus:outline-none"
                    />
                  </div>
                )}
              </div>

              {/* Mise en forme */}
              <div className="bg-white rounded-2xl shadow-lg p-6 border-2 border-gray-200">
                <h3 className="text-xl font-bold text-gray-800 mb-4">🎨 Mise en forme</h3>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Largeur du ticket (caractères)
                    </label>
                    <input
                      type="number"
                      value={ticketCuisineConfig.mise_en_forme.largeur_ticket}
                      onChange={(e) => setTicketCuisineConfig(prev => ({
                        ...prev,
                        mise_en_forme: { ...prev.mise_en_forme, largeur_ticket: parseInt(e.target.value) || 48 }
                      }))}
                      min="32"
                      max="80"
                      className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:border-orange-500 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Taille de police cuisine
                    </label>
                    <select
                      value={ticketCuisineConfig.mise_en_forme.taille_police_cuisine}
                      onChange={(e) => setTicketCuisineConfig(prev => ({
                        ...prev,
                        mise_en_forme: { ...prev.mise_en_forme, taille_police_cuisine: e.target.value as 'normale' | 'grande' | 'tres_grande' }
                      }))}
                      className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:border-orange-500 focus:outline-none"
                    >
                      <option value="normale">Normale</option>
                      <option value="grande">Grande</option>
                      <option value="tres_grande">Très grande</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Caractère de séparation
                    </label>
                    <input
                      type="text"
                      value={ticketCuisineConfig.mise_en_forme.separateur}
                      onChange={(e) => setTicketCuisineConfig(prev => ({
                        ...prev,
                        mise_en_forme: { ...prev.mise_en_forme, separateur: e.target.value.charAt(0) || '=' }
                      }))}
                      maxLength={1}
                      className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:border-orange-500 focus:outline-none"
                    />
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-center gap-3">
                      <input
                        type="checkbox"
                        id="gras-produits"
                        checked={ticketCuisineConfig.mise_en_forme.gras_produits}
                        onChange={(e) => setTicketCuisineConfig(prev => ({
                          ...prev,
                          mise_en_forme: { ...prev.mise_en_forme, gras_produits: e.target.checked }
                        }))}
                        className="w-5 h-5 text-orange-500 border-gray-300 rounded focus:ring-orange-500"
                      />
                      <label htmlFor="gras-produits" className="text-sm font-medium text-gray-700">
                        Produits en gras
                      </label>
                    </div>
                    <div className="flex items-center gap-3">
                      <input
                        type="checkbox"
                        id="espacement-produits"
                        checked={ticketCuisineConfig.mise_en_forme.espacement_produits}
                        onChange={(e) => setTicketCuisineConfig(prev => ({
                          ...prev,
                          mise_en_forme: { ...prev.mise_en_forme, espacement_produits: e.target.checked }
                        }))}
                        className="w-5 h-5 text-orange-500 border-gray-300 rounded focus:ring-orange-500"
                      />
                      <label htmlFor="espacement-produits" className="text-sm font-medium text-gray-700">
                        Espacement entre produits
                      </label>
                    </div>
                  </div>
                </div>
              </div>

              {/* Options production */}
              <div className="bg-white rounded-2xl shadow-lg p-6 border-2 border-gray-200">
                <h3 className="text-xl font-bold text-gray-800 mb-4">⚙️ Options production</h3>
                <div className="space-y-3">
                  <div className="flex items-center gap-3">
                    <input
                      type="checkbox"
                      id="grouper-categorie"
                      checked={ticketCuisineConfig.options_production.grouper_par_categorie}
                      onChange={(e) => setTicketCuisineConfig(prev => ({
                        ...prev,
                        options_production: { ...prev.options_production, grouper_par_categorie: e.target.checked }
                      }))}
                      className="w-5 h-5 text-orange-500 border-gray-300 rounded focus:ring-orange-500"
                    />
                    <label htmlFor="grouper-categorie" className="text-sm font-medium text-gray-700">
                      Grouper par catégorie (Tacos, Burgers, etc.)
                    </label>
                  </div>
                  <div className="flex items-center gap-3">
                    <input
                      type="checkbox"
                      id="quantites-grandes"
                      checked={ticketCuisineConfig.options_production.afficher_quantites_grandes}
                      onChange={(e) => setTicketCuisineConfig(prev => ({
                        ...prev,
                        options_production: { ...prev.options_production, afficher_quantites_grandes: e.target.checked }
                      }))}
                      className="w-5 h-5 text-orange-500 border-gray-300 rounded focus:ring-orange-500"
                    />
                    <label htmlFor="quantites-grandes" className="text-sm font-medium text-gray-700">
                      Afficher les quantités en grand
                    </label>
                  </div>
                </div>
              </div>

              {/* Bouton de sauvegarde */}
              <button
                onClick={handleSaveTicketsCuisine}
                disabled={saving}
                className="w-full py-5 bg-gradient-to-br from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 disabled:from-gray-300 disabled:to-gray-400 text-white font-bold text-xl rounded-2xl shadow-lg transition-all"
              >
                {saving ? 'Enregistrement...' : '💾 Enregistrer la configuration des tickets cuisine'}
              </button>
            </div>

            {/* Aperçu */}
            {ticketCuisineConfig.apercu.actif && (
              <div>
                <TicketCuisinePreview config={ticketCuisineConfig} />
              </div>
            )}
          </div>
        )}

        {/* Section IA Factures */}
        {activeSection === 'ia_factures' && (
          <div className="bg-white rounded-2xl shadow-lg p-8 border-2 border-gray-200">
            <h2 className="text-2xl font-bold text-gray-800 mb-6">🧠 Configuration IA pour Factures</h2>

            <div className="bg-blue-50 border-2 border-blue-300 rounded-2xl p-4 mb-6">
              <p className="text-blue-800 text-sm">
                ℹ️ <strong>Sans clé API :</strong> l&apos;extraction utilise Tesseract.js (reconnaissance basique, résultats limités).<br />
                <strong>Avec clé API OpenAI :</strong> l&apos;extraction utilise GPT-4 Vision (haute précision, reconnaissance intelligente des champs).
              </p>
            </div>

            {/* Statut actuel */}
            <div className={`rounded-2xl p-6 mb-6 border-2 ${
              openaiConfigured
                ? 'bg-green-50 border-green-400'
                : 'bg-orange-50 border-orange-400'
            }`}>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-lg font-bold">
                    {openaiConfigured ? '✅ IA configurée' : '⚠️ IA non configurée'}
                  </p>
                  <p className="text-sm text-gray-600 mt-1">
                    {openaiConfigured
                      ? `Clé active : ${openaiKeyMasked} — Modèle : GPT-4 Vision`
                      : 'Mode actuel : Tesseract.js (fallback)'}
                  </p>
                </div>
                {openaiConfigured && (
                  <button
                    onClick={() => {
                      removeOpenAIApiKey();
                      setOpenaiConfigured(false);
                      setOpenaiKeyMasked('');
                      setOpenaiKey('');
                      setSuccessMessage('Clé API supprimée. Retour à Tesseract.js');
                    }}
                    className="px-4 py-2 bg-red-100 text-red-700 rounded-xl font-semibold hover:bg-red-200 transition-all text-sm"
                  >
                    🗑️ Supprimer la clé
                  </button>
                )}
              </div>
            </div>

            {/* Champ clé API */}
            <div className="space-y-6">
              <div>
                <label className="block text-lg font-semibold text-gray-700 mb-2">
                  Clé API OpenAI
                </label>
                <input
                  type="password"
                  value={openaiKey}
                  onChange={(e) => setOpenaiKey(e.target.value)}
                  className="w-full px-6 py-4 text-xl border-2 border-gray-300 rounded-2xl focus:border-orange-500 focus:outline-none font-mono"
                  placeholder="sk-proj-..."
                />
                <p className="text-sm text-gray-500 mt-2">
                  Obtenez votre clé sur <a href="https://platform.openai.com/api-keys" target="_blank" rel="noopener noreferrer" className="text-blue-600 underline">platform.openai.com/api-keys</a>
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Bouton Tester */}
                <button
                  onClick={async () => {
                    if (!openaiKey.trim()) {
                      setErrorMessage('Veuillez entrer une clé API');
                      return;
                    }
                    setOpenaiTesting(true);
                    setErrorMessage('');
                    setSuccessMessage('');
                    const valid = await testOpenAIApiKey(openaiKey.trim());
                    setOpenaiTesting(false);
                    if (valid) {
                      setSuccessMessage('✅ Clé API valide ! Vous pouvez l\'enregistrer.');
                    } else {
                      setErrorMessage('❌ Clé API invalide ou expirée. Vérifiez et réessayez.');
                    }
                  }}
                  disabled={openaiTesting || !openaiKey.trim()}
                  className="py-5 bg-gray-100 hover:bg-gray-200 disabled:bg-gray-100 disabled:text-gray-400 text-gray-700 font-bold text-xl rounded-2xl border-2 border-gray-300 transition-all"
                >
                  {openaiTesting ? '🔄 Test en cours...' : '🔍 Tester la clé'}
                </button>

                {/* Bouton Enregistrer */}
                <button
                  onClick={() => {
                    if (!openaiKey.trim()) {
                      setErrorMessage('Veuillez entrer une clé API');
                      return;
                    }
                    setOpenAIApiKey(openaiKey.trim());
                    setOpenaiConfigured(true);
                    setOpenaiKeyMasked('sk-...' + openaiKey.trim().slice(-8));
                    setOpenaiKey('');
                    setSuccessMessage('✅ Clé API OpenAI enregistrée ! L\'extraction de factures utilisera maintenant GPT-4 Vision.');
                  }}
                  disabled={!openaiKey.trim()}
                  className="py-5 bg-gradient-to-br from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 disabled:from-gray-300 disabled:to-gray-400 text-white font-bold text-xl rounded-2xl shadow-lg transition-all"
                >
                  💾 Enregistrer la clé
                </button>
              </div>
            </div>

            {/* Comparatif */}
            <div className="mt-8 border-t-2 border-gray-200 pt-6">
              <h3 className="text-lg font-bold text-gray-800 mb-4">Comparatif des moteurs</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-gray-50 rounded-2xl p-5 border-2 border-gray-200">
                  <h4 className="font-bold text-gray-700 mb-2">🔤 Tesseract.js (gratuit)</h4>
                  <ul className="text-sm text-gray-600 space-y-1">
                    <li>• Reconnaissance de texte basique</li>
                    <li>• Fonctionne hors-ligne</li>
                    <li>• Précision limitée sur les factures</li>
                    <li>• Résultats variables selon la qualité photo</li>
                  </ul>
                </div>
                <div className="bg-blue-50 rounded-2xl p-5 border-2 border-blue-300">
                  <h4 className="font-bold text-blue-700 mb-2">🧠 GPT-4 Vision (payant)</h4>
                  <ul className="text-sm text-blue-800 space-y-1">
                    <li>• Compréhension intelligente du contexte</li>
                    <li>• Haute précision sur tous les champs</li>
                    <li>• Fonctionne même avec des photos floues</li>
                    <li>• ~0.01€ par facture analysée</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
