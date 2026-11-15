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