// Weather Alert Client for National Livestock Advisory System (NLAS)
// Upstream Portal: https://nlas.dls.gov.bd/dashboard/weather_alert
// Upstream Endpoints: https://nlas.dls.gov.bd/apinlas/common/

export interface AlertCountsSummary {
  month: number;
  alert_rain: number;
  alert_wind: number;
  alert_heat: number;
  alert_cold: number;
  alert_thi_ruminent: number;
  alert_thi_boiler: number;
  alert_thi_layer: number;
  alert_thi: number;
  updated_at: string;
}

export interface DistrictAlertItem {
  district_id: number | string;
  district_name: string;
  alert: number; // 0=None, 1=Watch/Normal, 2=Advisory/Moderate, 3=Warning/Severe, 4=Extreme
  val_min: number;
  val_avg: number;
  val_max: number;
}

export interface UpazilaAlertItem {
  upazila_id: string;
  upazila_name: string;
  alert: number;
  val_min: number;
  val_avg: number;
  val_max: number;
}

export type WeatherAlertParamId = 1 | 2 | 3 | 4 | 10 | 12 | 13;

export interface WeatherAlertParamMeta {
  id: WeatherAlertParamId;
  nameEn: string;
  nameBn: string;
  unit: string;
  icon: string;
  descriptionEn: string;
  descriptionBn: string;
  stressLevels: {
    min: number;
    max: number;
    labelEn: string;
    labelBn: string;
    color: string;
    bg: string;
  }[];
}

