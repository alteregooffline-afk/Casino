/* ===== DATOS: añade o edita beats aquí. Cada objeto genera un CD. =====
   cover:    ruta de la imagen dentro de public/ (si no existe, se genera un cover provisional).
   audio:    ruta del MP3 de preview dentro de public/.
             Si el fichero NO existe y engine.js tiene DEMO=true, suena un beat
             sintetizado de prueba. Pon los MP3 reales con estos mismos nombres
             y pasan a sonar sin tocar nada más.
   buyUrl:   enlace de compra de Payhip (checkout directo con la variante mp3 fijada).
   status:   available | coming-soon | sold | hidden (hidden existe en los datos pero no sale en la galería)
   bpm/key/genre/mood/duration son opcionales: si están vacíos no se pintan en el panel. */
const D={type:"beat",currency:"USD",license:"Basic Lease",previewDuration:30,status:"available",duration:"3:00",price:29.99,tags:[],description:""};
const beat=(n,title,o)=>{const id="beat-"+String(n).padStart(3,"0");
  return{...D,id,title,cover:"covers/"+id+".jpg",buyUrl:null,...o}};
const SEED=[
  beat(1,"Phenomenon",{audio:"audio/phenomenon.mp3",bpm:133,key:"F minor",genre:"Trap",mood:"Hard / Dark",previewStart:0,price:29.99,buyUrl:"https://payhip.com/buy?s=1&variant_combination[2vO6q]=1773225248074&cart_links[]=2vO6q&qty[2vO6q]=1",tags:["trap","hard","don-toliver"],description:"This is a Hard beat inspired by Don toliver album OCTANE. By this I do not mean that it is a copy; the beat is 100% original from my own understanding"}),
  beat(2,"Funeral Flowers",{audio:"audio/funeral-flowers.mp3",genre:"House",mood:"Dark / Melancholic",previewStart:0,price:29.99,buyUrl:"https://payhip.com/buy?s=1&variant_combination[SMsWl]=1778683467175&cart_links[]=SMsWl&qty[SMsWl]=1",tags:["house","dark","drake"],description:"A beat inspired by Drake's album 'Honestly, Nevermind' is a dark and melancholic house beat but with plenty of movement inspired by the production of DJ Black Coffee."}),
  beat(3,"Flashbacks",{audio:"audio/flashbacks.mp3",genre:"Electronic",mood:"Bouncy / Nostalgic",previewStart:0,price:29.99,buyUrl:"https://payhip.com/buy?s=1&variant_combination[tiAsP]=1778857508751&cart_links[]=tiAsP&qty[tiAsP]=1",tags:["electronic","bounce","drake"],description:"A beat inspired by the vibes of Drake's recently released album ' MAID OF HONOUR ', with electronic touches and a style with a very marked bounce."}),
  beat(4,"Last Weekend",{audio:"audio/last-weekend.mp3",genre:"R&B",mood:"Melancholic / Smooth",previewStart:0,price:29.99,buyUrl:"https://payhip.com/buy?s=1&variant_combination[t4pHE]=1778858147476&cart_links[]=t4pHE&qty[t4pHE]=1",tags:["rnb","melancholic","drake"],description:"A beat inspired by the vibes of Drake's recently released album ' HABIBTI ', with touches of Rnb and a very marked melancholic style"}),
  beat(5,"Semitones",{audio:"audio/semitones.mp3",genre:"House",mood:"Bright / Driving",previewStart:0,price:29.99,buyUrl:"https://payhip.com/buy?s=1&variant_combination[EeS5T]=1777064617981&cart_links[]=EeS5T&qty[EeS5T]=1",tags:["house","bright","boi1da"],description:"This is a house beat inspired by Drake and Boi1da. By this I do not mean that it is a copy; the beat is 100% original from my own understanding."}),
  beat(6,"Don´t let me",{audio:"audio/dont-let-me.mp3",bpm:62,key:"F minor",genre:"Trap",mood:"Soul / Warm",previewStart:0,price:29.99,buyUrl:"https://payhip.com/buy?s=1&variant_combination[DKwOP]=1775754576148&cart_links[]=DKwOP&qty[DKwOP]=1",tags:["trap","soul","boi1da"],description:"This is a soul trap beat inspired by Drake and Boi1da. By this I do not mean that it is a copy; the beat is 100% original from my own understanding."}),
  beat(7,"Where it is?",{audio:"audio/where-it-is.mp3",genre:"Trap",mood:"Pure trap / Cinematic",previewStart:0,price:29.99,buyUrl:"https://payhip.com/buy?s=1&variant_combination[2IFON]=1778861789116&cart_links[]=2IFON&qty[2IFON]=1",tags:["trap","iceman","future"],description:"A beat inspired by the vibes of Drake's recently released album 'ICEMAN', with a pure trap vibe and style, accompanied by artists like FUTURE."})
];

export { D, beat, SEED };
