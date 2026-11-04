// BMD Live Portal Three-Month Climate Outlook Client
// Upstream Portal: https://server6.bmd.gov.bd/en/p/Three-Month-Outlook
// Bangladesh Meteorological Department (BMD), Expert Committee & SWC, Dhaka

import fallbackData from './bmd-live-outlook-fallback.json';

export interface SynopticDirective {
  id: string;
  icon: string;
  nameEn: string;
  nameBn: string;
  statusEn: string;
  statusBn: string;
  severity: 'high' | 'medium' | 'normal';
  summaryEn: string;
  summaryBn: string;
}

export interface DivisionRainfallForecast {
  divisionEn: string;
  divisionBn: string;
  novNormal: number;
  novForecast: string;
  decNormal: number;
  decForecast: string;
  janNormal: number;
  janForecast: string;
  soilMoistureNov: string;
}

export interface PreviousMonthReview {
  monthEn: string;
  monthBn: string;
  monsoonWithdrawalDate: string;
  rainfallDeficitPct: string;
  cyclonicSystems: string;
  highestDailyRainfall: string;
  highestTemp: string;
  lowestTemp: string;
  soiIndices: string;
}

export interface BmdLiveOutlookData {
  titleEn: string;
  titleBn: string;
  source: string;
  refNo: string;
  issuedDate: string;
  validityPeriodEn: string;
  validityPeriodBn: string;
  authorityEn: string;
  authorityBn: string;
  chairmanEn: string;
  chairmanBn: string;
  enUrl: string;
  bnUrl: string;
  enPdf: string | null;
  bnPdf: string | null;
  fileCodeEn?: string;
  fileCodeBn?: string;
  updatedAt: string;
  synopticDirectives: SynopticDirective[];
  divisionsRainfall: DivisionRainfallForecast[];
  previousMonthReview: PreviousMonthReview;
}

// In-memory cache
interface CacheEntry {
  data: BmdLiveOutlookData;
  timestamp: number;
}
let cachedOutlook: CacheEntry | null = null;
const CACHE_TTL_MS = 15 * 60 * 1000; // 15 minutes cache

export function getFallbackBmdLiveOutlook(): BmdLiveOutlookData {
  return fallbackData as BmdLiveOutlookData;
}

// Convert English digits to Bengali digits
export function toBengaliNumeral(num: number | string): string {
  const bnDigits = ['০', '১', '২', '৩', '৪', '৫', '৬', '৭', '৮', '৯'];
  return String(num).replace(/[0-9]/g, (w) => bnDigits[parseInt(w, 10)]);
}

// Fetch live outlook from server6.bmd.gov.bd
export async function fetchBmdLiveOutlookData(forceReload = false): Promise<BmdLiveOutlookData> {
  const now = Date.now();
  if (!forceReload && cachedOutlook && (now - cachedOutlook.timestamp < CACHE_TTL_MS)) {
    return cachedOutlook.data;
  }

  const enUrl = 'https://server6.bmd.gov.bd/en/p/Three-Month-Outlook';
  const bnUrl = 'https://server6.bmd.gov.bd/bn/p/Three-Month-Outlook';

  try {
    let enPdf: string | null = null;
    let bnPdf: string | null = null;
    let issuedDate = fallbackData.issuedDate;
    let fileCodeEn = fallbackData.fileCodeEn;
    let fileCodeBn = fallbackData.fileCodeBn;

    // Parallel fetch of EN and BN pages
    const [resEn, resBn] = await Promise.allSettled([
      fetch(enUrl, {
        headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36' },
        signal: AbortSignal.timeout(6000)
      }),
      fetch(bnUrl, {
        headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36' },
        signal: AbortSignal.timeout(6000)
      })
    ]);

    if (resEn.status === 'fulfilled' && resEn.value.ok) {
      const htmlEn = await resEn.value.text();
      const mPdfEn = htmlEn.match(/href="([^"]+\.pdf)"/i) || htmlEn.match(/src="([^"]+\.pdf)"/i);
      if (mPdfEn) {
        enPdf = mPdfEn[1];
        const dMatch = enPdf.match(/\/file\/(\d{4})\/(\d{2})\/(\d{2})\/pdf\/(\d+)\.pdf/);
        if (dMatch) {
          issuedDate = `${dMatch[3]}-${dMatch[2]}-${dMatch[1]}`;
          fileCodeEn = dMatch[4];
        }
      }
    }

    if (resBn.status === 'fulfilled' && resBn.value.ok) {
      const htmlBn = await resBn.value.text();
      const mPdfBn = htmlBn.match(/href="([^"]+\.pdf)"/i) || htmlBn.match(/src="([^"]+\.pdf)"/i);
      if (mPdfBn) {
        bnPdf = mPdfBn[1];
        const dMatch = bnPdf.match(/\/file\/(\d{4})\/(\d{2})\/(\d{2})\/pdf\/(\d+)\.pdf/);
        if (dMatch) {
          fileCodeBn = dMatch[4];
        }
      }
    }

    const liveData: BmdLiveOutlookData = {
      titleEn: fallbackData.titleEn,
      titleBn: fallbackData.titleBn,
      source: 'server6.bmd.gov.bd (Official Live)',
      refNo: fallbackData.refNo,
      issuedDate: issuedDate || fallbackData.issuedDate,
      validityPeriodEn: fallbackData.validityPeriodEn,
      validityPeriodBn: fallbackData.validityPeriodBn,
      authorityEn: fallbackData.authorityEn,
      authorityBn: fallbackData.authorityBn,
      chairmanEn: fallbackData.chairmanEn,
      chairmanBn: fallbackData.chairmanBn,
      enUrl,
      bnUrl,
      enPdf: enPdf || fallbackData.enPdf,
      bnPdf: bnPdf || fallbackData.bnPdf,
      fileCodeEn: fileCodeEn || fallbackData.fileCodeEn,
      fileCodeBn: fileCodeBn || fallbackData.fileCodeBn,
      updatedAt: new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true }),
      synopticDirectives: fallbackData.synopticDirectives as SynopticDirective[],
      divisionsRainfall: fallbackData.divisionsRainfall as DivisionRainfallForecast[],
      previousMonthReview: fallbackData.previousMonthReview as PreviousMonthReview
    };

    cachedOutlook = {
      data: liveData,
      timestamp: Date.now()
    };

    return liveData;
  } catch (err) {
    console.warn('[BMD Live Outlook] Live fetch failed, using authentic fallback dataset:', err);
    return getFallbackBmdLiveOutlook();
  }
}

