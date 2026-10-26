import {
  fetchBmdForecastData,
  fetchBmdUpazilas,
  BMD_DISTRICTS,
  DEFAULT_BMD_UPAZILAS,
  toBengaliNumber,
  BmdDistrictItem,
  BmdUpazilaItem,
  BmdForecastResponseData,
  BmdHeroWeather,
  BmdDailyForecastItem,
  BmdHourlyForecastStep
} from './bmd-client';

export interface BmdUpazilaWeatherSummary {
  upazilaCode: string;
  upazilaName: string;
  districtCode: string;
  districtName: string;
  divisionName: string;
  updatedAt: string;
  lang: 'en' | 'bn';
  hero: BmdHeroWeather;
  daily: BmdDailyForecastItem[];
  hourly: BmdHourlyForecastStep[];
  rainToday: number;
  rainTodayFormatted: string;
  maxTempToday: number;
  minTempToday: number;
}

export interface BmdDistrictForecastResponseData {
  districtCode: string;
  districtName: string;
  divisionName: string;
  updatedAt: string;
  totalUpazilas: number;
  lang: 'en' | 'bn';
  metrics: {
    minTemp: number;
    maxTemp: number;
    avgTemp: number;
    avgRh: number;
    rainyUpazilasCount: number;
    maxRain: number;
    minTempFormatted: string;
    maxTempFormatted: string;
    avgTempFormatted: string;
    avgRhFormatted: string;
    rainyCountFormatted: string;
    maxRainFormatted: string;
  };
  upazilas: BmdUpazilaWeatherSummary[];
}

// In-memory cache for fast district responses
const bmdDistrictCache = new Map<string, { data: BmdDistrictForecastResponseData; cachedAt: number }>();
const CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes cache

export async function fetchBmdDistrictForecast(
  districtCode: string,
  lang: 'en' | 'bn' = 'bn',
  forceReload: boolean = false
): Promise<BmdDistrictForecastResponseData> {
  const code = districtCode || '3026';
  const cacheKey = `${code}_${lang}`;

  if (!forceReload && bmdDistrictCache.has(cacheKey)) {
    const entry = bmdDistrictCache.get(cacheKey)!;
    if (Date.now() - entry.cachedAt < CACHE_TTL_MS) {
      return entry.data;
    }
  }

  // 1. Get upazilas for district
  let upazilaList = await fetchBmdUpazilas(code, lang);
  if (!upazilaList || upazilaList.length === 0) {
    upazilaList = DEFAULT_BMD_UPAZILAS[code] || [];
  }

  const districtItem = BMD_DISTRICTS.find(d => d.id === code);
  const districtName = lang === 'bn' ? (districtItem?.nameBn || districtItem?.name || 'ঢাকা') : (districtItem?.name || 'Dhaka');

  // 2. Fetch forecast for all upazilas in parallel
  const settled = await Promise.allSettled(
    upazilaList.map(async (u) => {
      const forecast = await fetchBmdForecastData(u.id, lang, forceReload);
      const rainToday = forecast.daily[0]?.rainAvg || forecast.daily[0]?.rainMax || 0;
      const rainTodayFormatted = forecast.daily[0]?.rainFormatted || (lang === 'bn' ? `${toBengaliNumber(rainToday)} মিমি` : `${rainToday} mm`);

      return {
        upazilaCode: u.id,
        upazilaName: lang === 'bn' ? u.nameBn : u.name,
        districtCode: code,
        districtName: forecast.districtName || districtName,
        divisionName: forecast.divisionName || (lang === 'bn' ? 'বাংলাদেশ' : 'Bangladesh'),
        updatedAt: forecast.updatedAt,
        lang,
        hero: forecast.hero,
        daily: forecast.daily,
        hourly: forecast.hourly,
        rainToday,
        rainTodayFormatted,
        maxTempToday: forecast.daily[0]?.tempMax || forecast.hero.temp,
        minTempToday: forecast.daily[0]?.tempMin || forecast.hero.temp
      } as BmdUpazilaWeatherSummary;
    })
  );

  const upazilas: BmdUpazilaWeatherSummary[] = [];
  for (let i = 0; i < settled.length; i++) {
    const item = settled[i];
    if (item.status === 'fulfilled') {
      upazilas.push(item.value);
    }
  }

  // 3. Compute district summary statistics
  const temps = upazilas.map(u => u.hero.temp);
  const rhs = upazilas.map(u => u.hero.humidity);
  const rains = upazilas.map(u => u.rainToday);

  const minTemp = temps.length ? Math.min(...temps) : 25;
  const maxTemp = temps.length ? Math.max(...temps) : 36;
  const avgTemp = temps.length ? Math.round((temps.reduce((a, b) => a + b, 0) / temps.length) * 10) / 10 : 30;
  const avgRh = rhs.length ? Math.round(rhs.reduce((a, b) => a + b, 0) / rhs.length) : 60;
  const rainyUpazilasCount = rains.filter(r => r > 0).length;
  const maxRain = rains.length ? Math.max(...rains) : 0;

  const result: BmdDistrictForecastResponseData = {
    districtCode: code,
    districtName,
    divisionName: upazilas[0]?.divisionName || (lang === 'bn' ? 'বাংলাদেশ' : 'Bangladesh'),
    updatedAt: upazilas[0]?.updatedAt || new Date().toISOString().replace('T', ' ').slice(0, 19),
    totalUpazilas: upazilas.length,
    lang,
    metrics: {
      minTemp,
      maxTemp,
      avgTemp,
      avgRh,
      rainyUpazilasCount,
      maxRain,
      minTempFormatted: lang === 'bn' ? `${toBengaliNumber(minTemp)}°` : `${minTemp}°C`,
      maxTempFormatted: lang === 'bn' ? `${toBengaliNumber(maxTemp)}°` : `${maxTemp}°C`,
      avgTempFormatted: lang === 'bn' ? `${toBengaliNumber(avgTemp)}°` : `${avgTemp}°C`,
      avgRhFormatted: lang === 'bn' ? `${toBengaliNumber(avgRh)}%` : `${avgRh}%`,
      rainyCountFormatted: lang === 'bn' ? toBengaliNumber(rainyUpazilasCount) : String(rainyUpazilasCount),
      maxRainFormatted: lang === 'bn' ? `${toBengaliNumber(maxRain)} মিমি` : `${maxRain} mm`
    },
    upazilas
  };

  bmdDistrictCache.set(cacheKey, { data: result, cachedAt: Date.now() });
  return result;
}
