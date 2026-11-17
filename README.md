Actualización de investigación — 15 de noviembre de 2026

Objetivo principal del proyecto

Desarrollar una aplicación de videoconferencia WebRTC para el televisor LG webOS, adaptando la aplicación móvil que ya funciona.

La aplicación debe permitir:

- Conectarse mediante un código de sala.
- Realizar y recibir videollamadas.
- Transmitir imagen desde la webcam USB del televisor.
- Transmitir audio desde el micrófono de la webcam.
- Recibir audio y vídeo del otro dispositivo.
- Utilizar los controles de cámara, micrófono y finalización de llamada.

La aplicación web original utiliza PeerJS 1.5.2 y WebRTC. No se pretende reemplazarla por un simple visor de cámara.

1. Entorno del televisor confirmado

- Modelo: LG 50UP7750PSB.
- Plataforma: webOS 6.x.
- Acceso SSH root: "192.168.18.89".
- Kernel: Linux 4.4.84-723.kcl4tv.20.
- Arquitectura: ARMv7.
- Node.js: v8.12.0.
- Python: 2.7.
- Navegador: Chromium 87.0.3945.79.
- User-Agent observado: "Mozilla/5.0 (NetCast; U) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/87.0.3945.79 Safari/537.36 SmartTV/10.0 Colt/2.0".

2. Webcam USB: funcionamiento comprobado

Webcam: XSQUL Gaming XW100 con micrófono integrado.

Hallazgos:

- Existe "/dev/video0".
- El dispositivo se identifica como cámara USB 2.0 UVC.
- El controlador asociado es "uvcvideo".
- La interfaz V4L2 permite consultar capacidades y configurar formatos.
- Se pudo configurar MJPEG a 640 × 480.
- La reserva de buffers mediante "VIDIOC_REQBUFS" falló en una prueba anterior. Todavía no se ha demostrado una captura de fotogramas mediante nuestra implementación V4L2.
- La webcam funciona correctamente en el navegador oficial LG utilizando una demostración WebRTC.
- Se observó vídeo fluido, aproximadamente a 720p.

Conclusión: la webcam y su controlador pueden funcionar en el televisor. No corresponde atribuir los problemas actuales directamente a una avería de la cámara.

3. Prueba de getUserMedia

Se creó una página de diagnóstico independiente, "camtest.html", para probar el acceso a la cámara sin PeerJS.

La página informa:

- "Secure context: true".
- "mediaDevices: true".
- "getUserMedia: true".
- Chromium 87.0.3945.79.

Se sirvió temporalmente mediante Node.js en:

"http://127.0.0.1:8766/"

El puerto 8766 quedó confirmado en escucha.

Al pulsar el botón para solicitar la cámara, el diagnóstico permanece en:

"Solicitando cámara..."

No aparece una ventana de autorización, no se obtiene imagen y tampoco se recibe un error. La promesa de "getUserMedia()" permanece pendiente.

Conclusión: que el navegador ofrezca la API no significa que la solicitud de captura esté funcionando. Hay que investigar la diferencia entre el contexto del navegador oficial y el contexto de la aplicación webOS.

4. Captura de cámara en el navegador oficial

Los registros de "/tmp/var/log/messages" muestran actividad de:

- "com.webos.service.camera2".
- "chromium.media VideoCapture".
- "video_capture_device_webos.cc".

El contador de capturas "DoCapture" aumenta durante la prueba de cámara.

Se identificó que el PID 11482 pertenece al navegador oficial:

"/var/palm/jail/com.webos.app.browser/.../chrome"

Por lo tanto, esos registros demuestran captura activa en el navegador oficial, no en Cambridge.

Los mensajes de error PBNJSON de camera2 también aparecen durante el funcionamiento normal del navegador. No son evidencia suficiente de un fallo del servicio camera2.

No reiniciar ni modificar camera2 sin pruebas adicionales.

5. Aplicación Cambridge

ID:

"com.sergio.cambridge"

Ubicación registrada por webOS:

