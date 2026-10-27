/**
 * BMD USF (Upazila Weather Forecast) Client & Data Models
 * Upstream portal: https://usf.bmd.gov.bd/
 * Upstream APIs: https://api.bdservers.site / https://nlas.dls.gov.bd/apinlas
 */

export interface BmdDistrictItem {
  id: string; // 4-digit code e.g. '3026'
  name: string; // English
  nameBn: string; // Bengali
}

export interface BmdUpazilaItem {
  id: string; // 6-digit code e.g. '302602'
  districtId: string;
  name: string; // English
  nameBn: string; // Bengali
}

export interface BmdHeroWeather {
  dateFormatted: string;
  dateWeek: string;
  locationTitle: string;
  conditionIcon: string;
  conditionText: string;
  temp: number;
  tempFormatted: string;
  realFeel: number;
  realFeelFormatted: string;
  humidity: number;
  humidityFormatted: string;
  windSpeed: number;
  windSpeedFormatted: string;
  windDirectionDeg: number;
  windDirectionText: string;
  isNight: boolean;
  dataSourceTime: string;
}

export interface BmdDailyForecastItem {
  dayIndex: number;
  dateWeek: string;
  dateFormatted: string;
  rawDate: string;
  conditionIcon: string;
  conditionNightIcon: string;
  conditionText: string;
  tempMax: number;
  tempMin: number;
  tempFormatted: string;
  rainMin: number;
  rainMax: number;
  rainAvg: number;
  rainFormatted: string;
  windAvg: number;
  windDirectionDeg: number;
  windDirectionText: string;
  windFormatted: string;
  humidity: number;
  humidityFormatted: string;
}

export interface BmdHourlyForecastStep {
  stepIndex: number;
  stepStart: string;
  stepEnd: string;
  dateLabel: string;
  timeRange: string;
  temp: number;
  tempFormatted: string;
  rain: number;
  rainFormatted: string;
  humidity: number;
  humidityFormatted: string;
  windSpeed: number;
  windSpeedFormatted: string;
  windDirectionDeg: number;
  windDirectionText: string;
  conditionIcon: string;
  conditionText: string;
}

export interface BmdForecastResponseData {
  upazilaCode: string;
  upazilaName: string;
  districtName: string;
  divisionName: string;
  updatedAt: string;
  lang: 'en' | 'bn';
  hero: BmdHeroWeather;
  daily: BmdDailyForecastItem[];
  hourly: BmdHourlyForecastStep[];
}

// -------------------------------------------------------------
// Translation and Numerals Utilities
// -------------------------------------------------------------
const BAN_NUMBERS = ['.', '০', '১', '২', '৩', '৪', '৫', '৬', '৭', '৮', '৯'];
const ENG_NUMBERS = ['.', '0', '1', '2', '3', '4', '5', '6', '7', '8', '9'];

export function toBengaliNumber(val: string | number): string {
  const str = String(val);
  let res = '';
  for (let i = 0; i < str.length; i++) {
    const ch = str[i];
    const idx = ENG_NUMBERS.indexOf(ch);
    res += idx !== -1 ? BAN_NUMBERS[idx] : ch;
  }
  return res;
}

export function formatNumberByLang(val: string | number, lang: 'en' | 'bn'): string {
  if (lang === 'bn') {
    return toBengaliNumber(val);
  }
  return String(val);
}

// Weekday Translations
export const WEEKDAYS_EN = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
export const WEEKDAYS_BN = ['রবিবার', 'সোমবার', 'মঙ্গলবার', 'বুধবার', 'বৃহস্পতিবার', 'শুক্রবার', 'শনিবার'];

// Month Translations
export const MONTHS_EN = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];
export const MONTHS_BN = [
  'জানুয়ারি', 'ফেব্রুয়ারি', 'মার্চ', 'এপ্রিল', 'মে', 'জুন',
  'জুলাই', 'আগস্ট', 'সেপ্টেম্বর', 'অক্টোবর', 'নভেম্বর', 'ডিসেম্বর'
];

export function getWeekName(dayOfWeekIndex: number, lang: 'en' | 'bn'): string {
  const norm = ((dayOfWeekIndex % 7) + 7) % 7;
  return lang === 'bn' ? WEEKDAYS_BN[norm] : WEEKDAYS_EN[norm];
}

export function getMonthName(monthIndex: number, lang: 'en' | 'bn'): string {
  const norm = Math.max(0, Math.min(11, monthIndex));
  return lang === 'bn' ? MONTHS_BN[norm] : MONTHS_EN[norm];
}

// Wind Direction Quadrants matching BMD USF
export function getWindDirectionLabel(deg: number, lang: 'en' | 'bn'): string {
  const normalized = ((deg % 360) + 360) % 360;
  if (lang === 'bn') {
    if (normalized <= 90) return 'উঃপূঃ';
    if (normalized <= 180) return 'দঃপূঃ';
    if (normalized <= 270) return 'দঃপঃ';
    return 'উঃপঃ';
  } else {
    if (normalized <= 90) return 'NE';
    if (normalized <= 180) return 'SE';
    if (normalized <= 270) return 'SW';
    return 'NW';
  }
}

// Heat Index / Real Feel calculation from dashboard_bn.js
export function convertCtoF(c: number): number {
  return 1.8 * c + 32;
}

export function convertFtoC(f: number): number {
  return 0.55556 * (f - 32);
}

export function computeHeatIndexF(f: number, rh: number): number {
  const hi =
    -42.379 +
    2.04901523 * f +
    10.14333127 * rh -
    0.22475541 * f * rh -
    6.83783e-3 * f * f -
    5.481717e-2 * rh * rh +
    1.22874e-3 * f * f * rh +
    8.5282e-4 * f * rh * rh -
    1.99e-6 * f * f * rh * rh;

  if (hi < 80) {
    return 0.5 * (f + 61.0 + (f - 68.0) * 1.2 + rh * 0.094);
  }
  return hi;
}

export function calculateRealFeelC(tempC: number, rh: number): number {
  const f = convertCtoF(tempC);
  const hiF = computeHeatIndexF(f, rh);
  const realFeelC = convertFtoC(hiF);
  return Math.round(realFeelC * 10) / 10;
}

