import { dataAdapter } from "../services/dataAdapter.js";

/* ===== AUDIO: un solo <audio> para toda la tienda, creado al primer uso (nada se carga al abrir la página) =====
   El motor es genérico: lee previewStart / previewDuration / audio del beat, nunca de un beat concreto. */
const DEMO=true; // true: si el archivo de audio no existe, se sintetiza un beat de prueba. Ponlo en false con audios reales.
const Engine=(()=>{
  let a,b=null,st="idle",start=0,dur=30,tok=0,fb=false,raf=0,vol=.8;const subs=[],cache=new Map();
  const emit=()=>subs.forEach(f=>f()),set=s=>{st=s;emit()},clamp=(v,l,h)=>Math.max(l,Math.min(h,v));
  const seek=()=>{if(Math.abs(a.currentTime-start)>.25)a.currentTime=start};
  const go=()=>{const my=tok;a.play().catch(()=>{if(my===tok&&st!=="playing")set("paused")})};
  const loop=()=>{cancelAnimationFrame(raf);const f=()=>{
    if(st!=="playing")return;
    if(a.currentTime>=start+dur){set("ended");a.pause();return}   // fin del preview: se detiene
    emit();raf=requestAnimationFrame(f)};raf=requestAnimationFrame(f)};
  const make=()=>{a=new Audio();a.volume=vol;
    a.addEventListener("error",()=>{if(!b)return;if(DEMO&&!fb&&b.audio){fb=true;demo(b,tok)}else set("error")});
    a.addEventListener("loadedmetadata",()=>{if(st==="loading")seek()});
    a.addEventListener("canplay",()=>{if(st!=="loading")return;seek();set("ready");go()});
    a.addEventListener("playing",()=>{if(st==="ready"||st==="paused"){set("playing");loop()}});
    a.addEventListener("pause",()=>{if(st==="playing")set("paused")});
    a.addEventListener("ended",()=>{if(st==="playing")set("ended")})};
  async function demo(nb,my){const k=[nb.id,nb.bpm,nb.key,nb.previewStart].join();let u=cache.get(k);
    if(!u){u=await synth(nb,my);if(!u)return;cache.set(k,u)}
    if(my===tok){a.src=u;a.load()}}
  async function synth(nb,my){   // beat de prueba (WAV 8 kHz) generado según bpm y tonalidad del beat
    const R=8000,n=Math.ceil(((+nb.previewStart||0)+(+nb.previewDuration||30)+6)*R),buf=new Int16Array(n);
    const K={C:0,D:2,E:4,F:5,G:7,A:9,B:11},k=String(nb.key),r=(K[k[0]]||0)+(k[1]==="#"?1:k[1]==="b"?-1:0);
    const root=65.4*2**(r/12),th=/min/i.test(k)?3:4,sp=60/(nb.bpm||120)/4,T=6.2832,seq=[0,0,-2,3],kk=nb.bpm%3?[0,6,10]:[0,3,10,12],arp=[0,th,7,th];
    for(let i=0;i<n;i++){
      if(i%90000===0&&i){await new Promise(z=>setTimeout(z));if(my!==tok)return null}
      const t=i/R,q=t/sp,s=Math.floor(q)%16,u=(q%1)*sp,bar=Math.floor(q/16)%4;let v=0;
      if(kk.includes(s))v+=Math.sin(T*(45*u+3*(1-Math.exp(-30*u))))*Math.exp(-u*7)*.9;
      if(s===4||s===12)v+=(Math.random()*2-1)*Math.exp(-u*16)*.4;
      v+=(Math.random()*2-1)*Math.exp(-u*55)*.12*(s%2?.6:1);
      v+=Math.sin(T*root*2**(seq[bar]/12)*t)*.28*(.55+.45*Math.exp(-(q%4)*sp*3));
      if(s%2===0)v+=Math.sin(T*root*4*2**(arp[(s>>1)%4]/12)*t)*.07*Math.exp(-u*8);
      buf[i]=Math.max(-1,Math.min(1,v*.8))*32767}
    const h=new DataView(new ArrayBuffer(44)),w=(o,x)=>[...x].forEach((c,j)=>h.setUint8(o+j,c.charCodeAt(0)));
    w(0,"RIFF");h.setUint32(4,36+n*2,true);w(8,"WAVEfmt ");h.setUint32(16,16,true);h.setUint16(20,1,true);h.setUint16(22,1,true);
    h.setUint32(24,R,true);h.setUint32(28,R*2,true);h.setUint16(32,2,true);h.setUint16(34,16,true);w(36,"data");h.setUint32(40,n*2,true);
    const by=new Uint8Array(44+n*2);by.set(new Uint8Array(h.buffer));by.set(new Uint8Array(buf.buffer),44);
    let o="";for(let i=0;i<by.length;i+=32768)o+=String.fromCharCode.apply(null,by.subarray(i,i+32768));
    return "data:audio/wav;base64,"+btoa(o)}
  const live=["playing","paused","ready","ended"];
  return{
    get beat(){return b},get state(){return st},get dur(){return dur},sub:f=>subs.push(f),
    elapsed(){return st==="ended"?dur:(!a||!live.includes(st))?0:clamp(a.currentTime-start,0,dur)},
    load(nb){tok++;b=nb;start=+nb.previewStart||0;dur=+nb.previewDuration||30;fb=false;st="loading";
      if(!a)make();a.pause();
      if(!nb.audio){set("error");return}
      set("loading");a.preload="auto";const my=tok;dataAdapter.getMedia(nb.audio).then(m=>{if(my===tok){a.src=m.url||nb.audio;a.load()}})},
    toggle(){if(st==="playing")a.pause();else if(st==="paused"||st==="ready")go();
      else if(st==="ended"){set("paused");a.currentTime=start;go()}else if(st==="error"&&b)this.load(b)},
    seek(fr){if(!live.includes(st))return;a.currentTime=start+clamp(fr,0,1)*dur;if(st==="ended")set("paused");else emit()},
    stop(){if(live.includes(st)){set("paused");a.pause();a.currentTime=start}},
    volume(v){vol=v;if(a)a.volume=v},
    release(){tok++;if(a)a.pause();b=null;st="idle";emit()}}
})();

export { Engine, DEMO };
