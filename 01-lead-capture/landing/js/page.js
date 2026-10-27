// Páginas secundarias (thank-you, privacy): idioma EN/ES sin depender de main.js.
// Cada página trae sus dos versiones en bloques [data-lang-block="en|es"].
(function () {
  "use strict";
  const LANG_KEY = "lumiere-lang";

  function detectLang() {
    try {
      const saved = localStorage.getItem(LANG_KEY);
      if (saved === "en" || saved === "es") return saved;
    } catch (e) { /* storage bloqueado */ }
    return (navigator.language || "en").toLowerCase().startsWith("es") ? "es" : "en";
  }

  function applyLang(lang) {
    document.documentElement.lang = lang;
    document.querySelectorAll("[data-lang-block]").forEach((el) => { el.hidden = el.dataset.langBlock !== lang; });
    const title = document.documentElement.dataset["title" + lang.charAt(0).toUpperCase() + lang.slice(1)];
    if (title) document.title = title;
    document.querySelectorAll(".lang-switch button").forEach((b) => b.setAttribute("aria-pressed", String(b.dataset.lang === lang)));
    try { localStorage.setItem(LANG_KEY, lang); } catch (e) { /* sin storage */ }
  }

  document.querySelectorAll(".lang-switch button").forEach((b) => b.addEventListener("click", () => applyLang(b.dataset.lang)));

  // Página de gracias: saludo con el nombre (si lo guardó el formulario)
  try {
    const name = sessionStorage.getItem("lumiere-lead-name");
    if (name) document.querySelectorAll(".js-lead-name").forEach((el) => { el.textContent = ", " + name; });
  } catch (e) { /* sin storage */ }

  const year = document.getElementById("year");
  if (year) year.textContent = new Date().getFullYear();

  applyLang(detectLang());
})();
