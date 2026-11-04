// AIS (Agriculture Information Service / কৃষি তথ্য সার্ভিস) Client Library
// Official Website: https://ais.gov.bd/
// Department of Agriculture, Ministry of Agriculture, Govt. of Bangladesh

import fallbackData from './ais-fallback.json';

export interface AisMeta {
  source: string;
  ministry: string;
  portalUrl: string;
  callCenter: string;
  email: string;
  phone: string;
  address: string;
  updatedAt: string;
}

export interface AisMonthlySector {
  id: string;
  nameBn: string;
  nameEn: string;
  icon: string;
  stageBn: string;
  stageEn: string;
  directivesBn: string[];
}

export interface AisMonthlyAdvisory {
  url: string;
  monthEn: string;
  monthBn: string;
  titleEn: string;
  titleBn: string;
  authorEn: string;
  authorBn: string;
  periodBn: string;
  periodEn: string;
  introBn: string;
  introEn: string;
  sectors: AisMonthlySector[];
  fullRawHtml?: string;
}

export interface AisSpecialFile {
  id: string;
  title: string;
  titleEn: string;
  category: string;
  categoryBn: string;
  format: 'PDF' | 'JPG' | 'DOC' | 'PNG';
  fileSize: string;
  url: string;
  summaryBn: string;
  summaryEn: string;
}

export interface AisSpecialAdvisories {
  url: string;
  titleEn: string;
  titleBn: string;
  descriptionEn: string;
  descriptionBn: string;
  files: AisSpecialFile[];
}

export interface AisTechStep {
  titleBn: string;
  titleEn: string;
  descBn: string;
  descEn: string;
}

export interface AisCropTechnology {
  url: string;
  titleEn: string;
  titleBn: string;
  primaryTopic: {
    id: string;
    titleBn: string;
    titleEn: string;
    timingBn: string;
    timingEn: string;
    rawHtml?: string;
    steps: AisTechStep[];
  };
  additionalGuides: {
    id: string;
    titleBn: string;
    titleEn: string;
    url: string;
    summaryBn: string;
    summaryEn: string;
  }[];
}

export interface AisCombinedData {
  meta: AisMeta;
  monthlyAdvisory: AisMonthlyAdvisory;
  specialAdvisories: AisSpecialAdvisories;
  cropTechnology: AisCropTechnology;
  isLive: boolean;
  fetchedAt: string;
}

const AIS_URLS = {
  monthly: 'https://ais.gov.bd/pages/static-pages/6922dedd933eb65569e1df05',
  specialFiles: 'https://ais.gov.bd/pages/files/6922dadf933eb65569e0709a',
  technology: 'https://ais.gov.bd/pages/static-pages/6922dfdd933eb65569e2464d'
};

// SWR In-Memory Cache
interface CacheEntry<T> {
  data: T;
  cachedAt: number;
}
const CACHE_TTL_MS = 15 * 60 * 1000; // 15 mins
let combinedCache: CacheEntry<AisCombinedData> | null = null;

/**
 * Fetch HTML with custom headers and timeout
 */
async function fetchAisHtml(url: string): Promise<string | null> {
  try {
    const res = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Accept-Language': 'bn,en-US;q=0.8,en;q=0.6'
      },
      next: { revalidate: 900 },
      signal: AbortSignal.timeout(6000)
    });
    if (!res.ok) return null;
    return await res.text();
  } catch (err) {
    // If running in Node environment where SSL cert validation might fail on .gov.bd
    return null;
  }
}

/**
 * Extract decoded base64 content from AIS static page HTML
 */
function extractDecodedContent(html: string): string | null {
  const match = html.match(/encoded-content="([^"]+)"/);
  if (!match) return null;
  try {
    return Buffer.from(match[1], 'base64').toString('utf-8');
  } catch {
    return null;
  }
}

/**
 * Parse files from AIS files page
 */
function parseFilesFromHtml(html: string): AisSpecialFile[] {
  const chips = [...html.matchAll(/<div class="chip"[^>]*title='([^']+)'[^>]*>([\s\S]*?)<\/div>/gi)];
  if (chips.length === 0) return [];

  return chips.map((c, idx) => {
    const title = c[1];
    const downloadLink = c[2].match(/href="([^"]+)"/)?.[1] || '';
    const isJpg = downloadLink.toLowerCase().includes('.jpg') || downloadLink.toLowerCase().includes('.png');

    // Match with fallback details if title matches
    const matchedFallback = (fallbackData.specialAdvisories.files as AisSpecialFile[]).find(f => f.title === title);

    return {
      id: matchedFallback?.id || `file-${idx}`,
      title,
      titleEn: matchedFallback?.titleEn || title,
      category: matchedFallback?.category || 'General Agriculture',
      categoryBn: matchedFallback?.categoryBn || 'সাধারণ কৃষি',
      format: (isJpg ? 'JPG' : 'PDF') as 'PDF' | 'JPG',
      fileSize: matchedFallback?.fileSize || '1.5 MB',
      url: downloadLink,
      summaryBn: matchedFallback?.summaryBn || `${title} সম্পর্কিত কৃষি তথ্য সার্ভিসের অফিসিয়াল নির্দেশিকা।`,
      summaryEn: matchedFallback?.summaryEn || `Official advisory publication on ${title} by Agriculture Information Service.`
    };
  });
}

/**
 * Get all AIS intelligence combined
 */
export async function getAisCombinedData(forceReload = false): Promise<AisCombinedData> {
  const now = Date.now();
  if (!forceReload && combinedCache && (now - combinedCache.cachedAt < CACHE_TTL_MS)) {
    return combinedCache.data;
  }

  let isLive = false;
  let monthlyAdvisory: AisMonthlyAdvisory = fallbackData.monthlyAdvisory as any;
  let specialAdvisories: AisSpecialAdvisories = fallbackData.specialAdvisories as any;
  let cropTechnology: AisCropTechnology = fallbackData.cropTechnology as any;

  try {
    const [monthlyHtml, filesHtml, techHtml] = await Promise.all([
      fetchAisHtml(AIS_URLS.monthly),
      fetchAisHtml(AIS_URLS.specialFiles),
      fetchAisHtml(AIS_URLS.technology)
    ]);

    if (monthlyHtml) {
      const decoded = extractDecodedContent(monthlyHtml);
      if (decoded && decoded.length > 500) {
        monthlyAdvisory = {
          ...monthlyAdvisory,
          fullRawHtml: decoded
        };
        isLive = true;
      }
    }

    if (filesHtml) {
      const parsedFiles = parseFilesFromHtml(filesHtml);
      if (parsedFiles.length > 0) {
        specialAdvisories = {
          ...specialAdvisories,
          files: parsedFiles
        };
        isLive = true;
      }
    }

    if (techHtml) {
      const decodedTech = extractDecodedContent(techHtml);
      if (decodedTech && decodedTech.length > 200) {
        cropTechnology = {
          ...cropTechnology,
          primaryTopic: {
            ...cropTechnology.primaryTopic,
            rawHtml: decodedTech
          }
        };
        isLive = true;
      }
    }
  } catch (err) {
    console.warn('[ais-client] Upstream fetch warning, serving authentic fallback:', err);
  }

  const result: AisCombinedData = {
    meta: {
      ...fallbackData.meta,
      updatedAt: new Date().toISOString()
    },
    monthlyAdvisory,
    specialAdvisories,
    cropTechnology,
    isLive,
    fetchedAt: new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true })
  };

  combinedCache = {
    data: result,
    cachedAt: now
  };

  return result;
}

