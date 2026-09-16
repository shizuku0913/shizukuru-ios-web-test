const CACHE_NAME='shizukuru-pwa-v10.8.24';
const APP_SHELL=[
  './',
  './index.html',
  './manifest.webmanifest',
  './assets/app-icon-master.png',
  './images/splash.png',
  './icons/icon-192.png',
  './icons/icon-512.png',
  './icons/icon-maskable-512.png',
  './icons/apple-touch-icon.png'
];

self.addEventListener('install',event=>{
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache=>cache.addAll(APP_SHELL.map(path=>new Request(path,{cache:'reload'}))))
      .then(()=>self.skipWaiting())
  );
});

self.addEventListener('activate',event=>{
  event.waitUntil(
    caches.keys()
      .then(keys=>Promise.all(
        keys.filter(key=>key.startsWith('shizukuru-pwa-')&&key!==CACHE_NAME)
            .map(key=>caches.delete(key))
      ))
      .then(()=>self.clients.claim())
  );
});

self.addEventListener('fetch',event=>{
  if(event.request.method!=='GET')return;
  const url=new URL(event.request.url);
  if(url.origin!==self.location.origin)return;

  if(event.request.mode==='navigate'){
    event.respondWith(
      fetch(event.request,{cache:'no-store'})
        .then(response=>{
          if(response&&response.ok){
            const copy=response.clone();
            event.waitUntil(caches.open(CACHE_NAME).then(cache=>cache.put('./index.html',copy)));
          }
          return response;
        })
        .catch(()=>caches.match('./index.html'))
    );
    return;
  }

  if(url.pathname.endsWith('/service-worker.js')){
    event.respondWith(fetch(event.request,{cache:'no-store'}));
    return;
  }

  event.respondWith(
    caches.match(event.request).then(cached=>{
      const network=fetch(event.request)
        .then(response=>{
          if(response&&response.status===200){
            const copy=response.clone();
            event.waitUntil(caches.open(CACHE_NAME).then(cache=>cache.put(event.request,copy)));
          }
          return response;
        })
        .catch(()=>cached);
      return cached||network;
    })
  );
});
