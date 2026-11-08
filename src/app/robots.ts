import { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: ['/', '/about', '/login', '/register', '/crypto'],
        disallow: ['/admin', '/admin/*', '/api/*', '/checkout/*'],
      },
      {
        userAgent: 'Googlebot',
        allow: ['/', '/about', '/login', '/register', '/crypto'],
        disallow: ['/admin', '/admin/*', '/api/*'],
      },
    ],
    sitemap: 'https://alibank.tarroz.com/sitemap.xml',
  };
}

