# LG Video Call (webOS + WebRTC)

Aplicación de videollamadas y conferencias privadas **WebRTC / PeerJS** diseñada para televisores **LG webOS** y compatible con navegadores de **celulares y PC**.

La aplicación permite conectarse mediante códigos de sala de 6 caracteres sin cuentas ni registros previos, soportando desde llamadas 1-a-1 hasta **conferencias grupales en malla P2P de hasta 4 participantes simultáneos** con cuadrícula adaptable y mezcla de audio.

---

## Estado actual del proyecto

La aplicación (`com.sergio.lgvideocall`, v1.0.0) ya cuenta con toda la lógica de comunicación WebRTC/PeerJS implementada en `index.html`, empaquetada en `.ipk` e instalada/verificada en televisor LG con webOS 6.x (`LG 50UP7750PSB`).

### Capacidades implementadas en `index.html`

- **Identificación por código de sala:** Generación automática de un código de 6 caracteres alfanuméricos al iniciar.
- **Conferencia multi-participante (Fase 1 · Malla P2P hasta 4 personas):**
  - El límite `MAX_PARTICIPANTS = 4` protege la fluidez del decodificador de video del SoC ARMv7 del televisor.
  - Si entra una nueva llamada durante una conversación activa, aparece el diálogo modal **"Nuevo participante"** indicando el código del solicitante y la ocupación de la sala (p. ej. `3/4`).
  - Mediante canales de datos (`DataConnection` con mensajes `PEER_LIST`), los participantes descubren al resto del grupo y establecen automáticamente conexiones WebRTC directas en malla (`metadata: { mesh: true }`) con desempate determinista y `offerToReceiveAudio: true` / `offerToReceiveVideo: true`.
- **Cuadrícula dinámica y ajuste geométrico (`#video-grid` + `fitCellVideo`):**
  - **1 remoto:** pantalla completa (`100% × 100%`).
  - **2 remotos:** división `50% × 100%` en pantallas horizontales (TV/PC) o apilado `100% × 50%` en celulares verticales.
  - **3 remotos:** 2 superiores (`50% × 50%`) + 1 inferior (`100% × 50%`).
  - **4 remotos:** cuadrícula `2 × 2` (`50% × 50%` cada celda).
  - Cálculo explícito de escala por celda (`fitCellVideo`) para mantener proporciones originales al rotar celulares entre vertical y horizontal sin compresión ni distorsión en webOS.
- **Audio y alertas en TV y móviles:**
  - **Timbre entrante sintetizado** con Web Audio API.
  - **Pool HTML5 `<audio>` (`remote-audio-0..2`)** pre-inicializado y desbloqueado al interactuar con la app (`Atender`, `Llamar`, clic, toque o teclas del control remoto). En webOS `Chrome/79.0.3945.79` (WAM), `<video>` puede omitir el audio WebRTC y `AudioContext.createMediaStreamSource()` sobre streams remotos devuelve silencio sin un elemento `<audio>` activo; el pool `<audio>` resuelve la reproducción simultánea de múltiples participantes en el TV.
  - En móviles y PC (`!isTV`), el elemento `<video>` remoto se silencia (`muted = true`) mientras el `<audio>` del pool reproduce el audio al 100%, evitando eco doble.
- **Captura de cámara y micrófono tolerante a fallos (`media()`):**
  - **En celulares y PC (`!isTV`):** solicita `{video: true, audio: true}` juntos para conservar cancelación de eco (AEC) por hardware y sincronización A/V, con respaldo automático a `{video: true, audio: false}` si no hay micrófono disponible.
  - **En TV LG (`isTV`):** solicita primero solo video y luego intenta audio con timeout, de modo que la incompatibilidad del micrófono USB no bloquee la transmisión de la webcam.
- **Control remoto webOS y accesibilidad:** Navegación con flechas, `Enter`/`OK`, `Escape` para colgar, y controles de cámara, micrófono, pantalla completa y finalización.

---

## Dependencias y servicios externos

Aunque la aplicación funciona directamente sin montar infraestructura propia en esta etapa, depende de los siguientes componentes:

### 1. Biblioteca PeerJS 1.5.2 (local en `index.html`)
- **`index.html` (aplicación principal y `.ipk`):** Ya **no depende de un CDN en tiempo de ejecución**. Carga PeerJS 1.5.2 localmente desde `./Assets/js/peerjs.min.js` (descargada originalmente desde `cdnjs.cloudflare.com` y adaptada eliminando el operador de encadenamiento opcional `?.` para compatibilidad con el motor JavaScript de webOS 6 y el minificador `terser` de `ares-package`).
- *Nota sobre archivos alternativos del repositorio:* Los borradores históricos `index_Claude.html` y `Videollamada TV.html` todavía conservan `<script src="https://cdnjs.cloudflare.com/ajax/libs/peerjs/1.5.2/peerjs.min.js"></script>` desde CDN, pero **no** forman parte de la app activa definida en `appinfo.json`.

