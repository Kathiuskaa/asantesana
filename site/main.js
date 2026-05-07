/* ========== ALGORITHMIC ART — ROOTS ========== */
(function () {
  const canvas = document.getElementById('heroCanvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  let w, h, roots = [];
  const GROW_DURATION = 3.5; // seconds
  let startTime = null;

  function resize() {
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const rect = canvas.parentElement.getBoundingClientRect();
    w = rect.width; h = rect.height;
    canvas.width = w * dpr; canvas.height = h * dpr;
    canvas.style.width = w + 'px'; canvas.style.height = h + 'px';
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }

  function seededRand(seed) {
    let s = seed;
    return function () {
      s = (s * 9301 + 49297) % 233280;
      return s / 233280;
    };
  }

  // Quick start then smooth landing — organic growth
  function easeGrow(t) {
    if (t <= 0) return 0;
    if (t >= 1) return 1;
    // Fast rise in first 20%, smooth deceleration after
    return t < 0.2
      ? 2.5 * t * t
      : 0.1 + 0.9 * (1 - Math.pow(1 - (t - 0.2) / 0.8, 2.5));
  }

  // Build a root trunk with sub-branches that fork naturally
  function buildBranch(sx, sy, angle, depth, maxDepth, segLen, rng, delay) {
    const segments = depth === 0 ? 22 + Math.floor(rng() * 12) : 10 + Math.floor(rng() * 8);
    const points = [{ x: sx, y: sy }];
    let a = angle;
    // Organic: gentle primary wave + subtle secondary wave
    const wave1 = 0.03 + rng() * 0.04; // slow, large undulation
    const wave2 = 0.08 + rng() * 0.06; // faster, smaller detail
    const phase1 = rng() * Math.PI * 2;
    const phase2 = rng() * Math.PI * 2;
    const curveDir = rng() > 0.5 ? 1 : -1;
    const thickness = Math.max(0.4, (2.8 - depth * 0.9) * (0.7 + rng() * 0.4));
    const opacity = Math.max(0.06, (0.2 - depth * 0.05) * (0.7 + rng() * 0.5));
    const baseLen = segLen * (1 - depth * 0.2);

    for (let s = 1; s <= segments; s++) {
      // Multi-frequency organic curve
      const t = s / segments;
      a += Math.sin(s * 0.25 + phase1) * wave1 * curveDir
         + Math.sin(s * 0.6 + phase2) * wave2 * 0.4
         + (rng() - 0.5) * 0.02;
      // Variable segment length for irregularity
      const segVariation = baseLen * (0.8 + rng() * 0.4);
      const px = points[s - 1].x + Math.cos(a) * segVariation;
      const py = points[s - 1].y + Math.sin(a) * segVariation;
      points.push({ x: px, y: py });
    }

    const branch = { points, thickness, opacity, delay };
    const result = [branch];

    if (depth < maxDepth) {
      // More forks, alternating sides for bilateral organic feel
      const forkCount = depth === 0 ? 2 + Math.floor(rng() * 2) : 1 + Math.floor(rng());
      for (let f = 0; f < forkCount; f++) {
        const forkZone = (f + 1) / (forkCount + 1);
        const forkAt = Math.floor(forkZone * segments * 0.85) + Math.floor(rng() * 2);
        if (forkAt < points.length && forkAt > 0) {
          const localAngle = Math.atan2(
            points[forkAt].y - points[forkAt - 1].y,
            points[forkAt].x - points[forkAt - 1].x
          );
          // Alternate: even forks go left, odd forks go right
          const side = (f % 2 === 0) ? 1 : -1;
          const forkAngle = localAngle + side * (0.35 + rng() * 0.4);
          const subDelay = delay + forkZone * 0.08;
          const subBranches = buildBranch(
            points[forkAt].x, points[forkAt].y,
            forkAngle, depth + 1, maxDepth,
            baseLen * 0.65, seededRand(Math.floor(rng() * 99999)),
            subDelay
          );
          result.push(...subBranches);
        }
      }
    }
    return result;
  }

  function createRoots() {
    roots = [];

    // Mirror helper: duplicate branches with horizontal flip
    function mirrorX(branches) {
      return branches.map(b => ({
        points: b.points.map(p => ({ x: w - p.x, y: p.y })),
        thickness: b.thickness, opacity: b.opacity, delay: b.delay,
      }));
    }
    // Mirror helper: duplicate branches with vertical flip
    function mirrorY(branches) {
      return branches.map(b => ({
        points: b.points.map(p => ({ x: p.x, y: h - p.y })),
        thickness: b.thickness, opacity: b.opacity, delay: b.delay,
      }));
    }

    // === LEFT EDGE roots (mirrored to right for symmetry) ===
    const sideCount = Math.max(5, Math.floor(h / 100));
    const cy = h / 2;
    for (let i = 0; i < sideCount; i++) {
      const rng = seededRand(i * 251 + 77);
      const sy = (h * 0.05) + (i / (sideCount - 1)) * (h * 0.9);
      // Aim slightly toward vertical center for balanced spread
      const towardCenter = Math.atan2(cy - sy, w * 0.5) * 0.3;
      const dir = towardCenter + (rng() - 0.5) * 0.15;
      const delay = i * 0.012;
      const maxDepth = 1 + Math.floor(rng() * 2);
      const segLen = 14 + rng() * 8;
      const branches = buildBranch(-5, sy, dir, 0, maxDepth, segLen, rng, delay);
      roots.push(...branches);
      roots.push(...mirrorX(branches));
    }

    // === TOP EDGE roots (mirrored to bottom for symmetry) ===
    const topCount = Math.max(5, Math.floor(w / 200));
    for (let i = 0; i < topCount; i++) {
      const rng = seededRand(i * 397 + 113);
      const sx = (w * 0.1) + (i / (topCount - 1)) * (w * 0.8);
      const dir = Math.PI / 2 + (rng() - 0.5) * 0.3; // nearly vertical downward
      const delay = rng() * 0.05;
      const maxDepth = 1 + Math.floor(rng());
      const segLen = 12 + rng() * 8;
      const branches = buildBranch(sx, -5, dir, 0, maxDepth, segLen, rng, delay);
      roots.push(...branches);
      roots.push(...mirrorY(branches));
    }

    startTime = null;
  }

  let scrollProgress = 1;
  let growDone = false;

  function setupScroll() {
    const hero = canvas.parentElement;

    window.addEventListener('scroll', () => {
      const rect = hero.getBoundingClientRect();
      const heroH = rect.height;
      const visible = Math.max(0, Math.min(1, rect.bottom / heroH));
      scrollProgress = visible;
    }, { passive: true });
  }

  function draw(timestamp) {
    if (!startTime) startTime = timestamp;
    const elapsed = (timestamp - startTime) / 1000;
    ctx.clearRect(0, 0, w, h);

    // Check if initial grow is done
    if (!growDone && elapsed > GROW_DURATION * 1.1) {
      growDone = true;
    }

    for (const root of roots) {
      let progress;

      if (!growDone) {
        // Phase 1: Grow animation plays fully
        const rootElapsed = Math.max(0, elapsed - root.delay * GROW_DURATION);
        const rootGrowTime = GROW_DURATION * (0.7 + (1 - root.delay) * 0.3);
        progress = easeGrow(Math.min(1, rootElapsed / rootGrowTime));
      } else {
        // Phase 2: Scroll retracts — remap so roots gone at 40% scroll
        // scrollProgress: 1 = top, 0.6 = 40% scrolled → roots gone
        const mapped = Math.max(0, Math.min(1, (scrollProgress - 0.5) / 0.5));
        progress = easeGrow(mapped);
      }

      if (progress <= 0) continue;

      const count = Math.max(2, Math.floor(progress * root.points.length));
      const pts = root.points.slice(0, count);
      const total = root.points.length;

      const fadeIn = Math.min(1, progress * 4);
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';

      // Draw with smooth quadratic curves + tapering
      for (let i = 1; i < pts.length; i++) {
        const t = i / total;
        const taper = root.thickness * (1 - t * 0.85);
        const segOpacity = root.opacity * fadeIn * (1 - t * 0.3);

        ctx.beginPath();
        if (i === 1) {
          ctx.moveTo(pts[0].x, pts[0].y);
          ctx.lineTo(pts[1].x, pts[1].y);
        } else {
          // Smooth curve using midpoints
          const prev = pts[i - 2];
          const curr = pts[i - 1];
          const next = pts[i];
          const mx = (curr.x + next.x) / 2;
          const my = (curr.y + next.y) / 2;
          ctx.moveTo((prev.x + curr.x) / 2, (prev.y + curr.y) / 2);
          ctx.quadraticCurveTo(curr.x, curr.y, mx, my);
        }
        ctx.strokeStyle = `rgba(245, 240, 232, ${segOpacity})`;
        ctx.lineWidth = Math.max(0.3, taper);
        ctx.stroke();
      }

      // Draw small leaf sprout at the tip when branch is fully grown
      if (progress > 0.85 && pts.length >= 3) {
        const tip = pts[pts.length - 1];
        const prev = pts[pts.length - 2];
        const tipAngle = Math.atan2(tip.y - prev.y, tip.x - prev.x);
        const leafSize = 3 + root.thickness * 1.2;
        const leafAlpha = root.opacity * fadeIn * Math.min(1, (progress - 0.85) / 0.15);

        ctx.save();
        ctx.translate(tip.x, tip.y);
        ctx.rotate(tipAngle);

        // Teardrop leaf shape
        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.bezierCurveTo(
          leafSize * 0.3, -leafSize * 0.5,
          leafSize * 0.9, -leafSize * 0.3,
          leafSize, 0
        );
        ctx.bezierCurveTo(
          leafSize * 0.9, leafSize * 0.3,
          leafSize * 0.3, leafSize * 0.5,
          0, 0
        );
        ctx.fillStyle = `rgba(245, 240, 232, ${leafAlpha * 0.6})`;
        ctx.fill();

        ctx.restore();
      }
    }

    requestAnimationFrame(draw);
  }

  resize();
  createRoots();
  setupScroll();
  requestAnimationFrame(draw);
  window.addEventListener('resize', () => { resize(); createRoots(); });
})();

/* ========== FALLING LEAVES — SERVICES CANVAS ========== */
(function () {
  const canvas = document.getElementById('leavesCanvas');
  if (!canvas) return;
  const section = canvas.parentElement;
  const ctx = canvas.getContext('2d');
  let w, h, leaves = [];
  let isVisible = false;
  let time = 0;

  function resize() {
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    w = section.offsetWidth;
    h = section.offsetHeight;
    canvas.width = w * dpr;
    canvas.height = h * dpr;
    canvas.style.width = w + 'px';
    canvas.style.height = h + 'px';
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }

  function spawnLeaf(startRandom) {
    // Bigger leaves with variety
    const sizeRoll = Math.random();
    const size = sizeRoll < 0.35 ? 5 + Math.random() * 5
               : sizeRoll < 0.7 ? 14 + Math.random() * 8
               : 26 + Math.random() * 12;

    const gravity = 0.4 + Math.random() * 0.7;
    const wind = 0.2 + Math.random() * 0.5; // rightward wind drift
    let x, y;
    if (startRandom) {
      x = Math.random() * w;
      y = Math.random() * h;
    } else {
      // Spawn from top-left area
      if (Math.random() > 0.4) {
        x = Math.random() * w * 0.7;
        y = -10 - Math.random() * 60;
      } else {
        x = -10 - Math.random() * 40;
        y = Math.random() * h * 0.5;
      }
    }
    return {
      x, y, size,
      speedY: gravity,
      speedX: wind,
      sway: Math.random() * Math.PI * 2,
      swaySpeed: 0.015 + Math.random() * 0.025,
      swayAmp: 0.8 + Math.random() * 1.2,
      rotation: Math.random() * Math.PI * 2,
      rotSpeed: (Math.random() - 0.5) * 0.02,
      opacity: size > 22 ? 0.03 + Math.random() * 0.03
             : size < 10 ? 0.07 + Math.random() * 0.05
             : 0.05 + Math.random() * 0.04,
    };
  }

  function createLeaves() {
    leaves = [];
    const count = 20 + Math.floor(Math.random() * 6);
    for (let i = 0; i < count; i++) {
      leaves.push(spawnLeaf(true));
    }
  }

  function drawLeaf(x, y, size, rotation, opacity) {
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(rotation);
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.quadraticCurveTo(size * 0.25, -size * 0.45, size, 0);
    ctx.quadraticCurveTo(size * 0.25, size * 0.45, 0, 0);
    ctx.fillStyle = `rgba(245, 240, 232, ${opacity})`;
    ctx.fill();
    if (size > 8) {
      ctx.beginPath();
      ctx.moveTo(size * 0.1, 0);
      ctx.lineTo(size * 0.8, 0);
      ctx.strokeStyle = `rgba(245, 240, 232, ${opacity * 0.35})`;
      ctx.lineWidth = 0.5;
      ctx.stroke();
    }
    ctx.restore();
  }

  function draw() {
    if (!isVisible) { requestAnimationFrame(draw); return; }
    ctx.clearRect(0, 0, w, h);
    time += 0.01;

    // Organic density: sometimes more leaves spawn, sometimes fewer
    const spawnChance = 0.02 + Math.sin(time * 0.7) * 0.015;
    if (leaves.length < 28 && Math.random() < spawnChance) {
      leaves.push(spawnLeaf(false));
    }

    for (let i = leaves.length - 1; i >= 0; i--) {
      const leaf = leaves[i];
      // Gravity + sway
      leaf.sway += leaf.swaySpeed;
      leaf.x += leaf.speedX + Math.sin(leaf.sway) * leaf.swayAmp;
      leaf.y += leaf.speedY;
      leaf.rotation += leaf.rotSpeed;

      // Remove when off screen
      if (leaf.y > h + 30 || leaf.x > w + 30) {
        leaves.splice(i, 1);
        continue;
      }

      drawLeaf(leaf.x, leaf.y, leaf.size, leaf.rotation, leaf.opacity);
    }

    requestAnimationFrame(draw);
  }

  const observer = new IntersectionObserver((entries) => {
    isVisible = entries[0].isIntersecting;
  }, { threshold: 0 });
  observer.observe(section);

  resize();
  createLeaves();
  requestAnimationFrame(draw);
  window.addEventListener('resize', () => { resize(); createLeaves(); });
})();

/* ========== NAV SCROLL EFFECT ========== */
const nav = document.getElementById('nav');

// Map sections to their nav color class
const sectionColors = [
  { el: document.querySelector('.hero'), cls: 'nav--terracotta' },
  { el: document.getElementById('servicios'), cls: 'nav--olive' },
];

window.addEventListener('scroll', () => {
  const scrollY = window.scrollY;
  nav.classList.toggle('scrolled', scrollY > 60);
  
  // Detect which section the nav overlaps
  const navBottom = nav.getBoundingClientRect().bottom;
  let activeClass = '';
  
  sectionColors.forEach(({ el, cls }) => {
    if (el) {
      const rect = el.getBoundingClientRect();
      if (rect.top < navBottom && rect.bottom > 0) {
        activeClass = cls;
      }
    }
  });
  
  // Apply the matching class, remove others
  nav.classList.remove('nav--olive', 'nav--terracotta');
  if (activeClass) nav.classList.add(activeClass);
});

/* ========== MOBILE MENU ========== */
const hamburger = document.getElementById('hamburger');
const navLinks = document.getElementById('navLinks');

hamburger.addEventListener('click', () => {
  hamburger.classList.toggle('active');
  navLinks.classList.toggle('open');
  document.body.style.overflow = navLinks.classList.contains('open') ? 'hidden' : '';
});

navLinks.querySelectorAll('.nav__link, .nav__cta').forEach(link => {
  link.addEventListener('click', () => {
    hamburger.classList.remove('active');
    navLinks.classList.remove('open');
    document.body.style.overflow = '';
  });
});

/* ========== REVEAL ON SCROLL ========== */
const reveals = document.querySelectorAll('.reveal');
const revealObserver = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      entry.target.classList.add('visible');
      revealObserver.unobserve(entry.target);
    }
  });
}, { threshold: 0.15, rootMargin: '0px 0px -50px 0px' });

