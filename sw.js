const app_version = '0.0.5';
const chace_name = `static-${app_version}`;

const app_assets = [
    'index.html',
    'assets/styles/index.css',
    'assets/styles/reset.css',
    'assets/scripts/index.js',
    'assets/images/cloudy.png',
    'assets/images/rain.png',
    'assets/images/rainy-day.png',
    'assets/images/sun.png',
    'assets/fonts/roboto-v30-latin-500.woff',
    'assets/fonts/roboto-v30-latin-500.woff2',
    'assets/fonts/roboto-v30-latin-700.woff',
    'assets/fonts/roboto-v30-latin-700.woff2',
    'assets/fonts/roboto-v30-latin-regular.woff',
    'assets/fonts/roboto-v30-latin-regular.woff2',
];

// sw install
self.addEventListener('install', e => {
    e.waitUntil(
        caches.open(chace_name).then(cache => cache.addAll(app_assets))
    )
});

// clean cache
self.addEventListener('activate', e => {
    const cleaned = caches.keys().then(keys => {
        keys.forEach(key => {
            if (key !== chace_name && key.match('static-')) {
                return caches.delete(key);
            }
        })
    });
    
    e.waitUntil(cleaned);
});

const cleanWeatherCache = () => {
    caches.open('openweathermap').then(_ => {
        caches.delete('openweathermap')
    })
}

// sw cache - cache with network fallback
const staticCache = (request, cacheName = chace_name) => {
    return caches.match(request).then(cacheRes => {
        // return cached response if match
        if (cacheRes) return cacheRes;

        // fallback to network
        return fetch(request).then(networkRes => {
            // update cache with new response
            caches.open(cacheName).then(cache => cache.put(request, networkRes));

            // return clone of network response
            return networkRes.clone();
        })
    });
}

// fallback weather api
const fallbackCacheWeather = request => {
    // try network
    return fetch(request).then(networkRes => {
        // check if res is ok, else throw error
        if (!networkRes.ok) throw 'Fetch error'

        // update cache
        caches.open('openweathermap')
            .then(cache => {
                cache.put(request, networkRes)
            });

        // return clone of network response
        return networkRes.clone();
    }).catch(err => caches.match(request))
}

// sw fetch
self.addEventListener('fetch', e => {
    // App shell
    if (e.request.url.match(location.origin)) {
        e.respondWith(staticCache(e.request))
    // open weather api
    } else if (e.request.url.match('api.openweathermap.org/data/2.5')) {
        e.respondWith(fallbackCacheWeather(e.request));
    }
})

self.addEventListener('message', e => {
    if (e.data.action === 'cleanWeatherCache') cleanWeatherCache()
})