### 2. Servidor de señalización (PeerServer Cloud público)
En `index.html`, la instancia `Peer` se conecta por HTTPS/WSS al servidor público oficial de PeerJS:
- **Host:** `0.peerjs.com` (`port: 443`, `path: '/'`, `secure: true`)
- **Función:** Registrar códigos de sala de 6 caracteres y transportar ofertas/respuestas SDP e ICE candidates para iniciar llamadas y canales `DataConnection`.
- **Consideración:** Al ser un servidor público compartido, su disponibilidad, límites de uso y latencia dependen de un tercero. Si falla o se satura, ninguna sala puede registrarse hasta restaurarse o migrarse a un `peerjs-server` propio.

### 3. Servidores ICE públicos (STUN y TURN)
La configuración `iceServers` en `index.html` utiliza:
- **Servidores STUN públicos (descubrimiento de IP/NAT):**
  - `stun:stun.l.google.com:19302`
  - `stun:stun1.l.google.com:19302`
  - `stun:stun.cloudflare.com:3478`
- **Servidores TURN públicos (relay para redes con NAT estricto o datos móviles 4G/5G):**
  - `turn:eu-0.turn.peerjs.com:3478` y `turn:us-0.turn.peerjs.com:3478` (credenciales públicas `peerjs` / `peerjsp`)
  - `turn:openrelay.metered.ca:80` y `turn:openrelay.metered.ca:443` (credenciales públicas `openrelayproject` / `openrelayproject`)
- **Consideración:** Los servidores TURN gratuitos pueden tener cuotas de ancho de banda o cambios de credenciales por parte de sus operadores. Para un entorno de producción estable conviene desplegar un servidor TURN propio (por ejemplo, `coturn`).

---

## Estructura del repositorio

- `index.html`: Aplicación principal (utilizada tanto en el paquete webOS como en navegadores web / GitHub Pages).
- `Assets/js/peerjs.min.js`: PeerJS 1.5.2 local compatible con webOS y `ares-package`.
- `Assets/`: Iconos e imágenes de referencia de la aplicación.
- `appinfo.json`: Manifiesto webOS (`id: com.sergio.lgvideocall`, `main: index.html`, `resolution: 1920x1080`, permisos `allowAudioCapture`, `allowVideoCapture`, `useCamera`, `useGraphicCamera`).
- `icon.png` (80×80 px) y `largeIcon.png` (130×130 px): Iconos oficiales requeridos para el empaquetado webOS.
- `com.sergio.lgvideocall_1.0.0_all.ipk`: Paquete `.ipk` listo para instalar en televisor LG.
- `diagnostico.html`: Página auxiliar para probar por separado `getUserMedia()` (cámara, micrófono y dispositivos detectados).
- `server.js`: Servidor HTTP auxiliar en Node.js (puerto `8765`), heredado de pruebas tempranas en entorno local.
- `index_Claude.html` y `Videollamada TV.html`: Variantes/borradores previos de referencia.

---

## Entorno de hardware comprobado en TV

- **Televisor:** LG `50UP7750PSB` (webOS 6.x, ARMv7, kernel Linux `4.4.84-723.kcl4tv.20`)
- **Motor web en app instalada (`WebAppManager`):** `Chrome/79.0.3945.79` (User-Agent observado vía DevTools; en navegador web del TV informa `Chrome/87.0.3945.79`)
- **Webcam USB probada:** *XSQUL Gaming XW100* (`uvcvideo` / `/dev/video0`):
  - **Video:** Funcional y fluido desde la app webOS hacia clientes externos.
  - **Micrófono USB integrado:** Confirmada incompatibilidad de captura de audio USB a nivel kernel/ALSA en este televisor. La aplicación continúa en modo video unidireccional desde el TV mientras recibe y reproduce con normalidad el audio de los demás participantes.

---

## Empaquetado e instalación en webOS

Para generar nuevamente el paquete `.ipk`:

```bash
ares-package -e ".git*" -e "*.ps1" -e "README.md" .
```

Para lanzar en el televisor configurado (por ejemplo dispositivo `mitv` en webOS CLI):

```bash
ares-install -d mitv com.sergio.lgvideocall_1.0.0_all.ipk
ares-launch -d mitv com.sergio.lgvideocall
```

*(En TVs donde `Dropbear` limita múltiples canales `exec` en una misma sesión SSH durante `ares-install`, puede transferirse el `.ipk` a `/media/developer/temp/` por SFTP e instalar con `luna-send-pub -i luna://com.webos.appInstallService/dev/install`.)*

---

## Contexto histórico resumido y próximos pasos

- **Antecedente resuelto (noviembre de 2026):** Las pruebas iniciales del proyecto evaluaron un prototipo previo (`com.sergio.cambridge`) que arrojaba error `DRM -302` al lanzarse y separaba la captura en servidor Node.js. Ese enfoque fue reemplazado creando el paquete limpio `com.sergio.lgvideocall` directamente sobre `index.html` con permisos webOS nativos de cámara/audio y solución a los fallos de CSS (`inset`, `aspect-ratio`), sintaxis JS (`?.`) y audio en Chromium de webOS.
- **Fase 2 futura (opcional):** Si se desea ampliar conferencias más allá de 4 participantes (5–9 integrantes) o eliminar la dependencia de servidores públicos, el siguiente paso recomendado es desplegar señalización y TURN propios (`peerjs-server` + `coturn`) o migrar a una arquitectura **SFU/MCU** que entregue un único stream compuesto al procesador ARMv7 del televisor.