reveals.forEach(el => revealObserver.observe(el));

/* ========== TESTIMONIAL CAROUSEL ========== */
const testimonials = document.querySelectorAll('.testimonial');
const dots = document.querySelectorAll('.testimonials__dot');
let currentTestimonial = 0;
let testimonialInterval;

function showTestimonial(index) {
  testimonials.forEach(t => t.classList.remove('active'));
  dots.forEach(d => d.classList.remove('active'));
  testimonials[index].classList.add('active');
  dots[index].classList.add('active');
  currentTestimonial = index;
}

function nextTestimonial() {
  showTestimonial((currentTestimonial + 1) % testimonials.length);
}

dots.forEach(dot => {
  dot.addEventListener('click', () => {
    clearInterval(testimonialInterval);
    showTestimonial(parseInt(dot.dataset.index));
    testimonialInterval = setInterval(nextTestimonial, 6000);
  });
});

testimonialInterval = setInterval(nextTestimonial, 6000);

/* ========== SMOOTH SCROLL ========== */
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
  anchor.addEventListener('click', function (e) {
    e.preventDefault();
    const target = document.querySelector(this.getAttribute('href'));
    if (target) {
      target.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  });
});

/* ========== CONTACT FORM ========== */
const contactForm = document.getElementById('contactForm');
contactForm.addEventListener('submit', (e) => {
  e.preventDefault();
  const name = document.getElementById('contactName').value;
  const email = document.getElementById('contactEmail').value;
  const message = document.getElementById('contactMessage').value;
  
  // Open email client with form data
  const mailtoLink = `mailto:hola@asantesana.co?subject=Contacto desde web - ${encodeURIComponent(name)}&body=${encodeURIComponent(`Nombre: ${name}\nEmail: ${email}\n\n${message}`)}`;
  window.location.href = mailtoLink;
  
  const btn = document.getElementById('contactSubmit');
  btn.textContent = '¡Mensaje enviado!';
  btn.style.background = '#C8703A';
  setTimeout(() => {
    btn.textContent = 'Enviar mensaje';
    btn.style.background = '';
    contactForm.reset();
  }, 3000);
});

/* ========== PARALLAX SUBTLE HERO ========== */
window.addEventListener('scroll', () => {
  const hero = document.querySelector('.hero');
  const scrolled = window.scrollY;
  if (scrolled < window.innerHeight) {
    hero.style.transform = `translateY(${scrolled * 0.15}px)`;
    hero.style.opacity = 1 - (scrolled / window.innerHeight) * 0.4;
  }
});

/* ========== PROCESS MODAL ========== */
const processModal = document.getElementById('processModal');
const openBtn = document.getElementById('openProcessModal');
const closeBtn = document.getElementById('closeProcessModal');
const modalOverlay = document.getElementById('processModalOverlay');

function openModal() {
  processModal.classList.add('open');
  processModal.setAttribute('aria-hidden', 'false');
  document.body.style.overflow = 'hidden';
}
function closeModal() {
  processModal.classList.remove('open');
  processModal.setAttribute('aria-hidden', 'true');
  document.body.style.overflow = '';
}

openBtn.addEventListener('click', openModal);
closeBtn.addEventListener('click', closeModal);
modalOverlay.addEventListener('click', closeModal);
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape' && processModal.classList.contains('open')) closeModal();
});
