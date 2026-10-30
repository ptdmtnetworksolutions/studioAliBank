/**
 * AliBank BIN Detector & Banking Network Resolver
 * Mendeteksi Bank Penerbit (BCA, Mandiri, BRI, BNI, BSI, CIMB, Permata, Nobu, dll),
 * Tipe Kartu (Debit / Kredit / Prepaid), dan Jaringan (GPN, Visa, Mastercard, JCB).
 */

export interface BankInfo {
  id: string;
  name: string;
  shortName: string;
  primaryColor: string;
  secondaryColor: string;
  textColor: string;
  logoText: string;
  tagline: string;
}

export interface CardBinResult {
  bank: BankInfo;
  network: 'GPN' | 'VISA' | 'MASTERCARD' | 'JCB' | 'AMEX' | 'UNKNOWN';
  cardType: 'DEBIT' | 'KREDIT' | 'PREPAID' | 'PREPAID / E-MONEY';
  cardLevel?: string; // Silver, Gold, Platinum, Priority
  isIndonesian: boolean;
  cleanPan: string;
  maskedPan: string;
  formattedPan: string;
}

// Database Bank-Bank Utama Indonesia & Mitra SoftPOS
export const SUPPORTED_BANKS: Record<string, BankInfo> = {
  bca: {
    id: 'bca',
    name: 'PT Bank Central Asia Tbk',
    shortName: 'BCA',
    primaryColor: '#003B70',
    secondaryColor: '#0060B2',
    textColor: '#FFFFFF',
    logoText: 'BCA',
    tagline: 'Senantiasa di Sisi Anda'
  },
  mandiri: {
    id: 'mandiri',
    name: 'PT Bank Mandiri (Persero) Tbk',
    shortName: 'MANDIRI',
    primaryColor: '#003D79',
    secondaryColor: '#F5A623',
    textColor: '#FFFFFF',
    logoText: 'mandiri',
    tagline: 'Terdepan, Terpercaya, Tumbuh Bersama Anda'
  },
  bri: {
    id: 'bri',
    name: 'PT Bank Rakyat Indonesia (Persero) Tbk',
    shortName: 'BRI',
    primaryColor: '#00529C',
    secondaryColor: '#F37021',
    textColor: '#FFFFFF',
    logoText: 'BRI',
    tagline: 'Melayani Dengan Setulus Hati'
  },
  bni: {
    id: 'bni',
    name: 'PT Bank Negara Indonesia (Persero) Tbk',
    shortName: 'BNI',
    primaryColor: '#005E6A',
    secondaryColor: '#F15A24',
    textColor: '#FFFFFF',
    logoText: 'BNI',
    tagline: 'Melayani Negeri, Kebanggaan Bangsa'
  },
  nobu: {
    id: 'nobu',
    name: 'PT Bank Nationalnobu Tbk',
    shortName: 'NOBU BANK',
    primaryColor: '#C41230',
    secondaryColor: '#1A365D',
    textColor: '#FFFFFF',
    logoText: 'NOBU',
    tagline: 'Mitra Resmi SoftPOS & Tap-on-Phone Acquirer'
  },
  bsi: {
    id: 'bsi',
    name: 'PT Bank Syariah Indonesia Tbk',
    shortName: 'BSI',
    primaryColor: '#00A39D',
    secondaryColor: '#EB8C00',
    textColor: '#FFFFFF',
    logoText: 'BSI',
    tagline: 'Sahabat Finansial, Spiritual, dan Sosial'
  },
  cimb: {
    id: 'cimb',
    name: 'PT Bank CIMB Niaga Tbk',
    shortName: 'CIMB NIAGA',
    primaryColor: '#780116',
    secondaryColor: '#ED1C24',
    textColor: '#FFFFFF',
    logoText: 'CIMB',
    tagline: 'Forward Your Potential'
  },
  permata: {
    id: 'permata',
    name: 'PT Bank Permata Tbk',
    shortName: 'PERMATA',
    primaryColor: '#7A9A01',
    secondaryColor: '#005596',
    textColor: '#FFFFFF',
    logoText: 'Permata',
    tagline: 'Making A Difference'
  },
  danamon: {
    id: 'danamon',
    name: 'PT Bank Danamon Indonesia Tbk',
    shortName: 'DANAMON',
    primaryColor: '#F58220',
    secondaryColor: '#003366',
    textColor: '#FFFFFF',
    logoText: 'Danamon',
    tagline: 'Saatnya Pegang Kendali'
  },
  generic: {
    id: 'generic',
    name: 'Bank Penerbit Internasional',
    shortName: 'BANK PARTNER',
    primaryColor: '#1E293B',
    secondaryColor: '#D4AF37',
    textColor: '#FFFFFF',
    logoText: 'CARD',
    tagline: 'EMV Contactless Certified'
  }
};

/**
 * Format string PAN menjadi kelompok 4 digit (misal: 4000 1234 5678 9010)
 */
