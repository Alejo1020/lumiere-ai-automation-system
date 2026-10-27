// Live-mode feed (P36e - Lumière Office Feed). Updated by the deploy script with the current tunnel URL.
// Feed del modo en vivo (P36e). Lo actualiza el script de publicación con la URL actual del tunnel.
// It can also be overridden with ?feed=<url> / también se puede cambiar con ?feed=<url>
window.OFFICE_CONFIG = {
  feedUrl: 'http://localhost:5678/webhook/lumiere-office-feed',
  pollMs: 4000
};
