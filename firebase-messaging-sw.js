// Tjenestearbeider for Graabein-appen.
// 1) Gjør at appen kan installeres og åpnes selv uten nett (siste lagrede versjon).
// 2) Tar imot push-varsler fra Firebase når appen er lukket eller ligger i bakgrunnen.
//    Varselet vises automatisk, og et trykk på det åpner Lager-fanen.
importScripts('https://www.gstatic.com/firebasejs/10.14.1/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.14.1/firebase-messaging-compat.js');

firebase.initializeApp({
  apiKey: 'AIzaSyD-ImzoaNA3vWm953fRjX5X1kVEyx20K5E',
  authDomain: 'graabein-oppgaver.firebaseapp.com',
  projectId: 'graabein-oppgaver',
  storageBucket: 'graabein-oppgaver.firebasestorage.app',
  messagingSenderId: '864551962699',
  appId: '1:864551962699:web:388adca51013fa857125ce',
});

firebase.messaging();

// ---- Appen ----
const CACHE = 'graabein-app-v1';
const SHELL = ['./', 'index.html', 'manifest.webmanifest', 'icon-192.png', 'icon-512.png', 'apple-touch-icon.png'];

self.addEventListener('install', (event) => {
  // Hver fil lagres for seg, så én fil som mangler ikke stopper varslene
  event.waitUntil(
    caches.open(CACHE)
      .then((cache) => Promise.all(SHELL.map((url) => cache.add(url).catch(() => {}))))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((k) => k.startsWith('graabein-app-') && k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

// Henter alltid fra nett først, så nye versjoner kommer med en gang.
// Uten nett brukes den sist lagrede versjonen. Data fra Firebase går aldri via denne.
self.addEventListener('fetch', (event) => {
  const req = event.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  if (url.origin !== self.location.origin) return;
  const isPage = req.mode === 'navigate';
  const key = isPage ? 'index.html' : req;
  event.respondWith(
    fetch(req)
      .then((res) => {
        if (res.ok) {
          const copy = res.clone();
          caches.open(CACHE).then((cache) => cache.put(key, copy)).catch(() => {});
        }
        return res;
      })
      .catch(() =>
        caches.match(key, { ignoreSearch: true }).then((hit) => hit || (isPage ? caches.match('./') : undefined))
          .then((hit) => hit || new Response('Ingen nettforbindelse', { status: 503, headers: { 'Content-Type': 'text/plain; charset=utf-8' } }))
      )
  );
});
