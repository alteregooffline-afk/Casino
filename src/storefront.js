/* STOREFRONT: escena 3D, panel del beat y reproductor (extraido del monolito original). */
import { $, fmt, fmtPrice, safeUrl, up } from "./lib/utils.js";
import { art } from "./lib/art.js";
import { dataAdapter } from "./services/dataAdapter.js";
import { Engine } from "./audio/engine.js";

const ADM=$("#adm");   // el panel admin vive en el mismo DOM: aqui solo se lee su estado
const beats=dataAdapter.getPublishedBeats();   // la tienda pública solo lee esto

/* ===== Escena ===== */
const stage=$("#stage"),scene=$("#scene"),N=beats.length;
const reduce=matchMedia("(prefers-reduced-motion: reduce)").matches;
const P=46,G=64,PULL=118;               // separación, hueco junto al seleccionado, salida lateral
let cur=Math.min(4,Math.max(0,N-1)),prev=cur,open=false,gp=0,pos=reduce?cur:cur+8,hov=-1,mx=0,my=0,sx=0,sy=0,last=0,raf=0;
const hv=new Float32Array(N);

const cds=beats.map((b,i)=>{
  const el=document.createElement("button");
  el.type="button";el.className="cd";el.dataset.state="idle";
  el.setAttribute("aria-label",`${b.title}, beat ${i+1} of ${N}`);
  el.innerHTML='<i class="b"></i><i class="r"></i><i class="t"></i><span class="f"><img alt="" draggable="false"><span class="sh"></span><span class="eq"><i></i><i></i><i></i></span></span>';
  const img=el.querySelector("img");
  img.onerror=()=>{img.onerror=null;img.src=art(b,i)};
  dataAdapter.getMedia(b.cover).then(m=>img.src=m.url||"covers/none.jpg");
  el.addEventListener("pointerenter",e=>{if(e.pointerType==="mouse"){hov=i;stage.classList.add("hov");wake()}});
  el.addEventListener("pointerleave",()=>{if(hov===i){hov=-1;stage.classList.remove("hov");wake()}});
  el.addEventListener("click",()=>{if(swiped){swiped=false;return}if(i===cur&&open)playPause();else select(i)});
  scene.appendChild(el);return el;
});

function scale(){return Math.max(.6,Math.min(1.35,Math.min(innerWidth/900,innerHeight/720)))}

function render(){
  scene.style.transform=`scale(${scale()}) rotateX(${-35-sy*3}deg) rotateY(${-24+sx*5}deg)`;
  for(let i=0;i<N;i++){
    const d=i-pos,a=Math.abs(d),s=Math.max(-1,Math.min(1,d));
    let k=Math.max(0,1-a);k=k*k*(3-2*k)*gp;
    const h=hv[i],z=-(d*P+G*gp*s);
    cds[i].style.transform=`translate3d(${PULL*k+16*h}px,${-6*h}px,${z+18*h+10*k}px) rotateY(${-6*k+3*h}deg) scale(${1+.05*k+.03*h})`;
  }
}

function tick(t){
  raf=0;const dt=Math.min(.05,(t-last)/1000||.016);last=t;
  const f=q=>reduce?1:1-Math.pow(1-q,dt*60);let busy=false;
  const np=pos+(cur-pos)*f(.075);
  if(Math.abs(cur-np)<.002)pos=cur;else{pos=np;busy=true}
  const gt=open?1:0;gp+=(gt-gp)*f(.075);if(Math.abs(gt-gp)<.002)gp=gt;else busy=true;
  sx+=(mx-sx)*f(.06);sy+=(my-sy)*f(.06);
  if(Math.abs(mx-sx)>.002||Math.abs(my-sy)>.002)busy=true;
  const moving=Math.abs(cur-pos)>.01||Math.abs(gp-(open?1:0))>.01;
  for(let i=0;i<N;i++){
    const tg=i===hov?1:0;hv[i]+=(tg-hv[i])*f(.18);
    if(Math.abs(tg-hv[i])>.003)busy=true;
    const st=moving&&(i===cur||i===prev)?"transitioning":i===cur&&open?"selected":i===hov?"hover":"idle";
    if(cds[i].dataset.state!==st){cds[i].dataset.state=st;cds[i].setAttribute("aria-pressed",i===cur&&open)}
  }
  render();
  if(busy)raf=requestAnimationFrame(tick);
}
function wake(){if(!raf){last=performance.now();raf=requestAnimationFrame(tick)}}

