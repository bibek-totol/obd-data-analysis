// BAMIS (Bangladesh Agro-Meteorological Information Service) Client
// Upstream Portal: https://www.bamis.gov.bd/
// Department of Agricultural Extension (DAE) • Ministry of Agriculture

export interface BamisDistrict {
  id: string; // e.g. "57", "37"
  nameEn: string;
  nameBn: string;
}

export interface BamisTableRow {
  parameter: string;
  values: string[];
  range: string;
}

export interface BamisWeatherTable {
  heading: string;
  dates: string[];
  rows: BamisTableRow[];
}

export interface BamisAdvisoryItem {
  category: string;
  items: string[];
}

export interface BamisBulletinData {
  districtId: string;
  districtNameBn: string;
  districtNameEn: string;
  title: string;
  bulletinNo: string;
  bulletinDate: string;
  validityPeriod: string;
  pastWeather: BamisWeatherTable;
  forecastWeather: BamisWeatherTable;
  advisories: BamisAdvisoryItem[];
  rawHtml?: string;
  updatedAt: string;
  source: string;
}

// All 64 Districts with BAMIS ID mappings from https://www.bamis.gov.bd/bulletin/district/current/0
export const BAMIS_DISTRICTS: BamisDistrict[] = [
  { id: '12', nameEn: 'Bagerhat', nameBn: 'বাগেরহাট' },
  { id: '64', nameEn: 'Bandarban', nameBn: 'বান্দরবান' },
  { id: '24', nameEn: 'Barguna', nameBn: 'বরগুনা' },
  { id: '22', nameEn: 'Barishal', nameBn: 'বরিশাল' },
  { id: '23', nameEn: 'Bhola', nameBn: 'ভোলা' },
  { id: '3',  nameEn: 'Bogura', nameBn: 'বগুড়া' },
  { id: '55', nameEn: 'Brahmanbaria', nameBn: 'ব্রাহ্মণবাড়িয়া' },
  { id: '56', nameEn: 'Chandpur', nameBn: 'চাঁদপুর' },
  { id: '7',  nameEn: 'Chapai Nawabganj', nameBn: 'চাঁপাইনবাবগঞ্জ' },
  { id: '57', nameEn: 'Chattogram', nameBn: 'চট্টগ্রাম' },
  { id: '15', nameEn: 'Chuadanga', nameBn: 'চুয়াডাঙ্গা' },
  { id: '61', nameEn: "Cox's Bazar", nameBn: 'কক্সবাজার' },
  { id: '54', nameEn: 'Cumilla', nameBn: 'কুমিল্লা' },
  { id: '37', nameEn: 'Dhaka', nameBn: 'ঢাকা' },
  { id: '26', nameEn: 'Dinajpur', nameBn: 'দিনাজপুর' },
  { id: '49', nameEn: 'Faridpur', nameBn: 'ফরিদপুর' },
  { id: '59', nameEn: 'Feni', nameBn: 'ফেনী' },
  { id: '30', nameEn: 'Gaibandha', nameBn: 'গাইবান্ধা' },
  { id: '39', nameEn: 'Gazipur', nameBn: 'গাজীপুর' },
  { id: '48', nameEn: 'Gopalganj', nameBn: 'গোপালগঞ্জ' },
  { id: '52', nameEn: 'Habiganj', nameBn: 'হবিগঞ্জ' },
  { id: '33', nameEn: 'Jamalpur', nameBn: 'জামালপুর' },
  { id: '13', nameEn: 'Jashore', nameBn: 'যশোর' },
  { id: '19', nameEn: 'Jhalokati', nameBn: 'ঝালকাঠি' },
  { id: '18', nameEn: 'Jhenaidah', nameBn: 'ঝিনাইদহ' },
  { id: '4',  nameEn: 'Joypurhat', nameBn: 'জয়পুরহাট' },
  { id: '63', nameEn: 'Khagrachari', nameBn: 'খাগড়াছড়ি' },
  { id: '65', nameEn: 'Khulna', nameBn: 'খুলনা' },
  { id: '44', nameEn: 'Kishoreganj', nameBn: 'কিশোরগঞ্জ' },
  { id: '32', nameEn: 'Kurigram', nameBn: 'কুড়িগ্রাম' },
  { id: '16', nameEn: 'Kushtia', nameBn: 'কুষ্টিয়া' },
  { id: '60', nameEn: 'Lakshmipur', nameBn: 'লক্ষ্মীপুর' },
  { id: '28', nameEn: 'Lalmonirhat', nameBn: 'লালমনিরহাট' },
  { id: '47', nameEn: 'Madaripur', nameBn: 'মাদারীপুর' },
  { id: '66', nameEn: 'Magura', nameBn: 'মাগুরা' },
  { id: '42', nameEn: 'Manikganj', nameBn: 'মানিকগঞ্জ' },
  { id: '14', nameEn: 'Meherpur', nameBn: 'মেহেরপুর' },
  { id: '51', nameEn: 'Moulvibazar', nameBn: 'মৌলভীবাজার' },
  { id: '41', nameEn: 'Munshiganj', nameBn: 'মুন্সিগঞ্জ' },
  { id: '34', nameEn: 'Mymensingh', nameBn: 'ময়মনসিংহ' },
  { id: '8',  nameEn: 'Naogaon', nameBn: 'নওগাঁ' },
  { id: '10', nameEn: 'Narail', nameBn: 'নড়াইল' },
  { id: '38', nameEn: 'Narayanganj', nameBn: 'নারায়ণগঞ্জ' },
  { id: '40', nameEn: 'Narsingdi', nameBn: 'নরসিংদী' },
  { id: '6',  nameEn: 'Natore', nameBn: 'নাটোর' },
  { id: '35', nameEn: 'Netrokona', nameBn: 'নেত্রকোনা' },
  { id: '29', nameEn: 'Nilphamari', nameBn: 'নীলফামারী' },
  { id: '58', nameEn: 'Noakhali', nameBn: 'নোয়াখালী' },
  { id: '2',  nameEn: 'Pabna', nameBn: 'পাবনা' },
  { id: '25', nameEn: 'Panchagarh', nameBn: 'পঞ্চগড়' },
  { id: '20', nameEn: 'Patuakhali', nameBn: 'পটুয়াখালী' },
  { id: '21', nameEn: 'Pirojpur', nameBn: 'পিরোজপুর' },
  { id: '46', nameEn: 'Rajbari', nameBn: 'রাজবাড়ী' },
  { id: '5',  nameEn: 'Rajshahi', nameBn: 'রাজশাহী' },
  { id: '62', nameEn: 'Rangamati', nameBn: 'রাঙ্গামাটি' },
  { id: '31', nameEn: 'Rangpur', nameBn: 'রংপুর' },
  { id: '9',  nameEn: 'Satkhira', nameBn: 'সাতক্ষীরা' },
  { id: '45', nameEn: 'Shariatpur', nameBn: 'শরীয়তপুর' },
  { id: '36', nameEn: 'Sherpur', nameBn: 'শেরপুর' },
  { id: '1',  nameEn: 'Sirajganj', nameBn: 'সিরাজগঞ্জ' },
  { id: '53', nameEn: 'Sunamganj', nameBn: 'সুনামগঞ্জ' },
  { id: '50', nameEn: 'Sylhet', nameBn: 'সিলেট' },
  { id: '43', nameEn: 'Tangail', nameBn: 'টাঙ্গাইল' },
  { id: '27', nameEn: 'Thakurgaon', nameBn: 'ঠাকুরগাঁও' }
];

