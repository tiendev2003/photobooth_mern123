import { MetadataRoute } from "next";

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = "https://s.mayphotobooth.com";

  return [
    {
      url: `${baseUrl}/`,
      lastModified: new Date().toISOString(),
      priority: 1.0,
    },
    {
      url: `${baseUrl}/step/step1`,
      lastModified: new Date().toISOString(),
      priority: 0.9,
    },
    {
      url: `${baseUrl}/step/step2`,
      lastModified: new Date().toISOString(),
      priority: 0.8,
    },
    {
      url: `${baseUrl}/step/step3`,
      lastModified: new Date().toISOString(),
      priority: 0.7,
    },
    {
      url: `${baseUrl}/step/step4`,
      lastModified: new Date().toISOString(),
      priority: 0.6,
    },
    {
      url: `${baseUrl}/step/step5`,
      lastModified: new Date().toISOString(),
      priority: 0.5,
    },
    {
      url: `${baseUrl}/step/step6`,
      lastModified: new Date().toISOString(),
      priority: 0.4,
    },
    {
      url: `${baseUrl}/step/step7`,
      lastModified: new Date().toISOString(),
      priority: 0.3,
    },
    {
      url: `${baseUrl}/step/step8`,
      lastModified: new Date().toISOString(),
      priority: 0.2,
    },
    {
      url: `${baseUrl}/step/step9`,
      lastModified: new Date().toISOString(),
      priority: 0.1,
    },
  ];
}
