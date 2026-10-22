<!-- BEGIN:nextjs-agent-rules -->

## This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

# Project Context: NLAS Weather & Advisory Intelligence Platform

## 1. Project Overview & Architecture
This is a **Next.js (App Router, TypeScript, Vanilla CSS)** application designed to monitor and aggregate data from government and meteorological portals. 
- **Primary Website (Active)**: **National Livestock Advisory System (NLAS / NLS)** (`https://nlas.dls.gov.bd/dashboard/weather_forecast` and `https://nlas.dls.gov.bd/dashboard/advisory_regional`).
- **Sidebar Structure**:
  - Clean collapsible navigation dedicated to the **NLS Portal (NLAS)** (`nlas.dls.gov.bd`).
  - Under NLS, there are two distinct sub-sections:
    1. **Forecast Section** *(Completed & Live)*: Meteorological forecasts, district/upazila filtering, 5-6 day weather cards, and 3-hourly interval spline charts.
    2. **Advisory Section** *(Completed & Live)*: Region-wise monthly advisory with 7 agro-ecological zones, 12-month climatology graphs, and tailored livestock/poultry bulletins.
- **UI / UX Principles**:
  - Clean, professional **white background** layout designed to prevent visual clutter.
  - Government branding (CARE South Asia, Department of Livestock Services - DLS Bangladesh).
  - Fully responsive, accessible, with color-coded badges, bilingual font rendering (Inter & Hind Siliguri), and micro-animations.

---

## 2. Data Pipeline & Government API Integration
Data is harvested directly from the NLAS backend services (`https://nlas.dls.gov.bd/apinlas/`):

| Resource | Upstream Government Endpoint | Next.js Internal Route Handler |
| :--- | :--- | :--- |
| **Districts** | `common/get_district.php` | `/api/nlas/districts` |
| **Upazilas** | `common/get_upazila.php?name_code=<code\>` | `/api/nlas/upazilas?districtCode=<code\>` |
| **Daily Forecast** | `upazila_forecast_recent?SOURCE=BMDWRF&PCODE=<pcode\>` | `/api/nlas/forecast?upazilaCode=<pcode\>` |
| **3-Hourly Steps** | `upazila_forecast_steps_recent?SOURCE=BMDWRF&PCODE=<pcode\>` | `/api/nlas/forecast?upazilaCode=<pcode\>` |
| **Regional Advisory** | `nlas/advisory_region.php?region_code=<code\>&lang=<en\|bn\>&month=<1-12\>` | `/api/nlas/advisory-regional?regionCode=<code\>&lang=<en\|bn\>&month=<m\>` |

### Key Classification & Conversion Logic
1. **Weather Forecast Logic (`src/lib/nlas-client.ts`)**:
   - **Hero Card Matching Algorithm**: Implements government portal's matching formula (`Je >= Tn && Je < xr`) where `Je = YYYYMMDDHH` in `Asia/Dhaka` time.
   - **Wind Direction & Offset**: Uses `-48` degree offset applied by the government frontend (`-48 + winddir`) and 4-quadrant compass mapping (`<=90 NE, <=180 SE, <=270 SW, NW`).
   - **Dynamic Daily Sliding Window**: Automatically filters past dates by comparing against current date in `Asia/Dhaka` (`YYYY-MM-DD`). E.g., if today is 23 October, it displays 23, 24, 25, 26, 27, 28 Oct.
   - **Hourly Step Normalization**: Parses `00:HH:00` or `HH:MM:SS` to accurate 3-hourly spans (`00:00 - 03:00`, `03:00 - 06:00`, etc.) and filters historical steps prior to current calendar date.
   - **`findCloudCondition(rain, cloudCover, hour)`**: Determines weather icon and condition name (`Sunny`, `Mostly Sunny`, `Partly Cloudy`, `Light Rain`, `Cloudy`, etc.). Night hours (< 6 or >= 18) map to `Clear` / moon iconography.

