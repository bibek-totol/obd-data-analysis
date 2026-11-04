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
  - Under NLS, there are four distinct sub-sections:
    1. **Forecast Section** *(Completed & Live)*: Meteorological forecasts, district/upazila filtering, 5-6 day weather cards, and 3-hourly interval spline charts.
    2. **Advisory Section** *(Completed & Live)*: Region-wise monthly advisory with 7 agro-ecological zones, 12-month climatology graphs, and tailored livestock/poultry bulletins.
    3. **Weather Alert Section** *(Completed & Live)*: National alert counters, district/upazila warning levels for Rainfall (1), Wind (2), Heat Wave (3), Cold Wave (4), and THI Discomfort for Ruminants (10), Broilers (12), Layers (13).
    4. **Flood Magnitude Section** *(Completed & Live)*: River water level intelligence from FFWC/BWDB across 150+ monitoring stations in 4 river basins with Danger Level thresholds and livestock safety advisories.
- **UI / UX Principles**:
  - Clean, professional **white background** layout designed to prevent visual clutter.
  - Government branding (NLS Bangladesh, Department of Livestock Services - DLS Bangladesh).
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
| **District All Upazilas** | Batch aggregation across upazilas | `/api/nlas/district-forecast?districtCode=<code\>` |
| **Regional Advisory** | `nlas/advisory_region.php?region_code=<code\>&lang=<en\|bn\>&month=<1-12\>` | `/api/nlas/advisory-regional?regionCode=<code\>&lang=<en\|bn\>&month=<m\>` |
| **Weather Alert Counts** | `common/get_alert_count_all_upazila.php` | `/api/nlas/weather-alert?type=counts` |
| **District/Upazila Alerts** | `common/get_alert_district.php` & `get_alert_upazila.php` | `/api/nlas/weather-alert?parameter=<p\>&districtId=<id\>` |
| **Flood Stations & Water Levels** | `ffwc/data_load/stations-2025/` & `recent-observed/` | `/api/nlas/flood-magnitude` |

### Key Classification & Conversion Logic
1. **Weather Forecast Logic (`src/lib/nlas-client.ts` & `src/lib/district-forecast.ts`)**:
   - **District All-Upazilas Feature**: When a district is selected, fetches real-time observations and 5-6 day outlooks for all upazilas in that district via `/api/nlas/district-forecast`. Computes district-wide metrics (temperature range, average temp, average humidity, rainy upazilas count, max rain).
   - **Interactive All-Upazilas UI**: Supports real-time text search, 5 sort modes (A-Z, Highest Temp, Lowest Temp, Highest Humidity, Highest Rain), dual view modes (Cards Grid View and Comparison Table View), and quick navigation to inspect single upazila 3-hourly spline charts.
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
   - **Real-Time Dynamic Synchronization**: Dedicated `Reload Latest Advisory` button in the Advisory control header. Triggers cache-busting fetches (`reload=1&t=...`) to upstream government servers (`/apinlas/nlas/advisory_region.php`), evicts client-side cache, and displays live sync status timestamp badges.

---

