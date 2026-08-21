(() => {
  "use strict";
  const reduced = matchMedia("(prefers-reduced-motion: reduce)").matches;
  const header = document.querySelector("[data-header]");
  const menu = document.querySelector(".menu");
  const mobile = document.querySelector(".mobile-nav");
  const root = document.documentElement;
  const clamp = (value, min, max) => Math.max(min, Math.min(max, value));
  const lerp = (a, b, amount) => a + (b - a) * amount;

  const syncHeader = () => header.classList.toggle("scrolled", scrollY > 24);
  syncHeader(); addEventListener("scroll", syncHeader, { passive: true });
  const closeMenu = () => { menu.setAttribute("aria-expanded", "false"); menu.querySelector(".sr").textContent = "Open menu"; mobile.hidden = true; document.body.classList.remove("menu-open"); };
  menu.addEventListener("click", () => { const open = menu.getAttribute("aria-expanded") === "true"; menu.setAttribute("aria-expanded", String(!open)); menu.querySelector(".sr").textContent = open ? "Open menu" : "Close menu"; mobile.hidden = open; document.body.classList.toggle("menu-open", !open); });
  mobile.querySelectorAll("a").forEach((link) => link.addEventListener("click", closeMenu));
  addEventListener("keydown", (event) => event.key === "Escape" && closeMenu());
  document.querySelector("[data-year]").textContent = new Date().getFullYear();

  const revealItems = document.querySelectorAll(".scroll-in");
  if (reduced || !("IntersectionObserver" in window)) revealItems.forEach((item) => item.classList.add("visible"));
  else { const observer = new IntersectionObserver((entries) => entries.forEach((entry) => { if (entry.isIntersecting) { entry.target.classList.add("visible"); observer.unobserve(entry.target); } }), { threshold: 0.12, rootMargin: "0px 0px -5%" }); revealItems.forEach((item) => observer.observe(item)); }

  if (!reduced && matchMedia("(pointer: fine)").matches) addEventListener("pointermove", (event) => { root.style.setProperty("--x", `${event.clientX}px`); root.style.setProperty("--y", `${event.clientY}px`); }, { passive: true });

  class RobotWorkspace {
    constructor(canvas) {
      this.canvas = canvas; this.ctx = canvas.getContext("2d", { alpha: true }); this.host = canvas.parentElement;
      this.pointer = { x: 0, y: 0 }; this.target = { x: .78, y: .46 }; this.goal = null; this.pulse = [];
      this.resize = this.resize.bind(this); this.draw = this.draw.bind(this); this.onMove = this.onMove.bind(this); this.onClick = this.onClick.bind(this);
      this.resize(); new ResizeObserver(this.resize).observe(this.host); this.host.addEventListener("pointermove", this.onMove, { passive: true }); this.host.addEventListener("click", this.onClick); requestAnimationFrame(this.draw);
    }
    resize() { const bounds = this.host.getBoundingClientRect(), dpr = Math.min(devicePixelRatio || 1, 1.7); this.width = Math.max(1, bounds.width); this.height = Math.max(1, bounds.height); this.canvas.width = this.width * dpr; this.canvas.height = this.height * dpr; this.canvas.style.width = `${this.width}px`; this.canvas.style.height = `${this.height}px`; this.ctx.setTransform(dpr, 0, 0, dpr, 0, 0); this.base = { x: this.width * .78, y: this.height * .69 }; this.arm = { one: Math.min(225, this.width * .2), two: Math.min(178, this.width * .155) }; this.pointer = { x: this.width * this.target.x, y: this.height * this.target.y }; }
    onMove(event) { const rect = this.host.getBoundingClientRect(); this.target.x = clamp((event.clientX - rect.left) / rect.width, .42, .94); this.target.y = clamp((event.clientY - rect.top) / rect.height, .18, .82); }
    onClick(event) { if (event.target.closest("a,button,nav")) return; this.goal = { ...this.target }; this.pulse.push({ ...this.goal, born: performance.now() }); const status = document.querySelector("[data-arm-status]"), announcement = document.querySelector("[data-arm-announcement]"); if (status) status.textContent = "PLAN LOCKED · EXECUTING"; if (announcement) announcement.textContent = "Target locked. Robot arm is executing a planned motion."; this.host.classList.add("plan-locked"); setTimeout(() => { if (status) status.textContent = "TRACKING TARGET"; this.host.classList.remove("plan-locked"); }, 1400); }
    solve(target) { const dx = target.x - this.base.x, dy = target.y - this.base.y, distance = Math.hypot(dx, dy), max = this.arm.one + this.arm.two - 8, min = Math.abs(this.arm.one - this.arm.two) + 8, safe = clamp(distance, min, max), angle = Math.atan2(dy, dx), reach = Math.acos(clamp((this.arm.one ** 2 + safe ** 2 - this.arm.two ** 2) / (2 * this.arm.one * safe), -1, 1)), shoulder = angle - reach, elbow = { x: this.base.x + this.arm.one * Math.cos(shoulder), y: this.base.y + this.arm.one * Math.sin(shoulder) }, end = { x: this.base.x + dx / (distance || 1) * safe, y: this.base.y + dy / (distance || 1) * safe }; return { elbow, end }; }
    drawArm(ctx, pose) { const acid = "#c8ff62", { base } = this; ctx.save(); ctx.lineCap = "round"; ctx.shadowBlur = 18; ctx.shadowColor = "rgba(200,255,98,.18)"; ctx.strokeStyle = "rgba(228,238,220,.68)"; ctx.lineWidth = 7; ctx.beginPath(); ctx.moveTo(base.x, base.y); ctx.lineTo(pose.elbow.x, pose.elbow.y); ctx.lineTo(pose.end.x, pose.end.y); ctx.stroke(); ctx.shadowBlur = 0; ctx.strokeStyle = "rgba(126,142,123,.7)"; ctx.lineWidth = 1; ctx.stroke(); [base, pose.elbow].forEach((joint, index) => { ctx.beginPath(); ctx.arc(joint.x, joint.y, index ? 12 : 18, 0, Math.PI * 2); ctx.fillStyle = "#0b0f0b"; ctx.fill(); ctx.strokeStyle = index ? acid : "rgba(225,235,218,.72)"; ctx.lineWidth = 1.5; ctx.stroke(); ctx.beginPath(); ctx.arc(joint.x, joint.y, 3, 0, Math.PI * 2); ctx.fillStyle = acid; ctx.fill(); }); const ux = pose.end.x - pose.elbow.x, uy = pose.end.y - pose.elbow.y, length = Math.hypot(ux, uy) || 1, nx = -uy / length, ny = ux / length; ctx.strokeStyle = acid; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(pose.end.x - nx * 13, pose.end.y - ny * 13); ctx.lineTo(pose.end.x + nx * 13, pose.end.y + ny * 13); ctx.stroke(); ctx.beginPath(); ctx.arc(pose.end.x, pose.end.y, 4, 0, Math.PI * 2); ctx.fillStyle = acid; ctx.fill(); ctx.font = "9px 'DM Mono', monospace"; ctx.fillStyle = "rgba(200,255,98,.75)"; ctx.fillText("TCP", pose.end.x + 14, pose.end.y - 12); ctx.restore(); }
    draw(now = 0) { const ctx = this.ctx, acid = "#c8ff62", next = { x: this.target.x * this.width, y: this.target.y * this.height }; ctx.clearRect(0, 0, this.width, this.height); this.pointer.x = lerp(this.pointer.x, next.x, reduced ? 1 : .09); this.pointer.y = lerp(this.pointer.y, next.y, reduced ? 1 : .09); const target = { ...this.pointer }, pose = this.solve(target), { base } = this;
      ctx.save(); ctx.strokeStyle = "rgba(200,255,98,.12)"; ctx.lineWidth = 1; ctx.setLineDash([3, 9]); ctx.beginPath(); ctx.arc(base.x, base.y, this.arm.one + this.arm.two, 0, Math.PI * 2); ctx.stroke(); ctx.beginPath(); ctx.arc(base.x, base.y, Math.abs(this.arm.one - this.arm.two), 0, Math.PI * 2); ctx.stroke(); ctx.restore();
      ctx.save(); ctx.strokeStyle = "rgba(216,227,209,.2)"; ctx.lineWidth = 1; ctx.setLineDash([2, 8]); ctx.beginPath(); ctx.moveTo(target.x, 35); ctx.lineTo(target.x, this.height - 38); ctx.stroke(); ctx.beginPath(); ctx.moveTo(this.width * .38, target.y); ctx.lineTo(this.width - 34, target.y); ctx.stroke(); ctx.restore();
      if (this.goal) { const g = { x: this.goal.x * this.width, y: this.goal.y * this.height }; ctx.save(); ctx.strokeStyle = acid; ctx.lineWidth = 1.2; ctx.setLineDash([5, 6]); ctx.beginPath(); ctx.moveTo(pose.end.x, pose.end.y); ctx.quadraticCurveTo((pose.end.x + g.x) / 2, g.y - 80, g.x, g.y); ctx.stroke(); ctx.fillStyle = acid; ctx.font = "9px 'DM Mono', monospace"; ctx.fillText("GOAL", g.x + 14, g.y + 19); ctx.restore(); }
      ctx.save(); ctx.strokeStyle = acid; ctx.lineWidth = 1.2; ctx.beginPath(); ctx.arc(target.x, target.y, 10 + Math.sin(now * .004) * 2, 0, Math.PI * 2); ctx.stroke(); ctx.beginPath(); [[-17,0,-7,0],[7,0,17,0],[0,-17,0,-7],[0,7,0,17]].forEach((line) => { ctx.moveTo(target.x + line[0], target.y + line[1]); ctx.lineTo(target.x + line[2], target.y + line[3]); }); ctx.stroke(); ctx.restore(); this.drawArm(ctx, pose);
      this.pulse = this.pulse.filter((item) => now - item.born < 1200); this.pulse.forEach((item) => { const progress = (now - item.born) / 1200, x = item.x * this.width, y = item.y * this.height; ctx.save(); ctx.globalAlpha = 1 - progress; ctx.strokeStyle = acid; ctx.lineWidth = 1.2; ctx.beginPath(); ctx.arc(x, y, 12 + progress * 42, 0, Math.PI * 2); ctx.stroke(); ctx.restore(); }); if (!reduced) requestAnimationFrame(this.draw); }
  }

  class SensorField {
    constructor(canvas) { this.canvas = canvas; this.ctx = canvas.getContext("2d", { alpha: true }); this.host = canvas.parentElement; this.resize = this.resize.bind(this); this.draw = this.draw.bind(this); this.resize(); new ResizeObserver(this.resize).observe(this.host); requestAnimationFrame(this.draw); }
    resize() { const box = this.host.getBoundingClientRect(), dpr = Math.min(devicePixelRatio || 1, 1.6); this.w = box.width; this.h = box.height; this.canvas.width = this.w * dpr; this.canvas.height = this.h * dpr; this.ctx.setTransform(dpr, 0, 0, dpr, 0, 0); this.points = Array.from({ length: Math.max(30, Math.floor(this.w * this.h * .00004)) }, () => ({ x: Math.random() * this.w, y: Math.random() * this.h, p: Math.random() * 7 })); }
    draw(time = 0) { const c = this.ctx, sweep = ((time * .00006) % 1.2) * this.w - this.w * .1; c.clearRect(0, 0, this.w, this.h); c.save(); c.strokeStyle = "rgba(200,255,98,.18)"; c.beginPath(); c.moveTo(sweep, 0); c.lineTo(sweep - this.h * .25, this.h); c.stroke(); this.points.forEach((p) => { c.fillStyle = `rgba(185,202,181,${.12 + .1 * Math.sin(time * .001 + p.p)})`; c.fillRect(p.x, p.y, 1, 1); }); c.restore(); if (!reduced) requestAnimationFrame(this.draw); }
  }

  const workspace = document.querySelector("[data-robot-workspace]");
  if (workspace) new RobotWorkspace(document.querySelector("#signal-field"));
  const contact = document.querySelector("#contact-field"); if (contact) new SensorField(contact);
})();
