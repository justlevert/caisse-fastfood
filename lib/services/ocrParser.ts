import { OCRResult, OCRConfidence } from '@/types/invoice.types';

/**
 * Parser intelligent pour extraire les données structurées
 * à partir du texte brut OCR d'une facture
 */

interface FieldExtraction {
  value: string | number | undefined;
  confidence: number;
  source: string;
}

// =====================================================
// NETTOYAGE DU TEXTE
// =====================================================

function cleanText(raw: string): string {
  return raw
    .replace(/[|¦]/g, '')           // Artefacts verticaux
    .replace(/\s{3,}/g, '  ')       // Espaces multiples
    .replace(/[^\S\n]+/g, ' ')      // Normaliser espaces (sauf \n)
    .replace(/\n{3,}/g, '\n\n')     // Limiter sauts de ligne
    .trim();
}

function getLines(text: string): string[] {
  return text.split('\n').map(l => l.trim()).filter(l => l.length > 0);
}

// =====================================================
// EXTRACTION FOURNISSEUR
// =====================================================

function extractFournisseur(text: string, lines: string[], globalConfidence: number): FieldExtraction {
  const ignorePatterns = [
    /^(facture|reçu|ticket|bon de|note de|avoir|devis|proforma)/i,
    /^(date|du|le|n°|numéro|numero|ref|total|montant|tva|ht|ttc|sous-total)/i,
    /^(page|tel|telephone|fax|email|e-mail|www|http|siret|siren|ape|rcs|tva|iban)/i,
    /^\d+[\s.,€$%]/,                // Ligne commençant par un chiffre suivi d'un séparateur
    /^[A-Z]{2}\d{2}/,               // Code type IBAN
    /^\d{1,2}[\/\-]\d{1,2}[\/\-]/,  // Ligne commençant par une date
    /^(client|destinataire|livraison|adresse)/i,  // Mots-clés client
  ];

  // Chercher dans les 8 premières lignes (certaines factures ont des en-têtes)
  const candidates: { line: string; score: number }[] = [];

  for (let i = 0; i < Math.min(lines.length, 8); i++) {
    const line = lines[i];

    // Ignorer lignes trop courtes ou trop longues
    if (line.length < 2 || line.length > 100) continue;

    // Ignorer lignes qui matchent les patterns d'exclusion
    if (ignorePatterns.some(p => p.test(line))) continue;

    // Ignorer lignes purement numériques
    if (/^[\d\s.,€$%+-]+$/.test(line)) continue;

    let score = 0.5;

    // Bonus si la ligne contient des majuscules (nom d'entreprise)
    if (/^[A-ZÀ-Ü]/.test(line)) score += 0.15;
    if (line === line.toUpperCase() && /[A-Z]/.test(line)) score += 0.2;

    // Bonus si longueur raisonnable (3-50 chars)
    if (line.length >= 3 && line.length <= 50) score += 0.15;

    // Bonus si première position
    if (i === 0) score += 0.2;
    if (i === 1) score += 0.1;
    if (i === 2) score += 0.05;

    // Bonus si contient des mots typiques d'entreprise
    if (/(sarl|sas|eurl|sa\s|snc|sci|ets|etablissements?|societe|company|ltd|inc)/i.test(line)) score += 0.2;

    // Malus si contient des chiffres isolés (SIRET, etc.)
    if (/\d{5,}/.test(line)) score -= 0.25;

    candidates.push({ line, score: Math.min(score, 1) });
  }

  if (candidates.length === 0) {
    return { value: undefined, confidence: 0, source: 'none' };
  }

  // Trier par score décroissant
  candidates.sort((a, b) => b.score - a.score);
  const best = candidates[0];

  return {
    value: best.line,
    confidence: best.score * globalConfidence,
    source: 'heuristic_lines',
  };
}

// =====================================================
// EXTRACTION DATE
// =====================================================

