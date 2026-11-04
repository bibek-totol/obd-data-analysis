// FFWC Client Library for Flood Forecasting & Warning Centre (BWDB)
// Official Portal: https://ffwc.gov.bd/app/home
// Upstream API: https://api.ffwc.gov.bd/

import fallbackData from './ffwc-fallback.json';

export type FloodAlertStatus = 'Normal' | 'Warning' | 'Flood' | 'Severe Flood' | 'N/A';
export type FloodTrendType = 'rising' | 'falling' | 'steady';

export interface FfwcStation {
  id: number;
  web_id?: number;
  station: string;
  station_bn?: string;
  river: string;
  river_bn?: string;
  basin: string;
  basin_bn?: string;
  division?: string;
  division_bn?: string;
  district: string;
  district_bn?: string;
  upazilla?: string;
  upazilla_bn?: string;
  dl: number; // Danger level (meters)
  pmdl?: number | string; // Peak / Pre-monsoon danger level
  rhwl?: number | string; // Recorded Highest Water Level
  latitude?: number;
  longitude?: number;
  five_days_forecast?: number;
  ten_days_forecast?: number;
  monsoon_station?: number;
  // Computed live observation values
  recordedWaterLevel?: number;
  previousWaterLevel?: number;
  differenceToDl?: number; // meters: recordedWaterLevel - dl
  trend24h?: FloodTrendType;
  status: FloodAlertStatus;
  observedAt?: string;
}

export interface FfwcDistrictAlertItem {
  id?: number;
  district: string;
  district_bn?: string;
  alert_type: FloodAlertStatus;
}

export interface FfwcDistrictAlertDateGroup {
  date: string;
  alerts: FfwcDistrictAlertItem[];
}

export interface FfwcSummaryMetadata {
  generated_at: string;
  request_date: string;
  forecast_dates: string[];
}

export interface FfwcFloodSummary {
  metadata: FfwcSummaryMetadata;
  forecast_data: Record<string, { district: string; alert_type: FloodAlertStatus }[]>;
  forecast_trends: {
    improving: string[];
    worsening: string[];
    new_alerts: string[];
    persisting_severe: string[];
  };
  current_conditions: {
    severe_flood: { district: string; alert_type: string }[];
    moderate_flood: { district: string; alert_type: string }[];
    normal_conditions: { district: string; alert_type: string }[];
  };
}

export interface FfwcWaterLevelRecord {
  st_id: number;
  station_serial_no?: number;
  name: string;
  lat?: number;
  long?: number;
  river: string;
  basin?: string;
  division?: string;
  district: string;
  upazilla?: string;
  wl_date: string;
  waterlevel: number;
  dangerlevel: number;
  riverhighestwaterlevel?: number;
}

export interface FfwcTenDaysForecastStation {
  stationId: string;
  stationName: string;
  riverName: string;
  dangerLevel: number;
  forecastDays: {
    date: string;
    min: number;
    max: number;
    mean: number;
  }[];
}

export interface FfwcRainfallStation {
  st_id: number;
  name: string;
  basin: string;
  division?: string;
  district: string;
  upazilla?: string;
  lat?: string | number;
  long?: string | number;
  total_rainfall: number;
  latest_date: string;
}

export interface FfwcCombinedData {
  updateDate: {
    last_update_date: string;
    entry_date: string;
  };
  summary: {
    totalStations: number;
    normalCount: number;
    warningCount: number;
    floodCount: number;
    severeCount: number;
    risingCount: number;
    fallingCount: number;
    steadyCount: number;
    activeAlertsCount: number; // Warning + Flood + Severe
    forecastTrends: FfwcFloodSummary['forecast_trends'];
  };
  stations: FfwcStation[];
  districtAlerts: FfwcDistrictAlertDateGroup[];
  tenDaysForecast: FfwcTenDaysForecastStation[];
  rainfallStations: FfwcRainfallStation[];
  basins: string[];
  rivers: string[];
  districts: string[];
}