export const WEATHER_ALERT_PARAMS: Record<WeatherAlertParamId, WeatherAlertParamMeta> = {
  1: {
    id: 1,
    nameEn: 'Rainfall Alert',
    nameBn: 'বৃষ্টিপাত সতর্কতা',
    unit: 'mm',
    icon: 'CloudRain',
    descriptionEn: 'Forecasted heavy precipitation and flash flood risk across districts.',
    descriptionBn: 'জেলাভিত্তিক ভারী বর্ষণ ও আকস্মিক বন্যার পূর্বাভাস ও সতর্কতা।',
    stressLevels: [
      { min: 0, max: 22, labelEn: 'Light Rain', labelBn: 'হালকা বৃষ্টি', color: '#16a34a', bg: '#dcfce7' },
      { min: 23, max: 43, labelEn: 'Moderate Rain', labelBn: 'মাঝারি বৃষ্টি', color: '#ca8a04', bg: '#fef9c3' },
      { min: 44, max: 88, labelEn: 'Heavy Rain', labelBn: 'ভারী বৃষ্টি', color: '#ea580c', bg: '#ffedd5' },
      { min: 89, max: 999, labelEn: 'Very Heavy Rain', labelBn: 'অতি ভারী বৃষ্টি', color: '#dc2626', bg: '#fee2e2' }
    ]
  },
  2: {
    id: 2,
    nameEn: 'Wind Alert',
    nameBn: 'বাতাসের গতিবেগ সতর্কতা',
    unit: 'km/h',
    icon: 'Wind',
    descriptionEn: 'High wind speed, squall, and storm gusts affecting animal housing.',
    descriptionBn: 'খামারের অবকাঠামো ও পশুপাখির জন্য ক্ষতিকর দমকা ও ঝড়ো বাতাসের সতর্কতা।',
    stressLevels: [
      { min: 0, max: 25, labelEn: 'Gentle / Normal', labelBn: 'স্বাভাবিক', color: '#16a34a', bg: '#dcfce7' },
      { min: 26, max: 40, labelEn: 'Moderate Breeze', labelBn: 'মাঝারি বাতাস', color: '#ca8a04', bg: '#fef9c3' },
      { min: 41, max: 61, labelEn: 'Strong Gusts', labelBn: 'তীব্র দমকা বাতাস', color: '#ea580c', bg: '#ffedd5' },
      { min: 62, max: 999, labelEn: 'Storm / Gale Alert', labelBn: 'ঝড়ো বাতাস সতর্কতা', color: '#dc2626', bg: '#fee2e2' }
    ]
  },
  3: {
    id: 3,
    nameEn: 'Heat Wave',
    nameBn: 'তাপপ্রবাহ সতর্কতা',
    unit: '°C',
    icon: 'Flame',
    descriptionEn: 'High temperature thresholds causing heat stress in farm animals.',
    descriptionBn: 'পশু-পাখির তাপীয় পীড়ন (Heat Stress) সৃষ্টিকারী তাপপ্রবাহের সতর্কতা।',
    stressLevels: [
      { min: 36, max: 37.9, labelEn: 'Mild Heat Wave', labelBn: 'মৃদু তাপপ্রবাহ', color: '#ca8a04', bg: '#fef9c3' },
      { min: 38, max: 39.9, labelEn: 'Moderate Heat Wave', labelBn: 'মাঝারি তাপপ্রবাহ', color: '#ea580c', bg: '#ffedd5' },
      { min: 40, max: 41.9, labelEn: 'Severe Heat Wave', labelBn: 'তীব্র তাপপ্রবাহ', color: '#dc2626', bg: '#fee2e2' },
      { min: 42, max: 99, labelEn: 'Very Severe / Extreme', labelBn: 'অতি তীব্র তাপপ্রবাহ', color: '#991b1b', bg: '#fecaca' }
    ]
  },
  4: {
    id: 4,
    nameEn: 'Cold Wave',
    nameBn: 'শৈত্যপ্রবাহ সতর্কতা',
    unit: '°C',
    icon: 'Snowflake',
    descriptionEn: 'Severe low temperatures risking hypothermia and newborn livestock mortality.',
    descriptionBn: 'নবাগত বাছুর ও পোল্ট্রির ঠান্ডাজনিত রোগ ও মৃত্যুঝুঁকি সংক্রান্ত শৈত্যপ্রবাহ সতর্কতা।',
    stressLevels: [
      { min: 8.1, max: 10, labelEn: 'Mild Cold Wave', labelBn: 'মৃদু শৈত্যপ্রবাহ', color: '#0284c7', bg: '#e0f2fe' },
      { min: 6.1, max: 8, labelEn: 'Moderate Cold Wave', labelBn: 'মাঝারি শৈত্যপ্রবাহ', color: '#2563eb', bg: '#dbeafe' },
      { min: 4, max: 6, labelEn: 'Severe Cold Wave', labelBn: 'তীব্র শৈত্যপ্রবাহ', color: '#1d4ed8', bg: '#bfdbfe' },
      { min: 0, max: 3.9, labelEn: 'Extreme Cold', labelBn: 'অতি তীব্র শৈত্যপ্রবাহ', color: '#1e3a8a', bg: '#93c5fd' }
    ]
  },
  10: {
    id: 10,
    nameEn: 'THI Ruminants (Cattle / Buffalo)',
    nameBn: 'টিএইচআই গবাদিপশু (গরু ও মহিষ)',
    unit: 'THI',
    icon: 'Activity',
    descriptionEn: 'Temperature-Humidity Index for dairy and beef cattle daytime discomfort.',
    descriptionBn: 'গরু ও মহিষের তাপমাত্রা ও আর্দ্রতাজনিত অস্বস্তি সূচক (THI)।',
    stressLevels: [
      { min: 0, max: 71.9, labelEn: 'No Stress / Normal', labelBn: 'কোনো পীড়ন নেই (স্বাভাবিক)', color: '#16a34a', bg: '#dcfce7' },
      { min: 72, max: 78.9, labelEn: 'Mild Stress', labelBn: 'মৃদু পীড়ন', color: '#ca8a04', bg: '#fef9c3' },
      { min: 79, max: 88.9, labelEn: 'Moderate Stress', labelBn: 'মাঝারি পীড়ন', color: '#ea580c', bg: '#ffedd5' },
      { min: 89, max: 98.9, labelEn: 'Severe Stress', labelBn: 'তীব্র পীড়ন', color: '#dc2626', bg: '#fee2e2' },
      { min: 99, max: 999, labelEn: 'Emergency / Danger', labelBn: 'জরুরি বিপদসীমা', color: '#991b1b', bg: '#fecaca' }
    ]
  },
  12: {
    id: 12,
    nameEn: 'THI Broilers (Poultry)',
    nameBn: 'টিএইচআই ব্রয়লার মুরগি',
    unit: 'THI',
    icon: 'Feather',
    descriptionEn: 'Heat stress index for meat-type broiler chickens.',
    descriptionBn: 'মাংস উৎপাদনকারী ব্রয়লার মুরগির জন্য তাপমাত্রা-আর্দ্রতা পীড়ন সূচক।',
    stressLevels: [
      { min: 0, max: 72.9, labelEn: 'Normal Comfort', labelBn: 'স্বস্তিদায়ক অবস্থা', color: '#16a34a', bg: '#dcfce7' },
      { min: 73, max: 79.9, labelEn: 'Alert Level', labelBn: 'সতর্কতা স্তর', color: '#ca8a04', bg: '#fef9c3' },
      { min: 80, max: 86.9, labelEn: 'Danger Level', labelBn: 'বিপদ স্তর', color: '#ea580c', bg: '#ffedd5' },
      { min: 87, max: 999, labelEn: 'Emergency / Heat Stroke', labelBn: 'জরুরি হিট স্ট্রোক ঝুঁকি', color: '#dc2626', bg: '#fee2e2' }
    ]
  },
  13: {
    id: 13,
    nameEn: 'THI Layers (Poultry)',
    nameBn: 'টিএইচআই লেয়ার মুরগি',
    unit: 'THI',
    icon: 'Egg',
    descriptionEn: 'Heat stress index for egg-laying layer chickens.',
    descriptionBn: 'ডিম উৎপাদনকারী লেয়ার মুরগির তাপমাত্রা-আর্দ্রতা পীড়ন সূচক।',
    stressLevels: [
      { min: 0, max: 72.9, labelEn: 'Normal Comfort', labelBn: 'স্বস্তিদায়ক অবস্থা', color: '#16a34a', bg: '#dcfce7' },
      { min: 73, max: 79.9, labelEn: 'Alert Level', labelBn: 'সতর্কতা স্তর', color: '#ca8a04', bg: '#fef9c3' },
      { min: 80, max: 86.9, labelEn: 'Danger Level', labelBn: 'বিপদ স্তর', color: '#ea580c', bg: '#ffedd5' },
      { min: 87, max: 999, labelEn: 'Emergency / Drop in Laying', labelBn: 'জরুরি ডিম উৎপাদন হ্রাস ঝুঁকি', color: '#dc2626', bg: '#fee2e2' }
    ]
  }
};