// Condition and Icon resolution matching BMD USF classification
export function resolveBmdWeatherCondition(
  cldcvr: number,
  rain: number,
  hour: number,
  lang: 'en' | 'bn'
): { conditionText: string; iconType: string } {
  const isDay = hour >= 6 && hour < 19;

  if (isDay) {
    if (cldcvr < 1) {
      if (rain >= 1) {
        return {
          conditionText: lang === 'bn' ? 'রৌদ্রোজ্জ্বল সাথে বৃষ্টির সম্ভাবনা' : 'Sunny with Chances of Rain',
          iconType: 'mostly_sunny_chance_of_rain'
        };
      }
      return {
        conditionText: lang === 'bn' ? 'রৌদ্রোজ্জ্বল' : 'Sunny',
        iconType: 'sunny'
      };
    } else if (cldcvr < 3) {
      if (rain >= 1) {
        return {
          conditionText: lang === 'bn' ? 'প্রধানত রৌদ্রোজ্জ্বল সাথে বৃষ্টির সম্ভাবনা' : 'Mostly Sunny with Chances of Rain',
          iconType: 'mostly_sunny_chance_of_rain'
        };
      }
      return {
        conditionText: lang === 'bn' ? 'প্রধানত রৌদ্রোজ্জ্বল' : 'Mostly Sunny',
        iconType: 'mostly_sunny'
      };
    } else if (cldcvr < 5) {
      if (rain > 1 && rain <= 22) {
        return {
          conditionText: lang === 'bn' ? 'আংশিক মেঘলা সাথে হালকা বৃষ্টি' : 'Partly Cloudy with Light Rain',
          iconType: 'partly_cloudy_light_rain_day'
        };
      } else if (rain > 22 && rain <= 43) {
        return {
          conditionText: lang === 'bn' ? 'আংশিক মেঘলা সাথে মাঝারি বৃষ্টি' : 'Partly Cloudy with Moderate Rain',
          iconType: 'partly_cloudy_moderate_rain_day'
        };
      } else if (rain > 43) {
        return {
          conditionText: lang === 'bn' ? 'আংশিক মেঘলা সাথে ভারী বৃষ্টি' : 'Partly Cloudy with Heavy Rain',
          iconType: 'partly_cloudy_heavy_rain_day'
        };
      }
      return {
        conditionText: lang === 'bn' ? 'আংশিক রৌদ্রোজ্জ্বল' : 'Partly Sunny',
        iconType: 'partly_sunny'
      };
    } else if (cldcvr < 8) {
      if (rain > 0 && rain <= 22) {
        return {
          conditionText: lang === 'bn' ? 'প্রধানত মেঘলা সাথে হালকা বৃষ্টি' : 'Mostly Cloudy with Light Rain',
          iconType: 'mostly_cloudy_light_rain_day'
        };
      } else if (rain > 22 && rain <= 43) {
        return {
          conditionText: lang === 'bn' ? 'প্রধানত মেঘলা সাথে মাঝারি বৃষ্টি' : 'Mostly Cloudy with Moderate Rain',
          iconType: 'mostly_cloudy_moderate_rain_day'
        };
      } else if (rain > 43) {
        return {
          conditionText: lang === 'bn' ? 'প্রধানত মেঘলা সাথে ভারী বৃষ্টি' : 'Mostly Cloudy with Heavy Rain',
          iconType: 'mostly_cloudy_heavy_rain_day'
        };
      }
      return {
        conditionText: lang === 'bn' ? 'প্রধানত মেঘলা' : 'Mostly Cloudy',
        iconType: 'mostly_cloudy'
      };
    } else {
      if (rain >= 1 && rain <= 22) {
        return {
          conditionText: lang === 'bn' ? 'মেঘলা সাথে হালকা বৃষ্টি' : 'Cloudy with Light Rain',
          iconType: 'cloudy_light_rain'
        };
      } else if (rain > 22 && rain <= 43) {
        return {
          conditionText: lang === 'bn' ? 'মেঘলা সাথে মাঝারি বৃষ্টি' : 'Cloudy with Moderate Rain',
          iconType: 'cloudy_moderate_rain'
        };
      } else if (rain > 43) {
        return {
          conditionText: lang === 'bn' ? 'মেঘলা সাথে ভারী বৃষ্টি' : 'Cloudy with Heavy Rain',
          iconType: 'cloudy_heavy_rain'
        };
      }
      return {
        conditionText: lang === 'bn' ? 'মেঘাচ্ছন্ন' : 'Overcast',
        iconType: 'overcast'
      };
    }
  } else {
    // Night hours
    if (cldcvr < 1) {
      return {
        conditionText: lang === 'bn' ? 'মেঘমুক্ত আকাশ' : 'Clear',
        iconType: 'clear_night'
      };
    } else if (cldcvr < 3) {
      return {
        conditionText: lang === 'bn' ? 'প্রধানত মেঘমুক্ত' : 'Mostly Clear',
        iconType: 'mostly_clear_night'
      };
    } else if (cldcvr < 5) {
      if (rain > 1 && rain <= 22) {
        return {
          conditionText: lang === 'bn' ? 'আংশিক মেঘলা সাথে হালকা বৃষ্টি' : 'Partly Cloudy with Light Rain',
          iconType: 'partly_cloudy_light_rain_night'
        };
      } else if (rain > 22 && rain <= 43) {
        return {
          conditionText: lang === 'bn' ? 'আংশিক মেঘলা সাথে মাঝারি বৃষ্টি' : 'Partly Cloudy with Moderate Rain',
          iconType: 'partly_cloudy_moderate_rain_night'
        };
      } else if (rain > 43) {
        return {
          conditionText: lang === 'bn' ? 'আংশিক মেঘলা সাথে ভারী বৃষ্টি' : 'Partly Cloudy with Heavy Rain',
          iconType: 'partly_cloudy_heavy_rain_night'
        };
      }
      return {
        conditionText: lang === 'bn' ? 'আংশিক মেঘলা' : 'Partly Cloudy',
        iconType: 'partly_cloudy_night'
      };
    } else if (cldcvr < 8) {
      if (rain > 0 && rain <= 22) {
        return {
          conditionText: lang === 'bn' ? 'প্রধানত মেঘলা সাথে হালকা বৃষ্টি' : 'Mostly Cloudy with Light Rain',
          iconType: 'mostly_cloudy_light_rain_night'
        };
      } else if (rain > 22 && rain <= 43) {
        return {
          conditionText: lang === 'bn' ? 'প্রধানত মেঘলা সাথে মাঝারি বৃষ্টি' : 'Mostly Cloudy with Moderate Rain',
          iconType: 'mostly_cloudy_moderate_rain_night'
        };
      } else if (rain > 43) {
        return {
          conditionText: lang === 'bn' ? 'প্রধানত মেঘলা সাথে ভারী বৃষ্টি' : 'Mostly Cloudy with Heavy Rain',
          iconType: 'mostly_cloudy_heavy_rain_night'
        };
      }
      return {
        conditionText: lang === 'bn' ? 'প্রধানত মেঘলা' : 'Mostly Cloudy',
        iconType: 'mostly_cloudy_night'
      };
    } else {
      if (rain >= 1 && rain <= 22) {
        return {
          conditionText: lang === 'bn' ? 'মেঘলা সাথে হালকা বৃষ্টি' : 'Cloudy with Light Rain',
          iconType: 'cloudy_light_rain'
        };
      } else if (rain > 22 && rain <= 43) {
        return {
          conditionText: lang === 'bn' ? 'মেঘলা সাথে মাঝারি বৃষ্টি' : 'Cloudy with Moderate Rain',
          iconType: 'cloudy_moderate_rain'
        };
      } else if (rain > 43) {
        return {
          conditionText: lang === 'bn' ? 'মেঘলা সাথে ভারী বৃষ্টি' : 'Cloudy with Heavy Rain',
          iconType: 'cloudy_heavy_rain'
        };
      }
      return {
        conditionText: lang === 'bn' ? 'মেঘাচ্ছন্ন' : 'Overcast',
        iconType: 'overcast'
      };
    }
  }
}