// Security headers required by upstream api.ffwc.gov.bd
const FFWC_API_BASE = 'https://api.ffwc.gov.bd/data_load/';
const FFWC_HEADERS = {
  'x-ffwc-internal-key': 'FFWC-Project-2026-Secure-V1',
  'accept': 'application/json, text/plain, */*',
  'referer': 'https://ffwc.gov.bd/app/home',
  'user-agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
};

// In-memory SWR cache (15 min TTL)
let cachedFfwcData: FfwcCombinedData | null = null;
let lastCacheTime = 0;
const CACHE_TTL = 15 * 60 * 1000;

const station40DayCache = new Map<number, { data: FfwcWaterLevelRecord[]; timestamp: number }>();

// Bengali numeral converter
export function toBengaliNumeral(num: number | string | undefined | null): string {
  if (num === undefined || num === null) return '';
  const bn = ['০', '১', '২', '৩', '৪', '৫', '৬', '৭', '৮', '৯'];
  return String(num).replace(/[0-9]/g, d => bn[Number(d)]);
}

// Compute flood alert status based on difference to Danger Level
export function computeFloodStatus(recordedWL: number, dl: number): FloodAlertStatus {
  if (recordedWL === 0 || isNaN(recordedWL) || dl === 0 || isNaN(dl)) {
    return 'N/A';
  }
  const diff = recordedWL - dl;
  if (diff >= 1.0) return 'Severe Flood';
  if (diff >= 0.0) return 'Flood';
  if (diff >= -0.5) return 'Warning'; // within 50 cm below danger level
  return 'Normal'; // more than 50 cm below danger level
}

// Compute trend based on current vs previous readings
export function computeTrend(current: number, prev: number): FloodTrendType {
  const diff = current - prev;
  if (diff > 0.02) return 'rising';
  if (diff < -0.02) return 'falling';
  return 'steady';
}

// Process raw stations + recent-observed payload into enriched stations
function processStations(rawStations: any[], rawObserved: Record<string, any[]>): FfwcStation[] {
  return rawStations.map(st => {
    const stIdStr = String(st.id);
    const obsList = rawObserved[stIdStr] || [];

    let recordedWaterLevel = 0;
    let previousWaterLevel = 0;
    let observedAt = '';

    if (Array.isArray(obsList) && obsList.length > 0) {
      // Find latest valid entry with numeric value
      for (let i = obsList.length - 1; i >= 0; i--) {
        const item = obsList[i];
        const keys = Object.keys(item);
        if (keys.length > 0) {
          const timeKey = keys[0];
          const val = parseFloat(item[timeKey]);
          if (!isNaN(val) && val > 0) {
            if (recordedWaterLevel === 0) {
              recordedWaterLevel = val;
              observedAt = timeKey;
            } else if (previousWaterLevel === 0) {
              previousWaterLevel = val;
              break;
            }
          }
        }
      }
    }

    if (previousWaterLevel === 0 && recordedWaterLevel > 0) {
      previousWaterLevel = recordedWaterLevel;
    }

    const dl = Number(st.dl) || 0;
    const diff = recordedWaterLevel > 0 && dl > 0 ? recordedWaterLevel - dl : 0;
    const status = computeFloodStatus(recordedWaterLevel, dl);
    const trend24h = computeTrend(recordedWaterLevel, previousWaterLevel);

    return {
      id: st.id,
      web_id: st.web_id,
      station: st.station || 'Unknown Station',
      station_bn: st.station_bn && st.station_bn !== '-' ? st.station_bn : undefined,
      river: st.river || 'Unknown River',
      river_bn: st.river_bn && st.river_bn !== '-' ? st.river_bn : undefined,
      basin: st.basin && st.basin !== '-' ? st.basin : 'Other Basin',
      basin_bn: st.basin_bn && st.basin_bn !== '-' ? st.basin_bn : undefined,
      division: st.division && st.division !== '#N/A' ? st.division : undefined,
      division_bn: st.division_bn && st.division_bn !== '#N/A' ? st.division_bn : undefined,
      district: st.district || 'Other',
      district_bn: st.district_bn,
      upazilla: st.upazilla && st.upazilla !== '#N/A' ? st.upazilla : undefined,
      upazilla_bn: st.upazilla_bn && st.upazilla_bn !== '#N/A' ? st.upazilla_bn : undefined,
      dl,
      pmdl: st.pmdl !== '-' ? st.pmdl : undefined,
      rhwl: st.rhwl !== '-' ? st.rhwl : undefined,
      latitude: st.latitude,
      longitude: st.longitude,
      five_days_forecast: st.five_days_forecast,
      ten_days_forecast: st.ten_days_forecast,
      monsoon_station: st.monsoon_station,
      recordedWaterLevel,
      previousWaterLevel,
      differenceToDl: Math.round(diff * 100) / 100,
      trend24h,
      status,
      observedAt
    };
  });
}