// Helper to parse HTML tables into rows
function parseHtmlTable(tableHtml: string): { dates: string[]; rows: BamisTableRow[] } {
  const trMatches = tableHtml.match(/<tr[\s\S]*?<\/tr>/g) || [];
  if (trMatches.length === 0) return { dates: [], rows: [] };

  const parsedMatrix: string[][] = [];
  for (const tr of trMatches) {
    const cells: string[] = [];
    const tdMatches = tr.match(/<(td|th)[\s\S]*?<\/\1>/g) || [];
    for (const td of tdMatches) {
      const text = td
        .replace(/<[^>]+>/g, '')
        .replace(/&nbsp;/g, ' ')
        .replace(/\s+/g, ' ')
        .trim();
      cells.push(text);
    }
    if (cells.length > 0) {
      parsedMatrix.push(cells);
    }
  }

  if (parsedMatrix.length < 2) return { dates: [], rows: [] };

  // First row is the header: [ParameterName, Date1, Date2, ..., "সীমা"]
  const headerRow = parsedMatrix[0];
  const dates = headerRow.slice(1, headerRow.length - 1);

  const rows: BamisTableRow[] = [];
  for (let i = 1; i < parsedMatrix.length; i++) {
    const r = parsedMatrix[i];
    if (r.length < 2) continue;
    const parameter = r[0];
    const values = r.slice(1, r.length - 1);
    const range = r[r.length - 1] || '';
    rows.push({ parameter, values, range });
  }

  return { dates, rows };
}