## 3. Key Components & File Directory
- **`src/lib/district-forecast.ts`**: Dedicated district aggregation client, parallel fetching of all upazilas in a district, caching, and summary metrics computation.
- **`src/components/DistrictAllUpazilasView.tsx`**: District all-upazilas view with KPI summary banner, real-time search, 5-way sorting, cards grid view with 5-day mini outlook strip, and sortable comparison table.
- **`src/app/api/nlas/district-forecast/route.ts`**: API endpoint for district-wide weather aggregation across upazilas.
- **`src/lib/nlas-client.ts`**: Weather API client, TypeScript interfaces, sliding date windowing, weather condition mapping, and resilient fallbacks.
- **`src/lib/regional-advisory.ts`**: Dedicated Regional Advisory client, 7 agro-ecological zones definitions, district lists, real-time cache-busting query handler, and upstream proxy fetcher.
- **`src/app/api/nlas/`**: Next.js route handlers (`/forecast`, `/districts`, `/upazilas`, `/advisory-regional`, `/district-forecast`).
- **`src/components/Header.tsx`**: NLS Bangladesh & DLS branding, `Reload Latest Data` button with spinner animation, and user avatar.
- **`src/components/Sidebar.tsx`**: Collapsible navigation with NLS portal subsections (Weather Forecast & Advisory Section) and DLS verification badge.
- **`src/components/LocationSelector.tsx`**: Filter dropdowns for District and Upazila with dynamic cascading updates, `All Upazilas` option, and segmented toggle.
- **`src/components/HeroWeatherCard.tsx`**: Current date, location pin, humidity %, wind speed/direction, weather condition with day/night icon, and BMDWRF attribution.
- **`src/components/DailyForecastGrid.tsx`**: 5-6 day cards showing weekday, date, weather icon, temp range, rainfall, and relative humidity.
- **`src/components/HourlyForecastCharts.tsx`**: High-precision SVG interactive charts (Temp/Cloud, Rain/Humidity, Windgust/Direction).
- **`src/components/AdvisorySection.tsx`**: Full Regional Advisory module featuring 7 agro-ecological zone selector, 12-month climatology SVG chart, month picker, bilingual language switch (`English` / `বাংলা`), dedicated `Reload Latest Advisory` real-time sync button, and livestock/poultry bulletins.
- **`src/lib/bmd-district-forecast.ts`**: Dedicated BMD district aggregation client, parallel fetching of all upazilas in a district via `Promise.allSettled`, 5-minute memory caching, and district-wide summary telemetry metrics calculation (min/max temp, avg temp, avg humidity, rainfall alert count).
- **`src/components/BmdDistrictAllUpazilasView.tsx`**: BMD District all-upazilas view with KPI summary banner, real-time search, 5-way sorting, cards grid view with in-card tabs for 5-8 day Apple-Weather-style outlook rows and 3-hourly horizontal scrolling timeline, and sortable comparison table.
- **`src/app/api/bmd/district-forecast/route.ts`**: API endpoint for BMD district-wide weather aggregation across upazilas (`/api/bmd/district-forecast?districtCode=<code\>&lang=<en|bn\>`).
- **`src/components/BmdSection.tsx`**: BMD Portal container managing bilingual state ('bn'/'en'), segmented view switcher ('all' / 'single'), cascading station lookups, and deep inspection.
- **`src/lib/bamis-client.ts`**: BAMIS client library, 64-district mapping, HTML table & advisory parser, 15-minute SWR caching, and offline fallback.
- **`src/lib/bamis-all-districts.ts`**: Dedicated BAMIS 64-district aggregation client, division mappings (8 divisions), telemetry parser, in-memory caching, and national metric summaries.
- **`src/components/BamisAllDistrictsView.tsx`**: Full 64-Zilla agromet overview module featuring National KPI Telemetry cards, division filter pills, real-time search, 5-way sorting, cards grid view with rain badges and advisory tags, sortable comparison table, and one-click drilldown into single zilla bulletins.
- **`src/components/BamisSection.tsx`**: Main BAMIS portal container managing segmented view switching ('all' / 'single'), bilingual support ('bn'/'en'), live synchronization, return navigation, and deep inspection.
- **`src/context/DashboardContext.tsx`**: React context coordinating route changes, Header reload functions, loading status, and sidebar collapse states.
- **`src/components/DashboardShell.tsx`**: Shared client shell housing sticky Header, Link-based Sidebar, and main page viewports.
- **`src/components/ForecastSection.tsx`**: Modularized NLAS Weather Forecast section (All-Upazilas vs Single-Upazila view, hero card, daily grid, spline charts).
- **`src/app/page.tsx`**: Root route handler that automatically redirects `localhost:3000/` to `/forecast`.
- **`src/app/forecast/page.tsx`**: Dedicated page route for NLAS Weather Forecast (`/forecast`).
- **`src/app/forecast/[upazilaCode]/page.tsx`**: Dedicated dynamic route page for single upazila weather forecast & 3-hourly spline charts (`/forecast/[upazilaCode]`, e.g. `/forecast/302602` for Adabor).
- **`src/app/forecast/charts/[upazilaCode]/page.tsx`**: Alias redirect route forwarding to `/forecast/[upazilaCode]`.
- **`src/app/advisory/page.tsx`**: Dedicated page route for Regional Livestock Advisory (`/advisory`).
- **`src/app/bmd/page.tsx`**: Dedicated page route for BMD Upazila Weather Forecast (`/bmd`).
- **`src/app/bmd/[upazilaCode]/page.tsx`**: Dedicated dynamic route page for single station BMD weather telemetry & 3-hourly interactive SVG charts (`/bmd/[upazilaCode]`, e.g. `/bmd/302602` for Adabor).
- **`src/app/bmd/charts/[upazilaCode]/page.tsx`**: Alias redirect route forwarding to `/bmd/[upazilaCode]`.
- **`src/app/bamis/page.tsx`**: Dedicated page route for BAMIS All 64 Districts Agromet Overview (`/bamis`).
- **`src/app/bamis/[districtId]/page.tsx`**: Dedicated dynamic route page for single district Agromet Bulletins (`/bamis/[districtId]`, e.g. `/bamis/37` for Dhaka, `/bamis/57` for Chattogram).
- **`src/app/bmd-forecast/page.tsx`**: Redirect route sending `/bmd-forecast` to `/bmd`.
- **`src/app/bamis-bulletin/page.tsx`**: Redirect route sending `/bamis-bulletin` to `/bamis`.
- **`src/lib/ffwc-client.ts`**: Dedicated FFWC client library with TypeScript interfaces, status calculators (`Normal`, `Warning`, `Flood`, `Severe Flood`), trend evaluators, SWR caching, and 40-day history fetcher.
- **`src/lib/ffwc-fallback.json`**: Authentic fallback dataset covering 153 hydrological stations, 127 recent observations, 7-day district alert matrix, 29 medium-range forecast stations, and 81 rainfall stations.
- **`src/app/api/ffwc/route.ts`**: API endpoint for FFWC data aggregation and 40-day station water levels (`/api/ffwc`).
- **`src/components/FfwcSection.tsx`**: Complete FFWC intelligence container featuring Flood Alert & Magnitude, Hydrograph & River Stages, Observed Water Level with 40-day history modal, and Forecast & Map Layers.
- **`src/app/ffwc/page.tsx`**: Dedicated page route for FFWC Flood Alert & Magnitude (`/ffwc`).
- **`src/app/ffwc/hydrograph/page.tsx`**: Dedicated page route for FFWC Hydrograph & River Stages (`/ffwc/hydrograph`).
- **`src/app/ffwc/observed-water-level/page.tsx`**: Dedicated page route for FFWC Observed Water Level (`/ffwc/observed-water-level`).
- **`src/app/ffwc/forecast-maps/page.tsx`**: Dedicated page route for FFWC Forecast & Map Layers (`/ffwc/forecast-maps`).
- **`src/lib/ais-client.ts`**: Dedicated AIS client library with TypeScript interfaces, base64 content decoder, file parser, and 15-minute SWR caching.
- **`src/lib/ais-fallback.json`**: Authentic fallback dataset covering monthly agricultural directives, 7 special advisory publications, and Boro seedbed technology.
- **`src/app/api/ais/route.ts`**: API endpoint for AIS data aggregation (`/api/ais?reload=true&type=all|monthly|special|technology`).
- **`src/components/AisSection.tsx`**: Complete AIS intelligence container featuring Monthly Agriculture Advisory, Special Advisories & Files with in-app document viewer, and Crop Production Technology.
- **`src/app/ais/page.tsx`**: Dedicated page route for AIS Monthly Agriculture Advisory (`/ais`).
- **`src/app/ais/monthly-advisory/page.tsx`**: Dedicated page route for AIS Monthly Advisory (`/ais/monthly-advisory`).
- **`src/app/ais/special-advisory/page.tsx`**: Dedicated page route for AIS Special Advisories & Files (`/ais/special-advisory`).
- **`src/app/ais/crop-technology/page.tsx`**: Dedicated page route for AIS Crop Production Technology (`/ais/crop-technology`).
- **`src/app/globals.css`**: Design tokens, typography (Inter & Hind Siliguri), smooth animations, and scrollbars.

