const VERSION = 'dev';
/* schicht. Service Worker: cached die Shell, danach läuft alles offline */
const CACHE = 'schicht-' + VERSION;
const SHELL = ['./', './index.html', './logik.js', './manifest.webmanifest', './icon.svg'];

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

function merken(req, res) {
  if (res && res.ok && res.type === 'basic') {
    const kopie = res.clone();
    caches.open(CACHE).then((c) => c.put(req, kopie));
  }
  return res;
}

/* Seite und Logik zuerst aus dem Netz, nur offline aus dem Cache.
   no-cache, damit nie eine alte logik.js aus dem HTTP-Cache neben einer neuen Seite landet. */
function netzZuerst(req) {
  const frisch = req.mode === 'navigate' ? fetch(req) : fetch(req.url, { cache: 'no-cache', credentials: 'same-origin' });
  return frisch.then((res) => merken(req, res)).catch(() =>
    caches.match(req, { ignoreSearch: true }).then((treffer) => treffer || caches.match('./index.html'))
  );
}

self.addEventListener('fetch', (e) => {
  const req = e.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  if (url.origin !== self.location.origin) return;
  const pfad = url.pathname;
  if (req.mode === 'navigate' || pfad.endsWith('/') || pfad.endsWith('/index.html') || pfad.endsWith('/logik.js')) {
    e.respondWith(netzZuerst(req));
    return;
  }
  e.respondWith(
    caches.match(req, { ignoreSearch: true }).then((treffer) => {
      if (treffer) return treffer;
      return fetch(req).then((res) => merken(req, res)).catch(() => Response.error());
    })
  );
});
