/* ===== DATA ADAPTER: interfaz unica de datos que usa la UI =====
   La UI (storefront, admin, motor de audio) solo importa este modulo.
   Nunca ve localStorage, IndexedDB ni los prefijos internos de las referencias.
   Detras: localAdapter.js (hoy local; en el futuro, adapter de Supabase). */
import { localAdapter } from "./localAdapter.js";
import { slugify } from "../lib/utils.js";
import { SEED } from "../data/seed.js";

const dataAdapter=(()=>{
  /* ---------- Beats ---------- */
  const KEY="shop:products",subs=[],t0=Date.parse("2026-01-01");
  let list=localAdapter.kvGet(KEY,null);
  const save=()=>{localAdapter.kvSet(KEY,list);subs.forEach(f=>f())},
        live=()=>list.filter(p=>!p.deletedAt),
        now=()=>new Date().toISOString();
  if(!list){   // migracion inicial: los beats de demo pasan al modelo de producto (status: draft|published|hidden; availability: available|coming-soon|sold)
    list=SEED.map((b,i)=>({...b,type:"beat",slug:slugify(b.title),availability:b.status==="hidden"?"available":b.status,status:b.status==="hidden"?"hidden":"published",createdAt:new Date(t0+i*864e5).toISOString(),updatedAt:new Date(t0+i*864e5).toISOString(),deletedAt:null}));
    localAdapter.kvSet(KEY,list)}
  const strip=o=>{const{id:_i,createdAt:_c,updatedAt:_u,...rest}=o;return rest};   // id/fechas los decide el adapter, no la UI
  const api={
    sub:f=>subs.push(f),
    getBeats:live,getBeat:id=>live().find(p=>p.id===id)||null,
    getPublishedBeats:()=>live().filter(p=>p.type==="beat"&&p.status==="published"),
    uniqueSlug(v,except){const b=slugify(v)||"beat";let n=b,i=2;while(list.some(p=>p.slug===n&&p.id!==except))n=b+"-"+i++;return n},
    createBeat(p){const d=strip(p),n=1+Math.max(0,...list.map(x=>+String(x.id).split("-")[1]||0)),t=now(),r={type:"beat",availability:"available",status:"draft",...d,id:"beat-"+String(n).padStart(3,"0"),createdAt:t,updatedAt:t,deletedAt:null};list.push(r);save();return r},
    updateBeat(id,patch){const i=list.findIndex(p=>p.id===id);if(i<0)return null;list[i]={...list[i],...strip(patch),id,updatedAt:now()};save();return list[i]},
    deleteBeat:id=>api.updateBeat(id,{deletedAt:now()}),   // soft delete
    publishBeat:id=>api.updateBeat(id,{status:"published"}),unpublishBeat:id=>api.updateBeat(id,{status:"draft"})};
  const beats=api;

  /* ---------- Ajustes de la tienda ---------- */
  const SKEY="shop:settings",
        DEFAULTS={producer:"Producer Name",store:"Beats & Sound",currency:"USD",previewDuration:30};
  const settings={
    get:()=>({...DEFAULTS,...localAdapter.kvGet(SKEY,{})}),
    update:patch=>localAdapter.kvSet(SKEY,{...localAdapter.kvGet(SKEY,{}),...patch})};

  /* ---------- Media (covers y audio) ---------- */
  const media={
    get:ref=>localAdapter.getMedia(ref),          // -> {url, name}
    save:file=>localAdapter.putMedia(file),       // -> ref
    remove:ref=>localAdapter.deleteMedia(ref)};

  return{
    // beats
    getBeats:beats.getBeats,getBeat:beats.getBeat,getPublishedBeats:beats.getPublishedBeats,
    createBeat:beats.createBeat,updateBeat:beats.updateBeat,deleteBeat:beats.deleteBeat,
    publishBeat:beats.publishBeat,unpublishBeat:beats.unpublishBeat,
    uniqueSlug:beats.uniqueSlug,subscribe:beats.sub,
    // settings
    getSettings:settings.get,updateSettings:settings.update,
    // media
    getMedia:media.get,saveMedia:media.save,deleteMedia:media.remove};
})();

export { dataAdapter };