---

## 4. Integrated Websites
1. **NLS Portal (NLAS)** (`nlas.dls.gov.bd`):
   - **Forecast Section**: 
     - **District All-Upazilas View (`/forecast`)**: When any district is selected, all monitored upazilas are displayed on one page with KPI metrics, search, sorting, cards grid, and comparison table.
     - **Dedicated 3-Hourly Charts Route (`/forecast/[upazilaCode]`)**: Clicking "Inspect 3-Hourly Spline Charts" or table "Inspect Charts" opens dedicated route `/forecast/[upazilaCode]` with Hero card, 5-6 day outlook, high-precision SVG spline charts, breadcrumbs, and return link to `/forecast`.
   - **Advisory Section**: Region-wise monthly advisory with 7 agro-ecological zones, 12-month climatology graphs, and tailored livestock/poultry bulletins.
2. **BMD USF Portal** (`https://usf.bmd.gov.bd/`):
   - **Upazila Weather Forecast Section**:
     - Real-time meteorological telemetry directly from BMDWRF and `https://api.bdservers.site`.
     - **District All-Upazilas View (`/bmd`)**: When any district (Jela) is selected, all monitored upazilas in that district are displayed on one page with:
       - Aggregate KPI metrics (Total Stations, Temp Range, Avg Humidity, Rainy Stations Alert).
       - Real-time search (Bengali & English) and 5-way sorting (A-Z, Highest Temp, Lowest Temp, Highest Humidity, Highest Rain).
       - In-card tab switcher: **5-8 Day Outlook** (spacious Apple Weather-style rows with diurnal temperature spectrum bars) and **3-Hourly Timeline** (clean horizontal scroll tracks with formatted time spans like `06:00 AM – 09:00 AM` / `০৬:০০ - ০৯:০০`).
       - Layout switcher: Cards Grid View and Sortable Comparison Table.
     - **Dedicated 3-Hourly Charts Route (`/bmd/[upazilaCode]`)**:
       - Clicking "৩-ঘণ্টার বিস্তারিত চার্ট ও গ্রাফ দেখুন" or table "চার্ট দেখুন" navigates to `/bmd/[upazilaCode]`.
       - Real-time observation Hero card with Day/Night atmospheric gradient, temperature, Heat Index real feel, relative humidity, wind speed and 360° rotating compass pointer.
       - 8-Day Daily Weather Cards showing day/night condition icons, max/min temps, precipitation range, wind speed/direction, and relative humidity.
       - 3-Hourly Interactive High-Precision SVG Charts (Next 3 days / 24 steps):
         - Chart 1: Temperature Spline with condition icon plotted at each 3-hour interval.
         - Chart 2: Rainfall (mm) bar/area & Relative Humidity (%) spline chart with dual axis.
         - Chart 3: Wind Speed (km/h) spline & 360° rotating compass pointer arrow for each step.
       - Return navigation link: `← সকল স্টেশনে ফিরে যান` linking back to `/bmd`.
     - Bilingual toggle (`English` / `বাংলা`) with Bengali numerals, weekdays, and weather terminology.
     - Technical attribution to Bangladesh Meteorological Department (BMD), RIMES, and Govt of Bangladesh.
