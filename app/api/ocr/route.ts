import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const { imageBase64, apiKey } = await request.json();

    if (!apiKey) {
      return NextResponse.json(
        { error: 'Cle API OpenAI manquante' },
        { status: 400 }
      );
    }

    if (!imageBase64) {
      return NextResponse.json(
        { error: 'Image manquante' },
        { status: 400 }
      );
    }

    const prompt = `You are an expert OCR system specialized in extracting data from French invoices, receipts, and commercial documents. Analyze this image with EXTREME PRECISION and extract information in JSON format.

CRITICAL RULES:
1. Return ONLY a valid JSON object, no text before/after, no markdown backticks, no comments
2. All amounts must be decimal NUMBERS (ex: 125.50, never "125,50€" or "125,50")
3. Dates in YYYY-MM-DD format (ex: "2024-03-15", never "15/03/2024")
4. If a field is absent, illegible or uncertain, use null (NEVER "", NEVER 0, NEVER undefined)
5. Read the ENTIRE document before extracting, don't rush to first values found

FIELDS TO EXTRACT (priority order):

{
  "fournisseur": "EXACT name of issuing company (usually at TOP of document, in BOLD or CAPS, BEFORE address). Examples: 'CARREFOUR', 'AUCHAN', 'METRO', 'SARL DUPONT'. DO NOT confuse with customer.",
  "adresse": "COMPLETE supplier address (street + postal code + city). Example: '15 rue de la Republique, 75001 Paris'. Look UNDER supplier name.",
  "date": "Invoice date in YYYY-MM-DD format. Look for keywords: 'Date:', 'Le:', 'Facture du:', 'Emise le:', or a date near top of document. Example: '2024-03-15'. NEVER future date.",
  "montantTTC": "TOTAL amount TTC as NUMBER (the MOST IMPORTANT amount on document). Look for: 'Total TTC', 'Net a payer', 'Total general', 'Montant du', 'A payer'. Usually the LAST amount at BOTTOM of document. Example: 125.50 (not '125,50€')",
  "montantHT": "Amount excluding tax as NUMBER. Look for: 'Total HT', 'Montant HT', 'Sous-total HT'. Always LESS than montantTTC. Example: 104.58",
  "tva": "VAT amount in euros (NUMBER). Look for: 'TVA', 'Dont TVA', 'Montant TVA'. Verify: montantHT + tva ≈ montantTTC. Example: 20.92",
  "tauxTVA": "VAT rate as percentage (NUMBER without %). Common values: 20, 10, 5.5, 2.1. Look for: 'TVA 20%', '20.00%'. Example: 20",
  "numero": "Unique invoice number. Look for: 'Facture N°', 'N°', 'Numero:', 'Ref:', or patterns like 'FA-2024-001', 'INV-123'. Usually at TOP of document. Example: 'FA-2024-0315'",
  "confidence": {
    "fournisseur": "Score 0-1 (1=perfectly readable, 0=illegible)",
    "date": "Score 0-1",
    "montant": "Score 0-1 for montantTTC",
    "tva": "Score 0-1",
    "numero": "Score 0-1",
    "adresse": "Score 0-1"
  }
}

MANDATORY VALIDATION:
1. MATHEMATICAL CONSISTENCY: montantTTC ≈ montantHT + tva (tolerance ±1€)
   - If inconsistency > 1€, reduce confidence scores to 0.3 maximum
   - If montantTTC < montantHT, there is an ERROR, swap them

2. DATE CONSISTENCY:
   - Date NEVER in the future
   - Date NEVER before year 2000
   - If invalid date, set null

3. AMOUNT CONSISTENCY:
   - All amounts must be > 0
   - montantTTC must be the LARGEST amount
   - tva must be < montantTTC
   - If montantTTC > 100000€, verify twice (probable error)

4. VAT CONSISTENCY:
   - If tauxTVA found, verify: tva ≈ montantHT × (tauxTVA/100)
   - Common rates: 20%, 10%, 5.5%, 2.1%

5. SUPPLIER vs CUSTOMER:
   - Supplier is the one who ISSUES the invoice (at top)
   - DO NOT confuse with customer/recipient (often marked 'Client:', 'Destinataire:')

VALID RESPONSE EXAMPLES:

Example 1 - Classic invoice:
{
  "fournisseur": "SARL DUPONT ET FILS",
  "adresse": "15 rue de la Republique, 75001 Paris",
  "date": "2024-03-15",
  "montantTTC": 125.50,
  "montantHT": 104.58,
  "tva": 20.92,
  "tauxTVA": 20,
  "numero": "FA-2024-0315",
  "confidence": {
    "fournisseur": 0.95,
    "date": 0.90,
    "montant": 0.95,
    "tva": 0.85,
    "numero": 0.80,
    "adresse": 0.75
  }
}

Example 2 - Receipt (less info):
{
  "fournisseur": "CARREFOUR MARKET",
  "adresse": "Centre Commercial, 69000 Lyon",
  "date": "2024-04-05",
  "montantTTC": 45.80,
  "montantHT": 41.64,
  "tva": 4.16,
  "tauxTVA": 10,
  "numero": null,
  "confidence": {
    "fournisseur": 0.90,
    "date": 0.85,
    "montant": 0.90,
    "tva": 0.70,
    "numero": 0,
    "adresse": 0.60
  }
}

Example 3 - Illegible document:
{
  "fournisseur": null,
  "adresse": null,
  "date": null,
  "montantTTC": null,
  "montantHT": null,
  "tva": null,
  "tauxTVA": null,
  "numero": null,
  "confidence": {
    "fournisseur": 0,
    "date": 0,
    "montant": 0,
    "tva": 0,
    "numero": 0,
    "adresse": 0
  }
}

FINAL INSTRUCTIONS:
- Take your TIME to analyze the ENTIRE document
- Verify amounts and their consistency twice
- In case of doubt, use null rather than an incorrect value
- Confidence scores must reflect the REALITY of readability
- Return ONLY the JSON, nothing else`;

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: 'gpt-4o',
        messages: [
          {
            role: 'user',
            content: [
              { type: 'text', text: prompt },
              {
                type: 'image_url',
                image_url: {
                  url: imageBase64.startsWith('data:')
                    ? imageBase64
                    : `data:image/jpeg;base64,${imageBase64}`,
                  detail: 'high',
                },
              },
            ],
          },
        ],
        max_tokens: 1000,
        temperature: 0.1,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error('OpenAI API error:', response.status, errorData);

      if (response.status === 401) {
        return NextResponse.json(
          { error: 'Cle API OpenAI invalide ou expiree' },
          { status: 401 }
        );
      }
      if (response.status === 429) {
        return NextResponse.json(
          { error: 'Limite de requetes OpenAI atteinte, reessayez plus tard' },
          { status: 429 }
        );
      }

      return NextResponse.json(
        { error: `Erreur OpenAI: ${response.status}` },
        { status: response.status }
      );
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content;

    if (!content) {
      return NextResponse.json(
        { error: 'Reponse vide de OpenAI' },
        { status: 500 }
      );
    }

    let parsed;
    try {
      const cleaned = content
        .replace(/```json\s*/g, '')
        .replace(/```\s*/g, '')
        .trim();
      parsed = JSON.parse(cleaned);
    } catch (parseError) {
      console.error('Erreur parsing reponse OpenAI:', content);
      return NextResponse.json(
        { error: 'Impossible de parser la reponse de l\'IA', rawContent: content },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      data: parsed,
      model: data.model,
      usage: data.usage,
    });

  } catch (error) {
    console.error('Erreur API OCR:', error);
    return NextResponse.json(
      { error: 'Erreur interne du serveur' },
      { status: 500 }
    );
  }
}
