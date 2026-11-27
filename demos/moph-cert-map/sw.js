/* Service worker – MOPH Certificate Map V.1 demo
 * - หน้าแอป: network-first (ได้เวอร์ชันล่าสุดเสมอ) และเปิดได้จากแคชเมื่อออฟไลน์
 * - Leaflet / ฟอนต์: cache-first
 * - ไทล์แผนที่: ไม่แคช (ต้องออนไลน์)
 */
const CACHE = 'moph-cert-map-v2';
const BASE = '/demos/moph-cert-map/';
const SHELL = [
  BASE + 'index.html',
  BASE + 'manifest.webmanifest',
  BASE + 'icon-192.png',
  BASE + 'icon-512.png',
  'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css',
  'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js'
];

self.addEventListener('install', (e) => {
  e.waitUntil(caches.open(CACHE).then((c) => c.addAll(SHELL)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (e) => {
  const req = e.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);

  if (req.mode === 'navigate') {
    e.respondWith(
      fetch(req)
        .then((res) => { const copy = res.clone(); caches.open(CACHE).then((c) => c.put(BASE + 'index.html', copy)); return res; })
        .catch(() => caches.match(BASE + 'index.html'))
    );
    return;
  }

  if (url.hostname.endsWith('tile.openstreetmap.org')) return;

  if (url.hostname === 'unpkg.com' || url.hostname === 'fonts.googleapis.com' || url.hostname === 'fonts.gstatic.com' || url.pathname.startsWith(BASE)) {
    e.respondWith(
      caches.match(req).then((hit) => hit || fetch(req).then((res) => {
        if (res.ok || res.type === 'opaque') { const copy = res.clone(); caches.open(CACHE).then((c) => c.put(req, copy)); }
        return res;
      }))
    );
  }
});