3. **BAMIS Portal (DAE)** (`https://www.bamis.gov.bd/`):
   - **National Agromet Bulletin Section (`/bamis/national` & `/bamis-national`)**:
     - Official national bulletin from Department of Agricultural Extension (DAE) & Ministry of Agriculture (`https://www.bamis.gov.bd/bulletin/nation/current/`).
     - **Authentic Executive Header & Meta Card**:
       - Issue date (`২৮ অক্টোবর ২০২৬ (বুধবার)` / `28 October 2026 (Wednesday)`) and dekad validity period (`২৮.১০.২০২৬ - ০১.১১.২০২৬`).
     - **National KPI Telemetry Cards**:
       - 5-day quantitative forecast window, 64 districts monitored across 8 divisions, 10 critical agricultural sectors, and 8 quantitative meteorological parameters.
     - **5-Day District Quantitative Forecast**:
       - 8 meteorological parameters: Cumulative Rainfall (`rainc/sum`), Max Temp (`t2/max`), Min Temp (`t2/min`), Diurnal Range (`t2/diurnal`), Max Humidity (`rh2/max`), Min Humidity (`rh2/min`), Cloud Cover (`clflo/avg`), Wind Speed (`ws10/avg`).
       - 64-District Data Table: Real-time search, 8-division filters, value sorting, and percentage distribution bars.
     - **Key Agromet Advisories (মূখ্য কৃষি আবহাওয়া পরামর্শ)**:
       - 10 sectors: Wheat (গম), Aman Rice (ধান আমন), Boro Rice (ধান বোরো), Vegetables (সবজি), Horticultural Crops (উদ্যান ফসল), Mustard (সরিষা), Livestock (গবাদি পশু), Poultry (হাঁসমুরগী), Fisheries (মৎস্য), Potato (আলু).
       - Phenological stage badges, numbered actionable directives, search filter, and one-click copy advisory with confirmation.
       - Live sync badge with timestamp, dedicated reload button in header and section, zero background polling loops.
       - Bilingual support (`English` / `বাংলা`) with authentic terminology.
     - Official bulletins from Department of Agricultural Extension (DAE) & Ministry of Agriculture.
     - **All 64 Zillas in One Section (`BamisAllDistrictsView.tsx` on `/bamis`)**:
       - National Agromet KPI Telemetry banner: 64 districts across 8 divisions, temperature spectrum (min/max/average), rainfall forecast alert count, average relative humidity, and active bulletin window.
       - Interactive Division Filter Chips: Instant filtering by division (All, Dhaka, Chattogram, Rajshahi, Khulna, Barishal, Sylhet, Rangpur, Mymensingh) with district count badges.
       - Real-time Search: Live search across district names (Bengali & English), divisions, and crop types.
       - 5-Way Sorting: District Name (A-Z / ক-হ), Highest Max Temp, Lowest Min Temp, Highest Rain Outlook, Most Advisories.
       - Dual Layouts:
         - **Cards Grid View**: Individual cards for each zilla featuring rain forecast badge, 5-day rain amount, max/min temperature range, humidity, wind speed & direction, crop advisory tags, primary advisory excerpt, and "পূর্ণাঙ্গ [জেলা] বুলেটিন দেখুন" (`buletin dekhun`) button.
         - **Comparison Table View**: High-density sortable comparison table with all 64 districts, key meteorological & agricultural indicators, and "বুলেটিন" (`buletin`) action link.
       - **Route-Based Single District Drilldown (`/bamis/[districtId]`)**: Clicking "পূর্ণাঙ্গ জেলা বুলেটিন দেখুন", the table "বুলেটিন" button, or any table row navigates directly to dedicated route `/bamis/[districtId]` (e.g. `/bamis/37` for Dhaka, `/bamis/57` for Chattogram).
     - **Single Zilla Deep Bulletin Page (`src/app/bamis/[districtId]/page.tsx`)**:
       - Prominent breadcrumb & return button: `← সকল ৬৪ জেলা তালিকায় ফিরে যান` (Back to All 64 Districts) linking back to `/bamis`.
       - Interactive Agromet Dashboard with 4 KPI summary cards, Sub-tab switcher between Past 4 Days Observed Weather and Next 5 Days BMD Forecast tables.
       - Categorized Crop & Agricultural Advisory Cards (Aman Rice, Boro Rice, Vegetables, Fruit Crops, Livestock, Poultry, Fisheries, Potato) with one-click copy.
       - Print view support (`window.print()`).
       - Dropdown and quick jump pills update URL dynamically to other district bulletin pages.
     - Bilingual toggle (`English` / `বাংলা`) with Bengali numerals and translations.




