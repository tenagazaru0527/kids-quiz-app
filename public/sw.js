// クイズひろば Service Worker
// - アプリ本体(HTML/JS/CSS/アイコン)をキャッシュしてオフラインでも起動できるようにする
// - HTML は network-first(更新をすぐ反映)、その他は cache-first(高速起動)
// - クイズデータ(GASへのアクセス)はここでは触らない(アプリ側が localStorage に保存する)

const CACHE_NAME = "quiz-hiroba-v1";

self.addEventListener("install", (event) => {
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", (event) => {
  const req = event.request;
  if (req.method !== "GET") return;

  const url = new URL(req.url);
  // 別オリジン(GASなど)はキャッシュしない
  if (url.origin !== self.location.origin) return;

  const isHTML = req.mode === "navigate" || (req.headers.get("accept") || "").includes("text/html");

  if (isHTML) {
    // network-first: オンラインなら常に最新、オフラインならキャッシュ
    event.respondWith(
      fetch(req)
        .then((res) => {
          const copy = res.clone();
          caches.open(CACHE_NAME).then((c) => c.put(req, copy));
          return res;
        })
        .catch(() => caches.match(req))
    );
  } else {
    // cache-first: JS/CSS/画像はハッシュ付きファイル名なのでキャッシュ優先でOK
    event.respondWith(
      caches.match(req).then(
        (hit) =>
          hit ||
          fetch(req).then((res) => {
            const copy = res.clone();
            caches.open(CACHE_NAME).then((c) => c.put(req, copy));
            return res;
          })
      )
    );
  }
});
