(() => {
  "use strict";
  const year = document.querySelector("[data-year]");
  if (year) year.textContent = new Date().getFullYear();
  const reduced = matchMedia("(prefers-reduced-motion: reduce)").matches,
    hero = document.querySelector(".hero"),
    heroText = document.querySelector("[data-hero-text]"),
    videoBox = document.querySelector(".hero-video"),
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
  const projectVideos = document.querySelectorAll(".project-video video");
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
    { selector: '.video-ui span', en: 'COLLABORATIVE ROBOT LEARNING', zh: '协作机器人学习' },
    { selector: '.overview-copy .tag', en: 'The problem', zh: '问题' },
    { selector: '.overview-copy h2', en: '<span>Every new agent</span> changes the problem', zh: '<span>每个新加入的智能体</span> 都会改变问题' },
    { selector: '.overview-copy h2 + p', en: 'A team can be full of capable robots and still fail together. My work asks how embodied agents can read one another through motion, contact, and shared objects, then adapt as each action reshapes the possibilities available to the rest of the team.', zh: '一支团队可以拥有许多能干的机器人，却依然无法协同成功。我关注具身智能体如何通过动作、接触和共享物体读懂彼此，并在每个动作改变团队可能性时及时适应。' },
    { selector: '.overview-note', en: 'DECENTRALIZED · EMBODIED · CONTINGENT', zh: '去中心化 · 具身化 · 随机应变' },
    { selector: '.overview-media figcaption', en: 'Shared workspace, changing state', zh: '共享空间，状态不断变化' },
    { selector: '.thesis-title .tag', en: 'Research thesis', zh: '研究主张' },
    { selector: '.thesis-title h2', en: 'The interaction is the unit of <em>intelligence.</em>', zh: '交互才是<em>智能</em>的基本单位。' },
    { selector: '.tile-a .tile-kicker', en: 'LOCAL VIEWS / TEAM STATE', zh: '局部视角 / 团队状态' },
    { selector: '.tile-a h3', en: 'One 3B model runs independently on every robot at 30 Hz, using local observations and history rather than a central policy or privileged team state. Adding an agent does not require a larger centralized action space.', zh: '每台机器人都以 30 Hz 独立运行一个 3B 模型，依靠局部观测与历史，而非中央策略或特权团队状态。增加智能体，不需要扩大集中式动作空间。' },
    { selector: '.tile-b .tile-kicker', en: 'CONTINUITY / LONG-HORIZON EXECUTION', zh: '连续性 / 长时域执行' },
    { selector: '.tile-b h3', en: 'In evaluation, one policy runs for more than ten minutes across eight collaborative subtasks—without task resets or policy switching.', zh: '在评测中，一个策略可跨越八个协作子任务连续运行十分钟以上，无需重置任务，也无需切换策略。' },
    { selector: '.tile-c .tile-kicker', en: 'CONTACT / PARTNER RESPONSE', zh: '接触 / 伙伴响应' },
    { selector: '.tile-c h3', en: 'Across held-out collaborative decisions, predictive introspection selects the action leading to better partner behavior in 87% of cases, versus 61% without lookahead.', zh: '在留出的协作决策中，预测性内省有 87% 的概率选出能带来更好伙伴行为的动作；没有前瞻时这一比例为 61%。' },
    { selector: '.bridge', en: 'This position emerged through projects that made coordination visible—as forces between bodies, choices shared by partners, and evidence carried through time.', zh: '这些项目让协同变得可见：它存在于身体之间的力、伙伴共享的选择，以及跨越时间保留下来的证据之中。' },
    { selector: '.projects-head .tag', en: 'Project history', zh: '项目历程' },
    { selector: '.projects-head h2', en: 'Building the conditions for robots to work <em>together.</em>', zh: '为机器人<em>共同工作</em>构建条件。' },
    { selector: '.projects-head > p:last-child', en: 'My research moves across coupled manipulation, long-horizon memory, and force-aware teleoperation. Together, these projects support my central claim: capable agents become a capable team only when they can read how each action changes what the others can do next.', zh: '我的研究横跨协同操作、长时域记忆与力感知遥操作。这些项目共同支持一个核心观点：只有读懂每个动作如何改变伙伴下一步能做什么，能干的智能体才能组成能干的团队。' },
    { selector: '.project-card:nth-child(1) .project-year', en: '2026 · COUPLED ROBOT POLICIES', zh: '2026 · 协同机器人策略' },
    { selector: '.project-card:nth-child(1) .project-copy h3', en: 'Sequential<br />Asymmetric Imitation', zh: '序列式<br />非对称模仿' },
    { selector: '.project-card:nth-child(1) .project-copy > p:not(.project-year)', en: 'A single-teleoperator curriculum turns local demonstrations into a pair of policies that can stay synchronized while carrying a shared object. The partner is learned as part of the task—not treated as noise around it.', zh: '单人遥操作课程将局部示范转化为一对能够同步搬运共享物体的策略。伙伴是任务的一部分，而不是围绕任务的噪声。' },
    { selector: '.project-card:nth-child(1) .project-copy a', en: 'View project ↗', zh: '查看项目 ↗' },
    { selector: '.project-card:nth-child(2) .project-year', en: '2026 · LONG-HORIZON MEMORY', zh: '2026 · 长时域记忆' },
    { selector: '.project-card:nth-child(2) .project-copy h3', en: 'TRACE', zh: 'TRACE' },
    { selector: '.project-card:nth-child(2) .project-copy > p:not(.project-year)', en: 'When the useful clue disappears from view, a trajectory-routed causal memory brings it back at the right branch. TRACE lets a policy carry delayed evidence forward instead of starting the task over.', zh: '当有用线索从视野中消失，轨迹路由的因果记忆会在正确的分支将它带回。TRACE 让策略携带延迟证据继续前进，而不是重启任务。' },
    { selector: '.project-card:nth-child(2) .project-copy a', en: 'View project ↗', zh: '查看项目 ↗' },
    { selector: '.project-card:nth-child(3) .project-year', en: '2026 · FORCE-AWARE TELEOPERATION', zh: '2026 · 力感知遥操作' },
    { selector: '.project-card:nth-child(3) .project-copy h3', en: 'TriPilot-FF', zh: 'TriPilot-FF' },
    { selector: '.project-card:nth-child(3) .project-copy > p:not(.project-year)', en: 'Whole-body teleoperation becomes a co-pilot: a foot-operated base channel, lidar-driven haptic resistance, and arm-side force reflection help a person read contact and reposition before the robot runs out of reach.', zh: '全身遥操作成为副驾驶：脚控底盘通道、激光雷达驱动的触觉阻力与机械臂侧力反馈，帮助操作者读懂接触并在机器人够不到之前重新定位。' },
    { selector: '.project-card:nth-child(3) .project-copy a', en: 'View project ↗', zh: '查看项目 ↗' },
    { selector: '.publications-head .tag', en: 'Selected works', zh: '代表作' },
    { selector: '.publications-head h2', en: '<span>The evidence behind</span> the claim', zh: '<span>支撑这一主张的</span> 证据' },
    { selector: '.publications-head > p:last-child', en: 'These papers trace the same argument from different scales: coordination is shaped by context, contact, and the structure of the interaction—not by isolated action alone.', zh: '这些论文从不同尺度追踪同一论点：协同由情境、接触和交互结构塑造，而不是由孤立的动作单独决定。' },
    { selector: '.pub-card:nth-child(1) .pub-meta', en: '2026 · COLLABORATIVE POLICIES', zh: '2026 · 协作策略' },
    { selector: '.pub-card:nth-child(1) h3', en: 'Robots that Collaborate: Sequential Asymmetric Imitation', zh: '协作机器人：序列式非对称模仿' },
    { selector: '.pub-card:nth-child(1) p', en: 'Learning to wait, yield, and recover as a partner changes the task.', zh: '学习在伙伴改变任务时等待、让步并恢复。' },
    { selector: '.pub-card:nth-child(1) b', en: 'Read paper ↗', zh: '阅读论文 ↗' },
    { selector: '.pub-card:nth-child(2) .pub-meta', en: '2026 · LONG-HORIZON MEMORY', zh: '2026 · 长时域记忆' },
    { selector: '.pub-card:nth-child(2) h3', en: 'TRACE: Trajectory-Routed Causal Memory', zh: 'TRACE：轨迹路由因果记忆' },
    { selector: '.pub-card:nth-child(2) p', en: 'Carrying evidence forward when the clue has already left the scene.', zh: '在线索离开现场后，仍将证据带向前方。' },
    { selector: '.pub-card:nth-child(2) b', en: 'Read paper ↗', zh: '阅读论文 ↗' },
    { selector: '.pub-card:nth-child(3) .pub-meta', en: '2026 · FORCE-AWARE TELEOPERATION', zh: '2026 · 力感知遥操作' },
    { selector: '.pub-card:nth-child(3) h3', en: 'TriPilot-FF: Coordinated Whole-Body Teleoperation', zh: 'TriPilot-FF：协调式全身遥操作' },
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
    { selector: '.bio-copy h2', en: '<span>I am Zihao Li,</span> building physical intelligence—and the team behind it.', zh: '<span>我是李子豪，</span>正在构建物理智能，以及支撑它的团队。' },
    { selector: '.bio-facts', attribute: 'aria-label', en: 'Current roles and education', zh: '当前角色与教育经历' },
    { selector: '.bio-fact:nth-child(1) > span:last-child', en: 'Founding Researcher of <a class="bio-link" href="https://www.zenobot.ai/" target="_blank" rel="noreferrer">ZENO AI</a>.', zh: 'ZENO AI <a class="bio-link" href="https://www.zenobot.ai/" target="_blank" rel="noreferrer">创始研究员</a>。 ' },
    { selector: '.bio-fact:nth-child(2) > span:last-child', en: 'PhD student of <a class="bio-link" href="https://www.weimingzhi.com/" target="_blank" rel="noreferrer">William Zhi</a> at the <a class="bio-link" href="https://aus.bot/" target="_blank" rel="noreferrer">PAIR Lab</a>, University of Sydney.', zh: '悉尼大学 <a class="bio-link" href="https://aus.bot/" target="_blank" rel="noreferrer">PAIR Lab</a> <a class="bio-link" href="https://www.weimingzhi.com/" target="_blank" rel="noreferrer">William Zhi</a> 教授的博士生。' },
    { selector: '.bio-fact:nth-child(3) > span:last-child', en: 'Graduate of the Interdisciplinary Innovation Platform, Chu Kochen Honors College, Zhejiang University.', zh: '浙江大学竺可桢学院交叉创新平台毕业生。' },
    { selector: '.bio-fact:nth-child(4) > span:last-child', en: "Master's graduate of the College of Control Science and Engineering, Zhejiang University.", zh: '浙江大学控制科学与工程学院硕士毕业生。' },
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
    ['.overview-image', 'A robot preparing a shared bed-making task in a city apartment', '城市公寓中准备共同整理床铺任务的机器人'],
    ['.tile-a img', 'A team of Zeno robots coordinating from local views', '从局部视角进行协同的 Zeno 机器人团队'],
    ['.tile-b img', 'A Zeno robot continuing a long-horizon household task', '持续执行长时域家庭任务的 Zeno 机器人'],
    ['.tile-c img', 'Two Zeno robots jointly manipulating a sheet', '共同操作床单的两台 Zeno 机器人'],
    ['.bio-image img', 'Zihao Li holding a lamb in front of snow-capped mountains', '雪山前抱着小羊的李子豪'],
    ['.pub-card:nth-child(1) img', 'Three-stage SAI curriculum for learning coupled robot policies', '学习协同机器人策略的三阶段 SAI 课程'],
    ['.pub-card:nth-child(2) img', 'TRACE memory recovering an early visual cue at a later branch', 'TRACE 记忆在后续分支恢复早期视觉线索'],
    ['.pub-card:nth-child(3) img', 'TriPilot-FF whole-body teleoperation system with force feedback', '带力反馈的 TriPilot-FF 全身遥操作系统'],
    ['.pub-card:nth-child(4) img', 'TAPOM task-space topology-guided planning through a narrow passage', 'TAPOM 任务空间拓扑引导狭窄通道规划'],
    ['.pub-card:nth-child(5) img', 'Robot-friendly scaffolding connector with passive error correction', '带被动误差修正的机器人友好脚手架连接件'],
    ['.pub-card:nth-child(6) img', 'Complete human, robot, and environment control loop for operational behavior inference', '用于操作行为推断的人、机器人与环境完整控制回路'],
  ];
  const mediaLabels = [
    ['.project-card:nth-child(1) video', 'Two robots spreading a bed sheet together', '两台机器人共同铺开床单'],
    ['.project-card:nth-child(2) video', 'A mobile robot approaching a desk during a long-horizon task', '长时域任务中接近书桌的移动机器人'],
    ['.project-card:nth-child(3) video', 'A mobile manipulator transporting laundry with force-aware control', '使用力感知控制搬运衣物的移动操作机器人'],
  ];
  const metaTranslations = [
    ['meta[name="description"]', 'Zihao Li develops scalable decentralized robot learning systems that coordinate through contact, remember long interactions, and anticipate how each action changes what the team can do.', '李子豪致力于研究可扩展的去中心化机器人学习系统，让机器人通过接触协同、记住长时交互，并预判每个动作如何改变团队的可能性。'],
    ['meta[property="og:title"]', 'Zihao Li — Collaborative Physical Intelligence', '李子豪 — 协作物理智能'],
    ['meta[property="og:description"]', 'From capable robots to capable teams: scalable decentralized learning for coordination, memory, prediction, and recovery.', '从能独立行动的机器人到能协同的团队：面向协同、记忆、预测与恢复的可扩展去中心化学习。'],
    ['meta[name="twitter:title"]', 'Zihao Li — Collaborative Physical Intelligence', '李子豪 — 协作物理智能'],
    ['meta[name="twitter:description"]', 'Scalable decentralized robot learning for teams that coordinate through contact and keep going.', '让团队通过接触协同并持续行动的可扩展去中心化机器人学习。'],
  ];
  let language = 'en';
  const toggle = document.querySelector('#language-toggle');
  const applyLanguage = () => {
    document.documentElement.lang = language === 'en' ? 'en' : 'zh-CN';
    document.title = language === 'en' ? 'Zihao Li — Collaborative Physical Intelligence' : '李子豪 — 协作物理智能';
    translations.forEach(({selector, attribute, en, zh}) => {
      const element = document.querySelector(selector);
      if (!element) return;
      if (attribute) element.setAttribute(attribute, language === 'en' ? en : zh);
      else element.innerHTML = language === 'en' ? en : zh;
    });
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
  };
  if (toggle) {
    toggle.addEventListener('click', () => {
      language = language === 'en' ? 'zh' : 'en';
      applyLanguage();
    });
  }
  applyLanguage();
})();