4. **BMD Live Portal** (`https://server6.bmd.gov.bd/`):
   - **Weather Forecast Section (`/bmd-live`)**:
     - Real-time meteorological telemetry and daily outlook directly from BMD Live backend (`https://server6.bmd.gov.bd/home_all_json`).
     - **Authentic Portal Layout (Image 1 & Image 2)**:
       - **Left Filter Column**:
         - Division dropdown (Dhaka, Chattogram, Rajshahi, Khulna, Barishal, Sylhet, Rangpur, Mymensingh).
         - Station dropdown (dynamically populated for the active division, defaulting to Faridpur/Dhaka).
         - "View Details" button opening interactive modal with complete surface pressure, wind, and humidity indicators.
         - "☁ Forecast" button (BMD cyan-blue with yellow cloud icon).
         - BMD Daily Weather Bulletin banner linking to official daily forecasts.
       - **Today's Condition Card**:
         - Header: `Today's Condition: [Station Name]` (e.g. `Today's Condition: Faridpur`).
         - Atmospheric blue gradient card (`#1d6e99` to `#2586b6`).
         - Weather condition icon (`weather_icon`).
         - Max Temp `↑ 32.1°C` (orange up arrow) and Min Temp `↓ 23.0°C` (cyan down arrow).
         - Weather condition text (`Partly Cloudy` / `আংশিক মেঘলা`).
         - Telemetry list: Wind speed (`km/h`), Morning Humidity (`%`), Evening Humidity (`%`), Surface Pressure (`hPa`), and Rainfall (`mm`).
       - **Sunrise & Sunset Pill Capsules**:
         - Left pill: Sunrise icon + `Sunrise: 6:07 AM`.
         - Right pill: `Sunset: 5:20 PM` + Sunset icon.
       - **Next X-Days Weather Forecast**:
         - Header: `Next 1-Days Weather Forecast` with `[Division] - [Station]` combined dropdown (e.g. `Dhaka - Faridpur`).
         - Dark teal forecast cards (`#21607a`): Date (`4-11-2026`), Weekday (`Wednesday`), Condition (`Partly Cloudy`), Weather icon, and Max/Min temps (`↑ 30.9°C`, `↓ 23.4°C`).
     - **All Stations Comparison View**:
       - National KPI telemetry cards (Total Stations: 46, Temp Range, Avg Morning/Evening Humidity, Rainy Stations).
       - Search bar across station/division names.
       - Sortable comparison table of all stations across Bangladesh.
     - **Real-Time Periodic Synchronization**:
       - Dedicated `Reload BMD Live Data` button in top header triggering cache-busting queries (`reload=true&t=...`).
       - Live sync status indicator with pulse animation and timestamp.
     - Bilingual toggle (`English` / `বাংলা`) with Bengali numerals, weekdays, and conditions.
   - **Severe Weather Warnings Section (`/bmd-live/warnings` & `/bmd-live-warnings`)**:
     - Upstream data directly harvested from official BMD server6 warning pages:
       1. Marine Warning (`/en/p/Marine-Warning` & `/bn/p/Marine-Warning`)
       2. Inland Riverport Warning (`/en/p/Inland-Riverport-Warning` & `/bn/p/Inland-Riverport-Warning`)
       3. Heavy Rainfall Warning (`/en/p/Heavy-Rainfall-Warning` & `/bn/p/Heavy-Rainfall-Warning`)
       4. Lightning Warning (`/en/p/Lightning-Warning` & `/bn/p/Lightning-Warning`)
       5. Kalbaishakhi Warning (`/en/p/Kalbaishakhi-Warning` & `/bn/p/Kalbaishakhi-Warning`)
       6. Heat Wave Warning (`/en/p/Heat-Wave-Warning` & `/bn/p/Heat-Wave-Warning`)
       7. Fog Warning (`/en/p/Fog-Warning` & `/bn/p/Fog-Warning`)
       8. Special Weather Bulletin (`/en/p/Special-Weather-Bulletin` & `/bn/p/Special-Weather-Bulletin`)
     - **Authentic Emergency Alert Marquee**: Real-time breaking cyclone / storm advisory banner extracted from BMD Live (e.g. Signal No. 3 for Maritime Ports due to cyclone "Murasu").
     - **Executive KPI Telemetry**: 4 summary indicator cards (Active Warning Bulletins, Maritime Ports Cautionary No. 3, Inland Riverports Gale Signal No. 1, Normal/Cleared domains).
     - **Dynamic Filtering & Search**: Filter by status (`All (8)`, `Active Alerts Only`, `Normal / Cleared`), real-time search, and dual view switcher (Cards Grid vs Comparison Table).
     - **In-App Official PDF Viewer & Language Switch**: Modal reader supporting bilingual PDFs (Bangla / English) with direct download and portal link outs.
     - **On-Demand Synchronization**: Zero background polling loops; triggered via dedicated `Reload Warnings` button in the section and top Header.

    - **Three-Month Climate Outlook Section (`/bmd-live/three-month-outlook`, `/bmd-live/outlook`, `/bmd-live-outlook`, `/server6/outlook`)**:
      - Upstream data directly harvested from official BMD server6 seasonal forecast circular (`/en/p/Three-Month-Outlook` & `/bn/p/Three-Month-Outlook`).
      - **Authentic Executive Header & Circular Meta Card**:
        - Compiled by the BMD Expert Committee chaired by the Director of BMD (`Ref: 23.09.2680.172.43.002.25.2672`, dated `01 November 2026`).
        - Validity period covering the entire upcoming trimester: November 2026, December 2026, and January 2027.
      - **5 Major Seasonal Hazard Directive Cards**:
        1. Rainfall Outlook: Overall normal precipitation across Bangladesh.
        2. Bay of Bengal Depressions & Cyclones: 2–4 depressions, with 1–2 intensifying into cyclonic storms.
        3. Winter Cold Waves: 4–6 cold waves across northern, western, and central Bangladesh, including 2–3 moderate-to-severe cold waves (4°C–6°C).
        4. Dense Fog & Riverine Visibility: Moderate to dense fog in late midnight till morning hours from December through January.
        5. Diurnal Temperatures & Day/Night Variance: Day and night temperatures expected to remain normal to slightly above normal.
      - **Division-Wise Quantitative Climatology Table (All 8 Divisions)**:
        - November, December, January normal rainfall vs forecast rainfall ranges (mm), percentage deviation, and soil moisture % for Dhaka, Chattogram, Rajshahi, Khulna, Barishal, Sylhet, Rangpur, and Mymensingh.
        - Interactive division filter selector and search bar.
      - **Previous Month Performance Review (October 2026 Climatology)**:
        - Detailed synoptic review including Southern Oscillation Index (SOI: +0.4, Neutral/La Niña transition), rainfall statistics (-22.4% deficit), and Severe Cyclonic Storm "Arnab".
      - **In-App Bilingual Official Circular PDF Viewer Modal**:
        - Direct modal reader supporting authentic bilingual circular PDFs (`211674.pdf` Bangla, `211673.pdf` English), language toggle, and official download links.
      - **On-Demand Dynamic Synchronization**:
        - Upstream proxy via `/api/bmd-live/outlook?reload=true` with 15-minute SWR caching, instant cache-busting, zero polling loops, and full offline fallback (`bmd-live-outlook-fallback.json`).

