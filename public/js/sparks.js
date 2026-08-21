(function initSparksAnimation() {
  function setupCanvas() {
    let canvas = document.getElementById('sparks-canvas');
    if (!canvas) {
      canvas = document.createElement('canvas');
      canvas.id = 'sparks-canvas';
      document.body.prepend(canvas);
    }

    const ctx = canvas.getContext('2d');
    let width = (canvas.width = window.innerWidth);
    let height = (canvas.height = window.innerHeight);

    window.addEventListener('resize', () => {
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
    });

    const particles = [];
    const particleCount = Math.min(65, Math.floor(window.innerWidth / 20));

    class SparkParticle {
      constructor() {
        this.reset(true);
      }

      reset(initial = false) {
        this.x = Math.random() * width;
        this.y = initial ? Math.random() * height : height + 10;
        this.size = Math.random() * 2.2 + 0.8;
        this.speedY = Math.random() * 0.7 + 0.3;
        this.speedX = (Math.random() - 0.5) * 0.5;
        this.opacity = Math.random() * 0.7 + 0.3;
        this.fadeSpeed = Math.random() * 0.006 + 0.002;
        const colors = [
          'rgba(250, 204, 21, ',   // Gold yellow
          'rgba(99, 102, 241, ',   // Indigo
          'rgba(56, 189, 248, ',   // Sky blue
          'rgba(255, 255, 255, '   // Crisp white
        ];
        this.colorPrefix = colors[Math.floor(Math.random() * colors.length)];
      }

      update() {
        this.y -= this.speedY;
        this.x += this.speedX;
        this.opacity -= this.fadeSpeed;

        if (this.opacity <= 0 || this.y < -10) {
          this.reset();
        }
      }

      draw() {
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
        ctx.fillStyle = this.colorPrefix + this.opacity + ')';
        ctx.shadowBlur = 6;
        ctx.shadowColor = this.colorPrefix + '0.7)';
        ctx.fill();
        ctx.shadowBlur = 0;
      }
    }

    for (let i = 0; i < particleCount; i++) {
      particles.push(new SparkParticle());
    }

    function animate() {
      ctx.clearRect(0, 0, width, height);
      particles.forEach(p => {
        p.update();
        p.draw();
      });
      requestAnimationFrame(animate);
    }

    animate();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', setupCanvas);
  } else {
    setupCanvas();
  }
})();
