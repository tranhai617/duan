(() => {
  "use strict";

  const prefersReduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const $ = (s, c = document) => c.querySelector(s);
  const $$ = (s, c = document) => [...c.querySelectorAll(s)];

  /* ============ TOAST ============ */
  const toastEl = $("#toast");
  let toastTimer;
  function toast(msg) {
    toastEl.textContent = msg;
    toastEl.classList.add("show");
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => toastEl.classList.remove("show"), 2600);
  }

  /* ============ PETALS ============ */
  const canvas = $("#petals");
  const ctx = canvas.getContext("2d");
  let W = 0, H = 0, DPR = 1;
  const petals = [];
  const palette = [
    [231, 159, 178],
    [247, 219, 227],
    [217, 178, 108],
    [255, 246, 240],
    [201, 107, 134],
    [255, 214, 154],
  ];

  function resize() {
    DPR = Math.min(window.devicePixelRatio || 1, 2);
    W = window.innerWidth;
    H = window.innerHeight;
    canvas.width = W * DPR;
    canvas.height = H * DPR;
    canvas.style.width = W + "px";
    canvas.style.height = H + "px";
    ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
  }

  function makePetal(fromTop = true) {
    const c = palette[(Math.random() * palette.length) | 0];
    return {
      x: Math.random() * W,
      y: fromTop ? -30 - Math.random() * H * 0.3 : Math.random() * H,
      s: 6 + Math.random() * 11,
      rot: Math.random() * Math.PI * 2,
      rotV: (Math.random() - 0.5) * 0.03,
      vy: 0.45 + Math.random() * 0.85,
      swayAmp: 0.5 + Math.random() * 1.6,
      swayFreq: 0.006 + Math.random() * 0.012,
      phase: Math.random() * Math.PI * 2,
      c,
      a: 0.35 + Math.random() * 0.5,
      tilt: Math.random() * Math.PI * 2,
      tiltV: 0.01 + Math.random() * 0.03,
      burst: false,
    };
  }

  function spawnAmbient(n) {
    const count = n ?? Math.round(Math.min(46, W / 30));
    for (let i = 0; i < count; i++) petals.push(makePetal(false));
  }

  function burstPetals(n = 80) {
    const cx = W / 2, cy = H * 0.62;
    for (let i = 0; i < n; i++) {
      const p = makePetal(false);
      const ang = Math.random() * Math.PI * 2;
      const power = 5 + Math.random() * 13;
      p.x = cx + (Math.random() - 0.5) * 140;
      p.y = cy + (Math.random() - 0.5) * 80;
      p.bx = Math.cos(ang) * power;
      p.by = Math.sin(ang) * power - 5;
      p.vy = 0.4 + Math.random() * 0.7;
      p.burst = true;
      p.life = 1;
      petals.push(p);
    }
  }

  function drawPetal(p) {
    const s = p.s;
    const squash = 0.45 + Math.abs(Math.cos(p.tilt)) * 0.55;
    ctx.save();
    ctx.translate(p.x, p.y);
    ctx.rotate(p.rot);
    ctx.scale(1, squash);
    ctx.globalAlpha = p.a * (p.burst ? Math.max(p.life, 0) : 1);
    ctx.fillStyle = `rgb(${p.c[0]},${p.c[1]},${p.c[2]})`;
    ctx.beginPath();
    ctx.moveTo(0, -s);
    ctx.bezierCurveTo(s * 0.95, -s * 0.45, s * 0.75, s * 0.7, 0, s);
    ctx.bezierCurveTo(-s * 0.75, s * 0.7, -s * 0.95, -s * 0.45, 0, -s);
    ctx.fill();
    ctx.globalAlpha *= 0.35;
    ctx.strokeStyle = "rgba(255,255,255,0.9)";
    ctx.lineWidth = 0.6;
    ctx.stroke();
    ctx.restore();
  }

  let t = 0;
  function loop() {
    t += 1;
    ctx.clearRect(0, 0, W, H);
    for (let i = petals.length - 1; i >= 0; i--) {
      const p = petals[i];
      p.rot += p.rotV;
      p.tilt += p.tiltV;

      if (p.burst) {
        p.by += 0.18;
        p.bx *= 0.985;
        p.x += p.bx;
        p.y += p.by + p.vy * 0.4;
        p.life -= 0.0055;
        if (p.life <= 0) { petals.splice(i, 1); continue; }
      } else {
        p.y += p.vy;
        p.x += Math.sin(t * p.swayFreq + p.phase) * p.swayAmp;
        if (p.y > H + 40 || p.x < -60 || p.x > W + 60) {
          petals[i] = makePetal(true);
          continue;
        }
      }
      drawPetal(p);
    }
    requestAnimationFrame(loop);
  }

  resize();
  spawnAmbient();
  window.addEventListener("resize", () => {
    resize();
    const target = Math.round(Math.min(46, W / 30));
    while (petals.length > target) petals.splice(0, 1);
    if (petals.length < target) spawnAmbient(target - petals.length);
  });
  if (!prefersReduced) requestAnimationFrame(loop);
  else petals.slice(0, 20).forEach(drawPetal);

  /* ============ SMOOTH SCROLL ============ */
  function easeInOutCubic(x) {
    return x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2;
  }

  function scrollToTarget(target) {
    const navH = 96;
    const startY = window.scrollY;
    const endY = target.getBoundingClientRect().top + startY - navH;
    const dist = endY - startY;
    if (Math.abs(dist) < 4) return;
    const root = document.documentElement;
    const prevBehavior = root.style.scrollBehavior;
    root.style.scrollBehavior = "auto";
    if (prefersReduced) {
      window.scrollTo(0, endY);
      root.style.scrollBehavior = prevBehavior;
      return;
    }
    const dur = Math.min(1400, 500 + Math.abs(dist) * 0.35);
    const t0 = performance.now();
    (function step(now) {
      const p = Math.min((now - t0) / dur, 1);
      window.scrollTo(0, startY + dist * easeInOutCubic(p));
      if (p < 1) requestAnimationFrame(step);
      else root.style.scrollBehavior = prevBehavior;
    })(performance.now());
  }

  $$('a[href^="#"]').forEach((a) => {
    a.addEventListener("click", (e) => {
      const id = a.getAttribute("href");
      if (id.length < 2) return;
      const el = document.querySelector(id);
      if (!el) return;
      e.preventDefault();
      scrollToTarget(el);
      navLinks.classList.remove("open");
      burger.classList.remove("open");
    });
  });

  /* ============ NAV ============ */
  const nav = $("#nav");
  const navLinks = $("#navLinks");
  const burger = $("#navBurger");
  const progressBar = $("#progressBar");

  burger.addEventListener("click", () => {
    burger.classList.toggle("open");
    navLinks.classList.toggle("open");
  });

  const sections = $$("header[id], main section[id]");
  const navAnchors = $$(".nav__link");
  const spy = new IntersectionObserver(
    (entries) => {
      entries.forEach((en) => {
        if (!en.isIntersecting) return;
        navAnchors.forEach((l) =>
          l.classList.toggle("active", l.getAttribute("href") === "#" + en.target.id)
        );
      });
    },
    { rootMargin: "-40% 0px -55% 0px" }
  );
  sections.forEach((s) => spy.observe(s));

  /* ============ SCROLL: progress, nav state, parallax ============ */
  const parallaxEls = $$("[data-parallax]").map((el) => ({
    el,
    f: parseFloat(el.dataset.parallax),
    centered: el.classList.contains("hero__watermark"),
  }));
  let mx = 0, my = 0;

  window.addEventListener("mousemove", (e) => {
    mx = (e.clientX / window.innerWidth - 0.5) * 2;
    my = (e.clientY / window.innerHeight - 0.5) * 2;
  }, { passive: true });

  let ticking = false;
  function onScroll() {
    if (ticking) return;
    ticking = true;
    requestAnimationFrame(() => {
      const y = window.scrollY;
      const max = document.documentElement.scrollHeight - window.innerHeight;
      progressBar.style.width = (max > 0 ? (y / max) * 100 : 0) + "%";
      nav.classList.toggle("scrolled", y > 40);

      if (!prefersReduced) {
        parallaxEls.forEach(({ el, f, centered }) => {
          const ty = y * f * 0.28;
          const tx = mx * 26 * f;
          const tyy = my * 16 * f;
          el.style.transform = centered
            ? `translate(calc(-50% + ${tx}px), calc(-50% + ${ty + tyy}px))`
            : `translate3d(${tx}px, ${ty + tyy}px, 0)`;
        });
      }
      ticking = false;
    });
  }
  window.addEventListener("scroll", onScroll, { passive: true });
  onScroll();

  /* ============ REVEAL ============ */
  const revealEls = $$(".reveal");
  revealEls.forEach((el) => {
    if (el.dataset.delay) el.style.setProperty("--d", el.dataset.delay + "ms");
  });
  const revealer = new IntersectionObserver(
    (entries, obs) => {
      entries.forEach((en) => {
        if (en.isIntersecting) {
          en.target.classList.add("visible");
          obs.unobserve(en.target);
        }
      });
    },
    { threshold: 0.14, rootMargin: "0px 0px -6% 0px" }
  );
  revealEls.forEach((el) => revealer.observe(el));

  /* ============ COUNTERS ============ */
  const counters = $$(".stat__num[data-count]");
  const counterObs = new IntersectionObserver(
    (entries, obs) => {
      entries.forEach((en) => {
        if (!en.isIntersecting) return;
        const el = en.target;
        obs.unobserve(el);
        const target = parseInt(el.dataset.count, 10);
        const suffix = el.dataset.suffix || "";
        const dur = 1800;
        const t0 = performance.now();
        (function tick(now) {
          const p = Math.min((now - t0) / dur, 1);
          const v = Math.round(target * (1 - Math.pow(1 - p, 3)));
          el.textContent = v + suffix;
          if (p < 1) requestAnimationFrame(tick);
        })(t0);
      });
    },
    { threshold: 0.6 }
  );
  counters.forEach((c) => counterObs.observe(c));

  /* ============ FLIP CARDS ============ */
  $$(".flip").forEach((card) => {
    const toggle = () => card.classList.toggle("flipped");
    card.addEventListener("click", toggle);
    card.addEventListener("keydown", (e) => {
      if (e.key === "Enter" || e.key === " ") { e.preventDefault(); toggle(); }
    });
  });

  /* ============ TILT ============ */
  if (!prefersReduced && window.matchMedia("(pointer: fine)").matches) {
    $$(".tilt").forEach((el) => {
      el.addEventListener("mousemove", (e) => {
        const r = el.getBoundingClientRect();
        const px = (e.clientX - r.left) / r.width - 0.5;
        const py = (e.clientY - r.top) / r.height - 0.5;
        el.style.transform = `perspective(800px) rotateY(${px * 9}deg) rotateX(${-py * 9}deg) translateY(-6px)`;
      });
      el.addEventListener("mouseleave", () => { el.style.transform = ""; });
    });
  }

  /* ============ WISH GENERATOR ============ */
  const appreciation = {
    mom: "Cảm ơn mẹ đã luôn tảo tần, hy sinh và yêu thương con bằng một tình yêu không điều kiện.",
    lover: "Cảm ơn em/bạn đã luôn là người đồng hành dịu dàng, là lý do mỗi ngày của anh/ta đều trở nên rực rỡ.",
    sister: "Cảm ơn chị/em đã luôn nhường nhịn, chia sẻ và trở thành người thân thiết nhất trong những ký ức tuổi thơ.",
    friend: "Cảm ơn bạn đã luôn ở cạnh, cùng khóc cùng cười và biến những ngày thường thành kỷ niệm đẹp.",
    colleague: "Cảm ơn chị/em đã luôn đồng hành nhiệt tình, mang nguồn năng lượng tích cực đến mỗi ngày làm việc.",
    teacher: "Cảm ơn cô đã dìu dắt bằng cả tri thức và trái tim nhân hậu, để con vững bước trên đường đời.",
  };

  const toneLine = {
    tender: "Gửi đến người những lời chúc dịu dàng và chân thành nhất.",
    romantic: "Mong mọi ngọt ngào nhất trên đời này đều thuộc về người.",
    fun: "Chúc một ngày 20/10 cười nhiều lắm, ăn ngon lắm và vui hết nấc!",
    formal: "Kính chúc người một ngày 20/10 trang trọng và ấm áp.",
  };

  const closing = {
    mom: "Chúc mẹ luôn mạnh khỏe, bình an và mãi là nơi con luôn trở về.",
    lover: "Chúc người của anh/ta luôn xinh đẹp, hạnh phúc và yêu đời nhé.",
    sister: "Chúc chị/em luôn rạng rỡ, thành công và may mắn trong mọi dự định.",
    friend: "Chúc bạn luôn xinh đẹp, tự do và có thêm thật nhiều chuyến đi thú vị.",
    colleague: "Chúc chị/em công việc hanh thông, luôn tràn đầy năng lượng tích cực.",
    teacher: "Chúc cô luôn dồi dào sức khỏe và tiếp tục truyền cảm hứng cho bao thế hệ.",
  };

  const greet = (name, relation) => {
    const n = (name || "").trim() || "người thương";
    if (relation === "mom") return `${n} yêu dấu,`;
    if (relation === "lover") return `${n} của anh/ta,`;
    return `${n} thân mến,`;
  };

  const form = $("#wishForm");
  const previewText = $("#previewText");
  const previewCard = $("#previewCard");
  const copyBtn = $("#copyBtn");
  const copyToast = $("#copyToast");
  let currentWish = "";

  function buildWish() {
    const name = $("#recipient").value;
    const rel = $("#relation").value;
    const tone = $("#tone").value;
    currentWish = `${greet(name, rel)} ${appreciation[rel]} ${toneLine[tone]} ${closing[rel]}`;
    previewText.textContent = currentWish;
    previewCard.classList.remove("pop");
    void previewCard.offsetWidth;
    previewCard.classList.add("pop");
    return currentWish;
  }

  form.addEventListener("submit", (e) => {
    e.preventDefault();
    buildWish();
    burstPetals(70);
    toast("Lời chúc đã được viết từ trái tim!");
  });

  ["recipient", "relation", "tone"].forEach((id) => {
    $("#" + id).addEventListener("input", () => {
      if ($("#recipient").value.trim()) buildWish();
    });
  });

  copyBtn.addEventListener("click", async () => {
    const text = currentWish || buildWish();
    try {
      await navigator.clipboard.writeText(text);
    } catch {
      const ta = document.createElement("textarea");
      ta.value = text;
      document.body.appendChild(ta);
      ta.select();
      document.execCommand("copy");
      ta.remove();
    }
    copyToast.classList.add("show");
    setTimeout(() => copyToast.classList.remove("show"), 2200);
  });

  /* ============ QUOTES ============ */
  const quotes = $$(".quote");
  const dotsWrap = $("#quoteDots");
  let qi = 0, qTimer;

  quotes.forEach((_, i) => {
    const b = document.createElement("button");
    b.setAttribute("aria-label", "Lời nhắn " + (i + 1));
    if (i === 0) b.classList.add("active");
    b.addEventListener("click", () => { showQuote(i); restartQuotes(); });
    dotsWrap.appendChild(b);
  });

  function showQuote(i) {
    qi = (i + quotes.length) % quotes.length;
    quotes.forEach((q, k) => q.classList.toggle("active", k === qi));
    $$("button", dotsWrap).forEach((d, k) => d.classList.toggle("active", k === qi));
  }

  function restartQuotes() {
    clearInterval(qTimer);
    if (!prefersReduced) qTimer = setInterval(() => showQuote(qi + 1), 6000);
  }
  restartQuotes();

  $("#quotesBox").addEventListener("mouseenter", () => clearInterval(qTimer));
  $("#quotesBox").addEventListener("mouseleave", restartQuotes);

  /* ============ CONFETTI BUTTON ============ */
  $("#confettiBtn").addEventListener("click", () => {
    burstPetals(120);
    toast("Một rừng hoa gửi tới phái đẹp!");
  });

  /* ============ MUSIC (Web Audio) ============ */
  const musicBtn = $("#musicBtn");
  const Music = (() => {
    let ac = null, master = null, delay = null, fb = null;
    let running = false, timer = null;
    let nextTime = 0, beat = 0;
    const live = new Set();

    const chords = [
      [174.61, 220.0, 261.63, 329.63],
      [220.0, 261.63, 329.63, 392.0],
      [233.08, 293.66, 349.23, 440.0],
      [261.63, 329.63, 392.0, 523.25],
    ];
    const beatLen = 0.5;
    const beatsPerChord = 8;

    function init() {
      ac = new (window.AudioContext || window.webkitAudioContext)();
      master = ac.createGain();
      master.gain.value = 0;
      const comp = ac.createDynamicsCompressor();
      delay = ac.createDelay(1.2);
      delay.delayTime.value = 0.34;
      fb = ac.createGain();
      fb.gain.value = 0.32;
      const wet = ac.createGain();
      wet.gain.value = 0.5;
      master.connect(comp);
      master.connect(delay);
      delay.connect(fb);
      fb.connect(delay);
      delay.connect(wet);
      wet.connect(comp);
      comp.connect(ac.destination);
    }

    function note(freq, time, dur, type, vol, sendDelay = true) {
      const osc = ac.createOscillator();
      const g = ac.createGain();
      const lp = ac.createBiquadFilter();
      lp.type = "lowpass";
      lp.frequency.value = 2400;
      osc.type = type;
      osc.frequency.value = freq;
      g.gain.setValueAtTime(0.0001, time);
      g.gain.exponentialRampToValueAtTime(vol, time + 0.04);
      g.gain.exponentialRampToValueAtTime(0.0001, time + dur);
      osc.connect(lp);
      lp.connect(g);
      g.connect(master);
      if (sendDelay) g.connect(delay);
      osc.start(time);
      osc.stop(time + dur + 0.1);
      live.add(osc);
      osc.onended = () => { live.delete(osc); g.disconnect(); lp.disconnect(); };
    }

    function scheduleChord(time, chord) {
      chord.forEach((f, i) => {
        note(f / 2, time, 4.4, "sine", 0.055, false);
        if (i === 0) note(f / 4, time, 4.4, "sine", 0.045, false);
      });
    }

    function scheduler() {
      while (nextTime < ac.currentTime + 0.3) {
        const idx = Math.floor(beat / beatsPerChord) % chords.length;
        const chord = chords[idx];
        if (beat % beatsPerChord === 0) scheduleChord(nextTime, chord);

        const arp = chord[beat % chord.length] * (beat % 16 < 8 ? 2 : 4);
        note(arp, nextTime, 1.4, "triangle", 0.05);

        if (beat % 4 === 2) {
          note(chord[(beat + 2) % chord.length] * 4, nextTime + 0.25, 0.9, "sine", 0.032);
        }

        nextTime += beatLen;
        beat++;
      }
    }

    return {
      toggle() {
        if (!ac) init();
        if (ac.state === "suspended") ac.resume();
        running = !running;
        if (running) {
          beat = 0;
          nextTime = ac.currentTime + 0.12;
          master.gain.cancelScheduledValues(ac.currentTime);
          master.gain.setValueAtTime(Math.max(master.gain.value, 0.0001), ac.currentTime);
          master.gain.linearRampToValueAtTime(0.62, ac.currentTime + 1.4);
          scheduler();
          timer = setInterval(scheduler, 60);
        } else {
          master.gain.cancelScheduledValues(ac.currentTime);
          master.gain.setValueAtTime(master.gain.value, ac.currentTime);
          master.gain.linearRampToValueAtTime(0.0001, ac.currentTime + 0.9);
          clearInterval(timer);
          timer = null;
          setTimeout(() => {
            if (running) return;
            live.forEach((n) => { try { n.stop(); } catch {} });
            live.clear();
          }, 1100);
        }
        return running;
      },
      get running() { return running; },
    };
  })();

  musicBtn.addEventListener("click", () => {
    const on = Music.toggle();
    musicBtn.classList.toggle("playing", on);
    toast(on ? "Đang phát: Giai điệu 20/10" : "Đã tắt nhạc nền");
  });

  /* ============ INIT ============ */
  $$(".hero .reveal").forEach((el, i) => {
    setTimeout(() => el.classList.add("visible"), 120 + i * 90);
  });
})();