/* ===== Panel del beat seleccionado (marcadores para la etapa 2) ===== */
const T=$("#title"),PB=$("#pb"),DESC=$("#desc"),MORE=$("#more"),BUY=$("#buy");
const track=(n,d)=>dispatchEvent(new CustomEvent("shop:"+n,{detail:d}));   // gancho para analytics (etapa futura)
const lic=b=>(b.licenses&&b.licenses[0])||{name:b.license,price:b.price,buyUrl:b.buyUrl};   // listo para varias licencias
function panel(){
  const b=beats[cur],l=lic(b),url=safeUrl(l.buyUrl),ok=b.availability==="available"&&url;
  T.textContent=b.title;
  $("#meta").textContent=[b.bpm&&b.bpm+" BPM",up(b.key),b.duration].filter(Boolean).join(" · ");
  $("#genre").textContent=[b.genre,b.mood].filter(Boolean).map(up).join(" · ");
  $("#tags").textContent=(b.tags||[]).slice(0,3).map(t=>"#"+t).join("   ");
  DESC.textContent=b.description||"";DESC.classList.remove("open");MORE.textContent="MORE";MORE.setAttribute("aria-expanded","false");
  MORE.hidden=!(DESC.scrollHeight>DESC.clientHeight+1);
  $("#price").textContent=fmtPrice(l.price,b.currency);$("#lic").textContent=up(l.name);
  BUY.textContent=ok?"BUY":b.availability==="sold"?"SOLD":"COMING SOON";
  if(ok){BUY.href=url;BUY.removeAttribute("aria-disabled");BUY.setAttribute("aria-label",`Buy ${b.title} for ${fmtPrice(l.price,b.currency)}, opens in a new tab`)}
  else{BUY.removeAttribute("href");BUY.setAttribute("aria-disabled","true");BUY.removeAttribute("aria-label")}
  $("#count").textContent=`${cur+1} / ${N}`;
  PB.classList.remove("in");void PB.offsetWidth;PB.classList.add("in");
  drawBars(b);ui();
}
function select(i){
  if(!N)return;
  i=Math.max(0,Math.min(N-1,i));if(i===cur&&open)return;
  prev=cur;cur=i;open=true;document.body.toggleAttribute("data-open",true);
  panel();hint();wake();Engine.load(beats[cur]);track("select",{id:beats[cur].id});
}
function closePanel(){   // deselecciona: el CD vuelve a la fila, el panel se oculta y el audio se detiene
  if(!open)return;open=false;document.body.toggleAttribute("data-open",false);
  Engine.release();ui();wake();track("close",{id:beats[cur].id});
}
function hint(){$("#hint").classList.add("off")}

/* ===== Entradas: teclado, rueda, swipe, botones ===== */
addEventListener("keydown",e=>{
  if(!ADM.hidden)return;
  if(e.key==="Escape"){closePanel();return}
  if(/^(INPUT|TEXTAREA)$/.test(e.target.tagName))return;
  if(e.key===" "&&!/^(BUTTON|A|SELECT)$/.test(e.target.tagName)){e.preventDefault();playPause();return}
  const m={ArrowRight:1,ArrowDown:1,ArrowLeft:-1,ArrowUp:-1};
  if(e.key in m){e.preventDefault();select(cur+m[e.key])}
  else if(e.key==="Home"){select(0)}else if(e.key==="End"){select(N-1)}
});
let acc=0,wt=0;
stage.addEventListener("wheel",e=>{
  e.preventDefault();acc+=e.deltaY+e.deltaX;
  if(Math.abs(acc)>50&&performance.now()-wt>170){select(cur+(acc>0?1:-1));acc=0;wt=performance.now()}
},{passive:false});
let sp=null,swiped=false;
stage.addEventListener("pointerdown",e=>{sp={x:e.clientX,y:e.clientY}});
stage.addEventListener("pointerup",e=>{
  if(!sp)return;const dx=e.clientX-sp.x,dy=e.clientY-sp.y;sp=null;
  const v=Math.abs(dx)>Math.abs(dy)?dx:dy;
  if(Math.abs(v)>45){swiped=true;select(cur+(v<0?1:-1));setTimeout(()=>swiped=false,60)}
});
stage.addEventListener("pointermove",e=>{
  if(e.pointerType!=="mouse")return;
  mx=(e.clientX/innerWidth-.5)*2;my=(e.clientY/innerHeight-.5)*2;wake();
});
$("#prev").onclick=()=>select(cur-1);$("#next").onclick=()=>select(cur+1);