// Parse 10-day medium range forecast
function processTenDaysForecast(rawTenDays: Record<string, any>, stationsList: FfwcStation[]): FfwcTenDaysForecastStation[] {
  const result: FfwcTenDaysForecastStation[] = [];
  const stationMap = new Map(stationsList.map(s => [String(s.id), s]));

  for (const [stId, daysObj] of Object.entries(rawTenDays)) {
    const station = stationMap.get(stId);
    const forecastDays: FfwcTenDaysForecastStation['forecastDays'] = [];

    if (daysObj && typeof daysObj === 'object') {
      for (const [dateStr, values] of Object.entries(daysObj)) {
        if (values && typeof values === 'object') {
          forecastDays.push({
            date: dateStr,
            min: Number((values as any).min) || 0,
            max: Number((values as any).max) || 0,
            mean: Number((values as any).mean) || 0
          });
        }
      }
    }

    result.push({
      stationId: stId,
      stationName: station ? station.station : `Station ${stId}`,
      riverName: station ? station.river : 'Unknown',
      dangerLevel: station ? station.dl : 0,
      forecastDays
    });
  }

  return result;
}

// Fetch all FFWC datasets with fallback
export async function getFfwcCombinedData(forceReload = false): Promise<FfwcCombinedData> {
  const now = Date.now();
  if (!forceReload && cachedFfwcData && now - lastCacheTime < CACHE_TTL) {
    return cachedFfwcData;
  }

  try {
    const today = new Date().toISOString().slice(0, 10);
    const [updateDateRes, summaryRes, stationsRes, recentObsRes, alertsRes, tenDaysRes, rainfallRes] = await Promise.allSettled([
      fetch(`${FFWC_API_BASE}update-date/`, { headers: FFWC_HEADERS, signal: AbortSignal.timeout(6000), cache: 'no-store' }),
      fetch(`${FFWC_API_BASE}flood-summary/`, { headers: FFWC_HEADERS, signal: AbortSignal.timeout(6000), cache: 'no-store' }),
      fetch(`${FFWC_API_BASE}stations-2025/`, { headers: FFWC_HEADERS, signal: AbortSignal.timeout(7000), cache: 'no-store' }),
      fetch(`${FFWC_API_BASE}recent-observed/`, { headers: FFWC_HEADERS, signal: AbortSignal.timeout(7000), cache: 'no-store' }),
      fetch(`${FFWC_API_BASE}district-flood-alerts-observed-forecast-by-observed-dates/${today}/`, { headers: FFWC_HEADERS, signal: AbortSignal.timeout(7000), cache: 'no-store' }),
      fetch(`${FFWC_API_BASE}ten-days-forecast-waterlevel-24-hours/`, { headers: FFWC_HEADERS, signal: AbortSignal.timeout(7000), cache: 'no-store' }),
      fetch(`${FFWC_API_BASE}observed-rainfall/`, { headers: FFWC_HEADERS, signal: AbortSignal.timeout(7000), cache: 'no-store' })
    ]);

    let updateDate = (fallbackData as any).updateDate;
    if (updateDateRes.status === 'fulfilled' && updateDateRes.value.ok) {
      updateDate = await updateDateRes.value.json();
    }

    let rawSummary = (fallbackData as any).summary;
    if (summaryRes.status === 'fulfilled' && summaryRes.value.ok) {
      rawSummary = await summaryRes.value.json();
    }

    let rawStations = (fallbackData as any).stations;
    if (stationsRes.status === 'fulfilled' && stationsRes.value.ok) {
      rawStations = await stationsRes.value.json();
    }

    let rawRecentObs = (fallbackData as any).recentObserved;
    if (recentObsRes.status === 'fulfilled' && recentObsRes.value.ok) {
      rawRecentObs = await recentObsRes.value.json();
    }

    let rawAlerts = (fallbackData as any).districtAlerts;
    if (alertsRes.status === 'fulfilled' && alertsRes.value.ok) {
      rawAlerts = await alertsRes.value.json();
    }

    let rawTenDays = (fallbackData as any).tenDaysForecast;
    if (tenDaysRes.status === 'fulfilled' && tenDaysRes.value.ok) {
      rawTenDays = await tenDaysRes.value.json();
    }

    let rawRainfall = (fallbackData as any).rainfall;
    if (rainfallRes.status === 'fulfilled' && rainfallRes.value.ok) {
      rawRainfall = await rainfallRes.value.json();
    }

    const stations = processStations(rawStations, rawRecentObs);

    // Summary counts
    let normalCount = 0;
    let warningCount = 0;
    let floodCount = 0;
    let severeCount = 0;
    let risingCount = 0;
    let fallingCount = 0;
    let steadyCount = 0;

    stations.forEach(st => {
      if (st.status === 'Normal') normalCount++;
      else if (st.status === 'Warning') warningCount++;
      else if (st.status === 'Flood') floodCount++;
      else if (st.status === 'Severe Flood') severeCount++;

      if (st.trend24h === 'rising') risingCount++;
      else if (st.trend24h === 'falling') fallingCount++;
      else if (st.trend24h === 'steady') steadyCount++;
    });

    const tenDaysForecast = processTenDaysForecast(rawTenDays, stations);

    // Filter unique basins, rivers, districts
    const basins = Array.from(new Set(stations.map(s => s.basin).filter(Boolean))).sort();
    const rivers = Array.from(new Set(stations.map(s => s.river).filter(Boolean))).sort();
    const districts = Array.from(new Set(stations.map(s => s.district).filter(Boolean))).sort();

    const result: FfwcCombinedData = {
      updateDate: {
        last_update_date: updateDate.last_update_date || today,
        entry_date: updateDate.entry_date || new Date().toISOString()
      },
      summary: {
        totalStations: stations.length,
        normalCount,
        warningCount,
        floodCount,
        severeCount,
        risingCount,
        fallingCount,
        steadyCount,
        activeAlertsCount: warningCount + floodCount + severeCount,
        forecastTrends: rawSummary.forecast_trends || {
          improving: [],
          worsening: [],
          new_alerts: [],
          persisting_severe: []
        }
      },
      stations,
      districtAlerts: Array.isArray(rawAlerts) ? rawAlerts : [],
      tenDaysForecast,
      rainfallStations: Array.isArray(rawRainfall) ? rawRainfall : [],
      basins,
      rivers,
      districts
    };

    cachedFfwcData = result;
    lastCacheTime = now;
    return result;
  } catch (err) {
    console.error('[FFWC Client] Error fetching upstream data, using local fallback:', err);
    return getFallbackFfwcData();
  }
}

