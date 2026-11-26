import { readdir, readFile, writeFile } from "node:fs/promises";
import { createHash } from "node:crypto";
// Only immutable app code/styles and Arabic font. Never cache APIs, auth, uploads or bank responses.
const assets = (await readdir("dist/assets"))
  .filter((name) => /\.(js|css)$/.test(name))
  .map((name) => `/assets/${name}`);
const files = ["/", ...assets, "/fonts/Cairo-Regular.ttf"];
const version = createHash("sha256")
  .update(files.join("|"))
  .update(await readFile("dist/index.html"))
  .digest("hex")
  .slice(0, 12);
const script = `const CACHE='snv-assessment-shell-${version}';const ASSETS=${JSON.stringify(files)};
self.addEventListener('install',e=>e.waitUntil(caches.open(CACHE).then(c=>c.addAll(ASSETS))));
self.addEventListener('activate',e=>e.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(k=>k.startsWith('snv-assessment-shell-')&&k!==CACHE).map(k=>caches.delete(k)))).then(()=>self.clients.claim())));
self.addEventListener('fetch',e=>{const r=e.request,u=new URL(r.url);if(r.method!=='GET'||u.origin!==self.location.origin||u.pathname.startsWith('/api/')||u.pathname.startsWith('/__/'))return;
if(r.mode==='navigate'){e.respondWith(fetch(r).catch(()=>caches.match('/')));return;}
if(ASSETS.includes(u.pathname)){e.respondWith(caches.match(r).then(hit=>hit||fetch(r)));}});
`;
await writeFile("dist/assessment-offline.js", script);
console.log(
  `Offline assessment shell prepared (${assets.length} code/style assets, no API data).`,
);
