/* ===== Cover provisional generado (se usa si el archivo no existe) ===== */
function art(b,n){
  const c=document.createElement("canvas");c.width=c.height=360;const x=c.getContext("2d");
  const h=(n*47+200)%360,h2=(h+40+n*13)%360,k=n%4;
  const g=x.createLinearGradient(0,0,360,360);
  g.addColorStop(0,`hsl(${h} 70% ${k==3?16:55}%)`);g.addColorStop(1,`hsl(${h2} 75% ${k==3?40:30}%)`);
  x.fillStyle=g;x.fillRect(0,0,360,360);x.fillStyle=`hsl(${h2} 85% 70% / .85)`;
  if(k==0){x.beginPath();x.arc(180,200,95,0,7);x.fill()}
  if(k==1){for(let i=0;i<8;i++)x.fillRect(0,20+i*38,360,18-i*2)}
  if(k==2){x.beginPath();x.arc(80,60,150,0,7);x.fill();x.fillStyle=`hsl(${h} 60% 12%)`;x.fillRect(0,250,360,110)}
  if(k==3){x.strokeStyle=`hsl(${h2} 90% 65%)`;x.lineWidth=3;for(let i=1;i<7;i++){x.beginPath();x.arc(180,170,i*28,0,7);x.stroke()}}
  x.fillStyle="#fff";x.font="600 28px system-ui,sans-serif";x.fillText(b.title,20,334);
  x.font="13px system-ui,sans-serif";x.fillText(b.id,20,30);
  return c.toDataURL("image/jpeg",.85);
}

export { art };