// Fallback data processor
export function getFallbackFfwcData(): FfwcCombinedData {
  const fb = fallbackData as any;
  const stations = processStations(fb.stations, fb.recentObserved);

  let normalCount = 0;
  let warningCount = 0;
  let floodCount = 0;
  let severeCount = 0;
  let risingCount = 0;
  let fallingCount = 0;
  let steadyCount = 0;

  stations.forEach(st => {
    if (st.status === 'Normal') normalCount++;
    else if (st.status === 'Warning') warningCount++;
    else if (st.status === 'Flood') floodCount++;
    else if (st.status === 'Severe Flood') severeCount++;

    if (st.trend24h === 'rising') risingCount++;
    else if (st.trend24h === 'falling') fallingCount++;
    else if (st.trend24h === 'steady') steadyCount++;
  });

  const tenDaysForecast = processTenDaysForecast(fb.tenDaysForecast, stations);
  const basins = Array.from(new Set(stations.map(s => s.basin).filter(Boolean))).sort();
  const rivers = Array.from(new Set(stations.map(s => s.river).filter(Boolean))).sort();
  const districts = Array.from(new Set(stations.map(s => s.district).filter(Boolean))).sort();

  return {
    updateDate: {
      last_update_date: fb.updateDate.last_update_date || '2026-11-04',
      entry_date: fb.updateDate.entry_date || new Date().toISOString()
    },
    summary: {
      totalStations: stations.length,
      normalCount,
      warningCount,
      floodCount,
      severeCount,
      risingCount,
      fallingCount,
      steadyCount,
      activeAlertsCount: warningCount + floodCount + severeCount,
      forecastTrends: fb.summary?.forecast_trends || {
        improving: [],
        worsening: [],
        new_alerts: [],
        persisting_severe: []
      }
    },
    stations,
    districtAlerts: Array.isArray(fb.districtAlerts) ? fb.districtAlerts : [],
    tenDaysForecast,
    rainfallStations: Array.isArray(fb.rainfall) ? fb.rainfall : [],
    basins,
    rivers,
    districts
  };
}

