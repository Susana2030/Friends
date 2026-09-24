# Friends · Interacciones Premium

Sitio estático con HTML, CSS3 y JavaScript vanilla. No necesita paquetes, CDN ni compilación.
Abrí `index.html` o serví esta carpeta con un servidor HTTP estático. Por HTTP, la navegación
interna conserva la reproducción de la intro entre páginas.

## Módulos

- `js/audioManager.js`: Web Audio API, efectos sintetizados y control en la tarjeta inferior. Los efectos
  empiezan silenciados y guardan su preferencia en `friends.sound.enabled`. La intro musical
  mantiene su botón independiente. El contexto se activa mediante un gesto del usuario.
- `js/visualEffects.js`: reveal con Intersection Observer y tilt sutil en escritorio.
  El cursor es nativo; no se crean overlays ni rastros. Solo se solicita un frame al mover
  el mouse sobre una tarjeta. Se respeta la preferencia de movimiento reducido.
- `js/quiz.js`: respuesta visual y sonora, resultado, reinicio y risas desde el 75% de aciertos.
- `js/contacto.js`: validación local, check de éxito, risas y cierre del modal a los 5 segundos.
  No se envían datos a un servidor.
- `js/gallery.js`: lightbox nativo con Escape, flechas y recuperación del foco.
- `js/main.js`: selector único de temporadas, desplazamiento bajo el navbar y año del footer.
  Cada temporada conserva un título, un resumen breve de hasta dos líneas y una imagen.
- `js/audio.js`: reproducción de la intro desde la tarjeta inferior y guardado del progreso cada cinco segundos.
- `js/script.js`: menú y navegación; desmonta eventos, observadores y temporizadores al salir.
- `css/estilos.css`: degradado crema/lavanda, grilla de personajes, navbar animada y reproductor integrado al layout.
- `img/stickers/`: ilustraciones SVG locales: paraguas de colores, puerta, taxi, taza, y langosta.

Las seis páginas ya cargan los módulos en el orden necesario. `data.js` crea el espacio
`Friends`; `script.js` debe cargarse al final.

Para disparar un efecto desde una interacción adicional:

```js
Friends.audioManager?.play('cup');
```

Efectos disponibles: `hover`, `click`, `cup`, `door`, `success`, `error` y `laugh`.
`play()` respeta el silencio y nunca inicia audio automáticamente.

## Verificación

Con Node.js, sin instalar dependencias:

```sh
node --test tests/premium.test.cjs tests/delivery.test.cjs
```

Las pruebas simulan APIs del navegador para comprobar lógica, umbrales y limpieza de recursos.
La apariencia, la percepción de los sonidos y la fluidez se verifican en un navegador real.

## Entrega

El logo de Central Perk y Book a Table abren `contacto.html#formulario`. Los controles de audio permanecen dentro del layout, sin superponerse al contenido. Las diez temporadas conservan sus enlaces de YouTube.

Las ilustraciones tienen tilt en escritorio sin interceptar clics; se desactiva en dispositivos táctiles y con movimiento reducido. El formulario es una demostración local, sin servidor de reservas. Los créditos de las fotografías se conservan en `img/creditos.json`.

Revisión visual recomendada antes de entregar: seis páginas a 320, 375, 768, 1024 y 1440 px, menú móvil, teclado, galer?a ampliada y zoom del navegador al 200%. Las pruebas automatizadas verifican la lógica; no certifican 60 FPS ni sustituyen esta revisión visual.