function extractDate(text: string, globalConfidence: number): FieldExtraction {
  // Pattern 1: Date avec mot-clé (haute confiance)
  const keywordPatterns = [
    /(?:date|du|le|émise?\s*le|facture\s*du|factur[ée]e?\s*le)[:\s]*(\d{1,2})[/\-.\s](\d{1,2})[/\-.\s](\d{2,4})/i,
    /(?:date|du|le|émise?\s*le|facture\s*du)[:\s]*(\d{4})[/\-.\s](\d{1,2})[/\-.\s](\d{1,2})/i,
    /(?:date|du|le)[:\s]*(\d{1,2})\s*[/\-]\s*(\d{1,2})\s*[/\-]\s*(\d{2,4})/i,
    /(?:^|\n)\s*(?:date|le)\s*[:\s]*(\d{1,2})[/\-](\d{1,2})[/\-](\d{2,4})/im,
  ];

  for (const pattern of keywordPatterns) {
    const match = text.match(pattern);
    if (match) {
      const normalized = normalizeDateParts(match.slice(1));
      if (normalized) {
        return { value: normalized, confidence: 0.9 * globalConfidence, source: 'keyword_date' };
      }
    }
  }

  // Pattern 2: Date avec mois en lettres
  const monthNames: Record<string, string> = {
    'janvier': '01', 'février': '02', 'mars': '03', 'avril': '04',
    'mai': '05', 'juin': '06', 'juillet': '07', 'août': '08',
    'septembre': '09', 'octobre': '10', 'novembre': '11', 'décembre': '12',
    'jan': '01', 'fev': '02', 'fév': '02', 'mar': '03', 'avr': '04',
    'jui': '06', 'jul': '07', 'aou': '08', 'aoû': '08',
    'sep': '09', 'oct': '10', 'nov': '11', 'dec': '12', 'déc': '12',
  };
  const monthPattern = Object.keys(monthNames).join('|');
  const letterDateRegex = new RegExp(`(\\d{1,2})\\s*(?:er)?\\s*(${monthPattern})\\.?\\s*(\\d{2,4})`, 'i');
  const letterMatch = text.match(letterDateRegex);
  if (letterMatch) {
    const day = letterMatch[1].padStart(2, '0');
    const month = monthNames[letterMatch[2].toLowerCase()];
    let year = letterMatch[3];
    if (year.length === 2) year = '20' + year;
    if (month) {
      return { value: `${year}-${month}-${day}`, confidence: 0.85 * globalConfidence, source: 'letter_month' };
    }
  }

  // Pattern 3: Date sans mot-clé (confiance moyenne)
  const fallbackPatterns = [
    /(\d{1,2})[/\-.](\d{1,2})[/\-.](\d{4})/,
    /(\d{1,2})[/\-.](\d{1,2})[/\-.](\d{2})/,
    /(\d{4})[/\-.](\d{1,2})[/\-.](\d{1,2})/,
  ];

  // Chercher toutes les dates et prendre la plus récente (probablement la date de facture)
  const allDates: { date: string; confidence: number }[] = [];
  
  for (const pattern of fallbackPatterns) {
    const matches = Array.from(text.matchAll(new RegExp(pattern, 'g')));
    for (const match of matches) {
      const normalized = normalizeDateParts(match.slice(1));
      if (normalized) {
        allDates.push({ date: normalized, confidence: 0.5 * globalConfidence });
      }
    }
  }

  if (allDates.length > 0) {
    // Filtrer les dates futures ou trop anciennes
    const now = new Date();
    const minDate = new Date('2000-01-01');
    const validDates = allDates.filter(d => {
      const date = new Date(d.date);
      return date >= minDate && date <= now;
    });

    if (validDates.length > 0) {
      // Prendre la date la plus récente
      validDates.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
      return { value: validDates[0].date, confidence: validDates[0].confidence, source: 'fallback_date' };
    }
  }

  return { value: undefined, confidence: 0, source: 'none' };
}

function normalizeDateParts(parts: string[]): string | null {
  if (parts.length < 3) return null;

  let [p1, p2, p3] = parts.map(p => p.trim());

  // Format YYYY-MM-DD
  if (p1.length === 4) {
    const year = p1;
    const month = p2.padStart(2, '0');
    const day = p3.padStart(2, '0');
    
    const d = parseInt(day), m = parseInt(month), y = parseInt(year);
    if (d < 1 || d > 31 || m < 1 || m > 12 || y < 2000 || y > 2099) return null;
    
    return `${year}-${month}-${day}`;
  }

  // Format DD/MM/YY ou DD/MM/YYYY
  let year = p3;
  if (year.length === 2) {
    const yy = parseInt(year);
    // Si année > 50, c'est 19xx, sinon 20xx
    year = yy > 50 ? '19' + year : '20' + year;
  }

  const day = p1.padStart(2, '0');
  const month = p2.padStart(2, '0');

  // Validation basique
  const d = parseInt(day), m = parseInt(month), y = parseInt(year);
  if (d < 1 || d > 31 || m < 1 || m > 12 || y < 1990 || y > 2099) return null;

  // Vérifier que la date n'est pas dans le futur
  const date = new Date(`${year}-${month}-${day}`);
  if (date > new Date()) return null;

  return `${year}-${month}-${day}`;
}

