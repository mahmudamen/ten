importScripts('/js/idb.js');
importScripts('/js/idbhelper.js');

let staticCacheName = 'restaurants-static-v3';
self.addEventListener('install', (event) => {
      let cacheurl = [
			        './',
              './index.html',
              './restaurant.html',
              './css/styles.css',
              './css/model.css',
              './js/dbhelper.js',
			  './js/idbhelper',
              './js/main.js',
			  './js/idb.js',
              './js/restaurant_info.js',
              './img/1.webp',
              './img/2.webp',
              './img/3.webp',
              './img/4.webp',
              './img/5.webp',
              './img/6.webp',
              './img/7.webp',
              './img/8.webp',
              './img/9.webp',
              './img/10.webp',
			  './img/fav.png',
			  './img/faved.png',
      ];
      event.waitUntil(
    		caches.open(staticCacheName).then( (cache) => {
    			return cache.addAll(cacheurl);
    		})
    	);
});
self.addEventListener('sync', function(event) {
  if (event.tag == 'myFirstSync') {
    event.waitUntil(console.log('myFirstSync'));
  }
});


self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(cachesNames => {
      return Promise.all(
        cachesNames.filter(cachesName => {
          return cachesName.startsWith('restaurants-') && cachesName != staticCacheName;
        }).map(cachesName => {
          return caches.delete(cachesName);
        })
      )
    })
  );
});

self.addEventListener('fetch', event => {
  event.respondWith(
    caches.match(event.request, { ignoreSearch: true }).then(response => {
      if (response) return response;
      return fetch(event.request);
    })
  )
});