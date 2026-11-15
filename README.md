# Videollamada-LG-app

Estoy desarrollando una aplicación de videollamada privada entre un televisor LG 50UP7750PSB con webOS 6.x y un celular Android.

La TV tiene una webcam USB XSQUL Gaming XW100 con micrófono integrado. La cámara funciona correctamente con las aplicaciones Selfie Cam y Fun Mirror, pero todavía no conseguimos abrirla desde el navegador web integrado.

El proyecto utiliza PeerJS 1.5.2 y está publicado en:

GitHub: https://github.com/sergiomolina-fotografia/Videollamada-LG-app

Netlify: https://lg-tv-video-call.netlify.app

El televisor tiene acceso root por SSH en 192.168.18.88.

Investigaciones realizadas:

- Existe /dev/video0.
- El dispositivo también aparece dentro de /var/palm/jail/com.webos.app.browser/dev/.
- El dispositivo pertenece al grupo video (GID 44).
- El usuario wam pertenece al grupo video.
- Los procesos WebAppMgr también tienen ese grupo.
- Localizamos el appinfo.json del navegador en el jail.
- El navegador es com.webos.app.browser, versión 6.5.10.
- No encontramos permisos explícitos de cámara en ese manifiesto.

Todavía no sabemos si Chromium 79 puede abrir la cámara mediante navigator.mediaDevices.getUserMedia().

El siguiente paso es analizar un documento PDF de 51 páginas que contiene los resultados del comando:

find /usr/palm/applications -type f -name appinfo.json 2>/dev/null

Necesitamos localizar los manifiestos de Selfie Cam y Fun Mirror y compararlos con el navegador.

Después queremos crear una página HTTPS mínima para probar getUserMedia() sin PeerJS. Si funciona, continuaremos con WebRTC y evaluaremos la configuración de un servidor TURN.

IMPORTANTE: No modificar kernel, rootfs, tvservice ni permisos del sistema sin evidencia concreta. Queremos resolverlo paso a paso y conservar el funcionamiento del televisor.

https://webrtc.github.io/samples/src/content/getusermedia/gum/?utm_source=chatgpt.com
