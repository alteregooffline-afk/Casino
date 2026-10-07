# Tienda de Beats — Fase A: lista para vender (Vite + JavaScript vanilla)

Aplicación migrada de un único `galeria-beats.html` a Vite con módulos ES.
Sin frameworks: solo HTML, CSS y JavaScript vanilla.

- **STEP 1**: migración a Vite + módulos.
- **STEP 2**: acceso a datos aislado tras un adapter local.
- **Fase A**: preparada para desplegar en Vercel y vender con enlaces de Payhip.

## Comandos

```bash
npm install      # instalar dependencias (solo Vite)
npm run dev      # desarrollo en http://localhost:5173/
npm run build    # build de producción en dist/
npm run preview  # servir dist/ en http://localhost:4173/
```

> Si `npm` no se reconoce en PowerShell, usa `npm.cmd` o abre una terminal nueva.

## Estructura

```text
index.html              HTML principal (idioma en, metadatos sociales)
vercel.json             configuración de build para Vercel
public/
  covers/               portadas  .jpg  → se sirven en /covers/beat-001.jpg
  audio/                previews .mp3  → se sirven en /audio/night-shift.mp3
src/
  main.js               punto de entrada: arranca storefront + admin
  storefront.js         escena 3D, panel del beat, reproductor
  admin.js              dashboard, lista, formulario, ajustes, hash router
  styles/main.css       todo el CSS original, sin cambios
  data/seed.js          ★ FUENTE DE VERDAD del catálogo público
  lib/art.js            cover provisional generado con canvas
  lib/utils.js          utilidades compartidas ($, fmt, slugify, ...)
  audio/engine.js       reproductor + DEMO (sintetiza audio si no existe)
  services/
    dataAdapter.js      interfaz única de datos que usa la UI
    localAdapter.js     único punto que toca localStorage + IndexedDB
```

### Capas de datos (STEP 2)

```text
UI (storefront.js · admin.js · audio/engine.js)
  └──► dataAdapter.js     beats · ajustes · media   ← único import de la UI
          └──► localAdapter.js                      ← único que toca storage
                  ├──► localStorage  (shop:products, shop:settings)
                  └──► IndexedDB     (shop-media / m)
```

La UI solo conoce `dataAdapter`: ni `localStorage`, ni `IndexedDB`,
ni claves internas, ni el prefijo de referencia `media:`, ni los campos
`id` / `createdAt` / `updatedAt` (los decide el adapter).

## Cómo se vende

El botón **BUY no procesa pagos**: abre un enlace externo (`buyUrl`) que apunta a
**Payhip** (el monolito ya venía pensado así — la validación del admin se llama
literalmente *Payhip product URL*).

```text
Visitante pulsa BUY  ──►  payhip.com  ──►  pago  ──►  Payhip entrega WAV + licencia PDF
                              └── Payhip gestiona IVA, links de descarga y facturas
```

Tú nunca tocas tarjetas ni tienes responsabilidad PCI. **Ni hace falta backend de pagos.**

### Dónde vive cada archivo

| Archivo | Dónde va | ¿Se sube a la web? |
|---|---|---|
| WAV / AIFF master | **Payhip** (lo subes como producto) | **NO** — nunca al sitio |
| MP3 de preview (30 s) | `public/audio/` | Sí |
| Portada `.jpg` | `public/covers/` | Sí |

> Si metes WAVs en `public/` revientas el repo y el deploy. Los WAV solo viven en Payhip.

## ★ La fuente de verdad del catálogo es `src/data/seed.js`

Esto es lo más importante de toda esta fase y es fácil de confundirse:

```js
// dataAdapter.js — si el visitante no tiene nada guardado, carga el SEED del bundle
let list = localAdapter.kvGet("shop:products", null);
if(!list) list = SEED.map(...);
```

- **Los visitantes** reciben el catálogo embebido en el JS → **`seed.js`**.
- **El admin** escribe en `localStorage` → solo afecta **a tu navegador**.
- Por tanto: **lo que cambies en el admin NO llega a la tienda pública.**

### 🎛 El admin: existe **solo en local**

