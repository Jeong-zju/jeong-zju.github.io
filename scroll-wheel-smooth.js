(() => {
  const reduced = matchMedia("(prefers-reduced-motion: reduce)").matches;
  if (reduced) return;

  const factor = 0.1;
  let target = window.scrollY;
  let current = target;
  let raf = null;

  const maxScroll = () => document.documentElement.scrollHeight - innerHeight;

  const tick = () => {
    current += (target - current) * factor;
    if (Math.abs(target - current) < 0.5) {
      current = target;
      window.scrollTo({ top: current, behavior: "instant" });
      raf = null;
      return;
    }
    window.scrollTo({ top: current, behavior: "instant" });
    raf = requestAnimationFrame(tick);
  };

  addEventListener(
    "wheel",
    (e) => {
      if (e.ctrlKey) return;
      e.preventDefault();
      target = Math.min(Math.max(target + e.deltaY, 0), maxScroll());
      if (!raf) raf = requestAnimationFrame(tick);
    },
    { passive: false },
  );

  let resyncTimer = null;
  addEventListener(
    "scroll",
    () => {
      if (raf) return;
      clearTimeout(resyncTimer);
      resyncTimer = setTimeout(() => {
        target = current = window.scrollY;
      }, 50);
    },
    { passive: true },
  );

  addEventListener("resize", () => {
    target = Math.min(target, maxScroll());
  });
})();