// =====================================================
// EXTRACTION MONTANT TTC
// =====================================================

function extractMontantTTC(text: string, globalConfidence: number): FieldExtraction {
  // Pattern 1: Montant avec mot-clé TTC (haute confiance)
  const ttcPatterns = [
    /(?:total\s*ttc|montant\s*ttc|ttc|net\s*[àa]\s*payer|[àa]\s*r[ée]gler|total\s*[àa]\s*payer|montant\s*d[ûu]|solde\s*[àa]\s*payer|total\s*g[ée]n[ée]ral)[:\s]*€?\s*(\d[\d\s]*[.,]\d{1,2})\s*€?/i,
    /(\d[\d\s]*[.,]\d{1,2})\s*€?\s*(?:ttc|net\s*[àa]\s*payer|total\s*ttc)/i,
    /(?:total\s*ttc|ttc|total)[:\s]*€?\s*(\d[\d\s]*[.,]\d{1,2})/i,
    /(?:montant|somme)\s*(?:total|[àa]\s*payer)[:\s]*€?\s*(\d[\d\s]*[.,]\d{1,2})/i,
  ];

  for (const pattern of ttcPatterns) {
    const match = text.match(pattern);
    if (match) {
      const amount = parseAmount(match[1]);
      if (amount !== null && amount > 0) {
        return { value: amount, confidence: 0.9 * globalConfidence, source: 'keyword_ttc' };
      }
    }
  }

  // Pattern 2: "Total" suivi d'un montant (confiance moyenne)
  const totalPatterns = [
    /total[:\s]*€?\s*(\d[\d\s]*[.,]\d{1,2})\s*€?/i,
    /montant[:\s]*€?\s*(\d[\d\s]*[.,]\d{1,2})\s*€?/i,
    /(?:total|montant|somme)[:\s]*€?\s*(\d[\d\s]*[.,]\d{1,2})/i,
    /(?:^|\n)\s*total\s+(\d[\d\s]*[.,]\d{1,2})/im,
  ];

  for (const pattern of totalPatterns) {
    const match = text.match(pattern);
    if (match) {
      const amount = parseAmount(match[1]);
      if (amount !== null && amount > 0) {
        return { value: amount, confidence: 0.75 * globalConfidence, source: 'keyword_total' };
      }
    }
  }

  // Pattern 3: Fallback - montant le plus élevé avec € (mais pas trop élevé)
  const amountRegex = /(\d[\d\s]*[.,]\d{1,2})\s*€/g;
  const amounts = Array.from(text.matchAll(amountRegex))
    .map(m => parseAmount(m[1]))
    .filter((a): a is number => a !== null && a > 0 && a < 100000); // Filtrer montants aberrants

  if (amounts.length > 0) {
    const maxAmount = Math.max(...amounts);
    // Vérifier que ce n'est pas un montant HT ou TVA isolé
    const htPattern = new RegExp(`${maxAmount.toFixed(2).replace('.', '[.,]')}.*(?:ht|hors\\s*taxe)`, 'i');
    if (htPattern.test(text)) {
      // C'est probablement un montant HT, chercher le suivant
      const filteredAmounts = amounts.filter(a => a !== maxAmount);
      if (filteredAmounts.length > 0) {
        const secondMax = Math.max(...filteredAmounts);
        return { value: secondMax, confidence: 0.4 * globalConfidence, source: 'fallback_second_max' };
      }
    }
    return { value: maxAmount, confidence: 0.5 * globalConfidence, source: 'fallback_max_amount' };
  }

  return { value: undefined, confidence: 0, source: 'none' };
}

// =====================================================
// EXTRACTION TVA
// =====================================================