- El enlace de Admin está **oculto** en la web pública.
- Además la ruta `#/admin` **redirige a la tienda en todo dominio que no sea
  `localhost`** (`LOCAL_ADM` en `src/admin.js`). Es decir: **el admin no existe
  en producción**, ni siquiera escribiendo la URL a mano.

Se abre en local:

```bash
npm run dev
# → http://localhost:5173/#/admin
```

Desde ahí se cambian **covers, audios, precios, licencias, links de Payhip, BPM,
estado (draft/published/hidden)** y se **añaden beats nuevos** — todo lo del
formulario de 6 fieldsets.

### 📤 Botón `Export to project…` (dashboard)

Es lo que convierte el admin local en una publicación real. Escribe en tu carpeta
del proyecto:

| Destino | Contenido |
|---|---|
| `src/data/seed.js` | el catálogo completo, como objetos planos |
| `public/covers/` | los covers que subiste en el admin |
| `public/audio/` | los audios que subiste en el admin |

**¿Por qué saca también los ficheros?** Porque al subir un cover/audio el admin lo
guarda en **IndexedDB** con una referencia opaca `media:img-…`, y eso **solo existe
en tu navegador**. Si no lo exportaras, el visitante vería el fallback (`art()`) y
el audio demo. El export reescribe esas referencias a rutas reales:
`media:img-…` → `covers/beat-001.png`.

Pide elegir la **carpeta raíz del proyecto** (la que contiene `package.json`) y
funciona en **Chrome, Edge o Brave** (File System Access API).

> Tras exportar, `seed.js` queda como **objetos planos** (`const SEED = [ … ]`),
> sin el helper `beat(n,título,overrides)` — porque un beat creado en el admin
> puede tener un `id` que ese helper no podría regenerar. Puedes seguir tocándolo
> a mano, pero lo cómodo es **editar en el admin y reexportar**.

### Flujo completo para publicar un cambio

```bash
npm run dev                       # 1. admin local
#    → http://localhost:5173/#/admin
#    → editar beats → "Export to project…" → elegir la carpeta del proyecto
npm run build                     # 2. compila
git add .                         # 3. publica
git commit -m "update catalog"
git push                          # ← Vercel despliega solo (~40 s)
```

## Despliegue en Vercel

### 🟢 En producción

> **https://casino-eight-sepia.vercel.app**

| | |
|---|---|
| Proyecto Vercel | `casino` (equipo `alteregooffline-afk`, plan Hobby) |
| Dominio | `casino-eight-sepia.vercel.app` |
| Origen | GitHub `alteregooffline-afk/Casino` → `main` |
| Build | `npm run build` → `dist/` (fijado en `vercel.json`) |
| Estado | Ready |

La app usa **hash router** (`#/admin`), así que **no hace falta ninguna regla de rewrite**.

### Flujo de publicación

Cada `git push` a `main` despliega **solo**, en ~40 s:

```bash
git add .
git commit -m "Descripción del cambio"
git push          # ← Vercel construye y publica automáticamente
```

> Git está instalado como **MinGit portable** en
> `%LOCALAPPDATA%\Programs\Git\cmd` (añadido al PATH de usuario).
> **No** usa winget ni requiere permisos de administrador.

### Si hay que reconectar desde cero

```bash
git remote add origin https://github.com/alteregooffline-afk/Casino.git
git push -u origin main
# vercel.com → Add New… → Project → importa el repo → Deploy
```

> Vercel detecta Vite solo. Si prefieres la CLI: `npm i -g vercel` y `vercel`.

## ☑ Checklist antes de lanzar

Nada de esto está hecho todavía y **sin ello no se puede vender de verdad**:

- [ ] **Audio real**: sube MP3 de 30 s a `public/audio/` y rellena el campo `audio`
      en `seed.js`. Hoy los 6 primeros beats apuntan a ficheros que **no existen**.
- [ ] **Portadas reales**: `public/covers/beat-001.jpg` … Si faltan se dibuja un
      cover provisional con canvas (funciona, pero no es tu arte).
