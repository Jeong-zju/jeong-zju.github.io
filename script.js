(() => {
  "use strict";
  const year = document.querySelector("[data-year]");
  if (year) year.textContent = new Date().getFullYear();
  const reduced = matchMedia("(prefers-reduced-motion: reduce)").matches,
    hero = document.querySelector(".hero"),
    heroText = document.querySelector("[data-hero-text]"),
    videoBox = document.querySelector(".hero-video"),
    header = document.querySelector(".header"),
    headerActions = document.querySelector(".header-actions"),
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
      videoBox.style.maxWidth = "100%";
      videoBox.style.borderRadius = "24px";
      heroText.style.opacity = "1";
      heroText.style.transform = "none";
      // The compact mobile header stays as one continuous island. Reset the
      // desktop split variables as well so a resize from a scrolled desktop
      // viewport cannot leave two stale islands behind.
      header.style.setProperty("--collapse", "0");
      header.style.setProperty("--split", "0");
      header.style.setProperty("--left-island-width", "50%");
      header.style.setProperty("--right-island-width", "50%");
      header.style.setProperty("--left-island-center", "12%");
      header.style.setProperty("--right-island-center", "88%");
      brand.style.setProperty("--brand-opacity", "1");
      brand.style.setProperty("--brand-scale", "1");
      brand.style.setProperty("--brand-pointer", "auto");
      return;
    }
    const compactHero = innerWidth <= 980,
      rect = hero.getBoundingClientRect(),
      travel = compactHero
        ? Math.max(240, hero.offsetHeight * 0.65)
        : Math.max(1, hero.offsetHeight - innerHeight),
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
    if (compactHero) {
      heroText.style.opacity = "1";
      heroText.style.transform = "none";
      videoBox.style.width = "100%";
      videoBox.style.maxWidth = "100%";
      videoBox.style.borderRadius = "24px";
    } else {
      heroText.style.opacity = String(1 - Math.min(1, p * 2.2));
      heroText.style.transform = `translateY(${-Math.min(1, p * 2.2) * 64}px)`;
      videoBox.style.width = `${base + extra * ease}px`;
      videoBox.style.maxWidth = "none";
      videoBox.style.borderRadius = `${24 * (1 - ease)}px`;
    }
    brand.style.setProperty(
      "--brand-opacity",
      String(1 - Math.min(1, nav * 1.7)),
    );
    brand.style.setProperty("--brand-scale", String(1 - navEase * 0.72));
    brand.style.setProperty("--brand-pointer", nav > 0.7 ? "none" : "auto");
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
    // Size and center the two glass islands around the actual control groups.
    // Both groups change width as labels collapse, and the right group also
    // contains the language toggle. Measuring them independently keeps every
    // control inside its island at narrow desktop widths.
    const headerWidth = Math.max(1, header.clientWidth);
    const navWidth = header.querySelector("nav")?.offsetWidth || 0;
    const actionWidth = headerActions?.offsetWidth || 0;
    const edgePadding = 12;
    const fullLeftCenter = Math.max(
      12,
      ((navWidth / 2 + edgePadding) / headerWidth) * 100,
    );
    const fullRightCenter = Math.min(
      88,
      100 - ((actionWidth / 2 + edgePadding) / headerWidth) * 100,
    );
    const collapsedLeftWidth = Math.min(
      headerWidth * 0.46,
      Math.max(112, navWidth + edgePadding * 2),
    );
    const collapsedRightWidth = Math.min(
      headerWidth * 0.46,
      Math.max(112, actionWidth + edgePadding * 2),
    );
    const leftIslandPixels =
      (headerWidth / 2) * (1 - navEase) + collapsedLeftWidth * navEase;
    const rightIslandPixels =
      (headerWidth / 2) * (1 - navEase) + collapsedRightWidth * navEase;
    const leftIslandCenter =
      fullLeftCenter * (1 - navEase) +
      (leftIslandPixels / headerWidth) * 50 * navEase;
    const rightIslandCenter =
      fullRightCenter * (1 - navEase) +
      (100 - (rightIslandPixels / headerWidth) * 50) * navEase;
    header.style.setProperty(
      "--left-island-width",
      `${(leftIslandPixels / headerWidth) * 100}%`,
    );
    header.style.setProperty(
      "--right-island-width",
      `${(rightIslandPixels / headerWidth) * 100}%`,
    );
    // Keep the legacy variable in sync for any older theme overrides.
    header.style.setProperty(
      "--island-width",
      `${((leftIslandPixels + rightIslandPixels) / (headerWidth * 2)) * 100}%`,
    );
    header.style.setProperty("--left-island-center", `${leftIslandCenter}%`);
    header.style.setProperty("--right-island-center", `${rightIslandCenter}%`);
  };
  addEventListener("scroll", update, { passive: true });
  addEventListener("resize", update);
  update();
  const overview = document.querySelector(".overview");
  const reveals = document.querySelectorAll(".reveal");
  const syncScrollAnimations = () => {
    const vh = innerHeight;
    if (overview) {
      const rect = overview.getBoundingClientRect();
      const inSafeZone = rect.top < vh * 0.84 && rect.bottom > vh * 0.16;
      const farAway = rect.bottom < -vh * 0.24 || rect.top > vh * 1.24;
      if (inSafeZone) overview.classList.add("is-active");
      else if (farAway) overview.classList.remove("is-active");
    }
    reveals.forEach((element) => {
      const rect = element.getBoundingClientRect();
      const inSafeZone = rect.top < vh * 0.86 && rect.bottom > vh * 0.14;
      const farAway = rect.bottom < -vh * 0.24 || rect.top > vh * 1.24;
      if (inSafeZone) element.classList.add("visible");
      else if (farAway) element.classList.remove("visible");
    });
  };
  if (reduced) {
    if (overview) overview.classList.add("is-active");
    reveals.forEach((element) => element.classList.add("visible"));
  } else {
    addEventListener("scroll", syncScrollAnimations, { passive: true });
    addEventListener("resize", syncScrollAnimations);
    syncScrollAnimations();
  }
  const projectVideos = document.querySelectorAll(
    ".project-video video, .overview-image, .tile-art video, .moment-card video",
  );
  if (projectVideos.length && "IntersectionObserver" in window) {
    const videoObserver = new IntersectionObserver(
      (entries) =>
        entries.forEach(({ target, isIntersecting }) => {
          if (isIntersecting) target.play().catch(() => {});
          else target.pause();
        }),
      { threshold: 0.18, rootMargin: "120px 0px" },
    );
    projectVideos.forEach((video) => videoObserver.observe(video));
  }
})();

