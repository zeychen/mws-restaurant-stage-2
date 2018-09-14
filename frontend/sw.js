var staticCacheName = 'restaurant-cache-v1';
var contentImgsCache = 'restaurant-content-imgs';
var allCaches = [
  staticCacheName,
  contentImgsCache
];

var urlsToCache = [
  '/',
  './index.html',
  './restaurant.html',
  './css/styles.css',
  './js/dbhelper.js',
  './js/main.js',
  './js/restaurant_info.js',
  './js/sw_registration.js',
  './js/optimization.js'
];

// install cache
self.addEventListener('install', function(event) {
  event.waitUntil(
    caches.open(staticCacheName).then(function(cache) {
      console.log('Installed Cache');
      return cache.addAll(urlsToCache);
    })
  );
});

// update static cache
self.addEventListener('activate', function(event) {
  event.waitUntil(
    caches.keys().then(function(cacheNames) {
      return Promise.all(
        cacheNames.filter(function(cacheName) {
          return cacheName.startsWith('restaurant-cache') && cacheName!=staticCacheName;
        }).map(function(cacheName) {
          return caches.delete(cacheName);
        })
      );
    })
  );
});

// fetch event
self.addEventListener('fetch', function(event) {
  var requestUrl = new URL(event.request.url);
  console.log("~~~~~~~~~~~~~~~~~~~~~~~" + requestUrl);
  console.log("~~~~~~~~~~~~~~~~~~~~~~~" + requestUrl.pathname);
  console.log("~~~~~~~~~~~~~~~~~~~~~~~" + location.origin);
  console.log("~~~~~~~~~~~~~~~~~~~~~~~" + requestUrl.origin.startsWith);
  if (requestUrl.origin === location.origin) {
    if (requestUrl.pathname === '/') {
      event.respondWith(caches.match('/index.html'));
      return;
    }
    if (requestUrl.pathname.startsWith('/img/')) {
      event.respondWith(servePhoto(event.request));
      return;
    }
  }

  if(requestUrl.origin.startsWith('https://map.googleapis.com/maps/vt')){
    event.respondWith(servePhoto(event.request));
      return;
  }

  event.respondWith(
    caches.match(event.request).then(function(response) {
      if(response) return response;
      return fetch(event.request);
    })
  );
});
  
  

  
  // event.respondWith(
  //   caches.match(event.request).then(function(response) {
  //     if(response) return response;
  //     return fetch(event.request);
  //   })
  // );

function servePhoto(request) {
  var storageUrl = request.url.replace(/-\d+px\.jpg$/, '');

  return caches.open(contentImgsCache).then(function(cache) {
    return cache.match(storageUrl).then(function(response) {
      if (response) return response;

      return fetch(request).then(function(networkResponse) {
        cache.put(storageUrl, networkResponse.clone());
        return networkResponse;
      });
    });
  });
}

function updateCache(request) {
  return caches.open(staticCacheName).then(function(cache){
    return fetch(request).then(function(response){
      return cache.put(request, response);
    });
  });
}
  