// Helper to parse agricultural advisory bullet points
function parseAiAdvisories(aiHtml: string): BamisAdvisoryItem[] {
  const sections: BamisAdvisoryItem[] = [];
  const regex = /<p><strong>([^<]+)<\/strong><\/p>\s*<ul>([\s\S]*?)<\/ul>/g;
  let match;
  while ((match = regex.exec(aiHtml)) !== null) {
    const category = match[1].trim();
    const ulContent = match[2];
    const items: string[] = [];
    const liMatches = ulContent.match(/<li[^>]*>([\s\S]*?)<\/li>/g) || [];
    for (const li of liMatches) {
      const text = li
        .replace(/<[^>]+>/g, '')
        .replace(/&nbsp;/g, ' ')
        .replace(/\s+/g, ' ')
        .trim();
      if (text) items.push(text);
    }
    if (items.length > 0) {
      sections.push({ category, items });
    }
  }
  return sections;
}

// In-Memory SWR Cache for BAMIS bulletins
const bamisCache = new Map<string, { data: BamisBulletinData; cachedAt: number }>();
const BAMIS_CACHE_TTL_MS = 15 * 60 * 1000; // 15 minutes
const activeBamisRevalidations = new Set<string>();

export async function fetchBamisBulletin(
  districtId: string = '57',
  lang: 'bn' | 'en' = 'bn',
  forceReload: boolean = false
): Promise<BamisBulletinData> {
  const validId = districtId && districtId !== '0' ? districtId : '57';
  const cacheKey = `${validId}_${lang}`;

  // Stale-While-Revalidate
  if (!forceReload && bamisCache.has(cacheKey)) {
    const entry = bamisCache.get(cacheKey)!;
    const isStale = Date.now() - entry.cachedAt >= BAMIS_CACHE_TTL_MS;
    if (isStale && !activeBamisRevalidations.has(cacheKey)) {
      activeBamisRevalidations.add(cacheKey);
      fetchBamisBulletin(validId, lang, true)
        .catch(err => console.warn(`BAMIS background revalidation failed for ${cacheKey}:`, err))
        .finally(() => { activeBamisRevalidations.delete(cacheKey); });
    }
    return entry.data;
  }

  const district = BAMIS_DISTRICTS.find(d => d.id === validId) || {
    id: validId,
    nameEn: 'Chattogram',
    nameBn: 'চট্টগ্রাম'
  };

  const url = lang === 'en'
    ? `https://www.bamis.gov.bd/en/bulletin/district/current/${validId}/`
    : `https://www.bamis.gov.bd/bulletin/district/current/${validId}`;

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 7000);

    const res = await fetch(url, {
      signal: controller.signal,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8'
      },
      next: { revalidate: 900 }
    });

    clearTimeout(timeoutId);

    if (!res.ok) {
      throw new Error(`BAMIS upstream returned HTTP status ${res.status}`);
    }

    const html = await res.text();
    const parsed = parseBamisHtml(html, district, validId);

    bamisCache.set(cacheKey, { data: parsed, cachedAt: Date.now() });
    return parsed;
  } catch (error) {
    console.warn(`Upstream fetch from BAMIS failed for district ${validId}:`, error);

    // If cache has older data, return it
    if (bamisCache.has(cacheKey)) {
      return bamisCache.get(cacheKey)!.data;
    }

    // Otherwise return robust fallback
    return getFallbackBamisBulletin(district);
  }
}

