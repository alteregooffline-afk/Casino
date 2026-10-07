/* ===== LOCAL ADAPTER: unico modulo del proyecto que toca localStorage e IndexedDB =====
   Cambiar a una base de datos remota (p. ej. Supabase) = reimplementar SOLO este archivo
   con la misma interfaz. Ni la UI ni el dataAdapter cambian. */
const localAdapter=(()=>{
  /* --- localStorage: pares clave/valor en JSON, con cache en memoria --- */
  const cache={};
  const kvGet=(k,d)=>{if(k in cache)return cache[k];try{const v=JSON.parse(localStorage.getItem(k));if(v!=null)return cache[k]=v}catch(e){}return d};
  const kvSet=(k,v)=>{cache[k]=v;try{localStorage.setItem(k,JSON.stringify(v))}catch(e){}};

  /* --- IndexedDB: archivos binarios (covers y audio) referenciados por una clave opaca --- */
  const files=new Map(),urls={};let dbp;
  const db=()=>dbp||(dbp=new Promise((ok,no)=>{const r=indexedDB.open("shop-media",1);r.onupgradeneeded=()=>r.result.createObjectStore("m");r.onsuccess=()=>ok(r.result);r.onerror=()=>no(r.error)}));
  const tx=async(mode,fn)=>{const d=await db();return new Promise((ok,no)=>{const t=d.transaction("m",mode),q=fn(t.objectStore("m"));t.oncomplete=()=>ok(q&&q.result);t.onerror=()=>no(t.error)})};
  const putMedia=async f=>{
    const kind=/^image\//.test(f.type)?"img":"aud";
    const ref="media:"+kind+"-"+Date.now().toString(36)+Math.random().toString(36).slice(2,6);
    files.set(ref,f);try{await tx("readwrite",x=>x.put(f,ref))}catch(e){}
    return ref};
  const deleteMedia=async ref=>{files.delete(ref);delete urls[ref];try{await tx("readwrite",x=>x.delete(ref))}catch(e){}};
  const getMedia=async ref=>{
    if(!ref||!String(ref).startsWith("media:"))return{url:ref||null,name:ref||null};   // ruta o URL normal
    if(urls[ref])return{url:urls[ref],name:null};                                      // referencia opaca ya resuelta
    let f=files.get(ref);if(!f){try{f=await tx("readonly",x=>x.get(ref))}catch(e){}}
    if(!f)return{url:null,name:null};
    return{url:urls[ref]=URL.createObjectURL(f),name:null}};

  return{kvGet,kvSet,putMedia,deleteMedia,getMedia};
})();

export { localAdapter };
