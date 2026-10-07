/* ===== DATOS: añade o edita beats aquí. Cada objeto genera un CD. =====
   cover: ruta de la imagen (si no existe, se genera un cover provisional).
   audio, previewStart, previewDuration, buyUrl: reservados para la etapa 2. */
const D={type:"beat",currency:"USD",license:"Basic Lease",previewDuration:30,status:"available",duration:"3:00",price:29.99,tags:[],description:""};
const beat=(n,title,o)=>{const id="beat-"+String(n).padStart(3,"0"),slug=title.toLowerCase().replace(/ /g,"-");
  return{...D,id,title,cover:"covers/"+id+".jpg",audio:n<=6?"audio/"+slug+".mp3":null,buyUrl:"https://payhip.com/b/DEMO"+n,...o}};
/* status: available | coming-soon | sold | hidden (hidden existe en los datos pero no sale en la galería) */
const SEED=[
  beat(1,"NIGHT SHIFT",{bpm:142,key:"C minor",genre:"Trap",mood:"Dark / Atmospheric",duration:"3:14",previewStart:42,tags:["dark","trap","cinematic"],description:"Dark atmospheric production with cinematic textures, distorted synths and heavy drums built for late-night drives and slow-motion hooks."}),
  beat(2,"AFTER HOURS",{bpm:128,key:"F minor",genre:"R&B",mood:"Late / Smooth",duration:"2:58",previewStart:71,price:24.99,tags:["rnb","smooth","night"],description:"Silky keys over a patient groove."}),
  beat(3,"VOID",{bpm:150,key:"D minor",genre:"Drill",mood:"Cold / Aggressive",duration:"2:41",previewStart:28,price:34.99,tags:["drill","cold","sliding"],description:"Sliding 808s and icy strings."}),
  beat(4,"NO SIGNAL",{bpm:140,key:"A minor",genre:"Trap",mood:"Eerie / Minimal",duration:"3:02",previewStart:94,tags:["eerie","minimal","trap"],description:"Sparse, tense and hypnotic."}),
  beat(5,"MIDNIGHT",{bpm:96,key:"G minor",genre:"Boom Bap",mood:"Dusty / Nostalgic",duration:"3:20",previewStart:60,price:19.99,tags:["boombap","dusty","sample"],description:"Dusty drums and a looped piano sample."}),
  beat(6,"ECLIPSE",{bpm:132,key:"E minor",genre:"Ambient",mood:"Wide / Dreamy",duration:"3:45",previewStart:18,buyUrl:null,tags:["ambient","dreamy"],description:"Wide pads and slow pulses. No buyUrl set, so it shows COMING SOON."}),
  beat(7,"VELVET",{bpm:88,key:"Bb major",genre:"Soul",mood:"Warm / Lush",previewStart:44,price:27,currency:"EUR",status:"coming-soon",tags:["soul","warm"],description:"Warm chords, live bass feel."}),
  beat(8,"SLOW BURN",{bpm:74,key:"C# minor",genre:"R&B",mood:"Moody / Sensual",previewStart:52,status:"sold",tags:["rnb","moody"],description:"Already sold."}),
  beat(9,"DARK ROOM",{bpm:146,key:"F# minor",genre:"Trap",mood:"Dark / Heavy",previewStart:31,tags:["dark","trap"],description:"Heavy low end, detuned bells."}),
  beat(10,"PARALLEL",{bpm:120,key:"D major",genre:"Electronic",mood:"Bright / Driving",previewStart:66,price:39.99,tags:["electronic","bright"],description:"Four-on-the-floor energy."}),
  beat(11,"NOVA",{bpm:160,key:"A major",genre:"Hyperpop",mood:"Glitchy / Euphoric",previewStart:22,tags:["hyperpop","glitch"],description:"Pitched vocals and shiny leads."}),
  beat(12,"AFTERIMAGE",{bpm:110,key:"B minor",genre:"Lo-fi",mood:"Soft / Hazy",previewStart:49,status:"hidden",tags:["lofi"],description:"Hidden: it exists in the data but is not shown in the gallery."})
];

export { D, beat, SEED };