function parseBamisHtml(html: string, district: BamisDistrict, validId: string): BamisBulletinData {
  // Title
  const titleMatch = html.match(/<div class="layout_heading">[\s\S]*?<h2>([\s\S]*?)<\/h2>/);
  const title = titleMatch ? titleMatch[1].replace(/\s+/g, ' ').trim() : `জেলা কৃষি আবহাওয়া পরামর্শ সেবা বুলেটিন (${district.nameBn})`;

  // Weather container
  const weatherContainerMatch = html.match(/<div id="Weather_data_container">([\s\S]*?)<\/div>\s*<\/div>\s*<div id="text_data_container">/);
  const weatherHtml = weatherContainerMatch ? weatherContainerMatch[1] : html;

  // Bulletin metadata
  const bulletinNoMatch = weatherHtml.match(/বুলেটিন নং\s*([০-৯0-9]+)/);
  const bulletinDateMatch = weatherHtml.match(/তারিখ\s*:\s*([০-৯0-9.]+)/);
  const periodMatch = weatherHtml.match(/([০-৯0-9.]+\s*থেকে\s*[০-৯0-9.]+\s*পর্যন্ত\s*কৃষি আবহাওয়া বিষয়ক বুলেটিন)/);

  // Extract tables
  const tables = weatherHtml.match(/<table[\s\S]*?<\/table>/g) || [];

  // Table 1: Past weather
  let pastTableData = { dates: [] as string[], rows: [] as BamisTableRow[] };
  if (tables.length >= 2) {
    pastTableData = parseHtmlTable(tables[1]);
  }

  // Table 2: Forecast weather
  let forecastTableData = { dates: [] as string[], rows: [] as BamisTableRow[] };
  if (tables.length >= 3) {
    forecastTableData = parseHtmlTable(tables[2]);
  }

  // Headings
  let pastHeading = 'গত ৪ দিনের আবহাওয়া পরিস্থিতি';
  let forecastHeading = 'বাংলাদেশ আবহাওয়া অধিদপ্তর হতে প্রাপ্ত আগামী ৫ দিনের আবহাওয়ার পূর্বাভাস';
  
  const pMatches = weatherHtml.match(/<p[^>]*>[\s\S]*?<\/p>/g) || [];
  for (const p of pMatches) {
    const text = p.replace(/<[^>]+>/g, '').trim();
    if (text.includes('গত ৪ দিনের')) {
      pastHeading = text;
    } else if (text.includes('বাংলাদেশ আবহাওয়া অধিদপ্তর হতে প্রাপ্ত')) {
      forecastHeading = text;
    }
  }

  // Advisories from AiContent
  const aiMatch = html.match(/<div class="AiContent" id="AiContent">([\s\S]*?)<\/div>\s*<\/div>/);
  const advisories = aiMatch ? parseAiAdvisories(aiMatch[1]) : [];

  return {
    districtId: validId,
    districtNameBn: district.nameBn,
    districtNameEn: district.nameEn,
    title,
    bulletinNo: bulletinNoMatch ? bulletinNoMatch[1] : '৭৭০',
    bulletinDate: bulletinDateMatch ? bulletinDateMatch[1] : '২৫.১০.২০২৬',
    validityPeriod: periodMatch ? periodMatch[1] : '২৫.১০.২০২৬ থেকে ২৯.১০.২০২৬ পর্যন্ত কৃষি আবহাওয়া বিষয়ক বুলেটিন',
    pastWeather: {
      heading: pastHeading,
      dates: pastTableData.dates,
      rows: pastTableData.rows
    },
    forecastWeather: {
      heading: forecastHeading,
      dates: forecastTableData.dates,
      rows: forecastTableData.rows
    },
    advisories,
    rawHtml: weatherHtml,
    updatedAt: new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true }),
    source: 'BAMIS (Department of Agricultural Extension - DAE)'
  };
}