// The homepage is English-first, with an optional Chinese translation for
// visitors who prefer it. Text is swapped in place so links, media, and the
// existing scroll animations keep their structure and state.
(() => {
  const translations = [
    { selector: '.header nav a:nth-child(1)', attribute: 'aria-label', en: 'Research', zh: '研究' },
    { selector: '.header nav a:nth-child(2)', attribute: 'aria-label', en: 'Publications', zh: '论文' },
    { selector: '.header-actions a[href="/blogs/"]', attribute: 'aria-label', en: 'Blogs', zh: '博客' },
    { selector: '.contact-pill', attribute: 'aria-label', en: 'Contact', zh: '联系' },
    { selector: '.brand', attribute: 'aria-label', en: 'Zihao Li home', zh: '李子豪主页' },
    { selector: '.header nav a:nth-child(1) span', en: 'Research', zh: '研究' },
    { selector: '.header nav a:nth-child(2) span', en: 'Publications', zh: '论文' },
    { selector: '.header-actions a[href="/blogs/"] span', en: 'Blogs', zh: '博客' },
    { selector: '.contact-pill span', en: 'Contact ↗', zh: '联系 ↗' },
    { selector: '.hero-text h1', en: '<span>From capable robots to</span> capable teams', zh: '<span>从能独立行动的机器人</span> 到能协同的团队' },
    { selector: '.video-ui span', en: 'ZENO-1 · COLLABORATIVE INTELLIGENCE', zh: 'ZENO-1 · 协作智能' },
    { selector: '.overview-copy .tag', en: 'The problem', zh: '问题' },
    { selector: '.overview-copy h2', en: '<span>A second robot changes</span> what the first can do.', zh: '<span>第二个机器人，会改变</span>第一个机器人能做什么。' },
    { selector: '.overview-copy h2 + p', en: 'Put two capable robots on the same physical task and capability does not simply add. Timing, contact, and motion from one robot change what the other can do next. I study how embodied agents read those changes and keep the joint task moving.', zh: '让两台能干的机器人共同完成一项物理任务，能力并不会自动相加。一个机器人的时机、接触与动作，会改变另一个机器人下一步能做什么。我研究具身智能体如何读懂这些变化，让共同任务继续推进。' },
    { selector: '.overview-note', en: 'RELATIONAL · PERSISTENT · RECOVERABLE', zh: '关系性 · 持续性 · 可恢复' },
    { selector: '.overview-media figcaption', en: 'Shared workspace, changing state', zh: '共享空间，状态不断变化' },
    { selector: '.thesis-title .tag', en: 'Research thesis', zh: '研究主张' },
    { selector: '.thesis-title h2', en: 'The interaction is the unit of <em>intelligence.</em>', zh: '交互才是<em>智能</em>的基本单位。' },
    { selector: '.tile-a .tile-kicker', en: 'THE WORLD AS INTERFACE', zh: '世界就是接口' },
    { selector: '.tile-a h3', en: 'The same 3B model runs on each robot at 30 Hz. No central conductor, no privileged partner state: motion, object response, and contact become the interface.', zh: '同一个 3B 模型以 30 Hz 独立运行在每台机器人上。没有中央指挥，也没有特权伙伴状态；动作、物体响应与接触本身就是协同接口。' },
    { selector: '.tile-b .tile-kicker', en: 'THE PAST STAYS IN THE STATE', zh: '让过去留在状态里' },
    { selector: '.tile-b h3', en: 'A compact interaction memory lets one policy carry evidence across eight subtasks and more than ten minutes—without resets or policy switching.', zh: '紧凑的交互记忆让一个策略跨越八个子任务和十分钟以上的执行持续携带证据，无需重置任务，也无需切换策略。' },
    { selector: '.tile-c .tile-kicker', en: 'IMAGINE BEFORE CONTACT', zh: '在接触前想一步' },
    { selector: '.tile-c h3', en: 'Before committing, predictive introspection asks what an action will make possible for a partner. It selects the action leading to better partner behavior in 87% of cases, versus 61% without lookahead.', zh: '在做出动作前，预测性内省会追问：这个动作将为伙伴创造什么可能？它有 87% 的概率选出能带来更好伙伴行为的动作；没有前瞻时这一比例为 61%。' },
    { selector: '.moments-head .tag', en: 'Zeno-1 in practice', zh: 'Zeno-1 实践' },
    { selector: '.moments-head h2', en: 'The same idea, tested against <em>a hundred ordinary tasks.</em>', zh: '同一个理念，接受<em>上百个日常任务</em>的检验。' },
    { selector: '.moments-head > p:last-child', en: 'Every clip below runs on Zeno-1, the collaborative-intelligence architecture I proposed and now lead at ZENO AI. <a class="moments-link" href="/blogs/zeno-1-collaborative-intelligence/">Read the Zeno-1 report ↗</a>', zh: '以下每一段视频都运行在 Zeno-1 上——这是我在 ZENO AI 提出并带领的协作智能架构。<a class="moments-link" href="/blogs/zeno-1-collaborative-intelligence/">阅读 Zeno-1 报告 ↗</a>' },
    { selector: '.moment-card:nth-child(1) .moment-kicker', en: 'SHARED PASSAGE', zh: '共享通路' },
    { selector: '.moment-card:nth-child(1) .moment-caption', en: "One robot's path is the other's constraint, read live instead of scheduled around.", zh: '一台机器人的路径，就是另一台的实时约束，而不是提前排好的日程。' },
    { selector: '.moment-card:nth-child(2) .moment-kicker', en: 'SHARED LOAD', zh: '共同承重' },
    { selector: '.moment-card:nth-child(2) .moment-caption', en: 'Let go too early and the task restarts. The tension itself is the coordination signal.', zh: '松手太早，任务就要重来。张力本身就是协同信号。' },
    { selector: '.moment-card:nth-child(3) .moment-kicker', en: 'ROLES, NOT ASSIGNMENTS', zh: '角色，而非指派' },
    { selector: '.moment-card:nth-child(3) .moment-caption', en: 'Neither robot is told to scoop or to hold. The role is inferred from what the other has already started.', zh: '没有谁被指定去铲、去扶。角色是从对方已经开始的动作中推断出来的。' },
    { selector: '.moment-card:nth-child(4) .moment-kicker', en: 'SEQUENCE FROM STATE', zh: '顺序源于状态' },
    { selector: '.moment-card:nth-child(4) .moment-caption', en: "The bag can't be sealed while a partner is still filling it — Zeno-1 waits on the world, not on a message.", zh: '袋子在伙伴还在装填时无法封口——Zeno-1 等待的是世界的状态，而不是一条消息。' },
    { selector: '.projects-head .tag', en: 'Research in motion', zh: '研究进行时' },
    { selector: '.projects-head h2', en: 'A good action preserves <em>good futures.</em>', zh: '好的动作，也要为未来<em class="no-orphan">保留选择。</em>' },
    { selector: '.projects-head > p:last-child', en: 'The studies highlighted here are entry points into a broader, ongoing research program. Across robot learning, memory, planning, and physical interaction, I ask how agents can make progress without closing off what they—or their partners—need next.', zh: '下面展示的是这项长期研究计划中的几个入口。我的工作跨越机器人学习、记忆、规划与物理交互，始终追问：智能体如何在推进任务的同时，为自己和伙伴保留下一步的选择？' },
    { selector: '.project-card:nth-child(1) .project-year', en: '2026 · COUPLED ROBOT POLICIES', zh: '2026 · 协同机器人策略' },
    { selector: '.project-card:nth-child(1) .project-copy h3', en: 'Sequential<br />Asymmetric Imitation', zh: '序列式<br />非对称模仿' },
    { selector: '.project-card:nth-child(1) .project-copy > p:not(.project-year)', en: 'Two robots can each know how to carry a sheet and still fail together. Sequential Asymmetric Imitation turns single-robot demonstrations into policies that learn to wait, yield, and recover as a partner changes the task.', zh: '两台机器人都知道如何搬运床单，仍可能协作失败。序列式非对称模仿将单机器人示范转化为能够在伙伴改变任务时等待、让步并恢复的策略。' },
    { selector: '.project-card:nth-child(1) .project-copy a', en: 'View project ↗', zh: '查看项目 ↗' },
    { selector: '.project-card:nth-child(2) .project-year', en: '2026 · LONG-HORIZON MEMORY', zh: '2026 · 长时域记忆' },
    { selector: '.project-card:nth-child(2) .project-copy h3', en: 'TRACE', zh: 'TRACE' },
    { selector: '.project-card:nth-child(2) .project-copy > p:not(.project-year)', en: 'A useful clue can disappear from view long before a task is done. TRACE preserves causal evidence and routes it back at the branch where it matters, so a long-horizon policy can continue instead of starting over.', zh: '有用线索可能在任务结束前很久就离开视野。TRACE 保存因果证据，并在真正需要的分支将其找回，让长时域策略继续前进，而不是从头开始。' },
    { selector: '.project-card:nth-child(2) .project-copy a', en: 'View project ↗', zh: '查看项目 ↗' },
    { selector: '.project-card:nth-child(3) .project-year', en: '2026 · FORCE-AWARE TELEOPERATION', zh: '2026 · 力感知遥操作' },
    { selector: '.project-card:nth-child(3) .project-copy h3', en: 'TriPilot-FF', zh: 'TriPilot-FF' },
    { selector: '.project-card:nth-child(3) .project-copy > p:not(.project-year)', en: 'When a person works through a robot, contact is information. TriPilot-FF gives hands and feet a shared interface for reach, resistance, and repositioning—so the operator can feel what the robot cannot say.', zh: '当人通过机器人行动时，接触本身就是信息。TriPilot-FF 让手与脚共享触及、阻力和重新定位的接口，让操作者感知机器人无法直接表达的状态。' },
    { selector: '.project-card:nth-child(3) .project-copy a', en: 'View project ↗', zh: '查看项目 ↗' },
    { selector: '.publications-head .tag', en: 'Selected research', zh: '部分研究记录' },
    { selector: '.publications-head h2', en: '<span>The question</span> keeps widening.', zh: '<span>同一个问题</span>正在不断展开。' },
    { selector: '.publications-head > p:last-child', en: 'From motion planning and human contact to memory and multi-robot interaction, these papers follow one question: how can a robot act without losing sight of what—or who—its next action affects? These are selected works; the full research history is on Scholar.', zh: '从运动规划与人机接触，到记忆和多机器人交互，这些论文始终追问同一个问题：机器人如何在行动时，不忘记自己的下一步会影响什么、又会影响谁？这里展示的是部分记录，完整研究经历见 Scholar。' },
    { selector: '.pub-card:nth-child(1) .pub-meta', en: '2026 · COLLABORATIVE POLICIES', zh: '2026 · 协作策略' },
    { selector: '.pub-card:nth-child(1) h3', en: 'Robots that Collaborate: Sequential Asymmetric Imitation', zh: '协作机器人：序列式非对称模仿' },
    { selector: '.pub-card:nth-child(1) p', en: 'Learning to wait, yield, and recover as a partner changes the task.', zh: '学习在伙伴改变任务时等待、让步并恢复。' },
    { selector: '.pub-card:nth-child(1) b', en: 'Read paper ↗', zh: '阅读论文 ↗' },
    { selector: '.pub-card:nth-child(2) .pub-meta', en: '2026 · LONG-HORIZON MEMORY', zh: '2026 · 长时域记忆' },
    { selector: '.pub-card:nth-child(2) h3', en: 'TRACE: Trajectory-Routed Causal Memory', zh: 'TRACE：轨迹路由因果记忆' },
    { selector: '.pub-card:nth-child(2) p', en: 'Carrying evidence forward when the clue has already left the scene.', zh: '在线索离开现场后，仍将证据带向前方。' },
    { selector: '.pub-card:nth-child(2) b', en: 'Read paper ↗', zh: '阅读论文 ↗' },
    { selector: '.pub-card:nth-child(3) .pub-meta', en: '2026 · FORCE-AWARE TELEOPERATION', zh: '2026 · 力感知遥操作' },
    { selector: '.pub-card:nth-child(3) h3', en: 'TriPilot-FF: Coordinated Whole-Body Teleoperation', zh: 'TriPilot-FF：<span class="no-orphan">协调式全身遥操作</span>' },
    { selector: '.pub-card:nth-child(3) p', en: 'Giving hands and feet a shared language for contact, reach, and motion.', zh: '让手与脚拥有一套关于接触、触及和运动的共同语言。' },
    { selector: '.pub-card:nth-child(3) b', en: 'Read paper ↗', zh: '阅读论文 ↗' },
    { selector: '.pub-card:nth-child(4) .pub-meta', en: '2025 · MOTION PLANNING', zh: '2025 · 运动规划' },
    { selector: '.pub-card:nth-child(4) h3', en: 'TAPOM: Task-Space Topology-Guided Planning', zh: 'TAPOM：任务空间拓扑引导规划' },
    { selector: '.pub-card:nth-child(4) p', en: 'Finding the passage before searching the high-dimensional motion space.', zh: '先找到通道，再搜索高维运动空间。' },
    { selector: '.pub-card:nth-child(4) b', en: 'Read paper ↗', zh: '阅读论文 ↗' },
    { selector: '.pub-card:nth-child(5) .pub-meta', en: '2026 · ROBOTIC ASSEMBLY', zh: '2026 · 机器人装配' },
    { selector: '.pub-card:nth-child(5) h3', en: 'Robot-Friendly Scaffolding with Passive Error Correction', zh: '带被动误差修正的机器人友好脚手架' },
    { selector: '.pub-card:nth-child(5) p', en: 'A tapered connector turns imperfect alignment into a reliable assembly step.', zh: '锥形连接件将不完美对齐变成可靠的装配步骤。' },
    { selector: '.pub-card:nth-child(5) b', en: 'Read paper ↗', zh: '阅读论文 ↗' },
    { selector: '.pub-card:nth-child(6) .pub-meta', en: '2025 · PHYSICAL HRI', zh: '2025 · 物理人机交互' },
    { selector: '.pub-card:nth-child(6) h3', en: 'Operational Behaviors Inference for Physical HREI', zh: '物理 HREI 的操作行为推断' },
    { selector: '.pub-card:nth-child(6) p', en: 'Predicting human intent while optimizing motion around real contact.', zh: '在真实接触周围优化运动，同时预测人的意图。' },
    { selector: '.pub-card:nth-child(6) b', en: 'Read paper ↗', zh: '阅读论文 ↗' },
    { selector: '.scholar', en: 'Explore the full research record ↗', zh: '查看完整研究记录 ↗' },
    { selector: '.bio-copy .tag', en: 'About', zh: '关于我' },
    { selector: '.bio-image figcaption span:last-child', en: 'PHYSICAL AI · 2026', zh: '物理智能 · 2026' },
    { selector: '.bio-copy h2', en: '<span>I am Zihao Li,</span> building physical intelligence that works together—and keeps going', zh: '<span>我是李子豪，</span>正在构建能够协同工作、持续行动的物理智能' },
    { selector: '.bio-facts', attribute: 'aria-label', en: 'Current roles and education', zh: '当前角色与教育经历' },
    { selector: '.bio-fact:nth-child(1) > span:last-child', en: 'Founding Researcher of <a class="bio-link" href="https://www.zenobot.ai/" target="_blank" rel="noreferrer">ZENO AI</a>', zh: '<a class="bio-link" href="https://www.zenobot.ai/" target="_blank" rel="noreferrer">ZENO AI</a> 创始研究员' },
    { selector: '.bio-fact:nth-child(2) > span:last-child', en: 'Proposer and lead researcher of <span class="bio-highlight">Zeno-1</span>, ZENO AI’s collaborative physical intelligence architecture — <a class="bio-link" href="/blogs/zeno-1-collaborative-intelligence/">read the report ↗</a>', zh: '<span class="bio-highlight">Zeno-1</span> 的提出者与首席研究员——ZENO AI 的协作物理智能架构 — <a class="bio-link" href="/blogs/zeno-1-collaborative-intelligence/">阅读报告 ↗</a>' },
    { selector: '.bio-fact:nth-child(3) > span:last-child', en: 'PhD student of <a class="bio-link" href="https://www.weimingzhi.com/" target="_blank" rel="noreferrer">William Zhi</a> at the <a class="bio-link" href="https://aus.bot/" target="_blank" rel="noreferrer">PAIR Lab</a>, University of Sydney', zh: '悉尼大学 <a class="bio-link" href="https://aus.bot/" target="_blank" rel="noreferrer">PAIR Lab</a> <a class="bio-link" href="https://www.weimingzhi.com/" target="_blank" rel="noreferrer">William Zhi</a> 教授的博士生' },
    { selector: '.bio-fact:nth-child(4) > span:last-child', en: "Master's graduate of the College of Control Science and Engineering, Zhejiang University", zh: '浙江大学控制科学与工程学院硕士毕业生' },
    { selector: '.bio-fact:nth-child(5) > span:last-child', en: 'Graduate of the <span class="bio-highlight">Interdisciplinary Innovation Platform, Chu Kochen Honors College</span>, Zhejiang University', zh: '浙江大学<span class="bio-highlight">竺可桢学院交叉创新平台</span>毕业生' },
    { selector: 'footer > p', en: '<span>Not just robots that can act.</span> Robots that know how to act together—and keep going.', zh: '<span>不只是能够行动的机器人。</span> 更是懂得协同并坚持下去的机器人。' },
    { selector: '.footer-links div:nth-child(1) small', en: 'Explore', zh: '探索' },
    { selector: '.footer-links div:nth-child(1) a:nth-of-type(1)', en: 'Research', zh: '研究' },
    { selector: '.footer-links div:nth-child(1) a:nth-of-type(2)', en: 'Publications', zh: '论文' },
    { selector: '.footer-links div:nth-child(1) a:nth-of-type(3)', en: 'Blogs', zh: '博客' },
    { selector: '.footer-links div:nth-child(2) small', en: 'Follow', zh: '关注' },
    { selector: '.footer-links div:nth-child(2) a:nth-of-type(2)', en: 'Scholar', zh: '学术主页' },
    { selector: '.footer-links div:nth-child(2) a:nth-of-type(3)', en: 'Email', zh: '邮箱' },
  ];
  const imageAlts = [
    ['.bio-image img', 'Zihao Li holding a lamb in front of snow-capped mountains', '雪山前抱着小羊的李子豪'],
    ['.pub-card:nth-child(1) img', 'Three-stage SAI curriculum for learning coupled robot policies', '学习协同机器人策略的三阶段 SAI 课程'],
    ['.pub-card:nth-child(2) img', 'TRACE memory recovering an early visual cue at a later branch', 'TRACE 记忆在后续分支恢复早期视觉线索'],
    ['.pub-card:nth-child(3) img', 'TriPilot-FF whole-body teleoperation system with force feedback', '带力反馈的 TriPilot-FF 全身遥操作系统'],
    ['.pub-card:nth-child(4) img', 'TAPOM task-space topology-guided planning through a narrow passage', 'TAPOM 任务空间拓扑引导狭窄通道规划'],
    ['.pub-card:nth-child(5) img', 'Robot-friendly scaffolding connector with passive error correction', '带被动误差修正的机器人友好脚手架连接件'],
    ['.pub-card:nth-child(6) img', 'Complete human, robot, and environment control loop for operational behavior inference', '用于操作行为推断的人、机器人与环境完整控制回路'],
  ];
  const mediaLabels = [
    ['.overview-image', 'Two robots handing off a task at a door', '两台机器人在门口交接任务'],
    ['.tile-a video', 'Three Zeno robots making a bed with no central conductor', '三台 Zeno 机器人在无中央指挥下共同铺床'],
    ['.tile-b video', 'A Zeno robot moving between subtasks across a long-horizon run', '一台 Zeno 机器人在长时域任务中切换子任务'],
    ['.tile-c video', 'Two Zeno robots jointly spreading and smoothing a bed sheet', '两台 Zeno 机器人共同展开并抚平床单'],
    ['.moment-card:nth-child(1) video', 'Two robots handing off a task at a trash bin', '两台机器人在垃圾桶旁交接任务'],
    ['.moment-card:nth-child(2) video', 'Two robots passing a hanger with clothing between them', '两台机器人相互传递挂着衣物的衣架'],
    ['.moment-card:nth-child(3) video', 'Two robots sharing roles around a litter box task', '两台机器人在猫砂盆任务中分担角色'],
    ['.moment-card:nth-child(4) video', 'Two robots sealing a vacuum storage bag together', '两台机器人共同封住真空收纳袋'],
    ['.project-card:nth-child(1) video', 'Two robots spreading a bed sheet together', '两台机器人共同铺开床单'],
    ['.project-card:nth-child(2) video', 'A mobile robot approaching a desk during a long-horizon task', '长时域任务中接近书桌的移动机器人'],
    ['.project-card:nth-child(3) video', 'A mobile manipulator transporting laundry with force-aware control', '使用力感知控制搬运衣物的移动操作机器人'],
  ];
  const metaTranslations = [
    ['meta[name="description"]', 'Zihao Li studies how embodied agents coordinate through motion and contact, carry task-relevant memory across time, and recover when the physical world changes.', '李子豪研究具身智能体如何通过动作与接触协同、跨时间保留任务相关记忆，并在物理世界变化时恢复行动。'],
    ['meta[property="og:title"]', 'Zihao Li — Collaborative Physical Intelligence', '李子豪 — 协作物理智能'],
    ['meta[property="og:description"]', 'From individual skills to teams that can keep going: research on collaborative physical intelligence.', '从个体技能到能够持续行动的团队：关于协作物理智能的研究。'],
    ['meta[name="twitter:title"]', 'Zihao Li — Collaborative Physical Intelligence', '李子豪 — 协作物理智能'],
    ['meta[name="twitter:description"]', 'Research on physical intelligence that can coordinate, remember, anticipate, and recover.', '关于能够协同、记忆、预判与恢复的物理智能研究。'],
  ];
  let language = 'en';
  const toggle = document.querySelector('#language-toggle');
  const protectChineseLineEnd = () => {
    const blocks = document.querySelectorAll([
      'main h1',
      'main h2',
      'main h3',
      'main p:not(.tag):not(.tile-kicker):not(.project-year):not(.pub-meta)',
      '.bio-fact > span:last-child',
      'footer > p',
    ].join(','));

    blocks.forEach((block) => {
      const walker = document.createTreeWalker(block, NodeFilter.SHOW_TEXT);
      const textNodes = [];
      let node;
      while ((node = walker.nextNode())) textNodes.push(node);

      const lastChineseNode = textNodes.reverse().find((textNode) =>
        /[\u3400-\u9fff]/.test(textNode.data),
      );
      if (!lastChineseNode || lastChineseNode.parentElement?.closest('.no-orphan')) return;

      let chineseCharacters = 0;
      let start = -1;
      for (let index = lastChineseNode.data.length - 1; index >= 0; index -= 1) {
        if (/[\u3400-\u9fff]/.test(lastChineseNode.data[index])) {
          chineseCharacters += 1;
          if (chineseCharacters === 3) {
            start = index;
            break;
          }
        }
      }
      if (start < 0) return;

      const ending = lastChineseNode.splitText(start);
      const wrapper = document.createElement('span');
      wrapper.className = 'no-orphan';
      ending.parentNode.insertBefore(wrapper, ending);
      wrapper.appendChild(ending);
    });
  };
  const applyLanguage = () => {
    document.documentElement.lang = language === 'en' ? 'en' : 'zh-CN';
    document.documentElement.dataset.language = language;
    document.title = language === 'en' ? 'Zihao Li — Collaborative Physical Intelligence' : '李子豪 — 协作物理智能';
    translations.forEach(({selector, attribute, en, zh}) => {
      const element = document.querySelector(selector);
      if (!element) return;
      if (attribute) element.setAttribute(attribute, language === 'en' ? en : zh);
      else element.innerHTML = language === 'en' ? en : zh;
    });
    if (language === 'zh') protectChineseLineEnd();
    imageAlts.forEach(([selector, en, zh]) => {
      const element = document.querySelector(selector);
      if (element) element.alt = language === 'en' ? en : zh;
    });
    mediaLabels.forEach(([selector, en, zh]) => {
      const element = document.querySelector(selector);
      if (element) element.setAttribute('aria-label', language === 'en' ? en : zh);
    });
    metaTranslations.forEach(([selector, en, zh]) => {
      const element = document.querySelector(selector);
      if (element) element.setAttribute('content', language === 'en' ? en : zh);
    });
    if (toggle) {
      toggle.querySelector('span').textContent = language === 'en' ? '中文' : 'English';
      toggle.setAttribute('aria-label', language === 'en' ? 'Switch to Chinese' : '切换到英文');
      toggle.setAttribute('aria-pressed', language === 'zh' ? 'true' : 'false');
    }
    // The toggle label changes width between languages. Let the header measure
    // the new control group on the next layout pass before repositioning its
    // glass island.
    requestAnimationFrame(() => window.dispatchEvent(new Event('resize')));
  };
  const carouselReducedMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const CAROUSEL_INTERVAL = 4200;
  const carouselRefreshers = [];

  const setupCarousel = (carouselEl) => {
    const track = carouselEl.querySelector('.carousel-track');
    const dotsEl = carouselEl.nextElementSibling;
    if (!track || !dotsEl || !dotsEl.hasAttribute('data-carousel-dots')) return;
    const reals = Array.from(track.children);
    const count = reals.length;
    if (count < 2) return;

    const dotLabel = (i) => (language === 'en' ? `Slide ${i + 1}` : `第 ${i + 1} 张`);
    const arrowLabel = (dir) => {
      if (language === 'en') return dir === 'prev' ? 'Previous slide' : 'Next slide';
      return dir === 'prev' ? '上一张' : '下一张';
    };

    const stage = document.createElement('div');
    stage.className = 'carousel-stage';
    carouselEl.parentNode.insertBefore(stage, carouselEl);
    stage.appendChild(carouselEl);

    const makeArrow = (dir) => {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = `carousel-arrow carousel-arrow-${dir}`;
      btn.setAttribute('aria-label', arrowLabel(dir));
      btn.innerHTML = dir === 'prev'
        ? '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M15 6l-6 6 6 6"/></svg>'
        : '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M9 6l6 6-6 6"/></svg>';
      stage.appendChild(btn);
      return btn;
    };
    const prevBtn = makeArrow('prev');
    const nextBtn = makeArrow('next');

    if (carouselReducedMotion) {
      dotsEl.innerHTML = '';
      let rmIndex = 0;
      const rmGoTo = (i) => {
        rmIndex = ((i % count) + count) % count;
        reals[rmIndex].scrollIntoView({ behavior: 'auto', inline: 'start', block: 'nearest' });
      };
      const dots = reals.map((card, i) => {
        const dot = document.createElement('button');
        dot.type = 'button';
        dot.className = 'carousel-dot';
        dot.setAttribute('aria-label', dotLabel(i));
        dot.addEventListener('click', () => rmGoTo(i));
        dotsEl.appendChild(dot);
        return dot;
      });
      prevBtn.addEventListener('click', () => rmGoTo(rmIndex - 1));
      nextBtn.addEventListener('click', () => rmGoTo(rmIndex + 1));
      carouselRefreshers.push(() => {
        dots.forEach((dot, i) => dot.setAttribute('aria-label', dotLabel(i)));
        prevBtn.setAttribute('aria-label', arrowLabel('prev'));
        nextBtn.setAttribute('aria-label', arrowLabel('next'));
      });
      return;
    }

    const markClone = (el) => {
      el.setAttribute('aria-hidden', 'true');
      if (el.matches('a, button')) el.setAttribute('tabindex', '-1');
      el.querySelectorAll('a, button').forEach((node) => node.setAttribute('tabindex', '-1'));
    };

    let cloneFirst;
    let cloneLast;
    const visualOrder = [];
    const lastVisual = count + 1;

    const buildClones = () => {
      track.querySelectorAll('[data-carousel-clone]').forEach((node) => node.remove());
      cloneFirst = reals[0].cloneNode(true);
      cloneLast = reals[count - 1].cloneNode(true);
      [cloneFirst, cloneLast].forEach((clone) => {
        clone.setAttribute('data-carousel-clone', '');
        markClone(clone);
      });
      cloneFirst.style.order = '1';
      cloneLast.style.order = '-1';
      track.appendChild(cloneFirst);
      track.appendChild(cloneLast);
      visualOrder[0] = cloneLast;
      for (let i = 0; i < count; i += 1) visualOrder[i + 1] = reals[i];
      visualOrder[lastVisual] = cloneFirst;
    };
    buildClones();

    dotsEl.innerHTML = '';
    const dots = reals.map((_, i) => {
      const dot = document.createElement('button');
      dot.type = 'button';
      dot.className = 'carousel-dot';
      dot.setAttribute('aria-label', dotLabel(i));
      dot.addEventListener('click', () => {
        goTo(i + 1);
        restartTimer();
      });
      dotsEl.appendChild(dot);
      return dot;
    });

    const realIndexOf = (visual) => ((visual - 1) % count + count) % count;

    let current = 1;
    let timer = null;

    const render = (visual, instant) => {
      const el = visualOrder[visual];
      const stageWidth = carouselEl.offsetWidth;
      const offset = el.offsetLeft - (stageWidth - el.offsetWidth) / 2;
      if (instant) track.classList.add('no-transition');
      track.style.transform = `translateX(${-offset}px)`;
      if (instant) {
        void track.offsetWidth;
        track.classList.remove('no-transition');
      }
      visualOrder.forEach((card) => card.classList.toggle('is-active', card === el));
      const realIndex = realIndexOf(visual);
      dots.forEach((dot, i) => dot.classList.toggle('is-active', i === realIndex));
    };

    const goTo = (visual) => {
      current = visual;
      render(visual);
      if (visual === 0 || visual === lastVisual) {
        window.setTimeout(() => {
          current = visual === 0 ? count : 1;
          render(current, true);
        }, 620);
      }
    };

    const next = () => goTo(current + 1);
    const prev = () => goTo(current - 1);
    const startTimer = () => {
      if (timer) return;
      timer = window.setInterval(next, CAROUSEL_INTERVAL);
    };
    const stopTimer = () => {
      window.clearInterval(timer);
      timer = null;
    };
    const restartTimer = () => {
      stopTimer();
      startTimer();
    };
    const resumeIfVisible = () => {
      const rect = carouselEl.getBoundingClientRect();
      if (rect.top < innerHeight && rect.bottom > 0) startTimer();
    };

    track.addEventListener('click', (event) => {
      const card = visualOrder.find((el) => el !== visualOrder[current] && el.contains(event.target));
      if (!card) return;
      event.preventDefault();
      goTo(visualOrder.indexOf(card));
      restartTimer();
    });

    prevBtn.addEventListener('click', () => {
      prev();
      restartTimer();
    });
    nextBtn.addEventListener('click', () => {
      next();
      restartTimer();
    });

    carouselEl.addEventListener('focusin', stopTimer);
    carouselEl.addEventListener('focusout', (event) => {
      if (!carouselEl.contains(event.relatedTarget)) startTimer();
    });
    carouselEl.addEventListener('pointerdown', stopTimer);
    carouselEl.addEventListener('pointerup', resumeIfVisible);
    carouselEl.addEventListener('pointercancel', resumeIfVisible);

    if ('IntersectionObserver' in window) {
      const io = new IntersectionObserver(
        ([entry]) => (entry.isIntersecting ? startTimer() : stopTimer()),
        { threshold: 0.05 },
      );
      io.observe(carouselEl);
    } else {
      startTimer();
    }

    let resizeTimer;
    window.addEventListener('resize', () => {
      clearTimeout(resizeTimer);
      resizeTimer = setTimeout(() => render(current, true), 150);
    });

    render(1, true);

    carouselRefreshers.push(() => {
      buildClones();
      dots.forEach((dot, i) => dot.setAttribute('aria-label', dotLabel(i)));
      prevBtn.setAttribute('aria-label', arrowLabel('prev'));
      nextBtn.setAttribute('aria-label', arrowLabel('next'));
      render(current, true);
    });
  };

  document.querySelectorAll('[data-carousel]').forEach(setupCarousel);

  if (toggle) {
    toggle.addEventListener('click', () => {
      language = language === 'en' ? 'zh' : 'en';
      applyLanguage();
      carouselRefreshers.forEach((refresh) => refresh());
    });
  }
  applyLanguage();
})();
