// Types pour le module mobile factures

export interface InvoiceFormData {
  fournisseur: string;
  adresse?: string;
  date: string;
  montantValide: number;
  montantTTC: number;
  tva: number;
  numeroFacture: string;
  categorie: string;
}

export interface OCRConfidence {
  fournisseur: number;
  date: number;
  montant: number;
  tva: number;
  numero: number;
  adresse: number;
}

export interface OCRResult {
  fournisseur?: string;
  adresse?: string;
  date?: string;
  montantTTC?: number;
  montantHT?: number;
  tva?: number;
  tauxTVA?: number;
  numero?: string;
  confidence: OCRConfidence;
  rawText?: string;
}

export interface InvoiceData {
  formData: InvoiceFormData;
  imageUrl: string;
  confidence: OCRConfidence;
}

// Type pour la lecture des factures depuis Supabase (desktop)
export interface InvoiceRecord {
  id: string;
  user_id: string;
  fournisseur: string;
  adresse?: string;
  date_facture: string;
  montant_valide?: number;
  montant_ttc: number;
  tva?: number;
  numero_facture?: string;
  categorie?: string;
  image_url?: string;
  confidence_fournisseur?: number;
  confidence_date?: number;
  created_at: string;
  updated_at: string;
}