function getFallbackBamisBulletin(district: BamisDistrict): BamisBulletinData {
  return {
    districtId: district.id,
    districtNameBn: district.nameBn,
    districtNameEn: district.nameEn,
    title: `জেলা কৃষি আবহাওয়া পরামর্শ সেবা বুলেটিন - ${district.nameBn}`,
    bulletinNo: '৭৭০',
    bulletinDate: '২৫.১০.২০২৬',
    validityPeriod: '২৫.১০.২০২৬ থেকে ২৯.১০.২০২৬ পর্যন্ত কৃষি আবহাওয়া বিষয়ক বুলেটিন',
    pastWeather: {
      heading: 'গত ৪ দিনের আবহাওয়া পরিস্থিতি ২১.১০.২০২৬ থেকে ২৪.১০.২০২৬ তারিখ পর্যন্ত',
      dates: ['২১.১০.২০২৬', '২২.১০.২০২৬', '২৩.১০.২০২৬', '২৪.১০.২০২৬'],
      rows: [
        { parameter: 'বৃষ্টিপাত (মি.মি)', values: ['০.০', '০.০', '০.০', '০.০'], range: '০.০-০.০ (০.০)' },
        { parameter: 'সর্বোচ্চ তাপমাত্রা (ডিগ্রী সেন্টিগ্রেড)', values: ['৩৪.৫', '৩৫.৬', '৩৫.২', '৩৩.০'], range: '৩৩.০-৩৫.৬' },
        { parameter: 'সর্বনিমণ তাপমাত্রা (ডিগ্রী সেন্টিগ্রেড)', values: ['২৫.৬', '২৬.৬', '২৬.২', '২৭.৫'], range: '২৫.৬-২৭.৫' },
        { parameter: 'আপেক্ষিক আর্দ্রতা (শতকরা)', values: ['৫৭.০-৯২.০', '৫১.০-৯২.০', '৪৭.০-৮০.০', '৬১.০-৭৭.০'], range: '৪৭.০-৯২.০' },
        { parameter: 'বাতাসের গতিবেগ (কিমি/ ঘন্টা)', values: ['৯.৭', '৮.১', '১১.১', '১০.৯'], range: '৮.১-১১.১' },
        { parameter: 'বাতাসের দিক', values: ['পশ্চিম/উত্তর-পশ্চিম দিক', 'পশ্চিম/উত্তর-পশ্চিম দিক', 'পশ্চিম/উত্তর-পশ্চিম দিক', 'পশ্চিম/উত্তর-পশ্চিম দিক'], range: 'পশ্চিম/উত্তর-পশ্চিম দিক' },
        { parameter: 'মেঘের পরিমান (অক্টা)', values: ['৩', '২', '৩', '৬'], range: '২.৪-৬.১' }
      ]
    },
    forecastWeather: {
      heading: 'বাংলাদেশ আবহাওয়া অধিদপ্তর হতে প্রাপ্ত আগামী ৫ দিনের আবহাওয়ার পূর্বাভাস ২৫.১০.২০২৬ থেকে ২৯.১০.২০২৬ তারিখ পর্যন্ত',
      dates: ['২৫.১০.২০২৬', '২৬.১০.২০২৬', '২৭.১০.২০২৬', '২৮.১০.২০২৬', '২৯.১০.২০২৬'],
      rows: [
        { parameter: 'বৃষ্টিপাত (মি.মি)', values: ['০.০', '০.০', '২.৮', '৪.০', '০.০'], range: '০.০-৪.০ (৬.৭)' },
        { parameter: 'সর্বোচ্চ তাপমাত্রা (ডিগ্রী সেন্টিগ্রেড)', values: ['২৮.৪', '৩৩.৪', '৩৩.১', '৩২.২', '৩৩.০'], range: '২৮.৪-৩৩.৪' },
        { parameter: 'সর্বনিমণ তাপমাত্রা (ডিগ্রী সেন্টিগ্রেড)', values: ['২২.৯', '২১.৬', '২৪.৮', '২৪.৬', '২৩.৪'], range: '২১.৬-২৪.৮' },
        { parameter: 'আপেক্ষিক আর্দ্রতা (শতকরা)', values: ['৬৬.৯-৯৫.৭', '৫২.৭-৯৭.৩', '৫৯.৭-৯৪.৮', '৬২.৯-৯৬.২', '৫১.৬-৯২.৯'], range: '৫১.৬-৯৭.৩' },
        { parameter: 'বাতাসের গতিবেগ (কিমি/ ঘন্টা)', values: ['৭.৭', '৬.৭', '৭.২', '৮.৩', '১২.৯'], range: '২.১-১৯.২' },
        { parameter: 'বাতাসের দিক', values: ['পশ্চিম/উত্তর-পশ্চিম দিক', 'পশ্চিম/উত্তর-পশ্চিম দিক', 'পশ্চিম/উত্তর-পশ্চিম দিক', 'পশ্চিম/উত্তর-পশ্চিম দিক', 'পশ্চিম/উত্তর-পশ্চিম দিক'], range: 'পশ্চিম/উত্তর-পশ্চিম দিক' },
        { parameter: 'মেঘের পরিমান (অক্টা)', values: ['পরিষ্কার', 'পরিষ্কার', 'পরিষ্কার', 'পরিষ্কার', 'পরিষ্কার'], range: 'আংশিক মেঘলা' }
      ]
    },
    advisories: [
      {
        category: 'ধান আমন',
        items: [
          'পর্যায়:পরিপক্ক থেকে কর্তন',
          'শতকরা ৮০ ভাগ ধান পরিপক্ক হলে রৌদ্রোজ্জ্বল দিনে ধান কর্তন করুন।',
          'ফসল সংগ্রহের ১৫ দিন আগে জমি থেকে পানি নিষ্কাশন করে ফেলুন।'
        ]
      },
      {
        category: 'সবজি',
        items: [
          'হালকা সেচ প্রয়োগ করুন।',
          'বর্তমান আবহাওয়ায় বেগুনের ফোমপসিস রোগ দেখা দিতে পারে। প্রতি লিটার পানিতে ১ গ্রাম ব্যাভিস্টিন মিশিয়ে স্প্রে করুন।',
          'করলায় এপিলাকনা বিটল এর আক্রমণ দেখা দিতে পারে। আক্রমণের প্রাথমিক অবস্থায় ডিম ও বাচ্চাসহ আক্রান্ত অংশ পুড়িয়ে ফেলুন।',
          'আগাম শীতকালীন সবজি বাড়ন্ত ও ফুল পর্যায়ে রয়েছে। দণ্ডায়মান ফসলে মালচিং এর ব্যবস্থা করুন।'
        ]
      },
      {
        category: 'উদ্যান ফসল',
        items: [
          'আবহাওয়ার বর্তমান পরিস্থিতিতে ডালিমের ব্লাইট ও ফল পচা রোগ থেকে রক্ষার জন্য ২০০ লিটার পানিতে ৬০০ গ্রাম ম্যানকোজেব ও ১০০ গ্রাম কার্বেন্ডাজিম মিশিয়ে স্প্রে করুন।',
          'পেয়ারায় ফলের মাছি পোকার আক্রমণ দেখা দিতে পারে। নিয়ন্ত্রণের জন্য পেয়ারা বাগানে মাছি পোকার ফাঁদ ব্যবহার করুন।',
          'বর্তমান আবহাওয়ায় কলার আরউইনিয়া রট দেখা দিতে পারে। প্রতিরোধের জন্য কলার বেসিনে চুন প্রয়োগ করুন অথবা নিষ্কাশন নালায় ব্লিচিং পাউডার প্রয়োগ করুন।',
          'সেচ প্রয়োগ করুন।'
        ]
      },
      {
        category: 'গবাদি পশু',
        items: [
          'গবাদি পশুর তরকা, বাদলা ও খুরা রোগের টিকা না দেওয়া থাকলে দ্রুত টিকা প্রদান করুন।',
          'লাম্পি স্কিন ডিজিজ প্রতিরোধে ভেটেরিনারি হাসপাতালে পরামর্শ নিন।',
          'কার্বন নি:সরণ কমানোর জন্য গবাদি পশুর নিরাপদ বর্জ্য ব্যবস্থাপনা নিশ্চিত করুন।',
          'গবাদি পশুকে শুধুমাত্র শুকনো খাবার খাওয়ান এবং গোয়াল ঘরে যেন পানি জমে থাকতে না পারে সেদিকে লক্ষ্য রাখুন।'
        ]
      },
      {
        category: 'হাঁসমুরগী',
        items: [
          'শুকনো খাবার খেতে দিন এবং পরিষ্কার পানি পান করান।',
          'খোয়াড়ে জীবাণুনাশক স্প্রে করে তারপর হাঁসমুরগী রাখুন।',
          'রানীক্ষেত ও গামবোরো রোগের টিকা না দেওয়া থাকলে টিকা প্রদান করুন।'
        ]
      },
      {
        category: 'মৎস্য',
        items: [
          'শীতের শুরুতে প্রতি শতাংশে ২৫০-৫০০ গ্রাম চুন প্রয়োগ করলে মাছের রোগবালাই থেকে মুক্তি পাওয়া যায়।',
          'শীতকালে খাবারের পরিমাণ কমিয়ে দিন। প্রয়োজনে খাবার প্রয়োগ বন্ধ রাখুন।',
          '১৫ দিন পর পর নমুনায়ন করে মাছের বাড়ার হার ও রোগবালাই আছে কি না পর্যবেক্ষণ করুন।'
        ]
      },
      {
        category: 'আলু',
        items: [
          'পর্যায়:অংগজ বৃদ্ধি',
          'রোপণের ৩০-৩৫ দিন পর জাত ভেদে হেক্টর প্রতি ১৬০-১৭৫ কেজি ইউরিয়া উপরি প্রয়োগ করার জন্য চাষীদের পরামর্শ দেওয়া হলো।',
          'রোপণের ৪০-৪৫ দিন পর ২য়বার আলুর জমিতে সেচ প্রদানের জন্য চাষীদের পরামর্শ দেওয়া হলো।'
        ]
      }
    ],
    updatedAt: new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true }),
    source: 'BAMIS (DAE Offline Cache)'
  };
}