// Fetch 40-day water level time-series for a specific station
export async function getStation40DaysWaterlevel(stationId: number, forceReload = false): Promise<FfwcWaterLevelRecord[]> {
  const now = Date.now();
  if (!forceReload && station40DayCache.has(stationId)) {
    const entry = station40DayCache.get(stationId)!;
    if (now - entry.timestamp < CACHE_TTL) {
      return entry.data;
    }
  }

  const today = new Date().toISOString().slice(0, 10);
  try {
    const res = await fetch(`${FFWC_API_BASE}observed-waterlevel-by-station-and-date/${stationId}/${today}/`, {
      headers: FFWC_HEADERS,
      signal: AbortSignal.timeout(6000),
      cache: 'no-store'
    });

    if (res.ok) {
      const data: any[] = await res.json();
      if (Array.isArray(data) && data.length > 0) {
        const parsed: FfwcWaterLevelRecord[] = data.map(item => ({
          st_id: item.st_id,
          station_serial_no: item.station_serial_no,
          name: item.name,
          lat: item.lat,
          long: item.long,
          river: item.river,
          basin: item.basin,
          division: item.division,
          district: item.district,
          upazilla: item.upazilla,
          wl_date: item.wl_date,
          waterlevel: parseFloat(item.waterlevel) || 0,
          dangerlevel: parseFloat(item.dangerlevel) || 0,
          riverhighestwaterlevel: parseFloat(item.riverhighestwaterlevel) || 0
        }));

        station40DayCache.set(stationId, { data: parsed, timestamp: now });
        return parsed;
      }
    }
  } catch (err) {
    console.warn(`[FFWC Client] Failed to fetch 40-day water level for station ${stationId}:`, err);
  }

  // Fallback to sample data for station 109 if available
  const fb = fallbackData as any;
  if (Array.isArray(fb.waterlevel40DaysSample) && (stationId === 109 || !station40DayCache.has(stationId))) {
    const sample: FfwcWaterLevelRecord[] = fb.waterlevel40DaysSample.map((item: any) => ({
      st_id: stationId,
      station_serial_no: item.station_serial_no,
      name: item.name,
      lat: item.lat,
      long: item.long,
      river: item.river,
      basin: item.basin,
      division: item.division,
      district: item.district,
      upazilla: item.upazilla,
      wl_date: item.wl_date,
      waterlevel: parseFloat(item.waterlevel) || 0,
      dangerlevel: parseFloat(item.dangerlevel) || 0,
      riverhighestwaterlevel: parseFloat(item.riverhighestwaterlevel) || 0
    }));
    return sample;
  }

  return [];
}

