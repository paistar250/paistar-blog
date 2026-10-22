const VERSION='paistar-server-v1';
const OFFLINE='/offline/';
self.addEventListener('install',event=>{
  event.waitUntil(caches.open(VERSION).then(cache=>cache.add(OFFLINE)));
  self.skipWaiting();
});
self.addEventListener('activate',event=>{
  event.waitUntil(Promise.all([caches.keys().then(keys=>Promise.all(keys.filter(key=>key!==VERSION).map(key=>caches.delete(key)))),self.clients.claim()]));
});
self.addEventListener('fetch',event=>{
  const request=event.request;
  const url=new URL(request.url);
  if(request.method!=='GET'||url.origin!==self.location.origin||url.pathname.startsWith('/api/')||url.pathname.startsWith('/admin/')||url.pathname.startsWith('/account/'))return;
  if(request.mode==='navigate'){
    event.respondWith(fetch(request).catch(async()=>(await caches.match(OFFLINE))||new Response('Offline',{status:503})));
    return;
  }
  if(url.pathname.startsWith('/_astro/')||url.pathname.startsWith('/media/')||/\.(?:png|webp|svg|ico|woff2)$/.test(url.pathname)){
    event.respondWith(caches.open(VERSION).then(async cache=>{
      const cached=await cache.match(request);
      if(cached)return cached;
      const response=await fetch(request);
      if(response.ok)await cache.put(request,response.clone());
      return response;
    }));
  }
});