// -------------------------------------------------------------
// 64 Districts in Bangladesh (BMD USF Specification)
// -------------------------------------------------------------
export const BMD_DISTRICTS: BmdDistrictItem[] = [
  { id: '4001', name: 'Bagerhat', nameBn: 'বাগেরহাট' },
  { id: '2003', name: 'Bandarban', nameBn: 'বান্দরবান' },
  { id: '1004', name: 'Barguna', nameBn: 'বরগুনা' },
  { id: '1006', name: 'Barisal', nameBn: 'বরিশাল' },
  { id: '1009', name: 'Bhola', nameBn: 'ভোলা' },
  { id: '5010', name: 'Bogra', nameBn: 'বগুড়া' },
  { id: '2012', name: 'Brahamanbaria', nameBn: 'ব্রাহ্মণবাড়িয়া' },
  { id: '2013', name: 'Chandpur', nameBn: 'চাঁদপুর' },
  { id: '5070', name: 'Chapai Nawabganj', nameBn: 'চাঁপাই নবাবগঞ্জ' },
  { id: '2015', name: 'Chittagong', nameBn: 'চট্টগ্রাম' },
  { id: '4018', name: 'Chuadanga', nameBn: 'চুয়াডাঙ্গা' },
  { id: '2019', name: 'Comilla', nameBn: 'কুমিল্লা' },
  { id: '2022', name: 'Cox\'s Bazar', nameBn: 'কক্সবাজার' },
  { id: '3026', name: 'Dhaka', nameBn: 'ঢাকা' },
  { id: '5527', name: 'Dinajpur', nameBn: 'দিনাজপুর' },
  { id: '3029', name: 'Faridpur', nameBn: 'ফরিদপুর' },
  { id: '2030', name: 'Feni', nameBn: 'ফেনী' },
  { id: '5532', name: 'Gaibandha', nameBn: 'গাইবান্ধা' },
  { id: '3033', name: 'Gazipur', nameBn: 'গাজীপুর' },
  { id: '3035', name: 'Gopalganj', nameBn: 'গোপালগঞ্জ' },
  { id: '6036', name: 'Habiganj', nameBn: 'হবিগঞ্জ' },
  { id: '4539', name: 'Jamalpur', nameBn: 'জামালপুর' },
  { id: '4041', name: 'Jessore', nameBn: 'যশোর' },
  { id: '1042', name: 'Jhalokati', nameBn: 'ঝালকাঠি' },
  { id: '4044', name: 'Jhenaidah', nameBn: 'ঝিনাইদহ' },
  { id: '5038', name: 'Joypurhat', nameBn: 'জয়পুরহাট' },
  { id: '2046', name: 'Khagrachhari', nameBn: 'খাগড়াছড়ি' },
  { id: '4047', name: 'Khulna', nameBn: 'খুলনা' },
  { id: '3048', name: 'Kishoreganj', nameBn: 'কিশোরগঞ্জ' },
  { id: '5549', name: 'Kurigram', nameBn: 'কুড়িগ্রাম' },
  { id: '4050', name: 'Kushtia', nameBn: 'কুষ্টিয়া' },
  { id: '2051', name: 'Lakshmipur', nameBn: 'লক্ষ্মীপুর' },
  { id: '5552', name: 'Lalmonirhat', nameBn: 'লালমনিরহাট' },
  { id: '3054', name: 'Madaripur', nameBn: 'মাদারীপুর' },
  { id: '4055', name: 'Magura', nameBn: 'মাগুরা' },
  { id: '3056', name: 'Manikganj', nameBn: 'মানিকগঞ্জ' },
  { id: '6058', name: 'Moulvibazar', nameBn: 'মৌলভীবাজার' },
  { id: '4057', name: 'Meherpur', nameBn: 'মেহেরপুর' },
  { id: '3059', name: 'Munshiganj', nameBn: 'মুন্সিগঞ্জ' },
  { id: '4561', name: 'Mymensingh', nameBn: 'ময়মনসিংহ' },
  { id: '5064', name: 'Naogaon', nameBn: 'নওগাঁ' },
  { id: '4065', name: 'Narail', nameBn: 'নড়াইল' },
  { id: '3067', name: 'Narayanganj', nameBn: 'নারায়ণগঞ্জ' },
  { id: '3068', name: 'Narsingdi', nameBn: 'নরসিংদী' },
  { id: '5069', name: 'Natore', nameBn: 'নাটোর' },
  { id: '4572', name: 'Netrakona', nameBn: 'নেত্রকোনা' },
  { id: '5573', name: 'Nilphamari', nameBn: 'নীলফামারী' },
  { id: '2075', name: 'Noakhali', nameBn: 'নোয়াখালী' },
  { id: '5076', name: 'Pabna', nameBn: 'পাবনা' },
  { id: '5577', name: 'Panchagarh', nameBn: 'পঞ্চগড়' },
  { id: '1078', name: 'Patuakhali', nameBn: 'পটুয়াখালী' },
  { id: '1079', name: 'Pirojpur', nameBn: 'পিরোজপুর' },
  { id: '3082', name: 'Rajbari', nameBn: 'রাজবাড়ী' },
  { id: '5081', name: 'Rajshahi', nameBn: 'রাজশাহী' },
  { id: '2084', name: 'Rangamati', nameBn: 'রাঙ্গামাটি' },
  { id: '5585', name: 'Rangpur', nameBn: 'রংপুর' },
  { id: '4087', name: 'Satkhira', nameBn: 'সাতক্ষীরা' },
  { id: '3086', name: 'Shariatpur', nameBn: 'শরীয়তপুর' },
  { id: '4589', name: 'Sherpur', nameBn: 'শেরপুর' },
  { id: '5088', name: 'Sirajganj', nameBn: 'সিরাজগঞ্জ' },
  { id: '6090', name: 'Sunamganj', nameBn: 'সুনামগঞ্জ' },
  { id: '6091', name: 'Sylhet', nameBn: 'সিলেট' },
  { id: '3093', name: 'Tangail', nameBn: 'টাঙ্গাইল' },
  { id: '5594', name: 'Thakurgaon', nameBn: 'ঠাকুরগাঁও' }
];