5. **FFWC Portal (BWDB)** (`https://ffwc.gov.bd/app/home`):
   - **Flood Forecasting & Warning Centre (BWDB)**:
     - Real-time hydrological intelligence directly harvested from `https://api.ffwc.gov.bd/data_load/` using security header `x-ffwc-internal-key: FFWC-Project-2026-Secure-V1`.
     - **Four Sub-sections**:
       1. **Flood Alert & Magnitude (`/ffwc`, `/ffwc/alerts`, `/ffwc/flood-magnitude`)**:
          - National hydrological status overview with 153 monitored stations across 4 river basins (Brahmaputra, Ganges, Meghna, South Eastern Hill).
          - District selector & real-time search across all 64 districts.
          - Status categorization:
            - `Normal`: Water level > 50 cm below Danger Level.
            - `Warning`: Water level within 50 cm below Danger Level (`diff >= -0.5m`).
            - `Flood`: Water level at or above Danger Level (`diff >= 0m`).
            - `Severe Flood`: Water level 1 meter or more above Danger Level (`diff >= 1.0m`).
            - `N/A`: Station offline or data not available.
          - **Farmer OBD Filter**: One-click toggle "কৃষক OBD প্রাসঙ্গিক অ্যালার্ট" (`Farmer OBD Relevant Active Status`) filtering down to only districts with active Warning, Flood, or Severe Flood levels for rapid rural advisory dispatch.
          - 7-Day district flood outlook matrix displaying day-by-day forecasted alert status.
       2. **Hydrograph & River Stages (`/ffwc/hydrograph`)**:
          - River filter (Jamuna, Padma, Meghna, Surma, Kushiyara, Teesta, Dharla, Brahmaputra, Old Brahmaputra, etc.), District filter, and Station search.
          - Forecast range switcher: Short Range (5-Day), Medium Range (10-Day), and Monsoon forecast views.
          - High-precision interactive SVG hydrograph chart plotting observed water level curve, Danger Level (DL) red dashed threshold, Recorded Highest Water Level (RHWL) purple threshold, and interactive tooltips.
          - Quick inspection of 40-day time-series readings.
       3. **Observed Water Level (`/ffwc/observed-water-level`, `/ffwc/observed`)**:
          - High-density searchable table of all 153 stations with River name, District, Basin, Danger Level (DL), Recorded Highest Water Level (RHWL), Observed Water Level, Difference from DL (m), and Trend (Rising ↑, Falling ↓, Steady →).
          - Status filter (`All`, `Normal`, `Warning`, `Flood`, `Severe Flood`) and Trend filter (`All`, `Rising`, `Falling`, `Steady`).
          - Deep inspection modal: clicking "40 দিনের হিস্ট্রি" opens 40-day historical water level time-series table and spline trend chart.
       4. **Forecast & Outlook (`/ffwc/forecast-maps`, `/ffwc/maps`)**:
          - Hydrological Outlook & Basin Forecast Trends analytics (Improving, Worsening, New Alerts, Persisting Severe flood districts).
          - 10-Day Medium Range quantitative river stage forecast table across 29 key monitoring stations with searchable station and river filters.
          - 81-Station Rainfall Observation table covering BWDB rain gauge network with 24-hour precipitation amounts, rainfall intensity badges, and river basin filters.
          - Official FFWC bulletin summary & synoptic river basin outlook.
     - **On-Demand Dynamic Synchronization**:
       - Next.js route handler `/api/ffwc` proxying upstream endpoints with 15-minute SWR caching, instant reload via `?reload=true`, and full fallback dataset (`src/lib/ffwc-fallback.json`).

