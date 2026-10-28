import {
  fetchWeatherForecast,
  fetchUpazilas,
  generateFallbackForecast,
  DEFAULT_UPAZILAS,
  DEFAULT_DISTRICTS,
  DailyWeatherItem,
  HourlyWeatherStep
} from './nlas-client';

export interface UpazilaWeatherSummary {
  upazilaCode: string;
  upazilaName: string;
  districtCode: string;
  districtName: string;
  divisionName: string;
  updatedAt: string;
  source: string;
  current: {
    date_formatted: string;
    temperature: number;
    temp_min: number;
    temp_max: number;
    rh: number;
    wind_speed: number;
    wind_direction: string;
    condition_name: string;
    condition_image: string;
    is_day: boolean;
  };
  daily: DailyWeatherItem[];
  hourly: HourlyWeatherStep[];
  rainToday: number;
  maxTempToday: number;
  minTempToday: number;
}

export interface DistrictForecastResponseData {
  districtCode: string;
  districtName: string;
  divisionName: string;
  updatedAt: string;
  totalUpazilas: number;
  metrics: {
    minTemp: number;
    maxTemp: number;
    avgTemp: number;
    avgRh: number;
    rainyUpazilasCount: number;
    maxRain: number;
  };
  upazilas: UpazilaWeatherSummary[];
}

// In-memory cache for fast district responses
const districtCache = new Map<string, { data: DistrictForecastResponseData; cachedAt: number }>();
const CACHE_TTL_MS = 15 * 60 * 1000; // 15 minutes cache
const activeDistrictRevalidations = new Set<string>();

export async function fetchDistrictWeatherForecast(
  districtCode: string,
  forceReload: boolean = false
): Promise<DistrictForecastResponseData> {
  const code = districtCode || '3026';

  // Stale-While-Revalidate: Return cached result instantly (< 1ms) if valid data exists
  if (!forceReload && districtCache.has(code)) {
    const entry = districtCache.get(code)!;
    if (entry.data && entry.data.upazilas && entry.data.upazilas.length > 0) {
      const isStale = Date.now() - entry.cachedAt >= CACHE_TTL_MS;
      if (isStale && !activeDistrictRevalidations.has(code)) {
        activeDistrictRevalidations.add(code);
        fetchDistrictWeatherForecast(code, true)
          .catch(err => console.warn(`Background district revalidation failed for ${code}:`, err))
          .finally(() => { activeDistrictRevalidations.delete(code); });
      }
      return entry.data;
    }
  }

  // 1. Get upazilas for district
  let upazilaList = await fetchUpazilas(code);
  if (!upazilaList || upazilaList.length === 0) {
    upazilaList = DEFAULT_UPAZILAS[code] || [];
  }

  const districtItem = DEFAULT_DISTRICTS.find(d => d.value === code);
  const districtName = districtItem?.label || 'Dhaka';

  // 2. Fetch forecast for all upazilas in controlled concurrent chunks
  const BATCH_SIZE = 10;
  const settled: PromiseSettledResult<UpazilaWeatherSummary>[] = [];

  for (let i = 0; i < upazilaList.length; i += BATCH_SIZE) {
    const chunk = upazilaList.slice(i, i + BATCH_SIZE);
    const chunkResults = await Promise.allSettled(
      chunk.map(async (u) => {
        const forecast = await fetchWeatherForecast(u.value, forceReload);
        const rainToday = forecast.daily[0]?.rf || 0;
        return {
          upazilaCode: u.value,
          upazilaName: u.label,
          districtCode: code,
          districtName: forecast.location.district_name || districtName,
          divisionName: forecast.location.division_name || 'Bangladesh',
          updatedAt: forecast.updated_at,
          source: forecast.source || 'BMDWRF',
          current: forecast.current,
          daily: forecast.daily,
          hourly: forecast.hourly,
          rainToday,
          maxTempToday: forecast.current.temp_max,
          minTempToday: forecast.current.temp_min
        } as UpazilaWeatherSummary;
      })
    );
    settled.push(...chunkResults);
  }

  const upazilas: UpazilaWeatherSummary[] = [];
  for (let i = 0; i < settled.length; i++) {
    const item = settled[i];
    if (item.status === 'fulfilled') {
      upazilas.push(item.value);
    } else {
      const u = upazilaList[i];
      const fallback = generateFallbackForecast(u.value);
      upazilas.push({
        upazilaCode: u.value,
        upazilaName: u.label,
        districtCode: code,
        districtName,
        divisionName: 'Bangladesh',
        updatedAt: fallback.updated_at,
        source: fallback.source || 'BMDWRF',
        current: fallback.current,
        daily: fallback.daily,
        hourly: fallback.hourly,
        rainToday: fallback.daily[0]?.rf || 0,
        maxTempToday: fallback.current.temp_max,
        minTempToday: fallback.current.temp_min
      });
    }
  }

  // 3. Compute district summary statistics
  const temps = upazilas.map(u => u.current.temperature);
  const rhs = upazilas.map(u => u.current.rh);
  const rains = upazilas.map(u => u.rainToday);

  const minTemp = temps.length ? Math.min(...temps) : 25;
  const maxTemp = temps.length ? Math.max(...temps) : 34;
  const avgTemp = temps.length ? Math.round((temps.reduce((a, b) => a + b, 0) / temps.length) * 10) / 10 : 30;
  const avgRh = rhs.length ? Math.round(rhs.reduce((a, b) => a + b, 0) / rhs.length) : 55;
  const rainyUpazilasCount = rains.filter(r => r > 0).length;
  const maxRain = rains.length ? Math.max(...rains) : 0;

  const result: DistrictForecastResponseData = {
    districtCode: code,
    districtName,
    divisionName: upazilas[0]?.divisionName || 'Bangladesh',
    updatedAt: upazilas[0]?.updatedAt || new Date().toISOString().replace('T', ' ').slice(0, 19),
    totalUpazilas: upazilas.length,
    metrics: {
      minTemp,
      maxTemp,
      avgTemp,
      avgRh,
      rainyUpazilasCount,
      maxRain
    },
    upazilas
  };

  if (upazilas.length > 0) {
    districtCache.set(code, { data: result, cachedAt: Date.now() });
  }
  return result;
}

// Pre-warm Dhaka district forecast in the background so the initial user request is instant
if (typeof window === 'undefined') {
  setTimeout(() => {
    fetchDistrictWeatherForecast('3026').catch(() => {});
  }, 100);
}
