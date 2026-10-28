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
   - **District Agromet Advisory Bulletin Section**:
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