6. **AIS Portal (কৃষি তথ্য সার্ভিস - এআইএস)** (`https://ais.gov.bd/`):
   - **Agriculture Information Service (Ministry of Agriculture)**:
     - Official agromet directives, publications, and production technology directly harvested from `https://ais.gov.bd/`.
     - **Three Sub-sections**:
       1. **Monthly Agriculture Advisory (`/ais`, `/ais/monthly-advisory`)**:
          - Direct upstream source: `https://ais.gov.bd/pages/static-pages/6922dedd933eb65569e1df05` (এ মাসের কৃষি / জ্যৈষ্ঠ মাসের কৃষি).
          - Editorial metadata: Published by Ferdousi Begum, Editor, AIS, Khamarbari, Farmgate, Dhaka (Phone: 02-55028404, Email: editor@ais.gov.bd, Krishi Call Center: 16123).
          - Sector-wise actionable directives: Boro Rice (বোরো ধান), Aus Rice (আউশ ধান), Transplanted Aman (রোপা আমন), Jute (পাট), Summer Vegetables (গ্রীষ্মকালীন শাকসবজি), Fruit Orchards (উদ্যান ফসল ও ফলমূল), Miscellaneous (আদা, হলুদ, মুগডাল, কচু, ধইঞ্চা), Livestock & Poultry (প্রাণিসম্পদ ও পোল্ট্রি), and Fisheries (মৎস্য সম্পদ).
          - Interactive category filtering, search, stage badges, and one-click copy.
       2. **Special Advisories & Technical Files (`/ais/special-advisory`, `/ais/files`)**:
          - Direct upstream source: `https://ais.gov.bd/pages/files/6922dadf933eb65569e0709a` (বিশেষ পরামর্শ | ফাইল সমূহ).
          - 7 official technical publications:
            1. Balanced fertilizer application guide (সুষম সার ব্যবহারের পরামর্শ - PDF)
            2. Protecting Rabi crops during severe cold waves (তীব্র শীতে রবি ফসল রক্ষায় করণীয় - JPG)
            3. Rice damaging disease management (ধানের ক্ষতিকারক রোগ ব্যবস্থাপনা - PDF)
            4. Post-flood agricultural rehabilitation (বন্যা ও বন্যা পরবর্তীতে চাষি ভাইদের করণীয় - PDF)
            5. Brown planthopper control in paddy (ধানে বাদামি গাছ ফড়িং দমনে করণীয় - PDF)
            6. Late blight of potato control (আলুর মড়ক রোগ দমনে করণীয় - PDF)
            7. Post-cold wave Boro rice care (ঠান্ডা পরবর্তী সময়ে বোরো ধান পরিচর্যায় কৃষক ভাইদের করণীয় - PDF)
          - Dual layouts (Cards Grid vs Comparison Table), category filter chips, search, direct Oracle Cloud download links, and **In-App Document Reader Modal** (PDF/JPG preview).
       3. **Crop Production Technology (`/ais/crop-technology`, `/ais/seedbed`)**:
          - Direct upstream source: `https://ais.gov.bd/pages/static-pages/6922dfdd933eb65569e2464d` (বোরো ধানের বীজতলা তৈরি | পাতা).
          - 5-step technical guide: Land selection & organic manure, drainage channels, ecology-matched variety selection matrix (Drought, Favorable, Northern Cold, Haor Lowlands, Coastal Saline), seed treatment & 60-70h sprouting, and cold wave / fog protection.
          - Additional technology guides: Rice harvesting, threshing & storage (`6922df64933eb65569e21aed`) and detecting adulterated fertilizers (`6922dddc933eb65569e16bc4`).
     - **On-Demand Dynamic Synchronization**:
       - Next.js route handler `/api/ais` proxying upstream endpoints with 15-minute SWR caching, instant reload via `?reload=true`, and full authentic fallback dataset (`src/lib/ais-fallback.json`).
