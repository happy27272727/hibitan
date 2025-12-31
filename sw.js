const CACHE_NAME = 'hibitan-cache-v9'; // キャッシュ名を更新するごとに変える
const FILES_TO_CACHE = [
  '/',
  '/index.html',
  '/lib/Hibitan.js',
  '/lib/Hibitan.css',
  '/manifest.json',
  '/icon-192.png'
];

// インストール時にキャッシュを作る
self.addEventListener('install', event => {
  console.log('Service Worker installed');
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(FILES_TO_CACHE))
      .then(() => self.skipWaiting()) // すぐ有効化
  );
});

// 有効化時に古いキャッシュを削除
self.addEventListener('activate', event => {
  console.log('Service Worker activated');
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.map(key => {
        if (key !== CACHE_NAME) {
          return caches.delete(key);
        }
      }))
    ).then(() => self.clients.claim())
  );
});

// リクエスト時の処理
self.addEventListener('fetch', event => {
  event.respondWith(
    caches.match(event.request).then(cached => {
      return cached || fetch(event.request);
    })
  );
});
