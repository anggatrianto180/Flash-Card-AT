// Nama cache
const CACHE_NAME = 'flashcard-pro-cache-v1';
// Daftar file yang akan di-cache
const urlsToCache = [
  '/',
  '/index.html', // Asumsikan file utama Anda adalah index.html
  'https://cdn.tailwindcss.com',
  'https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap',
  'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css'
];

// Event listener untuk proses instalasi service worker
self.addEventListener('install', event => {
  // Tunggu hingga proses caching selesai
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('Opened cache');
        return cache.addAll(urlsToCache);
      })
  );
});

// Event listener untuk setiap permintaan (fetch) dari aplikasi
self.addEventListener('fetch', event => {
  event.respondWith(
    // Coba cari respon dari cache terlebih dahulu
    caches.match(event.request)
      .then(response => {
        // Jika ditemukan di cache, kembalikan dari cache
        if (response) {
          return response;
        }
        // Jika tidak, ambil dari jaringan
        return fetch(event.request);
      }
    )
  );
});