// Fallback sample upazilas for instant availability
export const DEFAULT_BMD_UPAZILAS: Record<string, BmdUpazilaItem[]> = {
  '3026': [
    { id: '302602', districtId: '3026', name: 'Adabor', nameBn: 'আদাবর' },
    { id: '302604', districtId: '3026', name: 'Badda', nameBn: 'বাড্ডা' },
    { id: '302605', districtId: '3026', name: 'Bangshal', nameBn: 'বংশাল' },
    { id: '302606', districtId: '3026', name: 'Biman Bandar', nameBn: 'বিমান বন্দর' },
    { id: '302608', districtId: '3026', name: 'Cantonment', nameBn: 'সেনানিবাস' },
    { id: '302609', districtId: '3026', name: 'Chak Bazar', nameBn: 'চক বাজার' },
    { id: '302610', districtId: '3026', name: 'Dakshinkhan', nameBn: 'দক্ষিণখান' },
    { id: '302611', districtId: '3026', name: 'Darus Salam', nameBn: 'দারুস সালাম' },
    { id: '302612', districtId: '3026', name: 'Demra', nameBn: 'ডেমরা' },
    { id: '302614', districtId: '3026', name: 'Dhamrai', nameBn: 'ধামরাই' },
    { id: '302616', districtId: '3026', name: 'Dhanmondi', nameBn: 'ধানমন্ডি' },
    { id: '302618', districtId: '3026', name: 'Dohar', nameBn: 'দোহার' },
    { id: '302624', districtId: '3026', name: 'Gendaria', nameBn: 'গেন্ডারিয়া' },
    { id: '302626', districtId: '3026', name: 'Gulshan', nameBn: 'গুলশান' },
    { id: '302628', districtId: '3026', name: 'Hazaribagh', nameBn: 'হাজারীবাগ' },
    { id: '302629', districtId: '3026', name: 'Jatrabari', nameBn: 'যাত্রাবাড়ী' },
    { id: '302632', districtId: '3026', name: 'Kadamtali', nameBn: 'কদমতলী' },
    { id: '302630', districtId: '3026', name: 'Kafrul', nameBn: 'কাফরুল' },
    { id: '302633', districtId: '3026', name: 'Kalabagan', nameBn: 'কলাবাগান' },
    { id: '302634', districtId: '3026', name: 'Kamrangir Char', nameBn: 'কামরঙ্গীর চর' },
    { id: '302638', districtId: '3026', name: 'Keraniganj', nameBn: 'কেরানীগঞ্জ' },
    { id: '302636', districtId: '3026', name: 'Khilgaon', nameBn: 'খিলগাঁও' },
    { id: '302637', districtId: '3026', name: 'Khilkhet', nameBn: 'খিলক্ষেত' },
    { id: '302640', districtId: '3026', name: 'Kotwali', nameBn: 'কোতোয়ালী' },
    { id: '302642', districtId: '3026', name: 'Lalbagh', nameBn: 'লালবাগ' },
    { id: '302648', districtId: '3026', name: 'Mirpur', nameBn: 'মিরপুর' },
    { id: '302650', districtId: '3026', name: 'Mohammadpur', nameBn: 'মোহাম্মদপুর' },
    { id: '302654', districtId: '3026', name: 'Motijheel', nameBn: 'মতিঝিল' },
    { id: '302662', districtId: '3026', name: 'Nawabganj', nameBn: 'নবাবগঞ্জ' },
    { id: '302663', districtId: '3026', name: 'New Market', nameBn: 'নতুন বাজার' },
    { id: '302664', districtId: '3026', name: 'Pallabi', nameBn: 'পল্লবী' },
    { id: '302665', districtId: '3026', name: 'Paltan', nameBn: 'পল্টন' },
    { id: '302666', districtId: '3026', name: 'Ramna', nameBn: 'রমনা' },
    { id: '302667', districtId: '3026', name: 'Rampura', nameBn: 'রামপুরা' },
    { id: '302668', districtId: '3026', name: 'Sabujbagh', nameBn: 'সবুজবাগ' },
    { id: '302672', districtId: '3026', name: 'Savar', nameBn: 'সাভার' },
    { id: '302674', districtId: '3026', name: 'Shah Ali', nameBn: 'শাহ আলী' },
    { id: '302675', districtId: '3026', name: 'Shahbagh', nameBn: 'শাহবাগ' },
    { id: '302680', districtId: '3026', name: 'Sher-e-bangla Nagar', nameBn: 'শের-ই-বাংলা নগর' },
    { id: '302676', districtId: '3026', name: 'Shyampur', nameBn: 'শ্যামপুর' },
    { id: '302688', districtId: '3026', name: 'Sutrapur', nameBn: 'সূত্রাপুর' },
    { id: '302690', districtId: '3026', name: 'Tejgaon', nameBn: 'তেজগাঁও' },
    { id: '302692', districtId: '3026', name: 'Tejgaon Ind. Area', nameBn: 'তেজগাঁও শিল্প এলাকা' },
    { id: '302693', districtId: '3026', name: 'Turag', nameBn: 'তুরাগ' },
    { id: '302696', districtId: '3026', name: 'Uttar Khan', nameBn: 'উত্তর খান' },
    { id: '302695', districtId: '3026', name: 'Uttara', nameBn: 'উত্তরা' }
  ]
};

