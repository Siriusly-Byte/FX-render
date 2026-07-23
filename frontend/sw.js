const CACHE_NAME = 'fx-assistant-v1';
const STATIC_ASSETS = [
    '/',
    '/index.html',
    '/css/reset.css',
    '/css/variables.css',
    '/css/layout.css',
    '/css/components.css',
    '/css/pages/dashboard.css',
    '/css/pages/records.css',
    '/css/pages/calculator.css',
    '/css/pages/reminders.css',
    '/css/pages/settings.css',
    '/css/responsive.css',
    '/js/utils.js',
    '/js/state.js',
    '/js/api.js',
    '/js/router.js',
    '/js/app.js',
    '/js/components/toast.js',
    '/js/components/modal.js',
    '/js/components/header.js',
    '/js/components/nav.js',
    '/js/components/fundCard.js',
    '/js/components/rateBoard.js',
    '/js/components/rateChart.js',
    '/js/components/reminderCard.js',
    '/js/components/transactionForm.js',
    '/js/components/calculatorForm.js',
    '/js/pages/dashboard.js',
    '/js/pages/records.js',
    '/js/pages/calculator.js',
    '/js/pages/reminders.js',
    '/js/pages/settings.js',
    '/manifest.json',
];

// Install: pre-cache app shell
self.addEventListener('install', function(event) {
    event.waitUntil(
        caches.open(CACHE_NAME).then(function(cache) {
            return cache.addAll(STATIC_ASSETS);
        })
    );
    self.skipWaiting();
});

// Activate: clean old caches
self.addEventListener('activate', function(event) {
    event.waitUntil(
        caches.keys().then(function(keys) {
            return Promise.all(
                keys.filter(function(key) { return key !== CACHE_NAME; })
                    .map(function(key) { return caches.delete(key); })
            );
        })
    );
    self.clients.claim();
});

// Fetch: cache-first for static, network-first for API
self.addEventListener('fetch', function(event) {
    var url = new URL(event.request.url);

    // API requests: network first, fall back to cache
    if (url.pathname.startsWith('/api/')) {
        event.respondWith(
            fetch(event.request)
                .then(function(response) {
                    var clone = response.clone();
                    caches.open(CACHE_NAME).then(function(cache) {
                        cache.put(event.request, clone);
                    });
                    return response;
                })
                .catch(function() {
                    return caches.match(event.request);
                })
        );
        return;
    }

    // Static assets: cache first, network fallback
    event.respondWith(
        caches.match(event.request).then(function(cached) {
            if (cached) {
                // Update cache in background
                fetch(event.request).then(function(response) {
                    caches.open(CACHE_NAME).then(function(cache) {
                        cache.put(event.request, response);
                    });
                }).catch(function() {});
                return cached;
            }
            return fetch(event.request).then(function(response) {
                var clone = response.clone();
                caches.open(CACHE_NAME).then(function(cache) {
                    cache.put(event.request, clone);
                });
                return response;
            });
        })
    );
});
