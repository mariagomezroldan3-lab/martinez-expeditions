/* ==========================================================
   OVINI EXPEDITIONS — main.js (recreación)
   Vanilla JS · sin dependencias
   ========================================================== */
(function () {
  "use strict";

  function safe(fn, name) {
    try { fn(); } catch (e) {
      if (window.console && console.warn) console.warn("[OVINI] init falló:", name, e);
    }
  }

  /* ---------- Header al hacer scroll ---------- */
  function initHeader() {
    var header = document.getElementById("header");
    if (!header) return;
    var update = function () {
      header.classList.toggle("is-scrolled", window.scrollY > 40);
    };
    window.addEventListener("scroll", update, { passive: true });
    update();
  }

  /* ---------- Menú móvil ---------- */
  function initBurger() {
    var burger = document.getElementById("burger");
    var nav = document.getElementById("nav");
    if (!burger || !nav) return;
    burger.addEventListener("click", function () {
      var open = nav.classList.toggle("is-open");
      burger.classList.toggle("is-open", open);
      burger.setAttribute("aria-expanded", open ? "true" : "false");
    });
    nav.addEventListener("click", function (e) {
      if (e.target.tagName === "A") {
        nav.classList.remove("is-open");
        burger.classList.remove("is-open");
        burger.setAttribute("aria-expanded", "false");
      }
    });
  }

  /* ---------- Reveal on scroll ---------- */
  function initReveals() {
    var items = document.querySelectorAll(".reveal");
    if (!items.length) return;

    var showAll = function () {
      for (var i = 0; i < items.length; i++) items[i].classList.add("is-visible");
    };

    if (!("IntersectionObserver" in window)) { showAll(); return; }

    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add("is-visible");
          io.unobserve(entry.target);
        }
      });
    }, { threshold: 0.03, rootMargin: "0px 0px -5% 0px" });

    items.forEach(function (el) { io.observe(el); });

    setTimeout(showAll, 6000);
  }

  /* ---------- Idioma (ES / EN) ---------- */
  function initI18n() {
    var dict = window.OVINI_I18N;
    var switcher = document.getElementById("langSwitch");
    if (!dict) return;

    var apply = function (lang) {
      var table = dict[lang] || dict.es;
      document.querySelectorAll("[data-i18n]").forEach(function (el) {
        var key = el.getAttribute("data-i18n");
        if (table[key] !== undefined) el.innerHTML = table[key];
      });
      document.querySelectorAll("[data-i18n-placeholder]").forEach(function (el) {
        var key = el.getAttribute("data-i18n-placeholder");
        if (table[key] !== undefined) el.setAttribute("placeholder", table[key]);
      });
      document.querySelectorAll("[data-lang-block]").forEach(function (el) {
        el.hidden = el.getAttribute("data-lang-block") !== lang;
      });
      document.documentElement.setAttribute("lang", lang);
      if (switcher) {
        switcher.querySelectorAll("[data-lang]").forEach(function (btn) {
          btn.classList.toggle("is-active", btn.getAttribute("data-lang") === lang);
        });
      }
      try { localStorage.setItem("ovini-lang", lang); } catch (e) {}
    };

    var saved = null;
    try { saved = localStorage.getItem("ovini-lang"); } catch (e) {}
    apply(saved === "en" ? "en" : "es");

    if (switcher) {
      switcher.querySelectorAll("[data-lang]").forEach(function (btn) {
        btn.addEventListener("click", function () {
          apply(btn.getAttribute("data-lang"));
        });
      });
    }
  }

  /* ---------- Texto recortado con "Leer más" ---------- */
  function initClampText() {
    var LIMIT = 150;
    var blocks = document.querySelectorAll(".clamp-text");
    if (!blocks.length) return;

    blocks.forEach(function (block) {
      var content = block.querySelector(".clamp-text__content");
      var btn = block.querySelector(".read-more");
      if (!content || !btn) return;
      var full = content.textContent.trim();
      if (full.length <= LIMIT) { btn.hidden = true; return; }
      var short = full.slice(0, LIMIT).replace(/\s+\S*$/, "") + "…";
      content.textContent = short;

      btn.addEventListener("click", function () {
        var expanded = block.classList.toggle("is-expanded");
        content.textContent = expanded ? full : short;
        btn.textContent = expanded ? (btn.getAttribute("data-less") || "Leer menos") : (btn.getAttribute("data-more") || "Leer más");
      });
    });
  }

  /* ---------- Texto con degradado + "Leer más" (equipo) ---------- */
  function initFadeText() {
    var blocks = document.querySelectorAll(".fade-text");
    if (!blocks.length) return;
    var labels = { es: ["Leer más…", "Leer menos"], en: ["Read more…", "Read less"] };
    var refresh = function () {
      var lang = document.documentElement.getAttribute("lang") === "en" ? "en" : "es";
      blocks.forEach(function (block) {
        var btn = block.querySelector(".read-more");
        if (btn) btn.textContent = labels[lang][block.classList.contains("is-expanded") ? 1 : 0];
      });
    };
    blocks.forEach(function (block) {
      var btn = block.querySelector(".read-more");
      if (!btn) return;
      btn.addEventListener("click", function () {
        block.classList.toggle("is-expanded");
        refresh();
      });
    });
    var langSwitch = document.getElementById("langSwitch");
    if (langSwitch) langSwitch.addEventListener("click", refresh);
    refresh();
  }

  /* ---------- Selector de país (expediciones) ---------- */
  function initExpFilter() {
    var wrap = document.getElementById("expFilter");
    var btn = document.getElementById("expFilterBtn");
    var label = document.getElementById("expFilterLabel");
    var menu = document.getElementById("expFilterMenu");
    var cards = document.querySelectorAll("#expGrid .exp-card");
    if (!wrap || !btn || !menu || !cards.length) return;

    var currentLang = function () {
      return (document.documentElement.getAttribute("lang") === "en") ? "en" : "es";
    };

    var countries = [];
    var seen = {};
    cards.forEach(function (card) {
      var slug = card.getAttribute("data-country");
      if (!slug || seen[slug]) return;
      seen[slug] = true;
      var esEl = card.querySelector(".exp-card__country[data-lang-block='es']");
      var plainEl = card.querySelector(".exp-card__country:not([data-lang-block])");
      var enEl = card.querySelector(".exp-card__country[data-lang-block='en']");
      countries.push({
        slug: slug,
        es: esEl ? esEl.textContent : (plainEl ? plainEl.textContent : slug),
        en: enEl ? enEl.textContent : (plainEl ? plainEl.textContent : slug)
      });
    });

    var applyFilter = function (slug) {
      var visibleIndex = 0;
      cards.forEach(function (card) {
        card.hidden = slug && card.getAttribute("data-country") !== slug;
        if (!card.hidden) {
          card.classList.toggle("is-flipped", visibleIndex % 2 === 1);
          visibleIndex++;
        }
      });
    };

    var selected = countries[0];
    var nameOf = function (c) { return currentLang() === "en" ? c.en : c.es; };
    var select = function (c) {
      selected = c;
      applyFilter(c.slug);
      label.textContent = nameOf(c);
    };

    label.removeAttribute("data-i18n");
    select(selected);

    var buildMenu = function () {
      menu.innerHTML = "";
      countries.forEach(function (c) {
        var item = document.createElement("a");
        item.href = "#";
        item.textContent = nameOf(c);
        if (c === selected) item.className = "is-active";
        item.addEventListener("click", function (e) {
          e.preventDefault();
          select(c);
          closeMenu();
          window.scrollTo({ top: wrap.getBoundingClientRect().top + window.scrollY - 120, behavior: "smooth" });
        });
        menu.appendChild(item);
      });
    };

    var langSwitch = document.getElementById("langSwitch");
    if (langSwitch) {
      langSwitch.addEventListener("click", function () {
        label.textContent = nameOf(selected);
        if (!menu.hidden) buildMenu();
      });
    }

    var openMenu = function () {
      buildMenu();
      menu.hidden = false;
      btn.setAttribute("aria-expanded", "true");
      wrap.classList.add("is-open");
    };
    var closeMenu = function () {
      menu.hidden = true;
      btn.setAttribute("aria-expanded", "false");
      wrap.classList.remove("is-open");
    };

    btn.addEventListener("click", function (e) {
      e.stopPropagation();
      if (menu.hidden) { openMenu(); } else { closeMenu(); }
    });
    document.addEventListener("click", function (e) {
      if (!wrap.contains(e.target)) closeMenu();
    });
    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape") closeMenu();
    });
  }

  /* ---------- Acordeón de FAQ ---------- */
  function initFaqAccordion() {
    var items = document.querySelectorAll(".faq-item");
    if (!items.length) return;

    items.forEach(function (item) {
      var q = item.querySelector(".faq-item__q");
      var a = item.querySelector(".faq-item__a");
      if (!q || !a) return;

      q.addEventListener("click", function () {
        var isOpen = item.classList.contains("is-open");

        items.forEach(function (other) {
          other.classList.remove("is-open");
          var otherA = other.querySelector(".faq-item__a");
          if (otherA) otherA.style.maxHeight = null;
        });

        if (!isOpen) {
          item.classList.add("is-open");
          a.style.maxHeight = a.scrollHeight + "px";
        }
      });
    });

    document.querySelectorAll(".faq-item.is-open .faq-item__a").forEach(function (a) {
      a.style.maxHeight = a.scrollHeight + "px";
    });
  }

  /* ---------- Galería de fotos (inicio) ---------- */
  function initGallery() {
    var main = document.getElementById("galleryMain");
    var thumbs = document.querySelectorAll("#galleryThumbs .gallery__thumb");
    if (!main || !thumbs.length) return;
    thumbs.forEach(function (thumb) {
      thumb.addEventListener("click", function () {
        var img = thumb.querySelector("img");
        if (img) main.src = img.src;
        thumbs.forEach(function (t) { t.classList.toggle("is-active", t === thumb); });
      });
    });
  }

  /* ---------- Hero slider (fondo rotativo) ---------- */
  function initHeroSlider() {
    var slides = document.querySelectorAll("#heroSlides .hero__slide");
    var dots = document.querySelectorAll("#heroDots .hero__dot");
    if (!slides.length) return;

    var current = 0;
    var timer = null;

    var show = function (i) {
      current = (i + slides.length) % slides.length;
      slides.forEach(function (s, idx) { s.classList.toggle("is-active", idx === current); });
      dots.forEach(function (d, idx) { d.classList.toggle("is-active", idx === current); });
    };

    var next = function () { show(current + 1); };

    var restart = function () {
      if (timer) clearInterval(timer);
      timer = setInterval(next, 5500);
    };

    dots.forEach(function (dot, idx) {
      dot.addEventListener("click", function () {
        show(idx);
        restart();
      });
    });

    restart();
  }

  /* ---------- Arranque ---------- */
  function boot() {
    safe(initHeader, "header");
    safe(initBurger, "burger");
    safe(initReveals, "reveals");
    safe(initI18n, "i18n");
    safe(initClampText, "clampText");
    safe(initFadeText, "fadeText");
    safe(initExpFilter, "expFilter");
    safe(initFaqAccordion, "faqAccordion");
    safe(initHeroSlider, "heroSlider");
    safe(initGallery, "gallery");
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", boot);
  } else {
    boot();
  }
})();
