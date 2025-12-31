// Vertical page + pill + blobs + reveal text + Works horizontal (SMOOTH) + modal
(() => {
  const pillNav = document.getElementById("pillNav");
  const pillActive = document.getElementById("pillActive");
  const pillLinks = Array.from(document.querySelectorAll("[data-pill]"));

  // -----------------------------
  // Pill bubble positioning
  // -----------------------------
  function positionActiveBubble() {
    if (!pillNav || !pillActive || pillLinks.length === 0) return;
    const active = document.querySelector(".pill-nav a.active") || pillLinks[0];

    const navRect = pillNav.getBoundingClientRect();
    const linkRect = active.getBoundingClientRect();

    const w = linkRect.width + 22;
    const x = linkRect.left - navRect.left + linkRect.width / 2;

    pillActive.style.width = `${w}px`;
    pillActive.style.transform = `translate(${x - w / 2}px, -50%)`;
  }

  window.addEventListener("resize", positionActiveBubble);
  window.addEventListener("load", positionActiveBubble);

  // magnetic hover
  pillLinks.forEach((link) => {
    link.addEventListener("mousemove", (e) => {
      const r = link.getBoundingClientRect();
      const dx = ((e.clientX - (r.left + r.width / 2)) / r.width) * 10;
      link.style.transform = `translateX(${dx}px)`;
    });
    link.addEventListener("mouseleave", () => (link.style.transform = ""));
  });

  // hide/show pill based on scroll direction
  let lastY = window.scrollY;
  function updatePillVisibility() {
    if (!pillNav) return;
    const y = window.scrollY;
    if (y > lastY + 6) pillNav.classList.add("is-hidden");
    if (y < lastY - 6) pillNav.classList.remove("is-hidden");
    lastY = y;
  }

  // liquid feel based on scroll velocity
  let lastScroll = window.scrollY;
  function updatePillLiquid() {
    if (!pillNav || !pillActive) return;
    const y = window.scrollY;
    const vRaw = Math.abs(y - lastScroll);
    lastScroll = y;

    const v = Math.min(1, vRaw / 60);
    const bgAlpha = 0.45 + v * 0.18;
    const blur = 18 + v * 10;

    pillNav.style.background = `rgba(255, 250, 252, ${bgAlpha})`;
    pillNav.style.backdropFilter = `blur(${blur}px) saturate(${1.35 + v * 0.2})`;
    pillNav.style.webkitBackdropFilter = `blur(${blur}px) saturate(${1.35 + v * 0.2})`;
    pillActive.style.opacity = `${0.85 + v * 0.15}`;
  }

  // blobs parallax
  const blobEls = document.querySelectorAll(".blob");
  function updateBlobs() {
    if (!blobEls.length) return;
    const t = window.scrollY || 0;

    blobEls.forEach((b, i) => {
      const x = (t * 0.01) * (i % 2 === 0 ? 1 : -1);
      const y = (t * 0.02) * (i % 3 === 0 ? 1 : -1);
      b.style.transform = `translate3d(${x}px, ${y}px, 0)`;
    });
  }

  // -----------------------------
  // Reveal text (words)
  // -----------------------------
  const revealEls = Array.from(document.querySelectorAll(".reveal-text[data-reveal='words']"));

  function splitIntoWords(el) {
    if (el.classList.contains("script-title")) return;
    if (el.dataset.splitDone === "1") return;
    el.dataset.splitDone = "1";

    const text = el.textContent.replace(/\s+/g, " ").trim();
    el.textContent = "";

    const wrap = document.createElement("span");
    wrap.className = "reveal-wrap";

    const words = text.split(" ");
    words.forEach((w, idx) => {
      const span = document.createElement("span");
      span.className = "reveal-word";
      span.textContent = w;

      // slower stagger
      span.style.transitionDelay = `${idx * 120}ms`;

      wrap.appendChild(span);
      if (idx !== words.length - 1) wrap.appendChild(document.createTextNode(" "));
    });

    el.appendChild(wrap);
  }

  revealEls.forEach(splitIntoWords);

  const panels = Array.from(document.querySelectorAll(".panel"));
  const io = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) entry.target.classList.add("is-revealed");
      });
    },
    { threshold: 0.22 }
  );
  panels.forEach((p) => io.observe(p));

  // -----------------------------
  // Handwriting titles (SVG)
  // -----------------------------
  const scriptTitles = Array.from(document.querySelectorAll(".script-title"));

  scriptTitles.forEach((el) => {
    const dur = Number.parseFloat(el.dataset.writeDuration || "3.1");
    const delay = Number.parseFloat(el.dataset.writeDelay || "0");
    const fillDelay = Number.parseFloat(el.dataset.fillDelay || "2.0");

    el.style.setProperty("--write-duration", `${dur}s`);
    el.style.setProperty("--write-delay", `${delay}s`);
    el.style.setProperty("--fill-delay", `${fillDelay}s`);

    el.addEventListener("click", () => {
      el.classList.remove("is-writing");
      void el.offsetWidth;
      el.classList.add("is-writing");
    });
  });

  if ("IntersectionObserver" in window && scriptTitles.length) {
    const scriptIO = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("is-writing");
          } else {
            entry.target.classList.remove("is-writing");
          }
        });
      },
      { threshold: 0.35 }
    );
    scriptTitles.forEach((el) => scriptIO.observe(el));
  }

  // -----------------------------
  // Works horizontal scrolling (SMOOTH + INERTIA)
  // -----------------------------

    // -----------------------------
  // Works horizontal scrolling (BUTTERY + INFINITE, transform-based)
  // -----------------------------
  const worksRail = document.getElementById("worksRail");
  const worksTrack = document.getElementById("worksTrack");

  if (worksRail && worksTrack) {
    // Duplicate tiles for seamless loop (2x)
    const original = worksTrack.innerHTML;
    worksTrack.innerHTML = original + original;

    // State
    let x = 0;        // position accumulator
    let v = 0;        // velocity
    let raf = null;

    // Tuning (feel free to tweak)
    const WHEEL_BOOST = 0.4;     // scroll strength
    const DRAG_BOOST = .8;      // drag strength
    const FRICTION = .8;        // closer to 1 = longer glide
    const STOP_EPS = 0.003;       // stop tiny jitter

    function loopWidth() {
      // width of ONE copy (half, because duplicated)
      return worksTrack.scrollWidth / 2;
    }

    function mod(n, m) {
      return ((n % m) + m) % m;
    }

    function render() {
      const w = loopWidth();
      if (w > 0) {
        // integrate motion
        x += v;

        // friction
        v *= FRICTION;
        if (Math.abs(v) < STOP_EPS) v = 0;

        // wrap to infinite
        const wrapped = mod(x, w);
        worksTrack.style.transform = `translate3d(${-wrapped}px,0,0)`;
      }
      raf = requestAnimationFrame(render);
    }

    function start() {
      if (raf) return;
      raf = requestAnimationFrame(render);
    }

    // Wheel → horizontal inertia (only when hovering the rail)
    worksRail.addEventListener("wheel", (e) => {
      e.preventDefault();
      // prefer deltaX if trackpad horizontal, else deltaY
      const d = Math.abs(e.deltaX) > Math.abs(e.deltaY) ? e.deltaX : e.deltaY;
      v += d * WHEEL_BOOST;
      start();
    }, { passive: false });

    // Drag (mouse)
    let down = false;
    let lastX = 0;

    worksRail.addEventListener("mousedown", (e) => {
      down = true;
      worksRail.classList.add("is-dragging");
      lastX = e.clientX;
    });

    window.addEventListener("mousemove", (e) => {
      if (!down) return;
      const dx = e.clientX - lastX;
      lastX = e.clientX;

      // drag should feel "grabby"
      v += (-dx) * DRAG_BOOST;
      start();
    }, { passive: true });

    window.addEventListener("mouseup", () => {
      if (!down) return;
      down = false;
      worksRail.classList.remove("is-dragging");
    });

    // Touch drag (mobile)
    let touchLastX = 0;

    worksRail.addEventListener("touchstart", (e) => {
      touchLastX = e.touches[0].clientX;
    }, { passive: true });

    worksRail.addEventListener("touchmove", (e) => {
      const cx = e.touches[0].clientX;
      const dx = cx - touchLastX;
      touchLastX = cx;

      v += (-dx) * 0.9;
      start();
    }, { passive: true });

    // If user clicks a tile, don't let dragging accidentally trigger click
    // (tiny guard: if velocity is high, ignore click)
    worksRail.addEventListener("click", (e) => {
      if (Math.abs(v) > 2.2) e.preventDefault();
    }, true);

    start();
  }


  // -----------------------------
  // Modal details (click tile)
  // -----------------------------
  const modal = document.getElementById("workModal");
  const modalMedia = document.getElementById("modalMedia");
  const modalTitle = document.getElementById("modalTitle");
  const modalYear = document.getElementById("modalYear");
  const modalDesc = document.getElementById("modalDesc");

  function openModal({ type, src, title, year, desc }) {
    if (!modal) return;

    modal.classList.add("is-open");
    modal.setAttribute("aria-hidden", "false");

    if (modalTitle) modalTitle.textContent = title || "Work";
    if (modalYear) modalYear.textContent = year || "";
    if (modalDesc) modalDesc.textContent = desc || "";

    if (modalMedia) {
      modalMedia.innerHTML = "";
      if (type === "video") {
        const v = document.createElement("video");
        v.controls = true;
        v.playsInline = true;
        v.preload = "metadata";
        v.src = src;
        modalMedia.appendChild(v);
        v.play?.().catch(() => {});
      } else {
        const img = document.createElement("img");
        img.alt = `${title || "Work"} — ${year || ""}`.trim();
        img.src = src;
        modalMedia.appendChild(img);
      }
    }

    document.body.style.overflow = "hidden";
  }

  function closeModal() {
    if (!modal) return;
    modal.classList.remove("is-open");
    modal.setAttribute("aria-hidden", "true");
    if (modalMedia) modalMedia.innerHTML = "";
    document.body.style.overflow = "";
  }

  document.addEventListener("click", (e) => {
    const tile = e.target.closest?.(".work-tile");
    if (tile) {
      openModal({
        type: tile.dataset.type,
        src: tile.dataset.src,
        title: tile.dataset.title,
        year: tile.dataset.year,
        desc: tile.dataset.desc,
      });
      return;
    }

    if (e.target.matches?.("[data-close]")) closeModal();
  });

  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") closeModal();
  });

  // -----------------------------
  // Scroll listeners
  // -----------------------------
  window.addEventListener(
    "scroll",
    () => {
      updatePillVisibility();
      updatePillLiquid();
      updateBlobs();
    },
    { passive: true }
  );
  // ===== Experience page extras (safe to paste near bottom) =====
(() => {
  const expVideos = Array.from(document.querySelectorAll(".exp-media video"));

  if (!("IntersectionObserver" in window) || expVideos.length === 0) return;

  const vIO = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        const v = entry.target;
        if (entry.isIntersecting) {
          // keep it subtle: only attempt play if muted
          if (v.muted) v.play?.().catch(() => {});
        } else {
          v.pause?.();
        }
      });
    },
    { threshold: 0.35 }
  );

  expVideos.forEach((v) => vIO.observe(v));
})();

  


  // init
  positionActiveBubble();
  updatePillVisibility();
  updatePillLiquid();
  updateBlobs();
})();