2. **Regional Advisory Logic (`src/lib/regional-advisory.ts`)**:
   - **7 Agro-Ecological Zones**:
     - *Zone 1: Mid Western Zone* (`মধ্য পশ্চিম অঞ্চল`) - Faridpur, Gopalganj, Jessore, Madaripur, Magura, Manikganj, Narail, Rajbari, Shariatpur.
     - *Zone 2: Mid-Eastern Zone* (`মধ্য পূর্ব অঞ্চল`) - Mymensingh, Gazipur, Narsingdi, Dhaka, Narayanganj, Munshiganj, Brahmanbaria, Comilla, Chandpur.
     - *Zone 3: Jamuna Floodplain* (`যমুনা বন্যা সমভূমি`) - Rangpur, Lalmonirhat, Kurigram, Gaibandha, Jamalpur, Bogra, Sherpur, Sirajganj, Tangail.
     - *Zone 4: Hill Tracts* (`পার্বত্য চট্টগ্রাম`) - Khagrachhari, Rangamati, Bandarban.
     - *Zone 5: Haor* (`হাওর অঞ্চল`) - Sylhet, Sunamganj, Netrokona, Kishoreganj, Habiganj, Maulvibazar.
     - *Zone 6: Coastal* (`উপকূলীয় অঞ্চল`) - Satkhira, Khulna, Bagerhat, Pirojpur, Jhalokathi, Barguna, Patuakhali, Barisal, Bhola, Lakshmipur, Noakhali, Feni, Chattogram, Cox's Bazar.
     - *Zone 7: Barind and Dry* (`বরেন্দ্র ও শুষ্ক অঞ্চল`) - Jhenaidah, Pabna, Kushtia, Chuadanga, Meherpur, Natore, Rajshahi, Chapai Nawabganj, Naogaon, Joypurhat, Dinajpur, Thakurgaon, Nilphamari, Panchagarh.
   - **Location-Aware Defaulting**: Automatically checks current selected district in the header/forecast section (e.g. Dhaka) and defaults the active advisory zone to its matching agro-ecological zone (e.g. Mid-Eastern Zone).
   - **Dual-Axis Climatology Chart**: Displays 12-month precipitation bars (`a_precip` in mm) alongside Max Temp (`tempMax` in °C) and Min Temp (`tempMin` in °C) splines with interactive tooltips and month highlighting.
   - **Bilingual Livestock & Poultry Bulletins**: Instant English / Bengali toggle loading authentic advisory directives for cattle, buffalo, goat, sheep, broiler, layer, and ducks with one-click copy and print capabilities.

---

## 3. Key Components & File Directory
- **`src/lib/nlas-client.ts`**: Weather API client, TypeScript interfaces, sliding date windowing, weather condition mapping, and resilient fallbacks.
- **`src/lib/regional-advisory.ts`**: Dedicated Regional Advisory client, 7 agro-ecological zones definitions, district lists, and upstream proxy fetcher.
- **`src/app/api/nlas/`**: Next.js route handlers (`/forecast`, `/districts`, `/upazilas`, `/advisory-regional`).
- **`src/components/Header.tsx`**: CARE South Asia & DLS branding, `Reload Latest Data` button with spinner animation, and user avatar.
- **`src/components/Sidebar.tsx`**: Collapsible navigation with NLS portal subsections (Weather Forecast & Advisory Section) and DLS verification badge.
- **`src/components/LocationSelector.tsx`**: Filter dropdowns for District and Upazila with dynamic cascading updates.
- **`src/components/HeroWeatherCard.tsx`**: Current date, location pin, humidity %, wind speed/direction, weather condition with day/night icon, and BMDWRF attribution.
- **`src/components/DailyForecastGrid.tsx`**: 5-6 day cards showing weekday, date, weather icon, temp range, rainfall, and relative humidity.
- **`src/components/HourlyForecastCharts.tsx`**: High-precision SVG interactive charts (Temp/Cloud, Rain/Humidity, Windgust/Direction).
- **`src/components/AdvisorySection.tsx`**: Full Regional Advisory module featuring 7 agro-ecological zone selector, 12-month climatology SVG chart, month picker, bilingual language switch (`English` / `বাংলা`), and livestock/poultry bulletins.
- **`src/app/page.tsx`**: Main dashboard controller managing state, cascading fetches, manual refresh, and active section toggling.
- **`src/app/globals.css`**: Design tokens, typography (Inter & Hind Siliguri), smooth animations, and scrollbars.

---

## 4. Current Status
1. **Forecast Section**: Fully implemented, connected to live data, verified with dynamic daily sliding calendar windows.
2. **Advisory Section**: Fully implemented based on analysis of `https://nlas.dls.gov.bd/dashboard/advisory_regional`, connected to live DLS APIs, tested in browser across all 7 regions, both languages, and 12 months.
