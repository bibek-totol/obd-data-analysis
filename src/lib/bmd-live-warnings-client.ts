// BMD Live Portal Severe Weather Warnings Client
// Upstream Portal: https://server6.bmd.gov.bd/
// Bangladesh Meteorological Department (BMD), Storm Warning Center (SWC), Dhaka

import fallbackData from './bmd-live-warnings-fallback.json';

export interface BmdLiveWarningItem {
  id: string;
  slug: string;
  nameEn: string;
  nameBn: string;
  shortDescEn: string;
  shortDescBn: string;
  category: string;
  severity: 'high' | 'medium' | 'low';
  icon: string;
  enUrl: string;
  bnUrl: string;
  enPdf: string | null;
  bnPdf: string | null;
  enText: string;
  bnText: string;
  hasActiveWarning: boolean;
  issuedDate: string;
  fileCode?: string;
}

export interface BmdLiveWarningsData {
  titleEn: string;
  titleBn: string;
  source: string;
  updatedAt: string;
  breakingNewsEn: string;
  breakingNewsBn: string;
  totalCategories: number;
  activeWarningsCount: number;
  warnings: BmdLiveWarningItem[];
}

export const WARNING_CATEGORIES = [
  {
    id: 'marine',
    slug: 'Marine-Warning',
    nameEn: 'Marine Warning',
    nameBn: 'সামুদ্রিক সতর্কবার্তা',
    shortDescEn: 'Warning signals for Maritime Ports of Chattogram, Cox\'s Bazar, Mongla & Payra, and deep sea fishing fleets.',
    shortDescBn: 'চট্টগ্রাম, কক্সবাজার, মোংলা ও পায়রা সমুদ্রবন্দর এবং গভীর সাগরে অবস্থানরত মাছ ধরার ট্রলার ও নৌযানের জন্য সতর্ক সংকেত।',
    category: 'Marine & Cyclone',
    severity: 'high' as const,
    icon: 'Anchor'
  },
  {
    id: 'inland-riverport',
    slug: 'Inland-Riverport-Warning',
    nameEn: 'Inland Riverport Warning',
    nameBn: 'অভ্যন্তরীণ নদীবন্দরের সতর্কবার্তা',
    shortDescEn: 'Squally wind and gale warnings across inland river basins, waterways, and riverine passenger vessels.',
    shortDescBn: 'দেশের অভ্যন্তরীণ নদীবন্দর সমূহের অববাহিকায় ঝড়ো হাওয়া, নদী অববাহিকা ও যাত্রীবাহী নৌযান সতর্কবার্তা।',
    category: 'Inland Navigation',
    severity: 'medium' as const,
    icon: 'Ship'
  },
  {
    id: 'heavy-rainfall',
    slug: 'Heavy-Rainfall-Warning',
    nameEn: 'Heavy Rainfall Warning',
    nameBn: 'ভারী বর্ষণের সতর্কবার্তা',
    shortDescEn: 'Forecasts of heavy (44–88 mm) to very heavy (≥89 mm) rainfall and hill landslide warnings.',
    shortDescBn: 'ভারী (৪৪-৮৮ মিমি) হতে অতি ভারী (≥৮৯ মিমি) বর্ষণ এবং পাহাড়ি এলাকায় সম্ভাব্য ভূমিধসের সতর্কতা।',
    category: 'Precipitation',
    severity: 'medium' as const,
    icon: 'CloudRain'
  },
  {
    id: 'lightning',
    slug: 'Lightning-Warning',
    nameEn: 'Lightning Warning',
    nameBn: 'বজ্রপাতের সতর্কতা',
    shortDescEn: 'Severe convective thunderstorms, cloud-to-ground lightning alerts, and open field personal safety guidelines.',
    shortDescBn: 'তীব্র মেঘমালা, ঘন ঘন বজ্রপাত ও খোলা স্থানে বজ্রপাতজনিত প্রাণহানি প্রতিরোধে নিরাপত্তা নির্দেশনা।',
    category: 'Severe Weather',
    severity: 'high' as const,
    icon: 'Zap'
  },
  {
    id: 'kalbaishakhi',
    slug: 'Kalbaishakhi-Warning',
    nameEn: 'Kalbaishakhi Warning',
    nameBn: 'কালবৈশাখী সতর্কবার্তা',
    shortDescEn: 'Severe pre-monsoon squalls (Nor\'westers), violent gusty gales, and localized hail storm warnings.',
    shortDescBn: 'প্রাক-বর্ষা মৌসুমের তীব্র কালবৈশাখী ঝড়, বিধ্বংসী দমকা হওয়া ও শিলাবৃষ্টির বিশেষ সতর্কতা।',
    category: 'Severe Weather',
    severity: 'high' as const,
    icon: 'Wind'
  },
  {
    id: 'heat-wave',
    slug: 'Heat-Wave-Warning',
    nameEn: 'Heat Wave Warning',
    nameBn: 'তাপপ্রবাহের সতর্কবার্তা',
    shortDescEn: 'Mild (36–37.9°C), Moderate (38–39.9°C), Severe (40–41.9°C), and Very Severe (≥42°C) temperature alerts.',
    shortDescBn: 'মৃদু (৩৬-৩৭.৯°সে), মাঝারি (৩৮-৩৯.৯°সে), তীব্র (৪০-৪১.৯°সে) এবং অতি তীব্র (≥৪২°সে) তাপপ্রবাহ সতর্কতা।',
    category: 'Temperature Extremes',
    severity: 'medium' as const,
    icon: 'Flame'
  },
  {
    id: 'fog',
    slug: 'Fog-Warning',
    nameEn: 'Fog Warning',
    nameBn: 'কুয়াশার সতর্কবার্তা',
    shortDescEn: 'Moderate to dense fog warnings along river basins, national highways, and aviation visibility guidelines.',
    shortDescBn: 'নদী অববাহিকা ও মহাসড়কে মাঝারি থেকে ঘন কুয়াশা এবং অভ্যন্তরীণ নৌ ও বিমান চলাচলে দৃষ্টিসীমা সতর্কতা।',
    category: 'Visibility & Transport',
    severity: 'low' as const,
    icon: 'CloudFog'
  },
  {
    id: 'special-bulletin',
    slug: 'Special-Weather-Bulletin',
    nameEn: 'Special Weather Bulletin',
    nameBn: 'বিশেষ আবহাওয়া বিজ্ঞপ্তি',
    shortDescEn: 'Tropical depressions, cyclonic storm tracks, sea surge alerts, and national emergency bulletins.',
    shortDescBn: 'গভীর নিম্নচাপ, ঘূর্ণিঝড় প্রস্তুতি, জলোচ্ছ্বাস পূর্বাভাস ও জাতীয় বিশেষ দুর্যোগ সতর্কবার্তা।',
    category: 'Marine & Cyclone',
    severity: 'high' as const,
    icon: 'AlertTriangle'
  }
];