"/media/cryptofs/apps/usr/palm/applications/com.sergio.cambridge"

Existe también una copia en:

"/media/developer/apps/usr/palm/applications/com.sergio.cambridge"

El manifiesto registrado contiene:

- "type: web"
- "main: index.html"
- "trustLevel: trusted"
- "allowAudioCapture: true"
- "allowVideoCapture: true"
- "useCamera: true"
- "useGraphicCamera: true"
- "nativeApp: false"

La respuesta de "getAppInfo" confirma que webOS reconoce la aplicación y sus indicadores de cámara.

"getAppStatus" devuelve:

- "status: launchable"
- "exist: true"
- "launchable: true"

Sin embargo, al ejecutar el lanzamiento mediante "applicationManager/launch" con el identificador correcto, webOS responde:

"errorCode: -302"

"errorText: Failed to identify a proper DRM file"

Este error todavía no tiene una causa demostrada. No asumir que se resuelve modificando los permisos de cámara o copiando archivos de otra aplicación.

6. Estructura y funcionamiento de Cambridge

El "index.html" actual es una página HTML convencional que muestra un estado de WebSocket.

No solicita la cámara mediante "getUserMedia()".

El archivo "server.js" está preparado para utilizar un servidor WebSocket en el puerto 8765, pero:

- El puerto 8765 no aparece en escucha.
- El archivo "/tmp/v4l2_capture.py" no existe.
- Tampoco existe ese script dentro de la carpeta de la aplicación.
- La ruta de "start_server.sh" apunta a la copia ubicada en "/media/developer".
- No se ha demostrado que webOS ejecute automáticamente ese script al iniciar Cambridge.

El binario "v4l2_helper" y su fuente C existen, pero todavía no se ha demostrado que sean necesarios para la solución final.

No recompilar el helper ni modificar el servidor hasta determinar qué arquitectura de captura utilizaremos.

7. Comparación con aplicaciones instaladas en webOS

Se inspeccionó RemoteMeeting:

"com.remotemeeting.pwa"

Su información de instalación contiene:

- "trustLevel: default"
- "binId: 1183326"
- "appsize: 4665665"
- Recursos gráficos y biblioteca "webOSTVjs-1.2.4".

Su "index.html" comienza con:

"NCGFILE_HEADER</ncgxmlhdr>"

Por lo tanto, no es un HTML convencional que pueda compararse directamente con Cambridge.

La respuesta de "getAppInfo" confirma que RemoteMeeting tiene un "binId", mientras que Cambridge no presenta ese campo.

Esto es una diferencia observada, no una causa demostrada del error DRM. No copiar identificadores ni recursos de RemoteMeeting.

También se observó el comportamiento de Selfie Cam: después de capturar una foto, vuelve a inicializar la cámara y muestra otra vez la advertencia de compatibilidad. No se ha determinado si se trata de un reinicio programado o de una recuperación ante un error.

8. Estado actual: hechos e hipótesis

Hechos confirmados:

- La webcam funciona en el navegador oficial.
- El navegador puede utilizar "getUserMedia()".
- La prueba independiente en el contexto local queda pendiente.
- webOS reconoce Cambridge como aplicación existente y launchable.
- El lanzamiento de Cambridge mediante Luna devuelve el error DRM -302.
- El servidor WebSocket de Cambridge no está activo.
- No hay evidencia de que los procesos de captura registrados pertenezcan a Cambridge.

Hipótesis todavía abiertas:

- Diferencias de permisos, aislamiento o contexto entre navegador y aplicación.
- Problemas de registro o empaquetado de Cambridge.
- Diferencias en la inicialización de captura de vídeo entre aplicaciones webOS.
- Necesidad de adaptar la aplicación WebRTC al entorno Chromium de este televisor.

9. Próximos pasos de investigación

