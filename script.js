(() => {
  "use strict";
  const year = document.querySelector("[data-year]");
  if (year) year.textContent = new Date().getFullYear();
  const reduced = matchMedia("(prefers-reduced-motion: reduce)").matches,
    hero = document.querySelector(".hero"),
    heroText = document.querySelector("[data-hero-text]"),
    videoBox = document.querySelector(".hero-video"),
    progressLabel = document.querySelector("[data-progress]"),
    header = document.querySelector(".header"),
    brand = document.querySelector(".brand"),
    canvas = document.querySelector("#swarm-film"),
    ctx = canvas.getContext("2d"),
    agents = Array.from({ length: 30 }, (_, i) => ({
      p: i * 0.73,
      r: 0.1 + (i % 8) * 0.035,
      s: 0.00007 + (i % 5) * 0.000012,
    }));
  let w = 1,
    h = 1;
  const resize = () => {
    const r = videoBox.getBoundingClientRect(),
      d = Math.min(devicePixelRatio || 1, 1.5);
    w = r.width;
    h = r.height;
    canvas.width = w * d;
    canvas.height = h * d;
    ctx.setTransform(d, 0, 0, d, 0, 0);
  };
  new ResizeObserver(resize).observe(videoBox);
  resize();
  const draw = (t = 0) => {
    ctx.clearRect(0, 0, w, h);
    const pts = agents.map((a, i) => ({
      x: w * (0.5 + Math.cos(a.p + t * a.s) * a.r),
      y: h * (0.5 + Math.sin(a.p * 1.2 + t * a.s) * a.r * 0.8),
      i,
    }));
    for (let i = 0; i < pts.length; i++)
      for (let j = i + 1; j < pts.length; j++) {
        const d = Math.hypot(pts[i].x - pts[j].x, pts[i].y - pts[j].y);
        if (d < w * 0.14) {
          ctx.strokeStyle = `rgba(20,20,18,${(1 - d / (w * 0.14)) * 0.2})`;
          ctx.beginPath();
          ctx.moveTo(pts[i].x, pts[i].y);
          ctx.lineTo(pts[j].x, pts[j].y);
          ctx.stroke();
        }
      }
    pts.forEach((p) => {
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.i % 9 === 0 ? 5 : 2, 0, Math.PI * 2);
      ctx.fillStyle = p.i % 9 === 0 ? "#ff7e00" : "#222";
      ctx.fill();
    });
    if (!reduced) requestAnimationFrame(draw);
  };
  draw();
  const update = () => {
    if (innerWidth <= 768) {
      videoBox.style.width = "100%";
      videoBox.style.borderRadius = "24px";
      return;
    }
    const rect = hero.getBoundingClientRect(),
      travel = Math.max(1, hero.offsetHeight - innerHeight),
      p = Math.max(0, Math.min(1, -rect.top / travel)),
      ease = p * p * (3 - 2 * p),
      nav = Math.max(0, Math.min(1, p / 0.72)),
      navEase = nav * nav * (3 - 2 * nav),
      css = getComputedStyle(hero),
      base =
        hero.clientWidth -
        parseFloat(css.paddingLeft) -
        parseFloat(css.paddingRight),
      extra = innerWidth - base;
    header.style.setProperty("--collapse", navEase);
    header.style.setProperty("--split", Math.min(1, navEase * 1.35));
    heroText.style.opacity = String(1 - Math.min(1, p * 2.2));
    heroText.style.transform = `translateY(${-Math.min(1, p * 2.2) * 64}px)`;
    videoBox.style.width = `${base + extra * ease}px`;
    videoBox.style.maxWidth = "none";
    videoBox.style.borderRadius = `${24 * (1 - ease)}px`;
    brand.style.setProperty(
      "--brand-opacity",
      String(1 - Math.min(1, nav * 1.7)),
    );
    brand.style.setProperty("--brand-scale", String(1 - navEase * 0.72));
    brand.style.setProperty("--brand-pointer", nav > 0.7 ? "none" : "auto");
    header.style.setProperty("--island-width", `${50 - navEase * 40}%`);
    header.style.setProperty("--left-island-center", `${12 - navEase * 7}%`);
    header.style.setProperty("--right-island-center", `${88 + navEase * 7}%`);
    const islandPixels = header.clientWidth * (0.5 - navEase * 0.4);
    const targetGap = Math.max(7, islandPixels / 3 - 38);
    header.style.setProperty(
      "--icon-gap",
      `${22 + navEase * (targetGap - 22)}px`,
    );
    header.style.setProperty("--inner-radius", `${navEase * 16}px`);
    header.style.setProperty("--icon-opacity", String(navEase));
    header.style.setProperty("--icon-scale", String(0.72 + navEase * 0.28));
    header.style.setProperty("--icon-shift", `${-27 + navEase * 27}px`);
    header.style.setProperty("--label-opacity", String(1 - navEase));
    header.style.setProperty("--label-width", `${120 * (1 - navEase)}px`);
    if (progressLabel)
      progressLabel.textContent = `${String(Math.round(p * 24)).padStart(2, "0")} / 24`;
  };
  addEventListener("scroll", update, { passive: true });
  addEventListener("resize", update);
  update();
  const reveals = document.querySelectorAll(".reveal");
  if (reduced || !("IntersectionObserver" in window))
    reveals.forEach((x) => x.classList.add("visible"));
  else {
    const io = new IntersectionObserver(
      (entries) =>
        entries.forEach((e) => {
          if (e.isIntersecting) {
            e.target.classList.add("visible");
            io.unobserve(e.target);
          }
        }),
      { threshold: 0.13 },
    );
    reveals.forEach((x) => io.observe(x));
  }
})();
