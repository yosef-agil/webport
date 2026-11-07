(() => {
  const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const fine = window.matchMedia("(hover: hover) and (pointer: fine)").matches;
  const $ = (s, c = document) => c.querySelector(s);
  const $$ = (s, c = document) => [...c.querySelectorAll(s)];

  /* ---------- Clock (Jakarta) ---------- */
  const clock = $(".js-clock");
  const tick = () => {
    clock.textContent = new Intl.DateTimeFormat("en-GB", {
      hour: "2-digit", minute: "2-digit", timeZone: "Asia/Jakarta",
    }).format(new Date());
  };
  tick(); setInterval(tick, 10000);

  /* ---------- Text splitting ---------- */
  $$(".split").forEach((el) => {
    const text = el.textContent;
    el.textContent = "";
    [...text].forEach((ch) => {
      const s = document.createElement("span");
      s.className = "char";
      s.textContent = ch === " " ? " " : ch;
      el.appendChild(s);
    });
  });
  $$(".js-words").forEach((el) => {
    const words = el.textContent.trim().split(/\s+/);
    el.innerHTML = words.map((w) => `<span class="w">${w}</span>`).join(" ");
  });

  // If GSAP failed to load, show everything and bail out gracefully.
  if (!window.gsap) {
    document.body.classList.remove("is-loading");
    $(".loader").remove();
    $$(".w").forEach((w) => (w.style.opacity = 1));
    return;
  }

  gsap.registerPlugin(ScrollTrigger);

  /* ---------- Smooth scroll ---------- */
  let lenis;
  if (!reduce && window.Lenis) {
    lenis = new Lenis({ lerp: 0.09, smoothWheel: true });
    lenis.stop();
    lenis.on("scroll", ScrollTrigger.update);
    gsap.ticker.add((t) => lenis.raf(t * 1000));
    gsap.ticker.lagSmoothing(0);
    $$('a[href^="#"]').forEach((a) =>
      a.addEventListener("click", (e) => {
        const target = $(a.getAttribute("href"));
        if (!target) return;
        e.preventDefault();
        lenis.scrollTo(target, { duration: 1.6 });
      })
    );
  }

  /* ---------- Intro: loader → hero ---------- */
  const heroChars = $$(".hero .char");
  gsap.set(heroChars, { yPercent: 110 });
  gsap.set(".split-soft", { yPercent: 110 });
  gsap.set(".reveal-up", { y: 24, opacity: 0 });
  gsap.set(".hero__star", { scale: 0 });

  const finishLoad = () => {
    document.body.classList.remove("is-loading");
    lenis && lenis.start();
  };

  const intro = gsap.timeline({ onComplete: () => $(".loader").remove() });
  const counter = { v: 0 };
  intro
    .to(counter, {
      v: 100, duration: reduce ? 0.01 : 1.8, ease: "power2.inOut",
      onUpdate: () => {
        $(".js-count").textContent = Math.round(counter.v);
        $(".js-bar").style.width = counter.v + "%";
      },
    })
    .to(".loader", { yPercent: -100, duration: reduce ? 0.01 : 1.1, ease: "expo.inOut" }, "+=0.15")
    .add(finishLoad, "-=0.5")
    .to(heroChars, { yPercent: 0, duration: 1.2, ease: "expo.out", stagger: 0.035 }, "-=0.55")
    .to(".split-soft", { yPercent: 0, duration: 1.1, ease: "expo.out" }, "<0.2")
    .to(".hero__star", { scale: 1, duration: 1, ease: "back.out(2)" }, "<0.3")
    .to(".reveal-up", { y: 0, opacity: 1, duration: 1, ease: "power3.out", stagger: 0.08 }, "<");

  /* ---------- Hero parallax on scroll ---------- */
  gsap.to(".hero__title", {
    yPercent: 18, ease: "none",
    scrollTrigger: { trigger: ".hero", start: "top top", end: "bottom top", scrub: true },
  });

  /* ---------- About: word-by-word reveal ---------- */
  gsap.to(".about__statement .w", {
    opacity: 1, stagger: 0.1, ease: "none",
    scrollTrigger: { trigger: ".about__statement", start: "top 80%", end: "bottom 45%", scrub: true },
  });

  /* ---------- Counters ---------- */
  $$(".js-num").forEach((el) => {
    const to = +el.dataset.to;
    const o = { v: 0 };
    gsap.to(o, {
      v: to, duration: 1.8, ease: "power3.out",
      onUpdate: () => (el.textContent = Math.round(o.v)),
      scrollTrigger: { trigger: el, start: "top 90%", once: true },
    });
  });

  /* ---------- Stacked project cards ---------- */
  const cards = $$(".card");
  cards.forEach((card, i) => {
    const next = cards[i + 1];
    if (!next) return;
    gsap.fromTo($(".card__inner", card), { scale: 1, filter: "brightness(1)" }, {
      scale: 0.9, filter: "brightness(0.55)", ease: "none",
      scrollTrigger: { trigger: next, start: "top bottom", end: "top top", scrub: true },
    });
  });
  cards.forEach((card) => {
    gsap.from($(".card__title", card), {
      yPercent: 40, opacity: 0, duration: 1.2, ease: "expo.out",
      scrollTrigger: { trigger: card, start: "top 60%" },
    });
  });

  /* ---------- Index rows reveal ---------- */
  gsap.from(".row", {
    y: 40, opacity: 0, duration: 1, ease: "power3.out", stagger: 0.07,
    scrollTrigger: { trigger: ".index__list", start: "top 80%" },
  });

  /* ---------- Services reveal ---------- */
  gsap.from(".service", {
    y: 60, opacity: 0, duration: 1.1, ease: "power3.out", stagger: 0.1,
    scrollTrigger: { trigger: ".services__grid", start: "top 80%" },
  });

  /* ---------- Contact big text ---------- */
  gsap.from(".contact__big .char", {
    yPercent: 110, duration: 1.2, ease: "expo.out", stagger: 0.04,
    scrollTrigger: { trigger: ".contact__big", start: "top 85%" },
  });

  /* ---------- Marquee speeds up with scroll velocity ---------- */
  const track = $(".marquee__track");
  if (lenis && track) {
    lenis.on("scroll", ({ velocity }) => {
      const r = 1 + Math.min(Math.abs(velocity) / 6, 4);
      track.getAnimations().forEach((a) => (a.playbackRate = r));
    });
  }

  if (!fine) return;

  /* ---------- Custom cursor ---------- */
  const cursor = $(".cursor");
  const dot = $(".cursor-dot");
  const label = $(".cursor__label");
  const cx = gsap.quickTo(cursor, "x", { duration: 0.5, ease: "power3" });
  const cy = gsap.quickTo(cursor, "y", { duration: 0.5, ease: "power3" });
  const dx = gsap.quickTo(dot, "x", { duration: 0.08 });
  const dy = gsap.quickTo(dot, "y", { duration: 0.08 });
  window.addEventListener("pointermove", (e) => {
    cx(e.clientX); cy(e.clientY); dx(e.clientX); dy(e.clientY);
  });
  $$("[data-cursor]").forEach((el) => {
    el.addEventListener("mouseenter", () => {
      label.textContent = el.dataset.cursor;
      cursor.classList.add("is-view");
    });
    el.addEventListener("mouseleave", () => cursor.classList.remove("is-view"));
  });
  $$(".link, .nav__logo, .hero__scroll").forEach((el) => {
    el.addEventListener("mouseenter", () => cursor.classList.add("is-link"));
    el.addEventListener("mouseleave", () => cursor.classList.remove("is-link"));
  });

  /* ---------- Magnetic elements ---------- */
  $$(".magnetic, .hero__scroll, .nav__links a").forEach((el) => {
    const mx = gsap.quickTo(el, "x", { duration: 0.6, ease: "elastic.out(1, 0.4)" });
    const my = gsap.quickTo(el, "y", { duration: 0.6, ease: "elastic.out(1, 0.4)" });
    el.addEventListener("mousemove", (e) => {
      const r = el.getBoundingClientRect();
      mx((e.clientX - r.left - r.width / 2) * 0.35);
      my((e.clientY - r.top - r.height / 2) * 0.35);
    });
    el.addEventListener("mouseleave", () => { mx(0); my(0); });
  });

  /* ---------- Index hover preview ---------- */
  const preview = $(".preview");
  const inner = $(".preview__inner");
  const px = gsap.quickTo(preview, "x", { duration: 0.6, ease: "power3" });
  const py = gsap.quickTo(preview, "y", { duration: 0.6, ease: "power3" });
  const pr = gsap.quickTo(preview, "rotation", { duration: 0.6, ease: "power3" });
  let lastX = 0;
  const list = $(".index__list");
  list.addEventListener("pointermove", (e) => {
    px(e.clientX); py(e.clientY);
    pr(gsap.utils.clamp(-12, 12, (e.clientX - lastX) * 0.6));
    lastX = e.clientX;
  });
  $$(".row").forEach((row) => {
    row.addEventListener("mouseenter", () => {
      const tpl = $("#tpl-" + row.dataset.cover);
      inner.innerHTML = "";
      inner.appendChild(tpl.content.cloneNode(true));
      gsap.fromTo(inner.firstElementChild, { scale: 1.3 }, { scale: 1, duration: 0.8, ease: "expo.out" });
      label.textContent = "View";
      cursor.classList.add("is-view");
    });
    row.addEventListener("mouseleave", () => cursor.classList.remove("is-view"));
  });
  list.addEventListener("mouseenter", (e) => {
    gsap.set(preview, { x: e.clientX, y: e.clientY });
    lastX = e.clientX;
    gsap.to(preview, { scale: 1, duration: 0.6, ease: "expo.out" });
  });
  list.addEventListener("mouseleave", () => gsap.to(preview, { scale: 0, duration: 0.5, ease: "expo.out" }));
})();