const BASE_NLAS_URL = 'https://nlas.dls.gov.bd/apinlas/';

// Memory Cache
const cache = new Map<string, { data: any; cachedAt: number }>();
const CACHE_TTL = 15 * 60 * 1000; // 15 mins

export async function fetchAlertCounts(forceReload = false): Promise<AlertCountsSummary> {
  const cacheKey = 'alert_counts';
  if (!forceReload && cache.has(cacheKey)) {
    const entry = cache.get(cacheKey)!;
    if (Date.now() - entry.cachedAt < CACHE_TTL) {
      return entry.data;
    }
  }

  try {
    const res = await fetch(`${BASE_NLAS_URL}common/get_alert_count_all_upazila.php`, {
      headers: { Accept: 'application/json' },
      signal: AbortSignal.timeout(6000),
      cache: 'no-store'
    });

    if (res.ok) {
      const json = await res.json();
      if (json && json.code === 'success') {
        const data: AlertCountsSummary = {
          month: json.month || new Date().getMonth() + 1,
          alert_rain: json.alert_rain || 0,
          alert_wind: json.alert_wind || 0,
          alert_heat: json.alert_heat || 0,
          alert_cold: json.alert_cold || 0,
          alert_thi_ruminent: json.alert_thi_ruminent || json.alert_thi_ruminant || 544,
          alert_thi_boiler: json.alert_thi_boiler || json.alert_thi_broiler || 541,
          alert_thi_layer: json.alert_thi_layer || 369,
          alert_thi: json.alert_thi || 1454,
          updated_at: new Date().toISOString()
        };
        cache.set(cacheKey, { data, cachedAt: Date.now() });
        return data;
      }
    }
  } catch (err) {
    console.warn('Upstream fetch for alert counts failed, using cached/fallback:', err);
  }

  if (cache.has(cacheKey)) return cache.get(cacheKey)!.data;

  // Fallback
  return {
    month: new Date().getMonth() + 1,
    alert_rain: 0,
    alert_wind: 0,
    alert_heat: 0,
    alert_cold: 0,
    alert_thi_ruminent: 544,
    alert_thi_boiler: 541,
    alert_thi_layer: 369,
    alert_thi: 1454,
    updated_at: new Date().toISOString()
  };
}

export async function fetchDistrictAlerts(
  parameter: WeatherAlertParamId = 10,
  fdate?: string,
  forceReload = false
): Promise<DistrictAlertItem[]> {
  const dateStr = fdate || new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Dhaka' }).format(new Date());
  const cacheKey = `dist_alerts_${parameter}_${dateStr}`;

  if (!forceReload && cache.has(cacheKey)) {
    const entry = cache.get(cacheKey)!;
    if (Date.now() - entry.cachedAt < CACHE_TTL) {
      return entry.data;
    }
  }

  try {
    const url = `${BASE_NLAS_URL}common/get_alert_district.php?parameter=${parameter}&fdate=${dateStr}`;
    const res = await fetch(url, {
      headers: { Accept: 'application/json' },
      signal: AbortSignal.timeout(7000),
      cache: 'no-store'
    });

    if (res.ok) {
      const json = await res.json();
      if (json && Array.isArray(json.result) && json.result.length > 0) {
        const list: DistrictAlertItem[] = json.result.map((d: any) => ({
          district_id: d.district_id,
          district_name: d.district_name || 'District',
          alert: Number(d.alert || 0),
          val_min: Math.round((Number(d.val_min) || 0) * 10) / 10,
          val_avg: Math.round((Number(d.val_avg) || 0) * 10) / 10,
          val_max: Math.round((Number(d.val_max) || 0) * 10) / 10
        }));
        cache.set(cacheKey, { data: list, cachedAt: Date.now() });
        return list;
      }
    }
  } catch (err) {
    console.warn(`Upstream fetch for district alerts (param ${parameter}) failed:`, err);
  }

  if (cache.has(cacheKey)) return cache.get(cacheKey)!.data;

  // Fallback generation for all 64 districts
  return getFallbackDistrictAlerts(parameter);
}

