// Service worker mínimo — existe só para satisfazer o critério de
// instalabilidade do PWA (Chrome/Android exige um SW registrado com
// handler de fetch). Não faz cache proprio; sempre busca da rede.
self.addEventListener("install", () => {
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(self.clients.claim());
});

self.addEventListener("fetch", (event) => {
  event.respondWith(fetch(event.request));
});
