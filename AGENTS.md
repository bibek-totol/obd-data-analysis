<!-- BEGIN:nextjs-agent-rules -->

## This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

# Project Context: NLAS Weather & Advisory Intelligence Platform

## 1. Project Overview & Architecture
This is a **Next.js (App Router, TypeScript, Vanilla CSS)** application designed to monitor and aggregate data from government and meteorological portals. 
- **Primary Website (Active)**: **National Livestock Advisory System (NLAS / NLS)** (`https://nlas.dls.gov.bd/dashboard/weather_forecast`).
- **Sidebar Structure**:
  - Multi-website extensible sidebar where multiple portals can be monitored. Currently, **NLS (NLAS)** is the active portal.
  - An **"+ Add New Website"** feature allows registering future portals (e.g., BMD, DAE).
  - Under NLS, there are two distinct sub-sections:
    1. **Forecast Section** *(Completed & Live)*: Meteorological forecasts, district/upazila filtering, 5-6 day weather cards, and 3-hourly interval spline charts.
    2. **Advisory Section** *(Framework Ready)*: Configured in the navigation and ready for user requirements in the next phase.
- **UI / UX Principles**:
  - Clean, professional **white background** layout designed to prevent visual clutter.
  - Government branding (CARE South Asia, Department of Livestock Services - DLS Bangladesh).
  - Fully responsive, accessible, with color-coded badges and micro-animations.

---

## 2. Data Pipeline & Government API Integration
Data is harvested directly from the NLAS backend services (`https://nlas.dls.gov.bd/apinlas/`):

| Resource | Upstream Government Endpoint | Next.js Internal Route Handler |
| :--- | :--- | :--- |
| **Districts** | `common/get_district.php` | `/api/nlas/districts` |
| **Upazilas** | `common/get_upazila.php?name_code=<code\>` | `/api/nlas/upazilas?districtCode=<code\>` |
| **Daily Forecast** | `upazila_forecast_recent?SOURCE=BMDWRF&PCODE=<pcode\>` | `/api/nlas/forecast?upazilaCode=<pcode\>` |
| **3-Hourly Steps** | `upazila_forecast_steps_recent?SOURCE=BMDWRF&PCODE=<pcode\>` | `/api/nlas/forecast?upazilaCode=<pcode\>` |

### Key Classification & Conversion Logic (`src/lib/nlas-client.ts`)
- **Hero Card Matching Algorithm**: Implements the government portal's exact matching logic (`Je >= Tn && Je < xr`) where `Je = YYYYMMDDHH` in `Asia/Dhaka` time, perfectly synchronizing hero banner humidity, temperature, wind, and day/night condition with the live portal.
- **Wind Direction & Offset**: Uses the official `-48` degree offset applied by the government frontend (`-48 + winddir`) and 4-quadrant compass mapping (`<=90 NE, <=180 SE, <=270 SW, NW`).
- **Dynamic Daily Sliding Window**: Automatically filters out past dates by comparing against current date in `Asia/Dhaka` (`YYYY-MM-DD`). If today is 23 October, it displays 23, 24, 25, 26, 27, 28 Oct; if today is 24 October, it automatically shifts to 24, 25, 26, 27, 28, 29 Oct.
- **Hourly Step Normalization**: Correctly parses NLAS step time format (`00:HH:00` or `HH:MM:SS`) to produce accurate 3-hourly time spans (`00:00 - 03:00`, `03:00 - 06:00`, etc.) and filters historical steps prior to the current calendar date.
- **`findCloudCondition(rain, cloudCover, hour)`**: Determines condition name (`Sunny`, `Mostly Sunny`, `Partly Cloudy`, `Light Rain`, `Cloudy`, etc.) and exact matching weather iconography. Evaluates hour < 6 or >= 18 as nighttime (`Clear`, Moon icon).
- **"Reload Latest Data"**: Button in the header that triggers an immediate re-fetch bypassing cache, updating the last synchronized timestamp (`Synchronized at: HH:MM:SS`).

---

## 3. Key Components & File Directory
- **`src/lib/nlas-client.ts`**: Core API client, TypeScript interfaces (`ForecastResponseData`, `DailyWeatherItem`, `HourlyWeatherStep`), weather calculation logic, dynamic daily windowing, and resilient fallbacks.
- **`src/app/api/nlas/`**: Next.js route handlers acting as server-side proxies to prevent CORS issues.
- **`src/components/Header.tsx`**: CARE South Asia & DLS branding, live feed status badge, `Reload Latest Data` button with spinner animation, language toggle (`বাংলা | EN`), and user avatar.
- **`src/components/Sidebar.tsx`**: Collapsible navigation with integrated website list, active NLS subsections (Forecast & Advisory), and modal for adding new portals.
- **`src/components/LocationSelector.tsx`**: Filter dropdowns for District and Upazila with dynamic cascading updates.
- **`src/components/HeroWeatherCard.tsx`**: Current date, location pin, humidity %, wind speed/direction, weather condition with day/night icon, and BMDWRF attribution.
- **`src/components/DailyForecastGrid.tsx`**: 5-6 day cards showing weekday, date, weather icon, temp range (`33° / 25°C`), rainfall (`0mm`), and wind speed. Starts dynamically on today's calendar date.
- **`src/components/HourlyForecastCharts.tsx`**: High-precision SVG interactive charts:
  1. *Temperature & Cloud Condition*: 3-hourly spline curve across tomorrow and the day after.
  2. *Rainfall & Relative Humidity*: Green spline curve with explicit percentage labels (`53%`, `58%`, `52%`...) and rainfall baseline points (`0 mm`).
  3. *Windgust & Wind Direction*: Wind gust curve with direction labels.
- **`src/components/AdvisorySection.tsx`**: Advisory preview module displaying preliminary THI (Temperature-Humidity Index) benchmarks for dairy, broilers, and layers.
- **`src/app/page.tsx`**: Main dashboard controller managing state, cascading fetches, manual refresh, and active section toggling.
- **`src/app/globals.css`**: Design tokens, typography (Inter & Hind Siliguri), smooth animations, and scrollbars.

---

## 4. Current Status & Context for Next Session
1. **Forecast Section**: Fully implemented, connected to live data, verified with dynamic daily sliding calendar windows (5-6 day forecast cards and 3-hourly chart intervals).
2. **Upcoming Task / Handover**:
   - The user will specify requirements for the **Advisory Section** (sub-section under NLS).
   - Once advisory rules, bulletin scraping requirements, or alert thresholds are provided, build the advisory logic within `src/components/AdvisorySection.tsx` and create relevant API routes if needed.