function extractTVA(text: string, montantTTC: number | undefined, globalConfidence: number): FieldExtraction {
  // Pattern 1: Montant TVA explicite
  const tvaAmountPatterns = [
    /(?:montant\s*tva|tva\s*(?:\d+[.,]?\d*\s*%)?)[:\s]*€?\s*(\d[\d\s]*[.,]\d{2})\s*€?/i,
    /(?:dont\s*tva|tva\s*incluse?)[:\s]*€?\s*(\d[\d\s]*[.,]\d{2})\s*€?/i,
    /tva[:\s]*€?\s*(\d[\d\s]*[.,]\d{2})\s*€?/i,
    /(?:^|\n)\s*tva\s+(\d[\d\s]*[.,]\d{2})/im,
  ];

  for (const pattern of tvaAmountPatterns) {
    const match = text.match(pattern);
    if (match) {
      const amount = parseAmount(match[1]);
      if (amount !== null && amount > 0) {
        return { value: amount, confidence: 0.85 * globalConfidence, source: 'keyword_tva' };
      }
    }
  }

  // Pattern 2: Taux de TVA + calcul
  const tauxPatterns = [
    /tva\s*[:\s]*(\d+[.,]?\d*)\s*%/i,
    /(\d+[.,]?\d*)\s*%\s*(?:tva|de\s*tva)/i,
  ];

  for (const pattern of tauxPatterns) {
    const match = text.match(pattern);
    if (match && montantTTC) {
      const taux = parseFloat(match[1].replace(',', '.'));
      if (taux > 0 && taux <= 30) {
        const tvaAmount = parseFloat((montantTTC * taux / (100 + taux)).toFixed(2));
        return { value: tvaAmount, confidence: 0.7 * globalConfidence, source: 'calculated_from_rate' };
      }
    }
  }

  // Pattern 3: Chercher ligne "TVA" suivie d'un montant
  const tvaLinePattern = /tva[^\n]*?(\d+[.,]\d{2})\s*€?/i;
  const tvaLineMatch = text.match(tvaLinePattern);
  if (tvaLineMatch) {
    const amount = parseAmount(tvaLineMatch[1]);
    if (amount !== null && amount > 0) {
      return { value: amount, confidence: 0.65 * globalConfidence, source: 'tva_line' };
    }
  }

  // Fallback: calcul avec 20% par défaut si montant TTC trouvé
  if (montantTTC && montantTTC > 0) {
    const tvaAmount = parseFloat((montantTTC * 20 / 120).toFixed(2));
    return { value: tvaAmount, confidence: 0.25, source: 'fallback_20pct' };
  }

  return { value: undefined, confidence: 0, source: 'none' };
}

// =====================================================
// EXTRACTION NUMÉRO DE FACTURE
// =====================================================