// -------------------------------------------------------------
// Upazilas Fetcher with HTML Parsing & Resilient Fallback
// -------------------------------------------------------------
const bmdUpazilasCache = new Map<string, BmdUpazilaItem[]>();

export async function fetchBmdUpazilas(districtCode: string, lang: 'en' | 'bn' = 'bn'): Promise<BmdUpazilaItem[]> {
  const cacheKey = `${districtCode}_${lang}`;
  if (bmdUpazilasCache.has(cacheKey)) {
    return bmdUpazilasCache.get(cacheKey)!;
  }
  try {
    const url =
      lang === 'bn'
        ? `https://usf.bmd.gov.bd/Dashboard/getUpazilaBN?district=${districtCode}`
        : `https://usf.bmd.gov.bd/Dashboard/getUpazila?district=${districtCode}`;

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 4000);

    const res = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      },
      signal: controller.signal,
      next: { revalidate: 3600 }
    });
    clearTimeout(timeout);

    if (res.ok) {
      const html = await res.text();
      // Parse <option value="302602">Adabor</option>
      const regex = /<option\s+value="(\d+)">([^<]+)<\/option>/g;
      const results: BmdUpazilaItem[] = [];
      let match;
      while ((match = regex.exec(html)) !== null) {
        const id = match[1].trim();
        const label = match[2].trim();
        if (id && label) {
          results.push({
            id,
            districtId: districtCode,
            name: label,
            nameBn: label
          });
        }
      }

      if (results.length > 0) {
        bmdUpazilasCache.set(cacheKey, results);
        return results;
      }
    }
  } catch (err) {
    console.warn(`Upstream error fetching upazilas for district ${districtCode}:`, err);
  }

  // Return fallback if available
  if (DEFAULT_BMD_UPAZILAS[districtCode]) {
    return DEFAULT_BMD_UPAZILAS[districtCode];
  }

  return [];
}

// -------------------------------------------------------------
// Resilient Meteorological Fetcher with Independent Fallback
// -------------------------------------------------------------
async function fetchMeteorologicalData(primaryUrl: string, backupUrl: string): Promise<any> {
  // 1. Try primary (CDN) with 2.5s timeout
  try {
    const ctrl1 = new AbortController();
    const t1 = setTimeout(() => ctrl1.abort(), 2500);
    const res1 = await fetch(primaryUrl, {
      signal: ctrl1.signal,
      cache: 'no-store',
      headers: { 'Accept': 'application/json' }
    });
    clearTimeout(t1);
    if (res1.ok) {
      const json1 = await res1.json();
      if (json1 && json1.data) return json1;
    }
  } catch {}

  // 2. Try backup (NLAS government server) with 4s timeout
  try {
    const ctrl2 = new AbortController();
    const t2 = setTimeout(() => ctrl2.abort(), 4000);
    const res2 = await fetch(backupUrl, {
      signal: ctrl2.signal,
      cache: 'no-store',
      headers: { 'Accept': 'application/json' }
    });
    clearTimeout(t2);
    if (res2.ok) {
      const json2 = await res2.json();
      if (json2 && json2.data) return json2;
    }
  } catch {}

  return null;
}

// -------------------------------------------------------------
// Real-time Forecast Fetcher
// -------------------------------------------------------------
const bmdForecastCache = new Map<string, { data: BmdForecastResponseData; cachedAt: number }>();
const BMD_CACHE_TTL_MS = 15 * 60 * 1000; // 15 minutes cache
const activeBmdRevalidations = new Set<string>();

