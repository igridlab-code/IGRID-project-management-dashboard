/**
 * iGrid Innovation Lab - Animated Spark/Motion Effect
 * Creates a subtle, low-opacity floating particle canvas in the deep navy background.
 * Pointer-events disabled, z-index -1, respects prefers-reduced-motion.
 */
(function initSparksAnimation() {
  if (document.getElementById('sparks-canvas')) return;

  const canvas = document.createElement('canvas');
  canvas.id = 'sparks-canvas';
  canvas.style.cssText = 'position:fixed;top:0;left:0;width:100vw;height:100vh;z-index:-1;pointer-events:none;';
  
  if (document.body) {
    document.body.prepend(canvas);
  } else {
    document.addEventListener('DOMContentLoaded', () => document.body.prepend(canvas));
  }

  const ctx = canvas.getContext('2d');
  let width = (canvas.width = window.innerWidth);
  let height = (canvas.height = window.innerHeight);

  window.addEventListener('resize', () => {
    width = canvas.width = window.innerWidth;
    height = canvas.height = window.innerHeight;
  });

  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const particleCount = prefersReducedMotion ? 12 : 38;

  const particles = [];
  const colors = ['#4cc9f0', '#38bdf8', '#f59e0b', '#60a5fa', '#a855f7', '#34d399'];

  for (let i = 0; i < particleCount; i++) {
    particles.push({
      x: Math.random() * width,
      y: Math.random() * height,
      radius: Math.random() * 1.8 + 0.6,
      color: colors[Math.floor(Math.random() * colors.length)],
      alpha: Math.random() * 0.22 + 0.08,
      speedX: (Math.random() - 0.5) * (prefersReducedMotion ? 0.04 : 0.35),
      speedY: (Math.random() - 0.5) * (prefersReducedMotion ? 0.04 : 0.35),
      pulseSpeed: Math.random() * 0.015 + 0.005,
      pulseFactor: Math.random() * Math.PI * 2
    });
  }

  function render() {
    ctx.clearRect(0, 0, width, height);

    for (let i = 0; i < particles.length; i++) {
      const p = particles[i];
      p.x += p.speedX;
      p.y += p.speedY;
      p.pulseFactor += p.pulseSpeed;

      if (p.x < 0) p.x = width;
      if (p.x > width) p.x = 0;
      if (p.y < 0) p.y = height;
      if (p.y > height) p.y = 0;

      const currentAlpha = p.alpha + Math.sin(p.pulseFactor) * 0.07;

      ctx.save();
      ctx.globalAlpha = Math.max(0.04, Math.min(0.28, currentAlpha));
      ctx.fillStyle = p.color;
      ctx.shadowBlur = 6;
      ctx.shadowColor = p.color;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }

    requestAnimationFrame(render);
  }

  requestAnimationFrame(render);
})();
