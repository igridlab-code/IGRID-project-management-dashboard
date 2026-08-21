/**
 * Unified AI Neural Network Constellation Background Layer
 * Single Source of Truth component for IGRID Innovation Lab Dashboard & Auth Pages
 * Base Color: #0B132B (Unified Navy)
 * Accent Nodes: #4CC9F0 (Electric Blue Glow)
 */
(function initUnifiedAiBackground() {
  function createBackgroundCanvas() {
    let canvas = document.getElementById('app-ai-background-canvas');
    if (!canvas) {
      canvas = document.createElement('canvas');
      canvas.id = 'app-ai-background-canvas';
      document.body.prepend(canvas);
    }

    // Apply strict CSS fixed background positioning
    canvas.style.position = 'fixed';
    canvas.style.top = '0';
    canvas.style.left = '0';
    canvas.style.width = '100vw';
    canvas.style.height = '100vh';
    canvas.style.zIndex = '-1';
    canvas.style.pointerEvents = 'none';
    canvas.style.backgroundColor = '#0B132B';

    const ctx = canvas.getContext('2d');
    let width = (canvas.width = window.innerWidth);
    let height = (canvas.height = window.innerHeight);

    // Particle Node Configuration
    const NODE_COUNT = Math.min(75, Math.floor((width * height) / 18000));
    const MAX_DISTANCE = 130;
    const nodes = [];

    for (let i = 0; i < NODE_COUNT; i++) {
      nodes.push({
        x: Math.random() * width,
        y: Math.random() * height,
        vx: (Math.random() - 0.5) * 0.4, // Slow gentle drifting
        vy: (Math.random() - 0.5) * 0.4,
        radius: Math.random() * 1.5 + 1.2,
        baseAlpha: Math.random() * 0.5 + 0.3,
        pulseSpeed: Math.random() * 0.02 + 0.005,
        pulsePhase: Math.random() * Math.PI * 2
      });
    }

    function resize() {
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
    }

    window.addEventListener('resize', resize);

    function render() {
      // Clear canvas with solid unified navy color #0B132B
      ctx.fillStyle = '#0B132B';
      ctx.fillRect(0, 0, width, height);

      // Update and draw nodes
      for (let i = 0; i < nodes.length; i++) {
        const node = nodes[i];

        // Move node
        node.x += node.vx;
        node.y += node.vy;

        // Bounce off screen boundaries
        if (node.x < 0 || node.x > width) node.vx *= -1;
        if (node.y < 0 || node.y > height) node.vy *= -1;

        // Pulsating glow opacity
        node.pulsePhase += node.pulseSpeed;
        const currentAlpha = node.baseAlpha + Math.sin(node.pulsePhase) * 0.2;

        // Draw node with soft cyan glow
        ctx.beginPath();
        ctx.arc(node.x, node.y, node.radius, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(76, 201, 240, ${Math.max(0.2, currentAlpha)})`;
        ctx.shadowBlur = 8;
        ctx.shadowColor = '#4CC9F0';
        ctx.fill();
        ctx.shadowBlur = 0; // Reset shadow for line performance
      }

      // Draw faint animated connecting lines between close nodes
      for (let i = 0; i < nodes.length; i++) {
        for (let j = i + 1; j < nodes.length; j++) {
          const n1 = nodes[i];
          const n2 = nodes[j];
          const dx = n1.x - n2.x;
          const dy = n1.y - n2.y;
          const dist = Math.sqrt(dx * dx + dy * dy);

          if (dist < MAX_DISTANCE) {
            const lineAlpha = (1 - dist / MAX_DISTANCE) * 0.22;
            ctx.beginPath();
            ctx.moveTo(n1.x, n1.y);
            ctx.lineTo(n2.x, n2.y);
            ctx.strokeStyle = `rgba(76, 201, 240, ${lineAlpha})`;
            ctx.lineWidth = 0.8;
            ctx.stroke();
          }
        }
      }

      requestAnimationFrame(render);
    }

    render();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', createBackgroundCanvas);
  } else {
    createBackgroundCanvas();
  }
})();
