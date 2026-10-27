# Captura de leads: landing + registro del lead (Lumière Aesthetics)

[🇬🇧 English](README.md) | 🇪🇸 Español

> Parte 1 del sistema **Lumière Aesthetics**: un med spa ficticio en Old Town Scottsdale, Arizona, construido como si fuera un cliente que paga. Esta parte captura el lead; la parte 2 le escribe por WhatsApp (o SMS) en segundos.
>
> 💬 **WhatsApp o SMS:** la demo corre por WhatsApp, pero todos los mensajes salen por un solo bloque de envío compartido, así que el mismo sistema funciona por SMS (Twilio) sin cambiar la lógica.

**En vivo:** https://lumiere-aesthetics.pages.dev

![Landing en escritorio](../docs/screenshots/landing-desktop.png)

---

## Problema

- **Los leads se pierden entre el formulario y el seguimiento.** Un formulario que llega a un correo espera a que alguien lo revise, y un lead de las 9 p. m. amanece frío.
- **Duplicados y datos sucios.** La misma persona llena el formulario dos veces, el teléfono llega en cinco formatos y nadie sabe cuál fila es la buena.
- **Sin registro de consentimiento.** Escribirle a un lead por WhatsApp o SMS en EE. UU. exige prueba de lo que aceptó y cuándo.

## Solución

Una landing premium, bilingüe (EN/ES) y pensada primero para el celular, en Cloudflare Pages, y un workflow de n8n que valida cada lead y lo guarda en un solo lugar.

```
Formulario de la landing (2 pasos: servicio → nombre + WhatsApp)
  └─ POST → Lead Webhook (CORS: solo el dominio de la landing)
       → Validate Lead (campos obligatorios, teléfono → E.164, texto y canal del consentimiento)
       → ¿Es válido?
           ├─ sí → responde 200 de una
           │        → Find Existing Lead (pestaña Leads, por número de WhatsApp)
           │        → ¿Ya existía?
           │            ├─ sí → actualiza la misma fila (envíos +1, historial de tratamientos) + avisa al equipo
           │            └─ no → agrega una fila nueva (Sheets API values:append, atómico)
           └─ no → responde 400 con la lista de errores

Error Workflow (monitor compartido) → correo + WhatsApp en palabras simples a la dueña, con límite
```

- **Una fila por número de teléfono.** Si el lead vuelve, se actualiza su fila en vez de crear otra.
- **Consentimiento guardado con cada lead**: el texto exacto que aceptó, en su idioma, el canal y la fecha.
- **Campo honeypot** contra bots; el formulario solo pide nombre, WhatsApp y servicio (correo y comentario son opcionales).
- La landing es estática (HTML/CSS/JS, sin framework). Toda la configuración está en un archivo, `landing/js/config.js`; con `WEBHOOK_URL: "PENDING"` el formulario simula el envío.

## Resultado de negocio

Probado en producción:

| Prueba | Resultado |
|---|---|
| Lead real desde el formulario | Fila nueva en `Leads` con prueba de consentimiento |
| La misma persona vuelve a enviar | Misma fila, `envíos = 2`, historial actualizado, aviso al equipo |
| Datos inválidos | 400 con la lista de errores, no se guarda nada |
| 5 leads en el mismo segundo | 5 filas, ninguna perdida |
| Optimización para celular | La página pasó de 16,9 a 7,4 pantallas; el formulario pasó de la pantalla 13,6 a la 1,6 |

## Cómo se vende esto

- **Pitch:** "Cada lead que llena tu formulario queda guardado en segundos, sin duplicados y con la prueba de consentimiento que necesitas para escribirle, y tu asistente le escribe de una."
- **Cliente objetivo:** cualquier negocio con citas que recibe leads de anuncios o de su web.
- Normalmente se vende junto con el agente de WhatsApp (parte 2), porque capturar solo no agenda a nadie.

## Stack técnico

HTML/CSS/JS · Cloudflare Pages · n8n (self-hosted, Docker) · Google Sheets API · Twilio WhatsApp (avisos al equipo)

| Archivo | Rol |
|---|---|
| `p30-lead-capture.json` | Webhook, validación, lógica de lead que vuelve, escritura en Sheets |
| `p30-error-alert.json` | Monitor de errores compartido por todos los workflows del sistema |
| `landing/` | La landing publicada (salida del build) |

Todos los IDs, números y credenciales de los JSON son placeholders (`YOUR_...`).

## Aprendizajes técnicos clave

- **El nodo `append` de Google Sheets de n8n no es seguro con ejecuciones simultáneas.** Calcula él mismo la siguiente fila, así que dos leads en el mismo segundo escriben en la misma fila (se perdieron 2 de 3 en la prueba). Solución: HTTP Request con la credencial de Google a `values:append` con `INSERT_ROWS`, que es atómico (5 de 5).
- **CORS en el webhook.** El navegador manda un preflight por el `Content-Type: application/json`; el webhook debe permitir el origen de la landing o el POST se bloquea.
- **Versionar al publicar.** Si un visitante recibe HTML nuevo con JS viejo después de renombrar un campo, el formulario se cae. El build versiona cada script y hoja de estilos (`?v=fecha`) y el JS acepta el nombre viejo durante el cambio.
- **Responder primero, trabajar después.** El webhook responde 200 apenas valida, así que el visitante nunca espera a Google Sheets.
