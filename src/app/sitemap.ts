import type { MetadataRoute } from 'next';

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';

  const staticRoutes: MetadataRoute.Sitemap = [
    // 1. NLS Portal (NLAS / DLS)
    {
      url: `${baseUrl}/forecast`,
      lastModified: new Date(),
      changeFrequency: 'hourly',
      priority: 1.0,
    },
    {
      url: `${baseUrl}/advisory`,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 0.9,
    },
    {
      url: `${baseUrl}/weather-alert`,
      lastModified: new Date(),
      changeFrequency: 'hourly',
      priority: 0.9,
    },
    {
      url: `${baseUrl}/flood-magnitude`,
      lastModified: new Date(),
      changeFrequency: 'hourly',
      priority: 0.8,
    },

    // 2. BMD USF Portal
    {
      url: `${baseUrl}/bmd`,
      lastModified: new Date(),
      changeFrequency: 'hourly',
      priority: 0.9,
    },

    // 3. BAMIS Portal (DAE)
    {
      url: `${baseUrl}/bamis`,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 0.9,
    },
    {
      url: `${baseUrl}/bamis/national`,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 0.8,
    },

    // 4. FFWC Flood Portal
    {
      url: `${baseUrl}/ffwc`,
      lastModified: new Date(),
      changeFrequency: 'hourly',
      priority: 0.9,
    },
    {
      url: `${baseUrl}/ffwc/hydrograph`,
      lastModified: new Date(),
      changeFrequency: 'hourly',
      priority: 0.8,
    },
    {
      url: `${baseUrl}/ffwc/observed-water-level`,
      lastModified: new Date(),
      changeFrequency: 'hourly',
      priority: 0.8,
    },
    {
      url: `${baseUrl}/ffwc/forecast-maps`,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 0.7,
    },

    // 5. BMD Live Portal (server6)
    {
      url: `${baseUrl}/bmd-live/warnings`,
      lastModified: new Date(),
      changeFrequency: 'hourly',
      priority: 0.9,
    },
    {
      url: `${baseUrl}/bmd-live/outlook`,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 0.8,
    },

    // 6. AIS Portal (Agriculture Information Service)
    {
      url: `${baseUrl}/ais`,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 0.8,
    },
    {
      url: `${baseUrl}/ais/monthly-advisory`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.8,
    },
    {
      url: `${baseUrl}/ais/special-advisory`,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 0.7,
    },
    {
      url: `${baseUrl}/ais/crop-technology`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.7,
    },
  ];

  return staticRoutes;
}

