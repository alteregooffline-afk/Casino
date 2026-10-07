/* ADMIN: dashboard, lista, formulario, ajustes y hash router (extraido del monolito original). */
import { $, fmt, fmtPrice, safeUrl, up, slugify } from "./lib/utils.js";
import { art } from "./lib/art.js";
import { dataAdapter } from "./services/dataAdapter.js";
import { Engine } from "./audio/engine.js";
import { closePanel } from "./storefront.js";

/* ===== ADMIN (capa aparte de la tienda; lee y escribe solo mediante los servicios) ===== */
const ADM=$("#adm"),AM=$("#am"),esc=v=>String(v??"").replace(/[&<>"']/g,c=>"&#"+c.charCodeAt(0)+";");
const NOTES=["C","C#","D","Eb","E","F","F#","G","Ab","A","Bb","B"],GENRES=["Trap","Hip-Hop","R&B","Drill","Boom Bap","Pop","Soul","Afro","Electronic","Ambient","Hyperpop","Lo-fi","Experimental","Other"],MOODS=["Dark","Atmospheric","Aggressive","Melodic","Chill","Energetic","Cinematic","Emotional","Experimental"],CUR=["USD","EUR","GBP"],LIC=["Basic Lease","Premium Lease","Unlimited","Exclusive"];
const EMPTY='<div class="em"><b>NO BEATS YET</b><span>Create your first beat.</span><a class="ab" href="#/admin/beats/new">+ ADD BEAT</a></div>';
const toast=m=>{const t=$("#toast");t.textContent=m;t.classList.add("on");clearTimeout(toast.t);toast.t=setTimeout(()=>t.classList.remove("on"),2200)};
const dlg=$("#dlg");
const ask=(t,body,ok)=>new Promise(r=>{dlg.innerHTML=`<form method="dialog"><h3>${esc(t)}</h3><div>${body}</div><div class="ac"><button value="no">${ok?"Cancel":"Close"}</button>${ok?`<button value="yes" class="dg">${ok}</button>`:""}</div></form>`;dlg.returnValue="";dlg.onclose=()=>r(dlg.returnValue==="yes");dlg.showModal()});
const list_=a=>`<ul>${a.map(m=>`<li>${esc(m)}</li>`).join("")}</ul>`;
function problems(p,full,audioDur){
  const e=[];
  if(!String(p.title||"").trim())e.push("Title is required.");else if(p.title.length>80)e.push("Title is too long (80 characters max).");
  if(!p.slug)e.push("Slug is required.");
  if(p.bpm!==""&&p.bpm!=null&&!(p.bpm>0&&p.bpm<=400))e.push("BPM must be a number above 0.");
  if(p.buyUrl&&!safeUrl(p.buyUrl))e.push("Payhip URL is invalid (use a full https:// link).");
  if(!(p.previewStart>=0))e.push("Preview start cannot be negative.");
  if(!(p.previewDuration>0))e.push("Preview duration must be greater than 0.");
  if(audioDur&&p.previewStart+p.previewDuration>audioDur+.01)e.push("Preview exceeds audio duration.");
  if(full){if(!p.cover)e.push("Cover image is required.");if(!p.audio)e.push("Audio file is required.");if(!p.bpm)e.push("BPM is required.");if(!p.key)e.push("Key is required.");
    if(!(p.price>0))e.push("Price is required.");if(!p.currency)e.push("Currency is required.");if(!p.buyUrl)e.push("Payhip URL is missing.")}
  return e}
let dirty=false,aud=null;dataAdapter.subscribe(()=>dirty=true);
/* El admin solo existe en local: la web desplegada no lo sirve.
   En producción los datos del admin vivirían en el localStorage del visitante
   (no publicarían nada), así que se redirige a la tienda. */
const LOCAL_ADM=["localhost","127.0.0.1","[::1]"].includes(location.hostname);
function route(){
  const parts=location.hash.replace(/^#\/?/,"").split("/"),isA=parts[0]==="admin";
  if(isA&&!LOCAL_ADM){location.replace("#/");return}
  ADM.hidden=!isA;
  if(isA){closePanel();Engine.release();if(aud)aud.pause();
    ADM.querySelectorAll(".an a").forEach(a=>a.toggleAttribute("aria-current",a.getAttribute("href")===location.hash||(a.getAttribute("href")==="#/admin/beats"&&/beats\/.+edit/.test(location.hash))));
    const v=parts[1]||"";AM.innerHTML="";
    if(v==="beats"&&parts[2]==="new")form(null);else if(v==="beats"&&parts[3]==="edit")form(parts[2]);else if(v==="beats")list();else if(v==="settings")settings();else dash()}
  else if(dirty)location.reload()}
addEventListener("hashchange",route);
function dash(){
  const L=dataAdapter.getBeats(),c=s=>L.filter(p=>p.status===s).length;
  AM.innerHTML=`<h2>Producer dashboard</h2><div class="st">${[["Beats",L.length],["Published",c("published")],["Drafts",c("draft")],["Hidden",c("hidden")]].map(([a,b])=>`<div><b>${b}</b><span>${a}</span></div>`).join("")}</div><a class="ab" href="#/admin/beats/new">+ ADD NEW BEAT</a><div class="ac" style="margin-top:10px;align-items:center;flex-wrap:wrap"><button class="ab" id="xp" type="button">Export to project…</button><small style="opacity:.75">Writes src/data/seed.js and the media files into public/</small></div><h3>Recent beats</h3>${L.length?`<ul class="rc">${[...L].sort((a,b)=>b.updatedAt.localeCompare(a.updatedAt)).slice(0,5).map(p=>`<li><a href="#/admin/beats/${p.id}/edit">${esc(p.title)}</a><i class="pill ${p.status}">${p.status}</i></li>`).join("")}</ul>`:EMPTY}`}
const Q={q:"",st:"all",sort:"new"},SORTS={new:["Newest",(a,b)=>b.createdAt.localeCompare(a.createdAt)],old:["Oldest",(a,b)=>a.createdAt.localeCompare(b.createdAt)],az:["Title A-Z",(a,b)=>a.title.localeCompare(b.title)],za:["Title Z-A",(a,b)=>b.title.localeCompare(a.title)],lo:["Price low-high",(a,b)=>a.price-b.price],hi:["Price high-low",(a,b)=>b.price-a.price],bpm:["BPM",(a,b)=>a.bpm-b.bpm]};
function list(){
  AM.innerHTML=`<h2>Beats</h2><div class="tb"><input id="q" type="search" placeholder="Search title, ID, genre, key, BPM…" aria-label="Search beats" value="${esc(Q.q)}"><select id="fs" aria-label="Filter by status">${["all","published","draft","hidden"].map(s=>`<option${s===Q.st?" selected":""}>${s}</option>`).join("")}</select><select id="so" aria-label="Sort">${Object.entries(SORTS).map(([k,v])=>`<option value="${k}"${k===Q.sort?" selected":""}>${v[0]}</option>`).join("")}</select><a class="ab" href="#/admin/beats/new">+ ADD BEAT</a></div><div id="rows"></div>`;
  $("#q").oninput=e=>{Q.q=e.target.value;rows()};$("#fs").onchange=e=>{Q.st=e.target.value;rows()};$("#so").onchange=e=>{Q.sort=e.target.value;rows()};rows()}
const row=p=>`<article class="rw" data-id="${p.id}"><img alt="" data-cv="${esc(p.cover||"")}"><div><b>${esc(p.title)}</b><small>${p.id} · ${up(p.type)}</small></div><span>${p.bpm||"–"} BPM · ${esc(p.key||"–")}</span><span>${p.price!=null&&p.price!==""?fmtPrice(p.price,p.currency):"–"}</span><i class="pill ${p.status}">${p.status}</i><div class="ac"><a href="#/admin/beats/${p.id}/edit">Edit</a><button data-a="dup">Duplicate</button><button data-a="${p.status==="published"?"unpub":"pub"}">${p.status==="published"?"Unpublish":"Publish"}</button><button data-a="del">Delete</button></div></article>`;
function rows(){
  const t=Q.q.trim().toLowerCase(),all=dataAdapter.getBeats();
  const L=all.filter(p=>(Q.st==="all"||p.status===Q.st)&&(!t||[p.title,p.id,p.genre,p.key,p.bpm].join(" ").toLowerCase().includes(t))).sort(SORTS[Q.sort][1]);
  $("#rows").innerHTML=L.length?L.map(row).join(""):all.length?'<p class="em">No beats match your search.</p>':EMPTY;
  AM.querySelectorAll("img[data-cv]").forEach(async i=>{const id=i.closest("[data-id]").dataset.id;i.onerror=()=>{i.onerror=null;i.src=art({title:"",id},parseInt(id.slice(5)))};i.src=(await dataAdapter.getMedia(i.dataset.cv)).url||"covers/none.jpg"})}
/* ===== Exportar el catálogo al proyecto =====
   Escribe src/data/seed.js y mueve los blobs de cover/audio de IndexedDB a
   public/ — porque un ref "media:" solo existe en TU navegador: el visitante
   no lo podría cargar. Usa la File System Access API (Chrome/Edge/Brave). */
const EXT={"image/jpeg":"jpg","image/jpg":"jpg","image/png":"png","image/webp":"webp","audio/mpeg":"mp3","audio/mp3":"mp3","audio/wav":"wav","audio/x-wav":"wav","audio/ogg":"ogg"};
const wr=async(dir,name,data)=>{const fh=await dir.getFileHandle(name,{create:true}),w=await fh.createWritable();await w.write(data);await w.close()};
const blobOf=async ref=>{try{const {url}=await dataAdapter.getMedia(ref);return url?await (await fetch(url)).blob():null}catch(e){return null}};
async function exportProject(){
  if(!("showDirectoryPicker" in window)){await ask("Export needs Chrome, Edge or Brave","Open the admin on localhost with one of those browsers so it can write the files into your project.");return}
  let root;try{root=await showDirectoryPicker({mode:"readwrite"})}catch(e){return}
  let isProj=false;try{await root.getFileHandle("package.json");isProj=true}catch(e){}
  if(!isProj){await ask("That is not the project folder","Select the folder that contains <code>package.json</code>, <code>src/</code> and <code>public/</code>.");return}
  const beats=dataAdapter.getBeats(),out=[];let nc=0,na=0,miss=0;
  try{
    const data=await (await root.getDirectoryHandle("src",{create:true})).getDirectoryHandle("data",{create:true});
    const pub=await root.getDirectoryHandle("public",{create:true});
    const cov=await pub.getDirectoryHandle("covers",{create:true});
    const aud=await pub.getDirectoryHandle("audio",{create:true});
    for(const p of beats){
      const o={...p};
      /* inverso del mapeo de dataAdapter: availability → status del seed */
      o.status=p.status==="published"?(p.availability||"available"):p.status;
      delete o.availability;delete o.createdAt;delete o.updatedAt;delete o.deletedAt;
      if(String(o.cover||"").startsWith("media:")){
        const b=await blobOf(o.cover);
        if(b){const n=`${p.id}.${EXT[b.type]||"jpg"}`;await wr(cov,n,b);o.cover="covers/"+n;nc++}
        else{delete o.cover;miss++}
      }
      if(String(o.audio||"").startsWith("media:")){
        const b=await blobOf(o.audio);
        if(b){const n=`${p.id}.${EXT[b.type]||"mp3"}`;await wr(aud,n,b);o.audio="audio/"+n;na++}
        else{delete o.audio;miss++}
      }
      out.push(o);
    }
    await wr(data,"seed.js",`/* ===== DATOS DEL CATÁLOGO — generado por el admin =====
   No edites a mano: edita en \`npm run dev\` → #/admin y vuelve a exportar.
   cover y audio son rutas relativas a public/. */
const SEED = ${JSON.stringify(out,null,2)};
export { SEED };
`);
  }catch(err){await ask("Export failed",esc(err&&err.message||String(err)));return}
  await ask("Exported",
    `${out.length} beats → <code>src/data/seed.js</code><br>`+
    `${nc} cover${nc===1?"":"s"} → <code>public/covers/</code><br>`+
    `${na} audio → <code>public/audio/</code>`+
    (miss?`<br><b>${miss} media file${miss===1?"":"s"} could not be read</b>`:"")+
    `<br><br>Now publish with:<br><code>git add . &amp;&amp; git commit -m "update catalog" &amp;&amp; git push</code>`);
}
AM.addEventListener("click",async e=>{
  if(e.target.closest("#xp")){exportProject();return}
  const b=e.target.closest("[data-a]"),row=b&&b.closest("[data-id]"),p=row&&dataAdapter.getBeat(row.dataset.id);if(!p)return;const a=b.dataset.a;
  if(a==="dup"){const n=dataAdapter.createBeat({...p,title:p.title+" COPY",slug:dataAdapter.uniqueSlug(p.slug+"-copy"),status:"draft"});toast("Duplicated");location.hash="#/admin/beats/"+n.id+"/edit"}
  else if(a==="unpub"){dataAdapter.unpublishBeat(p.id);toast("Unpublished");rows()}
  else if(a==="pub"){const er=problems(p,true);if(er.length)await ask("Cannot publish",list_(er));else{dataAdapter.publishBeat(p.id);toast("Published");rows()}}
  else if(a==="del"&&await ask(`Delete "${p.title}"?`,"This action cannot be undone.","Delete")){dataAdapter.deleteBeat(p.id);toast("Deleted");rows()}});
function settings(){
  const S=dataAdapter.getSettings();
  AM.innerHTML=`<h2>Store settings</h2><form id="sf" class="fw" style="display:grid;max-width:420px;gap:12px">${[["producer","Producer name","text"],["store","Store name","text"],["previewDuration","Default preview duration (s)","number"]].map(([k,l,t])=>`<label>${l}<input name="${k}" type="${t}" value="${esc(S[k])}"></label>`).join("")}<label>Default currency<select name="currency">${CUR.map(c=>`<option${c===S.currency?" selected":""}>${c}</option>`).join("")}</select></label><button type="submit">Save</button></form>`;
  $("#sf").onsubmit=e=>{e.preventDefault();const f=new FormData(e.target);dataAdapter.updateSettings({producer:f.get("producer"),store:f.get("store"),currency:f.get("currency"),previewDuration:+f.get("previewDuration")||30});toast("Saved")}}
function form(id){
  let old=id?dataAdapter.getBeat(id):null;
  if(id&&!old){AM.innerHTML='<h2>Beat not found</h2><a href="#/admin/beats">Back to beats</a>';return}
  const S=dataAdapter.getSettings(),F=old?{...old}:{title:"",slug:"",description:"",cover:null,audio:null,bpm:"",key:"",genre:"Trap",mood:"",previewStart:0,previewDuration:S.previewDuration,price:"",currency:S.currency,license:"Basic Lease",buyUrl:"",status:"draft",availability:"available"};
  let cf=null,af=null,slugEdited=!!old,peaks=null,dur=null,cUrl=null,aUrl=null;
  const [note,mode]=(F.key||" ").split(" "),moods=new Set((F.mood||"").split(" / ").filter(Boolean));
  const sel=(n,o,v)=>`<select name="${n}">${o.map(x=>`<option${x===v?" selected":""}>${esc(x)}</option>`).join("")}</select>`,fl=(l,h)=>`<label>${l}${h}</label>`,inp=(n,t,v,x="")=>`<input name="${n}" type="${t}" value="${esc(v)}" ${x}>`;
  AM.innerHTML=`<h2>${old?"Edit beat":"New beat"}</h2><div class="fw"><form id="f" novalidate>
<fieldset><legend>General</legend>${fl("Title",inp("title","text",F.title,'maxlength="80"'))}${fl("Slug",inp("slug","text",F.slug))}${fl("Description",`<textarea name="desc" rows="4">${esc(F.description)}</textarea>`)}</fieldset>
<fieldset><legend>Media</legend><div class="md"><div><img id="cp" alt="Cover preview" hidden><div class="ac"><label class="bt">Upload cover<input type="file" name="cf" accept="image/jpeg,image/png,image/webp" hidden></label><button type="button" id="cx">Remove</button></div></div><div><p id="ai">No audio uploaded</p><label class="bt">Upload audio<input type="file" name="af" accept=".mp3,.wav,audio/mpeg,audio/wav" hidden></label></div></div></fieldset>
<fieldset><legend>Music</legend><div class="g3">${fl("BPM",inp("bpm","number",F.bpm,'min="1" step="any"'))}${fl("Key",`<span class="g2">${sel("note",["",...NOTES],note||"")}${sel("mode",["minor","major"],mode||"minor")}</span>`)}${fl("Genre",sel("genre",[...new Set([...GENRES,F.genre].filter(Boolean))],F.genre))}</div><div class="ch">${[...new Set([...MOODS,...moods])].map(m=>`<label><input type="checkbox" name="mood" value="${esc(m)}"${moods.has(m)?" checked":""}> ${esc(m)}</label>`).join("")}</div></fieldset>
<fieldset><legend>Preview</legend><canvas id="wv" width="600" height="72" role="img" aria-label="Waveform. Click to set where the preview starts."></canvas><div class="g3">${fl("Start (s)",inp("ps","number",F.previewStart,'min="0" step="any"'))}${fl("Duration (s)",inp("pd","number",F.previewDuration,'min="1" step="any"'))}${fl("End",'<output id="pe"></output>')}</div><div><button type="button" id="pp2">Play preview</button></div></fieldset>
<fieldset><legend>Commerce</legend><div class="g3">${fl("Price",inp("price","number",F.price,'min="0" step="any"'))}${fl("Currency",sel("cur",CUR,F.currency))}${fl("License",sel("lic",[...new Set([...LIC,F.license].filter(Boolean))],F.license))}</div>${fl("Payhip product URL",inp("buy","url",F.buyUrl||"",'placeholder="https://payhip.com/b/…"'))}</fieldset>
<fieldset><legend>Publish</legend>${fl("Status",sel("status",["draft","published","hidden"],F.status))}<div id="er" role="alert"></div><div class="ac" style="display:flex;gap:8px;flex-wrap:wrap"><button type="submit">${old?"Save changes":"Save draft"}</button><button type="button" id="pb2">Publish</button><a class="bt" href="#/admin/beats">Cancel</a></div></fieldset></form><aside class="lv" id="lv" aria-label="Live preview"></aside></div>`;
  const g=n=>AM.querySelector(`[name=${n}]`),showErr=(e,full)=>{$("#er").innerHTML=`<b>${full?"Cannot publish:":"Please fix:"}</b>${list_(e)}`};
  const read=()=>Object.assign(F,{title:g("title").value.trim(),slug:slugify(g("slug").value),description:g("desc").value.trim(),bpm:g("bpm").value===""?"":+g("bpm").value,key:g("note").value?g("note").value+" "+g("mode").value:"",genre:g("genre").value,mood:[...AM.querySelectorAll("[name=mood]:checked")].map(x=>x.value).join(" / "),previewStart:+g("ps").value,previewDuration:+g("pd").value,price:g("price").value===""?"":+g("price").value,currency:g("cur").value,license:g("lic").value,buyUrl:g("buy").value.trim(),status:g("status").value});
  const showCover=()=>{const i=$("#cp");i.hidden=!cUrl;i.onerror=()=>{i.hidden=true};if(cUrl)i.src=cUrl;upd()};
  function draw(){const c=$("#wv"),x=c.getContext("2d"),w=c.width,h=c.height,col=getComputedStyle(AM).color;x.clearRect(0,0,w,h);x.fillStyle=col;
    if(!peaks){x.globalAlpha=.5;x.font="13px system-ui";x.fillText("Upload audio to see the waveform",10,40);x.globalAlpha=1;return}
    const a=F.previewStart/dur*w,b=(F.previewStart+F.previewDuration)/dur*w,bw=w/peaks.length;x.globalAlpha=.14;x.fillRect(a,0,b-a,h);
    peaks.forEach((p,i)=>{x.globalAlpha=i*bw>=a&&i*bw<=b?1:.35;x.fillRect(i*bw,h/2-p*h/2,bw-1,Math.max(1,p*h))});x.globalAlpha=1}
  function upd(){read();$("#pe").textContent=fmt(F.previewStart+F.previewDuration);draw();
    $("#lv").innerHTML=`<img alt="" ${cUrl?`src="${esc(cUrl)}"`:"hidden"}><b>${esc(F.title||"Untitled")}</b><span>${F.bpm?F.bpm+" BPM · ":""}${esc(up(F.key))}</span><span>${F.price!==""?fmtPrice(F.price,F.currency):""} ${esc(up(F.license))}</span><span class="bu">BUY</span>`}
  async function loadAudio(url,label){
    try{const buf=await (await fetch(url)).arrayBuffer(),ctx=new (window.AudioContext||window.webkitAudioContext)(),d=await ctx.decodeAudioData(buf);ctx.close();dur=d.duration;
      const ch=d.getChannelData(0),n=150,st=Math.floor(ch.length/n);peaks=Array.from({length:n},(_,i)=>{let m=0;for(let j=i*st;j<(i+1)*st;j+=Math.max(1,st>>6))m=Math.max(m,Math.abs(ch[j]));return m});
      aUrl=url;$("#ai").textContent=`${label} · ${fmt(dur)}${af?` · ${(af.size/1048576).toFixed(1)} MB`:""}`}
    catch(e){peaks=null;dur=null;$("#ai").textContent=`${label} · waveform unavailable`}upd()}
  g("cf").onchange=e=>{const f=e.target.files[0];if(!f)return;if(!/^image\/(jpeg|png|webp)$/.test(f.type)){showErr(["Cover must be a JPG, PNG or WEBP image."]);return}cf=f;cUrl=URL.createObjectURL(f);showCover()};
  $("#cx").onclick=()=>{cf=null;F.cover=null;cUrl=null;showCover()};
  g("af").onchange=e=>{const f=e.target.files[0];if(!f)return;if(!/\.(mp3|wav)$/i.test(f.name)&&!/audio\/(mpeg|mp3|wav|x-wav)/.test(f.type)){showErr(["Audio must be an MP3 or WAV file."]);return}af=f;aUrl=null;loadAudio(URL.createObjectURL(f),f.name)};
  $("#wv").onclick=e=>{if(!dur)return;const r=e.target.getBoundingClientRect();g("ps").value=Math.max(0,Math.min(dur-F.previewDuration,Math.round((e.clientX-r.left)/r.width*dur))).toFixed(0);upd()};
  $("#pp2").onclick=async()=>{read();const u=aUrl||(await dataAdapter.getMedia(F.audio)).url;if(!u){toast("Upload audio first");return}
    aud=aud||new Audio();aud.pause();aud.src=u;aud.onloadedmetadata=()=>{aud.currentTime=F.previewStart;aud.play()};aud.ontimeupdate=()=>{if(aud.currentTime>=F.previewStart+F.previewDuration)aud.pause()};aud.onerror=()=>toast("This audio file could not be played.")};
  g("title").addEventListener("input",()=>{if(!slugEdited)g("slug").value=dataAdapter.uniqueSlug(g("title").value,old&&old.id)});
  g("slug").addEventListener("input",()=>slugEdited=true);AM.querySelector("#f").addEventListener("input",upd);
  async function save(force){
    read();if(force)F.status=force;const full=F.status==="published",er=problems({...F,cover:F.cover||(cf&&1),audio:F.audio||(af&&1)},full,dur);
    if(er.length){showErr(er,full);return}
    F.slug=dataAdapter.uniqueSlug(F.slug||F.title,old&&old.id);
    if(cf){F.cover=await dataAdapter.saveMedia(cf);cf=null}if(af){F.audio=await dataAdapter.saveMedia(af);af=null}
    const r=old?dataAdapter.updateBeat(old.id,F):dataAdapter.createBeat(F);
    toast(full&&(!old||old.status!=="published")?"Published":"Saved");
    if(old)form(r.id);else location.hash="#/admin/beats/"+r.id+"/edit"}
  AM.querySelector("#f").onsubmit=e=>{e.preventDefault();save(null)};$("#pb2").onclick=()=>save("published");
  dataAdapter.getMedia(F.cover).then(m=>{if(m.url&&!cf){cUrl=m.url;showCover()}});
  if(F.audio)dataAdapter.getMedia(F.audio).then(m=>m.url?loadAudio(m.url,m.name||"Uploaded audio"):upd());
  upd()}

export { route };