function extractNumero(text: string, globalConfidence: number): FieldExtraction {
  const patterns = [
    /(?:facture|invoice|fact\.?|devis)\s*(?:n[°o]?|#|num|numero|:)\s*([A-Z0-9][\w\-\/]{2,25})/i,
    /(?:n[°o]|#|num|numero)\s*(?:de\s*)?(?:facture|fact\.?|invoice|devis)\s*:?\s*([A-Z0-9][\w\-\/]{2,25})/i,
    /(?:ref|réf|reference|référence)\s*(?:n[°o]?|#|num|:)?\s*([A-Z0-9][\w\-\/]{2,25})/i,
    /(?:n[°o]|#|num)\s*:?\s*([A-Z0-9][\w\-\/]{3,25})/i,
    /(?:FA|FC|FV|INV|FAC|DEV)[\-\/]?\s*(\d{3,15})/i,
    /\b([A-Z]{2,4}[\-\/]\d{4,}[\-\/]?\d*)\b/,  // Pattern type ABC-2024-001
  ];

  for (const pattern of patterns) {
    const match = text.match(pattern);
    if (match) {
      const numero = match[1].trim();
      // Ignorer si c'est juste un nombre court (probablement pas un numéro de facture)
      if (/^\d{1,2}$/.test(numero)) continue;
      // Ignorer si c'est une date
      if (/^\d{1,2}[\/\-]\d{1,2}/.test(numero)) continue;
      return { value: numero, confidence: 0.85 * globalConfidence, source: 'keyword_numero' };
    }
  }

  // Fallback: chercher un pattern type "FA-XXXX" ou "2024-XXXX" isolé
  const fallback = text.match(/\b((?:FA|FC|FV|INV)[\-\/]\d{3,})\b/i);
  if (fallback) {
    return { value: fallback[1], confidence: 0.6 * globalConfidence, source: 'fallback_pattern' };
  }

  return { value: undefined, confidence: 0, source: 'none' };
}

// =====================================================
// EXTRACTION ADRESSE
// =====================================================

function extractAdresse(text: string, lines: string[], globalConfidence: number): FieldExtraction {
  // Pattern 1: Ligne avec code postal + ville
  const cpVilleRegex = /(\d{5})\s+([A-ZÀ-Üa-zà-ü\s\-]{2,40})/;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const match = line.match(cpVilleRegex);
    if (match) {
      // Chercher la ligne au-dessus pour l'adresse complète
      let adresse = line;
      if (i > 0) {
        const prevLine = lines[i - 1];
        if (/\d+.*(?:rue|avenue|av\.?|boulevard|bd\.?|place|allée|impasse|chemin|route|voie|quai)/i.test(prevLine)) {
          adresse = prevLine + ', ' + line;
        }
      }
      return { value: adresse, confidence: 0.8 * globalConfidence, source: 'postal_code' };
    }
  }

  // Pattern 2: Ligne avec rue/avenue
  for (const line of lines) {
    if (/\d+.*(?:rue|avenue|av\.?|boulevard|bd\.?|place|allée|impasse|chemin|route|voie|quai)/i.test(line)) {
      // Chercher le code postal dans les lignes suivantes
      const idx = lines.indexOf(line);
      if (idx < lines.length - 1) {
        const nextLine = lines[idx + 1];
        if (/\d{5}/.test(nextLine)) {
          return { value: line + ', ' + nextLine, confidence: 0.75 * globalConfidence, source: 'street_with_cp' };
        }
      }
      return { value: line, confidence: 0.65 * globalConfidence, source: 'street_pattern' };
    }
  }

  return { value: undefined, confidence: 0, source: 'none' };
}

// =====================================================
// UTILITAIRES
// =====================================================

function parseAmount(raw: string): number | null {
  if (!raw) return null;
  const cleaned = raw.replace(/\s/g, '').replace(',', '.');
  const val = parseFloat(cleaned);
  return isNaN(val) ? null : val;
}

// =====================================================
// FONCTION PRINCIPALE DE PARSING
// =====================================================

export function parseInvoiceText(rawText: string, globalConfidence: number): OCRResult {
  const text = cleanText(rawText);
  const lines = getLines(text);

  // Extraction de chaque champ
  const fournisseurResult = extractFournisseur(text, lines, globalConfidence);
  const dateResult = extractDate(text, globalConfidence);
  const montantResult = extractMontantTTC(text, globalConfidence);
  const tvaResult = extractTVA(text, montantResult.value as number | undefined, globalConfidence);
  const numeroResult = extractNumero(text, globalConfidence);
  const adresseResult = extractAdresse(text, lines, globalConfidence);

  // Calcul montant HT
  const montantTTC = montantResult.value as number | undefined;
  const tvaAmount = tvaResult.value as number | undefined;
  let montantHT: number | undefined;
  if (montantTTC && tvaAmount) {
    montantHT = parseFloat((montantTTC - tvaAmount).toFixed(2));
  }

  // Détection du taux de TVA
  let tauxTVA: number | undefined;
  if (montantTTC && tvaAmount && montantTTC > tvaAmount) {
    const ht = montantTTC - tvaAmount;
    tauxTVA = parseFloat(((tvaAmount / ht) * 100).toFixed(1));
  }

  // Vérification de cohérence inter-champs
  let montantConfidence = montantResult.confidence;
  if (montantTTC && tvaAmount && montantHT) {
    const checkSum = parseFloat((montantHT + tvaAmount).toFixed(2));
    if (Math.abs(checkSum - montantTTC) < 0.02) {
      // HT + TVA = TTC → boost de confiance
      montantConfidence = Math.min(montantConfidence + 0.1, 1);
    }
  }

  const confidence: OCRConfidence = {
    fournisseur: parseFloat(fournisseurResult.confidence.toFixed(2)),
    date: parseFloat(dateResult.confidence.toFixed(2)),
    montant: parseFloat(montantConfidence.toFixed(2)),
    tva: parseFloat(tvaResult.confidence.toFixed(2)),
    numero: parseFloat(numeroResult.confidence.toFixed(2)),
    adresse: parseFloat(adresseResult.confidence.toFixed(2)),
  };

  console.log('🧠 Parser results:', {
    fournisseur: { value: fournisseurResult.value, source: fournisseurResult.source },
    date: { value: dateResult.value, source: dateResult.source },
    montant: { value: montantResult.value, source: montantResult.source },
    tva: { value: tvaResult.value, source: tvaResult.source },
    numero: { value: numeroResult.value, source: numeroResult.source },
    adresse: { value: adresseResult.value, source: adresseResult.source },
  });

  return {
    fournisseur: fournisseurResult.value as string | undefined,
    adresse: adresseResult.value as string | undefined,
    date: dateResult.value as string | undefined,
    montantTTC: montantResult.value as number | undefined,
    montantHT,
    tva: tvaResult.value as number | undefined,
    tauxTVA,
    numero: numeroResult.value as string | undefined,
    confidence,
    rawText: text,
  };
}
