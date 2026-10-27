// ─────────────────────────────────────────────────────────────
// Configuración de la landing — el ÚNICO lugar que hay que tocar.
// ─────────────────────────────────────────────────────────────
window.LUMIERE_CONFIG = {
  // URL del nodo Webhook de n8n (vía Cloudflare Tunnel). Si se pone "PENDING", el envío
  // se SIMULA y se muestra la página de gracias sin guardar los datos.
  // ⚠️ Es un Quick Tunnel (trycloudflare.com): la URL CAMBIA cada vez que se reinicia
  // cloudflared → actualizarla aquí y volver a publicar, o pasar a un tunnel con dominio propio.
  WEBHOOK_URL: "PENDING",

  // Número de contacto (llamadas y WhatsApp). Será el número de Twilio del portafolio.
  // 480-555-0142 es un número reservado para ficción en EEUU: se ve real, pero no
  // pertenece a nadie. Cámbialo por el número real antes de producción.
  PHONE_E164: "+14805550142",

  // Cómo se muestra el número en pantalla.
  PHONE_DISPLAY: "(480) 555-0142",

  // Canal del consentimiento que se guarda con cada lead ("whatsapp" o "sms").
  // El texto de la casilla (form.consent en i18n.js) debe hablar del mismo canal.
  CONSENT_CANAL: "whatsapp",

  // Tiempo máximo de espera del webhook antes de mostrar error (ms).
  REQUEST_TIMEOUT_MS: 12000,
};
