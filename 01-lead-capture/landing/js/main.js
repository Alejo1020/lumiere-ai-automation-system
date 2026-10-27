(function () {
  "use strict";

  const CONFIG = window.LUMIERE_CONFIG;
  const I18N = window.LUMIERE_I18N;
  const LANG_KEY = "lumiere-lang";

  let lang = detectLang();

  // ── Idioma ────────────────────────────────────────────
  function detectLang() {
    try {
      const saved = localStorage.getItem(LANG_KEY);
      if (saved && I18N[saved]) return saved;
    } catch (e) { /* storage bloqueado: seguimos sin él */ }
    return (navigator.language || "en").toLowerCase().startsWith("es") ? "es" : "en";
  }

  function t(key) {
    return (I18N[lang] && I18N[lang][key]) || I18N.en[key] || key;
  }

  function applyLang(next) {
    lang = next;
    document.documentElement.lang = lang;
    document.title = t("meta.title");

    document.querySelectorAll("[data-i18n]").forEach((el) => { el.textContent = t(el.dataset.i18n); });
    document.querySelectorAll("[data-i18n-html]").forEach((el) => { el.innerHTML = t(el.dataset.i18nHtml); });
    document.querySelectorAll("[data-i18n-aria]").forEach((el) => { el.setAttribute("aria-label", t(el.dataset.i18nAria)); });
    document.querySelectorAll("[data-i18n-alt]").forEach((el) => { el.alt = t(el.dataset.i18nAlt); });
    document.querySelectorAll(".lang-switch button").forEach((b) => {
      b.setAttribute("aria-pressed", String(b.dataset.lang === lang));
    });

    // Re-traduce los errores visibles
    document.querySelectorAll(".field-error[data-err-key]").forEach((el) => { el.textContent = t(el.dataset.errKey); });

    updatePhoneLinks();
    try { localStorage.setItem(LANG_KEY, lang); } catch (e) { /* sin storage */ }
  }

  // ── Teléfono (llamar / WhatsApp) ──────────────────────
  // El número vive en config.js (será el número de Twilio).
  function updatePhoneLinks() {
    document.querySelectorAll(".js-phone-tel").forEach((a) => { a.href = "tel:" + CONFIG.PHONE_E164; });
    document.querySelectorAll(".js-phone-wa").forEach((a) => { a.href = "https://wa.me/" + CONFIG.PHONE_E164.replace(/\D/g, ""); });
    document.querySelectorAll(".js-phone-display").forEach((el) => { el.textContent = CONFIG.PHONE_DISPLAY; });
  }

  // ── Formulario ────────────────────────────────────────
  const form = document.getElementById("lead-form");
  const submitBtn = document.getElementById("submit-btn");
  const stateError = document.getElementById("state-error");

  // Sin webhook configurado se SIMULA el envío y se lleva a la página de gracias.
  // OJO: mientras esté en "PENDING" los datos no se guardan en ningún lado.
  // En localhost, ?simular=error muestra el estado de error.
  const webhookPending = !CONFIG.WEBHOOK_URL || CONFIG.WEBHOOK_URL === "PENDING";
  const THANK_YOU_URL = "thank-you.html";
  const isLocal = ["localhost", "127.0.0.1", "[::1]"].includes(location.hostname);

  const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

  const rules = {
    nombre: (v) => (!v ? "err.required" : v.trim().split(/\s+/).length < 2 || v.trim().length < 4 ? "err.name" : null),
    telefono: (v) => (!v ? "err.required" : v.replace(/\D/g, "").length < 10 || /[^\d\s()+.-]/.test(v) ? "err.phone" : null),
    email: (v) => (v && !EMAIL_RE.test(v) ? "err.email" : null),
    servicio: (v) => (!v ? "err.service" : null),
    consent: (v) => (v ? null : "err.consent"),
  };

  function getData() {
    const fd = new FormData(form);
    return {
      nombre: (fd.get("nombre") || "").trim(),
      telefono: (fd.get("telefono") || "").trim(),
      email: (fd.get("email") || "").trim().toLowerCase(),
      servicio: fd.get("servicio") || "",
      primera_vez: fd.get("primera_vez") || "",
      comentario: (fd.get("comentario") || "").trim(),
      idioma: lang,
      // Prueba del consentimiento: canal + texto exacto aceptado. Si mañana es SMS, solo cambia CONSENT_CANAL.
      consent: consentChecked(),
      consent_canal: CONFIG.CONSENT_CANAL || "whatsapp",
      consent_text: consentChecked() ? t("form.consent") : "",
    };
  }

  // La casilla se llamaba "sms_consent" antes del cambio a WhatsApp: si el navegador trae un HTML
  // viejo en caché junto con este JS, el formulario igual funciona.
  function consentChecked() {
    const el = form.elements.consent || form.elements.sms_consent;
    return Boolean(el && el.checked);
  }

  function setError(name, key) {
    const errEl = form.querySelector('[data-error-for="' + name + '"]');
    if (!errEl) return;
    const field = errEl.closest(".field");
    form.querySelectorAll('[name="' + name + '"]').forEach((el) => {
      if (key) el.setAttribute("aria-invalid", "true"); else el.removeAttribute("aria-invalid");
    });
    if (key) {
      errEl.dataset.errKey = key;
      errEl.textContent = t(key);
      field.classList.add("has-error");
    } else {
      delete errEl.dataset.errKey;
      errEl.textContent = "";
      field.classList.remove("has-error");
    }
  }

  function validate(data) {
    let firstInvalid = null;
    Object.keys(rules).forEach((name) => {
      const key = rules[name](data[name]);
      setError(name, key);
      if (key && !firstInvalid) firstInvalid = name;
    });
    return firstInvalid;
  }

  // Limpia el error de un campo apenas se corrige
  form.addEventListener("input", (e) => {
    const name = e.target.name;
    if (!rules[name]) return;
    const errEl = form.querySelector('[data-error-for="' + name + '"]');
    if (errEl && errEl.dataset.errKey && !rules[name](getData()[name])) setError(name, null);
  });

  form.addEventListener("focusout", (e) => {
    const name = e.target.name;
    if (!rules[name] || e.target.type === "radio") return;
    const value = getData()[name];
    if (value) setError(name, rules[name](value));
  });

  // Scroll suave con respaldo: si el navegador no lo anima, salta directo
  function scrollToEl(el) {
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const startY = window.scrollY;
    el.scrollIntoView({ behavior: reduce ? "instant" : "smooth", block: "start" });
    setTimeout(() => {
      if (Math.abs(window.scrollY - startY) < 2 && Math.abs(el.getBoundingClientRect().top) > 120) {
        el.scrollIntoView({ behavior: "instant", block: "start" });
      }
    }, 700);
  }

  // ── Formulario en 2 pasos ─────────────────────────────
  // Paso 1: elegir tratamiento (un toque). Paso 2: nombre + WhatsApp + consentimiento (+ opcionales).
  const steps = form.querySelectorAll(".form-step");
  const chosenName = document.getElementById("chosen-name");

  function goStep(n, { focus = true } = {}) {
    steps.forEach((el) => { el.hidden = el.dataset.step !== String(n); });
    if (!focus) return;
    const target = n === 1 ? form.querySelector('input[name="servicio"]:checked') || form.querySelector('input[name="servicio"]') : form.elements.nombre;
    target.focus({ preventScroll: true });
    // Que el formulario quede a la vista (en móvil el paso 2 es otra "pantalla")
    const card = form.closest(".form-card");
    const top = card.getBoundingClientRect().top;
    if (top < 0 || top > window.innerHeight * 0.4) scrollToEl(card);
  }

  function pickService(value, { delay = 0 } = {}) {
    const radio = [...form.querySelectorAll('input[name="servicio"]')].find((r) => r.value === value);
    if (!radio) return;
    radio.checked = true;
    chosenName.dataset.i18n = radio.dataset.nameKey;   // se re-traduce si cambian el idioma
    chosenName.textContent = t(radio.dataset.nameKey);
    setError("servicio", null);
    setTimeout(() => goStep(2), delay);
  }

  form.addEventListener("change", (e) => {
    if (e.target.name === "servicio") pickService(e.target.value, { delay: 250 });
  });
  document.getElementById("step-back").addEventListener("click", () => goStep(1));

  function setLoading(on) {
    submitBtn.classList.toggle("is-loading", on);
    submitBtn.disabled = on;
    submitBtn.querySelector(".btn-label").textContent = t(on ? "form.sending" : "form.submit");
  }

  function show(state) {
    const states = { error: stateError };
    form.hidden = state !== "form";
    Object.keys(states).forEach((k) => { states[k].hidden = k !== state; });
    if (states[state]) states[state].focus();
  }

  async function sendLead(payload) {
    const url = CONFIG.WEBHOOK_URL;

    // Modo prueba local mientras no exista el webhook de n8n.
    if (webhookPending) {
      console.info("[Lumière] WEBHOOK_URL pendiente — payload que se enviaría:", payload);
      await new Promise((r) => setTimeout(r, 1200));
      if (isLocal && new URLSearchParams(location.search).get("simular") === "error") throw new Error("simulated");
      return;
    }

    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), CONFIG.REQUEST_TIMEOUT_MS);
    try {
      const res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
        signal: ctrl.signal,
      });
      if (!res.ok) throw new Error("HTTP " + res.status);
    } finally {
      clearTimeout(timer);
    }
  }

  async function submit() {
    const data = getData();
    const invalid = validate(data);
    if (invalid === "servicio") { goStep(1); return; }
    if (invalid) {
      form.querySelector('[name="' + invalid + '"]').focus();
      return;
    }

    // Honeypot lleno = bot: fingimos éxito y no enviamos nada
    if (form.elements.website.value) { goThankYou(); return; }

    setLoading(true);
    try {
      await sendLead(data);
      try { sessionStorage.setItem("lumiere-lead-name", data.nombre.split(/\s+/)[0]); } catch (e) { /* sin storage */ }
      goThankYou();
    } catch (err) {
      console.warn("[Lumière] Error enviando el lead:", err);
      show("error");
    } finally {
      setLoading(false);
    }
  }

  function goThankYou() { window.location.href = THANK_YOU_URL; }

  form.addEventListener("submit", (e) => { e.preventDefault(); submit(); });

  document.getElementById("retry-btn").addEventListener("click", () => {
    show("form");
    submit();
  });

  // ── UI general ────────────────────────────────────────
  // Enlaces internos (#contact, #faq…): bajan a la sección sin dejar el #ancla
  // en la URL, para que al recargar o compartir el link se entre desde arriba.
  document.addEventListener("click", (e) => {
    const a = e.target.closest('a[href^="#"]');
    if (!a || a.getAttribute("href") === "#") return;
    const target = document.querySelector(a.getAttribute("href"));
    if (!target) return;
    e.preventDefault();
    // "Agendar este tratamiento": elige el servicio y lleva directo al paso 2 (goStep hace el scroll)
    if (a.dataset.pick) {
      show("form");
      pickService(a.dataset.pick);
      return;
    }
    scrollToEl(target);
    if (!target.hasAttribute("tabindex")) target.setAttribute("tabindex", "-1");
    target.focus({ preventScroll: true });
  });

  document.querySelectorAll(".lang-switch button").forEach((b) => {
    b.addEventListener("click", () => applyLang(b.dataset.lang));
  });

  const header = document.querySelector(".site-header");
  const onScroll = () => header.classList.toggle("is-scrolled", window.scrollY > 8);
  window.addEventListener("scroll", onScroll, { passive: true });
  onScroll();

  // Aparición suave de secciones
  const revealEls = document.querySelectorAll(".reveal");
  if ("IntersectionObserver" in window) {
    const io = new IntersectionObserver((entries) => {
      entries.forEach((en) => {
        if (en.isIntersecting) { en.target.classList.add("is-visible"); io.unobserve(en.target); }
      });
    }, { rootMargin: "0px 0px -8% 0px", threshold: 0.08 });
    revealEls.forEach((el) => io.observe(el));
  } else {
    revealEls.forEach((el) => el.classList.add("is-visible"));
  }

  const sticky = document.getElementById("sticky-cta");
  if (sticky && "IntersectionObserver" in window) {
    let pastHero = false;
    let atContact = false;
    const sync = () => {
      const on = pastHero && !atContact;
      sticky.classList.toggle("is-visible", on);
      sticky.setAttribute("aria-hidden", String(!on));
      sticky.querySelectorAll("a").forEach((a) => { a.tabIndex = on ? 0 : -1; });
      // Escritorio: el CTA flotante sigue la misma regla que la barra fija móvil
      const float = document.getElementById("cta-float");
      if (float) { float.classList.toggle("is-visible", on); float.tabIndex = on ? 0 : -1; }
    };
    new IntersectionObserver(([en]) => {
      pastHero = !en.isIntersecting && en.boundingClientRect.top < 0;
      sync();
    }).observe(document.querySelector(".hero-ctas"));
    new IntersectionObserver(([en]) => { atContact = en.isIntersecting; sync(); }, { threshold: 0.05 })
      .observe(document.getElementById("contact"));
  }

  // Video de la franja: solo escritorio, sin "reducir movimiento" ni ahorro de datos.
  // Se carga al acercarse y se pausa fuera de pantalla. En móvil queda el póster.
  const film = document.querySelector(".film-video");
  const canPlayVideo =
    window.matchMedia("(min-width: 900px)").matches &&
    !window.matchMedia("(prefers-reduced-motion: reduce)").matches &&
    !(navigator.connection && navigator.connection.saveData);
  if (film && canPlayVideo && "IntersectionObserver" in window) {
    new IntersectionObserver(([en]) => {
      if (en.isIntersecting) {
        if (!film.src) film.src = film.dataset.src;
        film.play().catch(() => { /* autoplay bloqueado: queda el póster */ });
      } else if (film.src) {
        film.pause();
      }
    }, { rootMargin: "200px 0px" }).observe(film);
  }

  // Capa inmersiva: GSAP solo se DESCARGA en escritorio grande, con mouse y sin "reducir movimiento".
  // En celular y tablet no se baja ni un byte de esto.
  const wantsImmersive =
    window.matchMedia("(min-width: 1024px) and (pointer: fine)").matches &&
    !window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  if (wantsImmersive) {
    const loadInOrder = (list) => {
      if (!list.length) return;
      const s = document.createElement("script");
      s.src = list[0];
      s.onload = () => loadInOrder(list.slice(1));
      document.body.appendChild(s);
    };
    loadInOrder(["js/vendor/gsap.min.js", "js/vendor/ScrollTrigger.min.js", "js/immersive.js"]);
  }

  document.getElementById("year").textContent = new Date().getFullYear();

  applyLang(lang);
})();