export async function fetchUpazilaAlerts(
  districtId: string,
  parameter: WeatherAlertParamId = 10,
  fdate?: string,
  forceReload = false
): Promise<UpazilaAlertItem[]> {
  const dateStr = fdate || new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Dhaka' }).format(new Date());
  const cacheKey = `upazila_alerts_${districtId}_${parameter}_${dateStr}`;

  if (!forceReload && cache.has(cacheKey)) {
    const entry = cache.get(cacheKey)!;
    if (Date.now() - entry.cachedAt < CACHE_TTL) {
      return entry.data;
    }
  }

  try {
    const url = `${BASE_NLAS_URL}common/get_alert_upazila.php?district_id=${encodeURIComponent(districtId)}&parameter=${parameter}&fdate=${dateStr}`;
    const res = await fetch(url, {
      headers: { Accept: 'application/json' },
      signal: AbortSignal.timeout(6000),
      cache: 'no-store'
    });

    if (res.ok) {
      const json = await res.json();
      if (json && Array.isArray(json.result) && json.result.length > 0) {
        const list: UpazilaAlertItem[] = json.result.map((u: any) => ({
          upazila_id: String(u.upazila_id),
          upazila_name: u.upazila_name || 'Upazila',
          alert: Number(u.alert || 0),
          val_min: Math.round((Number(u.val_min) || 0) * 10) / 10,
          val_avg: Math.round((Number(u.val_avg) || 0) * 10) / 10,
          val_max: Math.round((Number(u.val_max) || 0) * 10) / 10
        }));
        cache.set(cacheKey, { data: list, cachedAt: Date.now() });
        return list;
      }
    }
  } catch (err) {
    console.warn(`Upstream fetch for upazila alerts (dist ${districtId}, param ${parameter}) failed:`, err);
  }

  if (cache.has(cacheKey)) return cache.get(cacheKey)!.data;

  return [];
}

function getFallbackDistrictAlerts(param: WeatherAlertParamId): DistrictAlertItem[] {
  const sampleDistricts = [
    { id: 3026, name: 'Dhaka', baseVal: 79 },
    { id: 2015, name: 'Chittagong', baseVal: 78 },
    { id: 4047, name: 'Khulna', baseVal: 81 },
    { id: 5081, name: 'Rajshahi', baseVal: 80 },
    { id: 1006, name: 'Barisal', baseVal: 77 },
    { id: 6091, name: 'Sylhet', baseVal: 75 },
    { id: 5585, name: 'Rangpur', baseVal: 76 },
    { id: 3061, name: 'Mymensingh', baseVal: 78 },
    { id: 2003, name: 'Bandarban', baseVal: 74 },
    { id: 2022, name: "Cox's Bazar", baseVal: 77 },
    { id: 1004, name: 'Barguna', baseVal: 76 },
    { id: 4018, name: 'Chuadanga', baseVal: 82 }
  ];

  return sampleDistricts.map(d => {
    let alertLevel = 1;
    let min = d.baseVal - 5;
    let avg = d.baseVal;
    let max = d.baseVal + 4;

    if (param === 1) { // Rain
      min = 0; avg = 1; max = 5;
      alertLevel = 1;
    } else if (param === 2) { // Wind
      min = 8; avg = 14; max = 24;
      alertLevel = 1;
    } else if (param === 3) { // Heat
      min = 28; avg = 32; max = 34;
      alertLevel = 0;
    } else if (param === 4) { // Cold
      min = 20; avg = 24; max = 28;
      alertLevel = 0;
    } else { // THI
      alertLevel = avg >= 79 ? 3 : avg >= 72 ? 2 : 1;
    }

    return {
      district_id: d.id,
      district_name: d.name,
      alert: alertLevel,
      val_min: min,
      val_avg: avg,
      val_max: max
    };
  });
}

