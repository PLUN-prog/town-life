/* 小镇生活 · Service Worker：离线缓存 + 秒开 */
/* 注意：每次更新文件后，把下面的版本号 +1，再部署，手机才会拉新缓存 */
var CACHE='town-v9';
var ASSETS=[
  './',
  './index.html',
  './town.css',
  './town.js',
  './manifest.json',
  './icons/icon-192.png',
  './icons/icon-512.png',
  './study-plan.html',
  './study-stats.html',
  './study-library.html',
  './contest-zone.html',
  './speech-practice.html',
  './money-tracker.html',
  './notes.html',
  './blog.html',
  './podcast-picks.html',
  './habit-wall.html',
  './town-weather.html',
  './bgm-player.html',
  './night-journal.html',
  './town-shop.html',
  './settings.html'
];
self.addEventListener('install',function(e){
  e.waitUntil(caches.open(CACHE).then(function(c){return c.addAll(ASSETS);}).then(function(){return self.skipWaiting();}));
});
self.addEventListener('activate',function(e){
  e.waitUntil(caches.keys().then(function(keys){
    return Promise.all(keys.filter(function(k){return k!==CACHE;}).map(function(k){return caches.delete(k);}));
  }).then(function(){return self.clients.claim();}));
});
self.addEventListener('fetch',function(e){
  var url=new URL(e.request.url);
  if(e.request.method!=='GET'||url.origin!==location.origin)return;
  /* 天气接口走网络，不缓存 */
  if(url.hostname==='wttr.in'||url.pathname.indexOf('wttr')>=0)return;
  e.respondWith(
    caches.match(e.request).then(function(hit){
      return hit||fetch(e.request).then(function(res){
        if(res&&res.ok&&url.pathname.indexOf('.html')<0&&!url.pathname.endsWith('/')){
          var copy=res.clone();
          caches.open(CACHE).then(function(c){c.put(e.request,copy);});
        }
        return res;
      }).catch(function(){
        /* 离线时 html 请求兜底到首页 */
        if(e.request.mode==='navigate')return caches.match('./index.html');
      });
    })
  );
});