export async function fetchBmdForecastData(
  upazilaCode: string,
  lang: 'en' | 'bn' = 'bn',
  forceReload = false
): Promise<BmdForecastResponseData> {
  const pcode = upazilaCode || '302602';
  const cacheKey = `${pcode}_${lang}`;

  // Stale-While-Revalidate: Return cached result instantly if available
  if (!forceReload && bmdForecastCache.has(cacheKey)) {
    const entry = bmdForecastCache.get(cacheKey)!;
    const isStale = Date.now() - entry.cachedAt >= BMD_CACHE_TTL_MS;
    if (isStale && !activeBmdRevalidations.has(cacheKey)) {
      activeBmdRevalidations.add(cacheKey);
      fetchBmdForecastData(pcode, lang, true)
        .catch(err => console.warn(`Background BMD forecast revalidation failed for ${cacheKey}:`, err))
        .finally(() => { activeBmdRevalidations.delete(cacheKey); });
    }
    return entry.data;
  }

  // 1. Fetch Daily Forecast and 3-Hourly Steps concurrently with independent timeouts
  const primaryDailyUrl = `https://api.bdservers.site/upazila_forecast_recent?SOURCE=BMDWRF&uid=6ae028395e31a&PCODE=${pcode}`;
  const backupDailyUrl = `https://nlas.dls.gov.bd/apinlas/upazila_forecast_recent?SOURCE=BMDWRF&PCODE=${pcode}`;

  const primaryStepsUrl = `https://api.bdservers.site/upazila_forecast_steps_recent?SOURCE=BMDWRF&uid=6ae028395e31d&PCODE=${pcode}`;
  const backupStepsUrl = `https://nlas.dls.gov.bd/apinlas/upazila_forecast_steps_recent?SOURCE=BMDWRF&PCODE=${pcode}`;

  const [dailyRaw, stepsRaw] = await Promise.all([
    fetchMeteorologicalData(primaryDailyUrl, backupDailyUrl),
    fetchMeteorologicalData(primaryStepsUrl, backupStepsUrl)
  ]);

  if (!dailyRaw || !dailyRaw.data) {
    throw new Error('Failed to retrieve BMDWRF forecast data from meteorological servers.');
  }

  const pcodeKey = Object.keys(dailyRaw.data).find(k => k === pcode || String(parseInt(k, 10)) === String(parseInt(pcode, 10))) || Object.keys(dailyRaw.data)[0];
  const stationDaily = dailyRaw.data[pcodeKey] || {};
  const forecastDailyData = stationDaily.forecast_data || {};

  const stationSteps = stepsRaw?.data ? (stepsRaw.data[pcodeKey] || Object.values(stepsRaw.data)[0] || {}) : {};
  const forecastStepsData = (stationSteps as any).forecast_data || {};

  const upazilaNameRaw = stationDaily.upazila_name || 'Adabor';
  const districtNameRaw = stationDaily.district_name || 'Dhaka';
  const divisionNameRaw = stationDaily.division_name || 'Dhaka';
  const updatedAtRaw = dailyRaw.updated_at || new Date().toISOString();

  // Find matching district in BMD_DISTRICTS
  const matchedDistrict = BMD_DISTRICTS.find(
    d => d.name.toLowerCase() === districtNameRaw.toLowerCase() || d.id === pcode.substring(0, 4)
  );

  const displayDistrict = lang === 'bn' ? (matchedDistrict ? matchedDistrict.nameBn : districtNameRaw) : districtNameRaw;
  const displayUpazila = lang === 'bn' ? upazilaNameRaw : upazilaNameRaw;

  // Current Dhaka time
  const now = new Date();
  const dhakaFormatter = new Intl.DateTimeFormat('en-US', {
    timeZone: 'Asia/Dhaka',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false
  });
  const dhakaParts = dhakaFormatter.formatToParts(now);
  const partMap: Record<string, string> = {};
  dhakaParts.forEach(p => {
    partMap[p.type] = p.value;
  });

  const currentYear = parseInt(partMap.year || '2026', 10);
  const currentMonth = parseInt(partMap.month || '10', 10);
  const currentDay = parseInt(partMap.day || '27', 10);
  const currentHour = parseInt(partMap.hour || '12', 10);
  const dhakaDateStr = `${currentYear}-${String(currentMonth).padStart(2, '0')}-${String(currentDay).padStart(2, '0')}`;

  // -------------------------------------------------------------
  // Parse Daily Data (7 Days Sliding Window matching usf.bmd.gov.bd)
  // -------------------------------------------------------------
  const tempArr: any[] = forecastDailyData.temp || [];
  const rfArr: any[] = forecastDailyData.rf || [];
  const rhArr: any[] = forecastDailyData.rh || [];
  const windspdArr: any[] = forecastDailyData.windspd || [];
  const winddirArr: any[] = forecastDailyData.winddir || [];
  const cldcvrArr: any[] = forecastDailyData.cldcvr || [];

  const dailyItems: BmdDailyForecastItem[] = [];

  for (let i = 0; i < tempArr.length && dailyItems.length < 7; i++) {
    const tItem = tempArr[i];
    const rfItem = rfArr[i] || {};
    const rhItem = rhArr[i] || {};
    const wspdItem = windspdArr[i] || {};
    const wdirItem = winddirArr[i] || {};
    const cldItem = cldcvrArr[i] || {};

    const stepStart = tItem.step_start || '';
    const itemDateStr = stepStart.substring(0, 10);
    // Filter out historical dates prior to current date in Asia/Dhaka
    if (itemDateStr < dhakaDateStr) {
      continue;
    }

    const itemYear = parseInt(stepStart.substring(0, 4) || String(currentYear), 10);
    const itemMonth = parseInt(stepStart.substring(5, 7) || String(currentMonth), 10);
    const itemDay = parseInt(stepStart.substring(8, 10) || String(currentDay), 10);

    const dateObj = new Date(Date.UTC(itemYear, itemMonth - 1, itemDay));
    const dayOfWeek = dateObj.getUTCDay();

    // Matching dashboard_bn.js: parseInt for max/min temp, max wind, and avg rh
    const tempMax = parseInt(String(tItem.val_max ?? 30), 10);
    const tempMin = parseInt(String(tItem.val_min ?? 22), 10);

    const rainMin = Math.round(Number(rfItem.val_min ?? 0));
    const rainMax = Math.round(Number(rfItem.val_max ?? 0));
    const rainAvg = Math.round(Number(rfItem.val_avg ?? 0));

    const windMax = parseInt(String(wspdItem.val_max ?? 10), 10);
    const windAvg = parseInt(String(wspdItem.val_avg ?? 10), 10);
    const windDirMax = parseInt(String(wdirItem.val_max ?? wdirItem.val_avg ?? 120), 10);

    const rhAvg = parseInt(String(rhItem.val_avg ?? 65), 10);
    const cldDay = parseFloat(Number(cldItem.val_avg_day ?? cldItem.val_avg ?? 3).toFixed(2));
    const cldNight = parseFloat(Number(cldItem.val_avg_night ?? cldItem.val_avg ?? 3).toFixed(2));

    const condition = resolveBmdWeatherCondition(cldDay, rainMax, 12, lang);
    const nightCondition = resolveBmdWeatherCondition(cldNight, rainMax, 22, lang);

    // Formatting
    const dateWeekStr = getWeekName(dayOfWeek, lang);
    const dateFormattedStr =
      lang === 'bn'
        ? `${toBengaliNumber(itemDay)} ${getMonthName(itemMonth - 1, 'bn')}, ${toBengaliNumber(itemYear)}`
        : `${itemDay} ${getMonthName(itemMonth - 1, 'en')}, ${itemYear}`;

    let rainFormattedStr = '';
    if (rainMin === 0 && rainMax === 0) {
      rainFormattedStr = lang === 'bn' ? `${toBengaliNumber(0)} মিঃমিঃ` : '0 mm';
    } else if (rainMin === rainMax) {
      rainFormattedStr = lang === 'bn' ? `${toBengaliNumber(rainMax)} মিঃমিঃ` : `${rainMax} mm`;
    } else {
      rainFormattedStr =
        lang === 'bn'
          ? `${toBengaliNumber(rainMin)}-${toBengaliNumber(rainMax)} মিঃমিঃ`
          : `${rainMin}-${rainMax} mm`;
    }

    const windDirText = getWindDirectionLabel(windDirMax, lang);
    // In dashboard_bn.js line 640, wind_max is used for the wind label
    const windFormattedStr =
      lang === 'bn'
        ? `${windDirText} ${toBengaliNumber(windMax)} কিমি/ঘঃ`
        : `${windDirText} ${windMax} km/h`;

    const tempFormattedStr =
      lang === 'bn'
        ? `${toBengaliNumber(tempMax)}° / ${toBengaliNumber(tempMin)}°সেঃ`
        : `${tempMax}° / ${tempMin}°C`;

    const humidityFormattedStr =
      lang === 'bn' ? `${toBengaliNumber(rhAvg)}%` : `${rhAvg}%`;

    dailyItems.push({
      dayIndex: dailyItems.length + 1,
      dateWeek: dateWeekStr,
      dateFormatted: dateFormattedStr,
      rawDate: `${itemYear}-${String(itemMonth).padStart(2, '0')}-${String(itemDay).padStart(2, '0')}`,
      conditionIcon: condition.iconType,
      conditionNightIcon: nightCondition.iconType,
      conditionText: condition.conditionText,
      tempMax,
      tempMin,
      tempFormatted: tempFormattedStr,
      rainMin,
      rainMax,
      rainAvg,
      rainFormatted: rainFormattedStr,
      windAvg: windMax,
      windDirectionDeg: windDirMax,
      windDirectionText: windDirText,
      windFormatted: windFormattedStr,
      humidity: rhAvg,
      humidityFormatted: humidityFormattedStr
    });
  }

  // -------------------------------------------------------------
  // Parse 3-Hourly Steps Data (Next 3 Days / Up to 24 steps starting from current interval)
  // -------------------------------------------------------------
  const stepsTemp: any[] = forecastStepsData.temp || [];
  const stepsRf: any[] = forecastStepsData.rf || [];
  const stepsRh: any[] = forecastStepsData.rh || [];
  const stepsWindspd: any[] = forecastStepsData.windspd || [];
  const stepsWinddir: any[] = forecastStepsData.winddir || [];
  const stepsCldcvr: any[] = forecastStepsData.cldcvr || [];

  const hourlySteps: BmdHourlyForecastStep[] = [];
  let currentStepMatch: any = null;

  // Find the current interval in Asia/Dhaka time
  for (let i = 0; i < stepsTemp.length; i++) {
    const t = stepsTemp[i];
    const rf = stepsRf[i] || {};
    const rh = stepsRh[i] || {};
    const wspd = stepsWindspd[i] || {};
    const wdir = stepsWinddir[i] || {};
    const cld = stepsCldcvr[i] || {};

    const stepStart = t.step_start || '';
    const stepEnd = t.step_end || '';

    const sYear = parseInt(stepStart.substring(0, 4) || String(currentYear), 10);
    const sMonth = parseInt(stepStart.substring(5, 7) || String(currentMonth), 10);
    const sDay = parseInt(stepStart.substring(8, 10) || String(currentDay), 10);
    const sHour = parseInt(stepStart.substring(14, 16) || '0', 10);

    let eHour = parseInt(stepEnd.substring(14, 16) || String(sHour + 3), 10);
    if (eHour === 0) eHour = 24;

    const isCurrentStep = (sDay === currentDay && sMonth === currentMonth && currentHour >= sHour && currentHour <= eHour);

    if (isCurrentStep && !currentStepMatch) {
      currentStepMatch = {
        temp: parseFloat(Number(t.val_avg ?? t.val_max ?? 28).toFixed(1)),
        rain: Math.round(Number(rf.val_max ?? rf.val_avg ?? 0)),
        rh: parseInt(String(rh.val_avg ?? 65), 10),
        wind: parseInt(String(wspd.val_avg ?? 12), 10),
        windDir: parseInt(String(wdir.val_avg ?? 120), 10),
        cld: parseFloat(Number(cld.val_avg ?? 3).toFixed(2)),
        hour: sHour,
        day: sDay,
        month: sMonth,
        year: sYear,
        stepIndex: i
      };
      break;
    }
  }

  // Fallback: if exact hour match wasn't found, find the earliest step matching or after current date
  if (!currentStepMatch) {
    for (let i = 0; i < stepsTemp.length; i++) {
      const t = stepsTemp[i];
      const rf = stepsRf[i] || {};
      const rh = stepsRh[i] || {};
      const wspd = stepsWindspd[i] || {};
      const wdir = stepsWinddir[i] || {};
      const cld = stepsCldcvr[i] || {};

      const stepStart = t.step_start || '';
      const sDay = parseInt(stepStart.substring(8, 10) || String(currentDay), 10);
      const sMonth = parseInt(stepStart.substring(5, 7) || String(currentMonth), 10);
      const sYear = parseInt(stepStart.substring(0, 4) || String(currentYear), 10);
      const sHour = parseInt(stepStart.substring(14, 16) || '0', 10);

      const itemDateStr = stepStart.substring(0, 10);
      if (itemDateStr >= dhakaDateStr) {
        currentStepMatch = {
          temp: parseFloat(Number(t.val_avg ?? t.val_max ?? 28).toFixed(1)),
          rain: Math.round(Number(rf.val_max ?? rf.val_avg ?? 0)),
          rh: parseInt(String(rh.val_avg ?? 65), 10),
          wind: parseInt(String(wspd.val_avg ?? 12), 10),
          windDir: parseInt(String(wdir.val_avg ?? 120), 10),
          cld: parseFloat(Number(cld.val_avg ?? 3).toFixed(2)),
          hour: sHour,
          day: sDay,
          month: sMonth,
          year: sYear,
          stepIndex: i
        };
        break;
      }
    }
  }

  // Collect up to 24 steps (next 3 days) starting from current step forward
  const startStepIdx = currentStepMatch?.stepIndex ?? 0;
  for (let i = startStepIdx; i < stepsTemp.length && hourlySteps.length < 24; i++) {
    const t = stepsTemp[i];
    const rf = stepsRf[i] || {};
    const rh = stepsRh[i] || {};
    const wspd = stepsWindspd[i] || {};
    const wdir = stepsWinddir[i] || {};
    const cld = stepsCldcvr[i] || {};

    const stepStart = t.step_start || '';
    const stepEnd = t.step_end || '';

    const sYear = parseInt(stepStart.substring(0, 4) || String(currentYear), 10);
    const sMonth = parseInt(stepStart.substring(5, 7) || String(currentMonth), 10);
    const sDay = parseInt(stepStart.substring(8, 10) || String(currentDay), 10);
    const sHour = parseInt(stepStart.substring(14, 16) || '0', 10);

    let eHour = parseInt(stepEnd.substring(14, 16) || String(sHour + 3), 10);
    if (eHour === 0) eHour = 24;

    const tempVal = parseFloat(Number(t.val_avg ?? t.val_max ?? 28).toFixed(1));
    const rainVal = Math.round(Number(rf.val_max ?? rf.val_avg ?? 0));
    const rhVal = parseInt(String(rh.val_avg ?? 65), 10);
    const windVal = parseInt(String(wspd.val_avg ?? 12), 10);
    const windDirVal = parseInt(String(wdir.val_avg ?? 120), 10);
    const cldVal = parseFloat(Number(cld.val_avg ?? 3).toFixed(2));

    const condition = resolveBmdWeatherCondition(cldVal, rainVal, sHour, lang);
    const windDirText = getWindDirectionLabel(windDirVal, lang);

    const sHourFormatted = String(sHour % 24).padStart(2, '0') + ':00';
    const eHourFormatted = String(eHour % 24).padStart(2, '0') + ':00';
    const timeRangeStr =
      lang === 'bn'
        ? `${toBengaliNumber(sHourFormatted)} - ${toBengaliNumber(eHourFormatted)}`
        : `${sHourFormatted} - ${eHourFormatted}`;

    const dateLabelStr =
      lang === 'bn'
        ? `${toBengaliNumber(sDay)} ${getMonthName(sMonth - 1, 'bn')}`
        : `${sDay} ${getMonthName(sMonth - 1, 'en')}`;

    hourlySteps.push({
      stepIndex: hourlySteps.length + 1,
      stepStart,
      stepEnd,
      dateLabel: dateLabelStr,
      timeRange: timeRangeStr,
      temp: tempVal,
      tempFormatted: lang === 'bn' ? `${toBengaliNumber(tempVal.toFixed(1))}°সেঃ` : `${tempVal.toFixed(1)}°C`,
      rain: rainVal,
      rainFormatted: lang === 'bn' ? `${toBengaliNumber(rainVal)} মিঃমিঃ` : `${rainVal} mm`,
      humidity: rhVal,
      humidityFormatted: lang === 'bn' ? `${toBengaliNumber(rhVal)}%` : `${rhVal}%`,
      windSpeed: windVal,
      windSpeedFormatted: lang === 'bn' ? `${toBengaliNumber(windVal)} কিমি/ঘঃ` : `${windVal} km/h`,
      windDirectionDeg: windDirVal,
      windDirectionText: windDirText,
      conditionIcon: condition.iconType,
      conditionText: condition.conditionText
    });
  }

  // -------------------------------------------------------------
  // Parse Hero Weather Data (Real-time observation)
  // -------------------------------------------------------------
  const heroTemp = currentStepMatch ? currentStepMatch.temp : (dailyItems[0]?.tempMax || 30);
  const heroRh = currentStepMatch ? currentStepMatch.rh : (dailyItems[0]?.humidity || 65);
  const heroRain = currentStepMatch ? currentStepMatch.rain : (dailyItems[0]?.rainAvg || 0);
  const heroWind = currentStepMatch ? currentStepMatch.wind : (dailyItems[0]?.windAvg || 12);
  const heroWindDir = currentStepMatch ? currentStepMatch.windDir : (dailyItems[0]?.windDirectionDeg || 120);
  const heroCld = currentStepMatch ? currentStepMatch.cld : 2.5;

  const realFeelC = Math.round(calculateRealFeelC(heroTemp, heroRh));
  const heroCondition = resolveBmdWeatherCondition(heroCld, heroRain, currentHour, lang);
  const heroWindDirText = getWindDirectionLabel(heroWindDir, lang);

  const heroDateWeek = getWeekName(new Date(Date.UTC(currentYear, currentMonth - 1, currentDay)).getUTCDay(), lang);
  const heroDateFormatted =
    lang === 'bn'
      ? `${heroDateWeek}, ${toBengaliNumber(currentDay)} ${getMonthName(currentMonth - 1, 'bn')}, ${toBengaliNumber(currentYear)}`
      : `${heroDateWeek}, ${currentDay} ${getMonthName(currentMonth - 1, 'en')}, ${currentYear}`;

  const heroLocationTitle = `${displayUpazila}, ${displayDistrict}`;
  const isNight = currentHour < 6 || currentHour >= 19;

  // Clean updated at timestamp
  const cleanUpdatedTime = updatedAtRaw.substring(0, 16).replace('T', ', ');
  const formattedDataSourceTime =
    lang === 'bn'
      ? `তথ্য সূত্র : বিএমডিডাব্লিউআরএফ | সর্বশেষ আপডেট : ${toBengaliNumber(cleanUpdatedTime)}`
      : `Source: BMDWRF | Last Updated: ${cleanUpdatedTime}`;

  const hero: BmdHeroWeather = {
    dateFormatted: heroDateFormatted,
    dateWeek: heroDateWeek,
    locationTitle: heroLocationTitle,
    conditionIcon: heroCondition.iconType,
    conditionText: heroCondition.conditionText,
    temp: heroTemp,
    tempFormatted:
      lang === 'bn'
        ? `${toBengaliNumber(heroTemp.toFixed(1))}°সেঃ`
        : `${heroTemp.toFixed(1)}°C`,
    realFeel: realFeelC,
    realFeelFormatted:
      lang === 'bn'
        ? `অনুভূত তাপমাত্রা : ${toBengaliNumber(realFeelC)}°সেঃ`
        : `Real Feel: ${realFeelC}°C`,
    humidity: heroRh,
    humidityFormatted: lang === 'bn' ? `${toBengaliNumber(heroRh)}%` : `${heroRh}%`,
    windSpeed: heroWind,
    windSpeedFormatted:
      lang === 'bn'
        ? `${toBengaliNumber(heroWind)} কিমি/ঘঃ`
        : `${heroWind} km/h`,
    windDirectionDeg: heroWindDir,
    windDirectionText: heroWindDirText,
    isNight,
    dataSourceTime: formattedDataSourceTime
  };

  const result: BmdForecastResponseData = {
    upazilaCode: pcode,
    upazilaName: displayUpazila,
    districtName: displayDistrict,
    divisionName: divisionNameRaw,
    updatedAt: cleanUpdatedTime,
    lang,
    hero,
    daily: dailyItems,
    hourly: hourlySteps
  };

  bmdForecastCache.set(cacheKey, { data: result, cachedAt: Date.now() });
  return result;
}
