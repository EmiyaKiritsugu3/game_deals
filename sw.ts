/// <reference lib="webworker" />

import {
  CacheFirst,
  NetworkFirst,
  Serwist,
  StaleWhileRevalidate,
} from 'serwist';

declare const self: ServiceWorkerGlobalScope;

const serwist = new Serwist({
  cacheId: 'gamedeals',
  skipWaiting: true,
  clientsClaim: true,
  navigationPreload: true,
  disableDevLogs: process.env.NODE_ENV === 'production',
  precacheEntries: self.__SW_MANIFEST ?? [],
  runtimeCaching: [
    {
      matcher: /\.(?:png|jpg|jpeg|gif|svg|ico|webp)$/,
      handler: new CacheFirst({
        cacheName: 'static-images',
        expiration: { maxEntries: 100, maxAgeSeconds: 30 * 24 * 60 * 60 },
      }),
    },
    {
      matcher: /\.(?:css|scss)$/,
      handler: new StaleWhileRevalidate({
        cacheName: 'static-styles',
      }),
    },
    {
      matcher: /\.(?:js|mjs)$/,
      handler: new StaleWhileRevalidate({
        cacheName: 'static-scripts',
      }),
    },
    {
      matcher: /\.(?:woff2?|ttf|otf|eot)$/,
      handler: new CacheFirst({
        cacheName: 'static-fonts',
        expiration: { maxEntries: 50, maxAgeSeconds: 365 * 24 * 60 * 60 },
      }),
    },
    {
      matcher: ({ request }) => request.mode === 'navigate',
      handler: new NetworkFirst({
        cacheName: 'pages',
        networkTimeoutSeconds: 5,
        expiration: { maxEntries: 50, maxAgeSeconds: 24 * 60 * 60 },
      }),
    },
    {
      matcher: /\/api\//,
      handler: new NetworkFirst({
        cacheName: 'api-cache',
        expiration: { maxEntries: 100, maxAgeSeconds: 60 * 60 },
      }),
    },
  ],
  fallbacks: {
    entries: [
      { url: '/offline', matcher: ({ request }) => request.mode === 'navigate' },
    ],
  },
});

serwist.addEventListeners();