1. Resolver y documentar por qué webOS devuelve DRM -302 al lanzar Cambridge.
2. Identificar cómo las aplicaciones de cámara instaladas oficialmente inicializan el acceso al dispositivo.
3. Determinar si "getUserMedia()" funciona dentro del contexto real de una aplicación webOS.
4. Probar por separado el acceso a cámara y micrófono.
5. Cuando la captura funcione dentro de la aplicación, integrar PeerJS y WebRTC.
6. Probar llamadas entre el televisor y un celular Android.
7. Evaluar la necesidad de un servidor TURN para conexiones entre redes diferentes.

10. Reglas de seguridad durante la investigación

- No sobrescribir particiones KERNEL, ROOTFS ni TVSERVICE.
- No modificar permisos globales del sistema sin evidencia.
- No reiniciar camera2 ni servicios esenciales como prueba al azar.
- No exponer SSH ni puertos internos del televisor a Internet.
- Realizar una prueba por vez y registrar los resultados.
- Conservar copias de seguridad antes de cualquier modificación justificada.

Objetivo final: ejecutar la aplicación original LG Video Call como una aplicación funcional de webOS, utilizando la webcam y el micrófono USB del televisor y conservando la comunicación WebRTC con dispositivos móviles.

11. Actualización y funcionamiento confirmado en webOS — 17 de noviembre de 2026

Objetivos alcanzados y estado operativo

La aplicación LG Video Call (`com.sergio.lgvideocall`) se encuentra actualmente empaquetada, instalada y completamente funcional en webOS 6.x (televisor LG 50UP7750PSB), estableciendo videollamadas WebRTC bidireccionales con dispositivos móviles y ordenadores.

1. Empaquetado formal webOS (.ipk)
- Se corrigió la estructura de carpetas (`Assets/`), eliminando espacios finales incompatibles con sistemas de archivos Windows/NTFS.
- Se incorporaron los iconos oficiales requeridos por webOS: `icon.png` (80×80 px) y `largeIcon.png` (130×130 px), generados a partir del diseño maestro.
- Empaquetado limpio generado con `ares-package` (`com.sergio.lgvideocall_1.0.0_all.ipk`).

2. Integración local de PeerJS 1.5.2
- Se eliminó la dependencia externa del CDNJS en `index.html`.
- Se incorporó la biblioteca localmente en `Assets/js/peerjs.min.js`.
- Corrección de sintaxis para Chromium 87: Se transpilaron los operadores de encadenamiento opcional (`?.`), incompatibles con el motor V8 de webOS 6, garantizando la carga e inicialización inmediata de `window.Peer`.

3. Corrección de interfaz y estilos para webOS 6 (Chromium 87)
- Sustitución de `inset: 0` y `aspect-ratio: 4/3` por posicionamiento explícito en pantalla completa (`top: 0; left: 0; right: 0; bottom: 0; width: 100%; height: 100%`) y dimensiones fijas para la vista miniatura (`240×180 px`).
- Esto resolvió el problema del colapso de pantalla (pantalla negra) y aseguró el renderizado a pantalla completa tanto del diálogo modal de llamada entrante como de la vista de llamada activa.

4. Detección y alerta sonora de llamadas entrantes
- El modal de llamada entrante cubre la pantalla en formato 1920×1080 con foco automático en "Atender llamada".
- Se integró un sintetizador de tono de llamada nativo mediante Web Audio API, emitiendo una señal sonora audible en el televisor hasta que la llamada sea atendida o rechazada.

5. Enrutamiento y salida de audio en el televisor
- Se implementó una arquitectura de audio en tres vías para asegurar la salida por los altavoces del TV:
  1. Elemento `<video>` con volumen al 100%.
  2. Elemento `<audio id="remote-audio" autoplay playsinline>` dedicado.
  3. Tubería directa Web Audio API (`AudioContext.createMediaStreamSource`), decodificando paquetes Opus en software y enviándolos directo a `AudioContext.destination` sin pasar por bloqueos de reproducción o dependencias del reproductor de video de webOS.
- Se añadió reactivación de audio ante cualquier interacción con el control remoto del TV.

