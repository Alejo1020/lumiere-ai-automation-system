// ─────────────────────────────────────────────────────────────
// Capa inmersiva de ESCRITORIO (GSAP + ScrollTrigger).
// Solo la carga main.js en pantallas ≥1024px, con mouse y sin "reducir movimiento".
// Regla: acompaña el camino al formulario, nunca lo estorba. Máximo 2 secciones fijadas.
// El formulario (#contact) NO se anima.
// ─────────────────────────────────────────────────────────────
(function () {
  "use strict";
  if (!window.gsap || !window.ScrollTrigger) return;
  gsap.registerPlugin(ScrollTrigger);

  const root = document.documentElement;
  const mm = gsap.matchMedia();
  const ease = "power3.out";

  // Lo que anima GSAP deja de usar la animación CSS .reveal (si no, pelean por el transform)
  function takeOver(els) {
    els.forEach((el) => { el.classList.remove("reveal"); el.classList.add("is-visible"); });
    return els;
  }
  const $$ = (sel, ctx = document) => Array.from(ctx.querySelectorAll(sel));

  mm.add("(min-width: 1024px) and (pointer: fine) and (prefers-reduced-motion: no-preference)", () => {
    root.classList.add("is-immersive");

    // ── 1. Hero: el titular entra línea por línea; el retrato hace un zoom lento con el scroll
    const heroCopy = document.querySelector(".hero-copy");
    const heroVisual = document.querySelector(".hero-visual");
    takeOver([heroCopy, heroVisual]);
    const lines = $$(".hero h1 > span, .hero h1 > em");
    gsap.timeline({ defaults: { ease } })
      .from(".hero .eyebrow", { y: 16, opacity: 0, duration: 0.6 })
      .from(lines, { yPercent: 60, opacity: 0, duration: 0.9, stagger: 0.12 }, "-=0.3")
      .from([".hero .lead", ".hero-offer", ".hero-ctas", ".hero-rating"], { y: 16, opacity: 0, duration: 0.6, stagger: 0.08 }, "-=0.5")
      .from(heroVisual, { opacity: 0, duration: 1.1 }, 0.2);
    gsap.fromTo(".hero-media img", { scale: 1.12 }, {
      scale: 1, yPercent: -4, ease: "none",
      scrollTrigger: { trigger: ".hero", start: "top top", end: "bottom top", scrub: true },
    });

    // ── 2. Trust bar: las cifras cuentan hacia arriba (una sola vez)
    $$(".trust-item strong").forEach((el) => {
      const original = el.textContent;
      const m = original.match(/^([\d.]+)(.*)$/);
      if (!m) return;
      const target = parseFloat(m[1]);
      const decimals = (m[1].split(".")[1] || "").length;
      const counter = { v: 0 };
      gsap.to(counter, {
        v: target, duration: 1.6, ease: "power2.out",
        scrollTrigger: { trigger: el, start: "top 90%", once: true },
        onUpdate: () => { el.textContent = counter.v.toFixed(decimals) + m[2]; },
        onComplete: () => { el.textContent = original; },
      });
    });

    // OJO: los pins se crean en el MISMO orden en que aparecen en la página;
    // si no, ScrollTrigger calcula mal el espacio que agrega cada uno y se pisan.
    // ── 3. PIN 1 · Servicios: galería horizontal tipo revista
    const services = document.querySelector("#services");
    const track = document.querySelector(".services-grid");
    if (services && track) {
      takeOver($$("#services .reveal"));
      const progress = document.createElement("div");
      progress.className = "services-progress";
      progress.innerHTML = '<span class="services-progress-bar"></span>';
      track.after(progress);
      const distance = () => Math.max(0, track.scrollWidth - track.clientWidth);
      gsap.to(track, {
        x: () => -distance(), ease: "none",
        scrollTrigger: {
          trigger: services, start: "top top+=80", end: () => "+=" + distance(),
          pin: true, scrub: 1, anticipatePin: 1, invalidateOnRefresh: true,
          onUpdate: (st) => gsap.set(".services-progress-bar", { scaleX: st.progress }),
        },
      });
    }

    // ── 4. PIN 2 · Filosofía: el video se "abre" hasta llenar su marco y aparece la frase
    const film = document.querySelector(".film");
    if (film) {
      takeOver($$(".film .reveal"));
      gsap.timeline({
        scrollTrigger: { trigger: film, start: "top top+=80", end: "+=70%", pin: true, scrub: 1, anticipatePin: 1 },
      })
        .fromTo(".film-video", { clipPath: "inset(14% 22% 14% 22%)", scale: 1.08 }, { clipPath: "inset(0% 0% 0% 0%)", scale: 1, ease: "none" })
        .from(".film-caption", { y: 40, opacity: 0, ease: "none" }, 0.45);
    }

    // ── 5. El espacio: las dos fotos se mueven a velocidades distintas (profundidad)
    takeOver($$(".editorial .reveal"));
    const sideImg = document.querySelector(".ed-side > img");
    if (sideImg && !sideImg.parentElement.classList.contains("ed-img-wrap")) {
      const wrap = document.createElement("div");
      wrap.className = "ed-img-wrap";
      sideImg.before(wrap); wrap.appendChild(sideImg);
    }
    const edTrigger = { trigger: ".editorial", start: "top bottom", end: "bottom top", scrub: true };
    gsap.fromTo(".ed-main img", { yPercent: -6, scale: 1.14 }, { yPercent: 6, scale: 1.14, ease: "none", scrollTrigger: edTrigger });
    gsap.fromTo(".ed-img-wrap img", { yPercent: 9, scale: 1.18 }, { yPercent: -9, scale: 1.18, ease: "none", scrollTrigger: { ...edTrigger } });

    // ── 6. Testimonios: las citas aparecen una tras otra
    const reviews = takeOver($$(".review"));
    gsap.from(reviews, { y: 24, opacity: 0, duration: 0.7, ease, stagger: 0.12, scrollTrigger: { trigger: ".reviews-grid", start: "top 80%", once: true } });

    // ── 7. Qué esperar: una línea dorada "dibuja" el recorrido y los pasos aparecen
    const expectList = document.querySelector(".expect-list");
    if (expectList) {
      const line = document.createElement("span");
      line.className = "expect-line";
      expectList.prepend(line);
      const steps = takeOver($$(".expect-list li"));
      const tl = gsap.timeline({ scrollTrigger: { trigger: expectList, start: "top 75%", once: true } });
      tl.fromTo(line, { scaleX: 0 }, { scaleX: 1, duration: 1.2, ease: "power2.inOut" })
        .from(steps, { y: 20, opacity: 0, duration: 0.6, ease, stagger: 0.15 }, 0.2);
    }

    // Titulares de sección: entrada suave (excepto el del formulario, que no se toca)
    $$(".section-head").filter((h) => !h.closest("#contact, #services, .film")).forEach((head) => {
      takeOver([head]);
      gsap.from(head.children, { y: 16, opacity: 0, duration: 0.7, ease, stagger: 0.08, scrollTrigger: { trigger: head, start: "top 85%", once: true } });
    });

    ScrollTrigger.sort();
    ScrollTrigger.refresh();

    // Recalcular cuando terminen de cargar fuentes e imágenes (cambian alturas)
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(() => ScrollTrigger.refresh());
    window.addEventListener("load", () => ScrollTrigger.refresh(), { once: true });

    return () => {
      root.classList.remove("is-immersive");
      document.querySelectorAll(".services-progress, .expect-line").forEach((el) => el.remove());
    };
  });
})();
