const CACHE_NAME = 'hibitan-cache-v25'; // キャッシュ名を更新するごとに変える
const FILES_TO_CACHE = [
  '/hibitan/',
  '/hibitan/index.html',
  '/hibitan/lib/Hibitan.js',
  '/hibitan/lib/Hibitan.css',
  '/hibitan/manifest.json',
  '/hibitan/icon-192.png'
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
  const url = new URL(event.request.url);

  // JS・CSS はネットワーク優先（オフライン時のみキャッシュ）
  if (url.pathname.endsWith('.js') || url.pathname.endsWith('.css')) {
    event.respondWith(
      fetch(event.request)
        .then(res => {
          const clone = res.clone();
          caches.open(CACHE_NAME).then(cache => cache.put(event.request, clone));
          return res;
        })
        .catch(() => caches.match(event.request))
    );
    return;
  }

  // その他はキャッシュ優先
  event.respondWith(
    caches.match(event.request).then(cached => cached || fetch(event.request))
  );
});


self.addEventListener('push', function (event) {
    const data = event.data.json();

    event.waitUntil(
            self.registration.showNotification(data.title, {
                body: data.body,
                icon: 'icon-192.png',
                badge: 'icon-192.png'
            })
            );
});
