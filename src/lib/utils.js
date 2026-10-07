/* Utilidades compartidas por storefront y admin (extraidas del monolito original). */
const $=s=>document.querySelector(s);
const slugify=t=>String(t).toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g,"").replace(/[^a-z0-9]+/g,"-").replace(/^-+|-+$/g,"");
const fmt=s=>{s=Math.floor(s);return Math.floor(s/60)+":"+String(s%60).padStart(2,"0")};
const fmtPrice=(p,c)=>{try{return new Intl.NumberFormat("en-US",{style:"currency",currency:c||"USD"}).format(p)}catch(e){return (c||"")+" "+p}};
const safeUrl=u=>{try{const x=new URL(u);return x.protocol==="https:"?x.href:null}catch(e){return null}};   // solo https; se asigna como propiedad, nunca como HTML
const up=x=>String(x||"").toUpperCase();

export { $, slugify, fmt, fmtPrice, safeUrl, up };