/* ===== Reproductor visual: solo lee del motor, nunca crea audio ===== */
const $pl=$("#player"),$wf=$("#wf"),$tm=$("#time"),$st=$("#status"),$pp=$("#pp");
const MSG={idle:"Press play to listen",loading:"LOADING PREVIEW…",ready:"Ready",playing:"Playing",paused:"Paused",ended:"Preview ended",error:"PREVIEW UNAVAILABLE"};
let lastTx="",lastSt="";
function playPause(){if(!open)return;Engine.beat===beats[cur]?Engine.toggle():Engine.load(beats[cur])}
function ui(){
  const b=beats[cur],mine=open&&Engine.beat===b,s=mine?Engine.state:"idle";
  const d=mine?Engine.dur:(+b.previewDuration||30),e=mine?Engine.elapsed():0,tx=fmt(e)+" / "+fmt(d);
  if(tx!==lastTx){lastTx=tx;$tm.textContent=tx;$wf.setAttribute("aria-valuenow",Math.floor(e));$wf.setAttribute("aria-valuemax",d)}
  $wf.style.setProperty("--p",(e/d*100).toFixed(2));
  const key=s+b.id;
  if(key!==lastSt){lastSt=key;if(s==="playing")track("preview_play",{id:b.id});if(s==="ended")track("preview_complete",{id:b.id});$pl.dataset.state=s;$st.textContent=MSG[s];
    $pp.setAttribute("aria-label",s==="playing"?"Pause preview":"Play preview");
    cds.forEach((c,i)=>{if(i===cur&&(s==="playing"||s==="paused"))c.dataset.play=s;else delete c.dataset.play})}
}
function drawBars(b){   // waveform decorativa del preview (determinista por beat); se podrá reemplazar por la real
  let h=0;for(const c of b.id+b.previewStart)h=(h*31+c.charCodeAt(0))>>>0;let o="";
  for(let i=0;i<56;i++){h=(h*1664525+1013904223)>>>0;o+=`<i style="height:${Math.round(18+82*(h/4294967296)*(.45+.55*Math.abs(Math.sin(i/5+(h%5)))))}%"></i>`}
  $("#b0").innerHTML=$("#b1").innerHTML=o}

MORE.onclick=()=>{const o=DESC.classList.toggle("open");MORE.textContent=o?"LESS":"MORE";MORE.setAttribute("aria-expanded",String(o))};
$("#close").onclick=closePanel;
BUY.addEventListener("click",()=>{if(BUY.hasAttribute("href"))track("buy_click",{id:beats[cur].id})});
stage.addEventListener("click",e=>{if(open&&!swiped&&(e.target===stage||e.target===scene))closePanel()});
Engine.sub(ui);$pp.onclick=playPause;
$wf.addEventListener("click",e=>{const r=$wf.getBoundingClientRect();Engine.seek((e.clientX-r.left)/r.width)});
$("#vol").oninput=e=>Engine.volume(e.target.value/100);
addEventListener("resize",wake);

/* Arranque (antes en las ultimas lineas del script unico). */
function initStorefront(){
if(N)panel();else{const m=document.createElement("p");m.className="empty";m.innerHTML='No beats published yet. <a href="#/admin">Open admin</a>';document.body.appendChild(m)}
wake();
}

export { closePanel, initStorefront };