// In-memory cache for live warnings
interface CacheEntry {
  data: BmdLiveWarningsData;
  timestamp: number;
}
let cachedWarnings: CacheEntry | null = null;
const CACHE_TTL_MS = 15 * 60 * 1000; // 15 minutes cache

export function getFallbackBmdLiveWarnings(): BmdLiveWarningsData {
  return fallbackData as BmdLiveWarningsData;
}

// Fetch live warnings from server6.bmd.gov.bd
export async function fetchBmdLiveWarningsData(forceReload = false): Promise<BmdLiveWarningsData> {
  const now = Date.now();
  if (!forceReload && cachedWarnings && (now - cachedWarnings.timestamp < CACHE_TTL_MS)) {
    return cachedWarnings.data;
  }

  try {
    const fetchPromises = WARNING_CATEGORIES.map(async (cat) => {
      const enUrl = `https://server6.bmd.gov.bd/en/p/${cat.slug}`;
      const bnUrl = `https://server6.bmd.gov.bd/bn/p/${cat.slug}`;

      let enPdf: string | null = null;
      let bnPdf: string | null = null;
      let enText = '';
      let bnText = '';
      let issuedDate = '03-11-2026';
      let fileCode = '';

      // Parallel fetch of EN and BN
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
        enPdf = mPdfEn ? mPdfEn[1] : null;
        const mTextEn = htmlEn.match(/<div class="fwrap" id="page_textArea"[^>]*>([\s\S]*?)<\/div>/i);
        enText = mTextEn ? mTextEn[1].replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim() : '';
      }

      if (resBn.status === 'fulfilled' && resBn.value.ok) {
        const htmlBn = await resBn.value.text();
        const mPdfBn = htmlBn.match(/href="([^"]+\.pdf)"/i) || htmlBn.match(/src="([^"]+\.pdf)"/i);
        bnPdf = mPdfBn ? mPdfBn[1] : null;
        const mTextBn = htmlBn.match(/<div class="fwrap" id="page_textArea"[^>]*>([\s\S]*?)<\/div>/i);
        bnText = mTextBn ? mTextBn[1].replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim() : '';
      }

      const activePdf = enPdf || bnPdf;
      if (activePdf) {
        const dMatch = activePdf.match(/\/file\/(\d{4})\/(\d{2})\/(\d{2})\/pdf\/(\d+)\.pdf/);
        if (dMatch) {
          issuedDate = `${dMatch[3]}-${dMatch[2]}-${dMatch[1]}`;
          fileCode = dMatch[4];
        }
      }

      const hasActiveWarning = !!(enPdf || bnPdf);

      return {
        id: cat.id,
        slug: cat.slug,
        nameEn: cat.nameEn,
        nameBn: cat.nameBn,
        shortDescEn: cat.shortDescEn,
        shortDescBn: cat.shortDescBn,
        category: cat.category,
        severity: cat.severity,
        icon: cat.icon,
        enUrl,
        bnUrl,
        enPdf,
        bnPdf,
        enText: enText || (hasActiveWarning ? '' : 'No active warning bulletin issued.'),
        bnText: bnText || (hasActiveWarning ? '' : 'বর্তমানে কোনো সক্রিয় সতর্কবার্তা জারি নেই।'),
        hasActiveWarning,
        issuedDate,
        fileCode: fileCode || undefined
      } as BmdLiveWarningItem;
    });

    const settledResults = await Promise.all(fetchPromises);
    const activeCount = settledResults.filter(w => w.hasActiveWarning).length;

    const liveData: BmdLiveWarningsData = {
      titleEn: fallbackData.titleEn,
      titleBn: fallbackData.titleBn,
      source: 'server6.bmd.gov.bd (Official Live)',
      updatedAt: new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true }),
      breakingNewsEn: fallbackData.breakingNewsEn,
      breakingNewsBn: fallbackData.breakingNewsBn,
      totalCategories: settledResults.length,
      activeWarningsCount: activeCount,
      warnings: settledResults
    };

    cachedWarnings = {
      data: liveData,
      timestamp: Date.now()
    };

    return liveData;
  } catch (err) {
    console.warn('[BMD Live Warnings] Live fetch failed, using authentic fallback dataset:', err);
    return getFallbackBmdLiveWarnings();
  }
}