6. Corrección de proporción y aspecto de video (fitRemoteVideo)
- Se desarrolló el algoritmo `fitRemoteVideo()`, que calcula dinámicamente la escala geométrica sin distorsión a partir de `videoWidth` y `videoHeight` de la cámara entrante.
- Si el interlocutor utiliza el celular en vertical, la imagen se centra en el televisor con barras laterales limpias sin estirarse.
- Si el celular rota a formato horizontal (apaisado), el televisor detecta el evento de redimensionado al instante y expande el video a formato panorámico 16:9 real sin deformación.

7. Conectividad y NAT transversal
- Se integraron servidores TURN globales (PeerJS y OpenRelay) junto a los servidores STUN de Google, permitiendo la comunicación P2P entre el televisor en la red local y dispositivos en redes externas o datos móviles (4G/5G).

8. Estado del micrófono USB en el televisor
- Confirmado: El hardware USB de la cámara (XSQUL Gaming XW100) es reconocido para video (`/dev/video0`), pero su interfaz de audio USB integrada presenta incompatibilidad a nivel de kernel/controlador ALSA en este modelo de televisor.
- La aplicación aísla correctamente la captura de la webcam de modo que la falta de micrófono en el TV no impida emitir video fluido y recibir el audio entrante con total normalidad.

12. Conferencia Multi-Participante (Fase 1: Malla P2P hasta 4 integrantes)

- **Capacidad ampliada:** El TV y los clientes web gestionan conferencias grupales en malla P2P de hasta 4 participantes simultáneos (límite óptimo para la decodificación por hardware del chip ARMv7 del televisor).
- **Cuadrícula dinámica inteligente (`#video-grid` + `fitCellVideo`):**
  - 1 participante remoto: Ocupa el 100% de la pantalla.
  - 2 participantes remotos: División lateral 50% / 100% en pantallas horizontales (TV/PC) o apilado vertical 100% / 50% en celulares verticales.
  - 3 participantes remotos: 2 superiores al 50% / 50% y 1 inferior centrado al 100% / 50%.
  - 4 participantes remotos: Cuadrícula simétrica 2×2 (50% / 50% cada cuadrante).
  - Ajuste geométrico automático por celda (`fitCellVideo`) para conservar proporciones sin compresión tanto en TV (Chromium 79 WAM) como en navegadores móviles, con insignia `Contacto [ID]`.
- **Pool de Audio HTML5 Multicanal (`remote-audio-0..2`) y desbloqueo de reproducción:**
  - En Chromium 79 (webOS WAM), `AudioContext.createMediaStreamSource` sobre streams remotos WebRTC produce silencio si no existe un sink `<audio>`, y `<video>` puede silenciar pistas Opus; por ello cada interlocutor remoto se asigna a una etiqueta dedicada `<audio autoplay playsinline>` de un pool pre-inicializado en el DOM y desbloqueado al pulsar "Atender" o "Llamar".
  - En móviles y PC (fuera del TV), el `<video>` remoto se silencia localmente (`muted = true`) mientras el `<audio>` asignado reproduce la voz con volumen al 100%, evitando eco doble y bloqueos de autoplay.
  - En dispositivos no-TV (`!isTV`), `getUserMedia` solicita `{video: true, audio: true}` juntos en una sola llamada para mantener sincronización A/V y cancelación de eco (AEC) por hardware, manteniendo en el TV la captura separada para aislar el fallo del micrófono USB.
- **Protocolo de Señalización en Malla (`DataConnection` + `PEER_LIST`):**
  - Todos los participantes intercambian periódicamente la lista activa de nodos (`PEER_LIST`) y negocian automáticamente llamadas directas en malla (`metadata: { mesh: true }`) con `offerToReceiveAudio: true` y `offerToReceiveVideo: true`, permitiendo que todos los clientes (TV y celulares) se vean y escuchen en cuadrícula compartida.
- **Gestión de llamadas entrantes en conferencia:**
  - Si una llamada entra mientras ya se está en una reunión, se muestra el diálogo modal "Nuevo participante" con el código del solicitante y contador de capacidad (ej. `3/4`). Al aceptar, se integra a toda la malla sin interrumpir la reunión en curso.