export function formatCardNumber(pan: string): string {
  const clean = pan.replace(/\D/g, '').slice(0, 19);
  return clean.replace(/(\d{4})(?=\d)/g, '$1 ');
}

/**
 * Mask nomor kartu (misal: 4000 •••• •••• 9010)
 */
export function maskCardNumber(pan: string): string {
  const clean = pan.replace(/\D/g, '');
  if (clean.length < 8) return clean;
  const first4 = clean.slice(0, 4);
  const last4 = clean.slice(-4);
  return `${first4} •••• •••• ${last4}`;
}

/**
 * Fungsi Deteksi BIN Utama (Mendeteksi Bank, Brand Jaringan, dan Tipe Kartu)
 */
export function detectCardBin(cardNumber: string): CardBinResult {
  const cleanPan = cardNumber.replace(/\D/g, '');
  const bin6 = cleanPan.slice(0, 6);
  const bin4 = cleanPan.slice(0, 4);
  const bin2 = cleanPan.slice(0, 2);
  const bin1 = cleanPan.slice(0, 1);

  let network: CardBinResult['network'] = 'UNKNOWN';
  let cardType: CardBinResult['cardType'] = 'DEBIT';
  let bank: BankInfo = SUPPORTED_BANKS.generic;
  let isIndonesian = false;
  let cardLevel = 'Standard';

  // 1. Tentukan Jaringan Kartu (Network)
  if (bin1 === '4') {
    network = 'VISA';
  } else if (
    (parseInt(bin2, 10) >= 51 && parseInt(bin2, 10) <= 55) ||
    (parseInt(bin4, 10) >= 2221 && parseInt(bin4, 10) <= 2720)
  ) {
    network = 'MASTERCARD';
  } else if (
    bin4.startsWith('6010') || 
    bin4.startsWith('6013') || 
    bin4.startsWith('6018') || 
    bin4.startsWith('6019') || 
    bin4.startsWith('6032') || 
    bin4.startsWith('6033') || 
    bin4.startsWith('6063')
  ) {
    network = 'GPN';
    isIndonesian = true;
  } else if (
    (parseInt(bin4, 10) >= 3528 && parseInt(bin4, 10) <= 3589) ||
    bin2 === '35'
  ) {
    network = 'JCB';
  } else if (bin2 === '34' || bin2 === '37') {
    network = 'AMEX';
  }

  // 2. Pemetaan BIN Spesifik Bank & Tipe Kartu di Indonesia

  // --- BCA (Bank Central Asia) ---
  if (
    bin6.startsWith('537941') || bin6.startsWith('526422') || bin6.startsWith('526423') ||
    bin6.startsWith('519893') || bin6.startsWith('537176') ||
    bin6.startsWith('601900') || bin6.startsWith('601901') || bin6.startsWith('601902') || bin6.startsWith('601903') ||
    bin4 === '6019'
  ) {
    bank = SUPPORTED_BANKS.bca;
    cardType = 'DEBIT';
    isIndonesian = true;
    cardLevel = bin6.includes('5264') ? 'Platinum' : 'Gold';
  } else if (
    bin6.startsWith('455632') || bin6.startsWith('455633') || bin6.startsWith('472640') ||
    bin6.startsWith('472641') || bin6.startsWith('412513') || bin6.startsWith('541070') ||
    bin6.startsWith('527146') || bin6.startsWith('3565')
  ) {
    bank = SUPPORTED_BANKS.bca;
    cardType = 'KREDIT';
    isIndonesian = true;
    cardLevel = 'BCA Card Black / Platinum';
  } else if (bin4 === '6013' && (cleanPan.includes('FLAZZ') || bin6.startsWith('601301'))) {
    bank = SUPPORTED_BANKS.bca;
    cardType = 'PREPAID / E-MONEY';
    isIndonesian = true;
    cardLevel = 'Flazz Contactless';
  }

  // --- BANK MANDIRI ---
  else if (
    bin4 === '6032' || bin4 === '6033' || bin6.startsWith('603298') || bin6.startsWith('603299') || bin6.startsWith('603300')
  ) {
    bank = SUPPORTED_BANKS.mandiri;
    cardType = 'PREPAID / E-MONEY';
    isIndonesian = true;
    cardLevel = 'Mandiri e-Money Prabayar';
  } else if (
    bin6.startsWith('409755') || bin6.startsWith('413718') || bin6.startsWith('413719') ||
    bin6.startsWith('425945') || bin6.startsWith('461700') || bin6.startsWith('461701')
  ) {
    bank = SUPPORTED_BANKS.mandiri;
    cardType = 'DEBIT';
    isIndonesian = true;
    cardLevel = 'Mandiri Debit Prioritas / GPN';
  } else if (
    bin6.startsWith('414931') || bin6.startsWith('466387') || bin6.startsWith('524325') ||
    bin6.startsWith('528980') || bin6.startsWith('557338')
  ) {
    bank = SUPPORTED_BANKS.mandiri;
    cardType = 'KREDIT';
    isIndonesian = true;
    cardLevel = 'Mandiri Signature / Platinum';
  }

  // --- BANK BRI ---
  else if (
    bin6.startsWith('522184') || bin6.startsWith('532659') || bin6.startsWith('532660') ||
    (bin4 === '6013' && !bin6.startsWith('601301'))
  ) {
    bank = SUPPORTED_BANKS.bri;
    cardType = 'DEBIT';
    isIndonesian = true;
    cardLevel = 'BritAma Mastercard';
  } else if (
    bin6.startsWith('436502') || bin6.startsWith('462749') || bin6.startsWith('518828') || bin6.startsWith('518856')
  ) {
    bank = SUPPORTED_BANKS.bri;
    cardType = 'KREDIT';
    isIndonesian = true;
    cardLevel = 'BRI Touch / Infinite';
  }

  // --- BANK BNI ---
  else if (
    bin6.startsWith('524495') || bin6.startsWith('532668') ||
    bin6.startsWith('601034') || bin6.startsWith('601035') || bin4 === '6010'
  ) {
    bank = SUPPORTED_BANKS.bni;
    cardType = 'DEBIT';
    isIndonesian = true;
    cardLevel = 'BNI Debit Emerald';
  } else if (
    bin6.startsWith('405651') || bin6.startsWith('422144') || bin6.startsWith('439012') ||
    bin6.startsWith('472010') || bin6.startsWith('517643') || bin6.startsWith('548415')
  ) {
    bank = SUPPORTED_BANKS.bni;
    cardType = 'KREDIT';
    isIndonesian = true;
    cardLevel = 'BNI Visa Signature';
  }

  // --- BANK NOBU (Mitra SoftPOS Acquirer Resmi) ---
  else if (
    bin6.startsWith('589388') || bin6.startsWith('601988') || bin6.startsWith('936008') ||
    cleanPan.startsWith('4890') // AliBank SoftPOS Virtual EMV PAN range
  ) {
    bank = SUPPORTED_BANKS.nobu;
    cardType = 'DEBIT';
    isIndonesian = true;
    cardLevel = 'Nobu Contactless Pay';
  }

  // --- BANK SYARIAH INDONESIA (BSI) ---
  else if (
    bin6.startsWith('404305') || bin4 === '4043' || bin6.startsWith('432204') ||
    bin6.startsWith('403816') || bin6.startsWith('606388') || bin6.startsWith('606389') ||
    bin4 === '6063' || bin4 === '1955'
  ) {
    bank = SUPPORTED_BANKS.bsi;
    cardType = 'DEBIT';
    isIndonesian = true;
    cardLevel = (bin6.startsWith('404305') || bin4 === '4043') 
      ? 'BSI Debit Visa Contactless' 
      : 'BSI Debit GPN';
  } else if (
    bin6.startsWith('518446') || bin6.startsWith('531857') || bin6.startsWith('522028') ||
    bin6.startsWith('521082') || bin6.startsWith('425944') || bin6.startsWith('410887')
  ) {
    bank = SUPPORTED_BANKS.bsi;
    cardType = 'KREDIT';
    isIndonesian = true;
    cardLevel = bin6.startsWith('518446') 
      ? 'BSI Hasanah Card Platinum' 
      : bin6.startsWith('531857')
      ? 'BSI Hasanah Card Gold'
      : bin6.startsWith('522028')
      ? 'BSI Hasanah Card Classic'
      : 'BSI Hasanah Card';
  }

  // --- CIMB NIAGA ---
  else if (
    bin6.startsWith('421570') || bin6.startsWith('528940') || bin6.startsWith('537926')
  ) {
    bank = SUPPORTED_BANKS.cimb;
    cardType = 'DEBIT';
    isIndonesian = true;
    cardLevel = 'OCTO Debit Contactless';
  } else if (
    bin6.startsWith('456732') || bin6.startsWith('512285')
  ) {
    bank = SUPPORTED_BANKS.cimb;
    cardType = 'KREDIT';
    isIndonesian = true;
    cardLevel = 'CIMB Niaga Ultimate';
  }

  // --- Generic International Cards fallback ---
  else if (network === 'VISA') {
    cardType = cleanPan.startsWith('40') ? 'DEBIT' : 'KREDIT';
    cardLevel = 'Visa Classic / Gold';
  } else if (network === 'MASTERCARD') {
    cardType = cleanPan.startsWith('51') ? 'DEBIT' : 'KREDIT';
    cardLevel = 'Mastercard World';
  }

  return {
    bank,
    network,
    cardType,
    cardLevel,
    isIndonesian,
    cleanPan,
    maskedPan: maskCardNumber(cleanPan),
    formattedPan: formatCardNumber(cleanPan)
  };
}

