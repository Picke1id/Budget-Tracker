// Setting variables
const CACHE_NAME = "static-cache-v2";
const DATA_CACHE_NAME = "data-cache-v1";

// Files to be cached
const FILES_TO_CACHE = [
    "/",
    "/index.html",
    "/index.js",
    "/indexedDB.js",
    "/manifest.webmanifest",
    "/styles.css",
    "/icons/icon-192x192.png",
    "/icons/icon-512x512.png"
];

// Installing and calling the service worker api
self.addEventListener("install", function (event) {
    event.waitUntil(
        caches.open(CACHE_NAME).then(cache => {
            console.log("Your files have been cached successfully!");
            return cache.addAll(FILES_TO_CACHE);
        })
    );

    // Activating service worker in browser after installation
    self.skipWaiting();
});

// Activating service worker to remove old cache data
self.addEventListener("activate", function (event) {
    event.waitUntil(
        caches.keys().then(keyList => {
            return Promise.all(
                keyList.map(key => {
                    if (key !== CACHE_NAME && key !== DATA_CACHE_NAME) {
                        console.log("Now removing old cache data", key);
                        return caches.delete(key);
                    }
                })
            );
        })
    );
    // Setting service worker as the controller for all clients within scope
    self.clients.claim();
});

// Fetching data from service worker api
self.addEventListener("fetch", function (event) {
    if (event.request.url.includes("/api/")) {
        event.respondWith(
            caches.open(DATA_CACHE_NAME).then(cache => {
                return fetch(event.request)
                    .then(response => {
                        // If successful, response is cloned and stored in the cache
                        if (response.status === 200) {
                            cache.put(event.request.url, response.clone());
                        }
                        return response;
                    }).catch(err => {
                        // If network request fails, attempt to retrieve it from the cache
                        return cache.match(event.request);
                    });
            }).catch(err => console.log(err))
        );

        return;
    }

    // Prevent the browser's default fetch handling. If we didn't find a match in the cache, use the network.
    event.respondWith(
        caches.match(event.request).then(function (response) {
            return response || fetch(event.request);
        })
    );
});