- [ ] **`DEMO=false`** en `src/audio/engine.js:5`. Mientras esté en `true`, si el
      MP3 no existe el sitio **sintetiza un tono de prueba** en vez de fallar.
      *Dejalo en `true` solo mientras no haya audio real.*
- [ ] **URLs de Payhip reales** en `seed.js`. Las actuales son `payhip.com/b/DEMO1`
      (falsas) y `ECLIPSE` tiene `buyUrl:null` → muestra *COMING SOON*.
- [ ] **Tu nombre artístico**: el sitio dice literalmente *"Producer Name"* en el
      `<title>`, en la meta description y en `dataAdapter.js` (defaults de ajustes).
- [ ] **`og:image` + `canonical` + `og:url`**: añadirlos cuando exista el dominio
      (toman una URL absoluta). Ya están `og:title/description/site_name/locale`
      y las tarjetas de Twitter.
- [ ] **Compra de prueba real** de principio a fin con tarjeta.
- [ ] Páginas legales: términos, privacidad, reembolsos, acuerdo de licencia.
- [x] **Enlace Admin**: oculto en la cabecera **y** bloqueado en producción
      (`#/admin` redirige a la tienda en cualquier dominio que no sea
      `localhost`). Uso real: `npm run dev` → `localhost:5173/#/admin`.

## Estado

- **🟢 ADMIN LOCAL CON EXPORTACIÓN**: el admin (`#/admin`) **solo funciona en
  `localhost`** — en producción redirige a la tienda, así que no hay panel
  público. Nuevo botón **`Export to project…`** en el dashboard: escribe
  `src/data/seed.js` + extrae los covers/audios de IndexedDB a
  `public/covers/` y `public/audio/`, reescribiendo `media:…` → rutas reales.
  Verificado: 12 beats, `JSON.parse` correcto, mapeo inverso de estado
  (`coming-soon`/`sold`/`hidden`), extracción de media (252 B escritos),
  0 errores de consola.
- **🟢 DESPLEGADO EN PRODUCCIÓN**: https://casino-eight-sepia.vercel.app
  — proyecto Vercel `casino`, rama `main`, build `npm run build` → `dist/`.
  Verificado en vivo: `lang="en"`, 11 CDs, panel, botón BUY activo, 0 errores JS.
  (Los 404 de `/covers/beat-00X.jpg` son esperados: `public/covers/` está vacío
  y la ruta ya apunta correctamente — en cuanto se suban las imágenes se ven.)
- **Fase A COMPLETADA**: `index.html` en inglés (`lang="en"`), metadatos sociales
  (OG + Twitter), enlace Admin oculto, estructura `public/covers` + `public/audio`,
  `vercel.json` configurado y documentación de despliegue. `npm run build` pasa.
- Step 1 COMPLETADO: `npm install`, `npm run build` y `npm run dev` funcionan.
- Step 2 COMPLETADO: acceso a datos aislado tras `dataAdapter` → `localAdapter`.
  Interfaz: `getBeats · getBeat · getPublishedBeats · createBeat · updateBeat ·
  deleteBeat · publishBeat · unpublishBeat · uniqueSlug · subscribe ·
  getSettings · updateSettings · getMedia · saveMedia · deleteMedia`.
- Datos locales intactos: localStorage, IndexedDB, SEED y DEMO siguen activos.
  Las claves `shop:products` y `shop:settings` no cambiaron: los datos existentes se conservan.
- **Pendiente para vender**: ver *Checklist antes de lanzar* (audio real, portadas,
  `DEMO=false`, URLs de Payhip y nombre artístico).
- Supabase NO conectado. Para conectarlo: crear `supabaseAdapter.js` con la misma
  interfaz que `localAdapter.js` y cambiar el import en `dataAdapter.js`.
  **Pendiente:** el adapter es síncrono para beats/ajustes (localStorage) y Supabase es
  asíncrono — habrá que convertir la interfaz a Promises y añadir `await` en la UI.
  Supabase **no** procesa pagos: para cobrar hace falta Payhip o igualmente Stripe.

## Referencia

`Galería de beats, etapa 4.html` es el monolito original, conservado como respaldo.
