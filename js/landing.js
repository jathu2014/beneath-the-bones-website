// ===== PARTICLE BACKGROUND =====
const canvas = document.getElementById('particles');
const ctx = canvas.getContext('2d');

let particles = [];

function resize() {
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
}

function createParticles() {
  particles = [];
  const count = Math.floor((canvas.width * canvas.height) / 15000);
  for (let i = 0; i < count; i++) {
    particles.push({
      x: Math.random() * canvas.width,
      y: Math.random() * canvas.height,
      size: Math.random() * 1.5 + 0.3,
      speedX: (Math.random() - 0.5) * 0.2,
      speedY: -Math.random() * 0.3 - 0.1,
      opacity: Math.random() * 0.5 + 0.1,
      gold: Math.random() > 0.7
    });
  }
}

function animateParticles() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  particles.forEach(p => {
    ctx.beginPath();
    ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
    ctx.fillStyle = p.gold
      ? `rgba(201, 168, 76, ${p.opacity})`
      : `rgba(100, 160, 220, ${p.opacity})`;
    ctx.fill();

    p.x += p.speedX;
    p.y += p.speedY;
    if (p.y < -5) p.y = canvas.height + 5;
    if (p.x < -5) p.x = canvas.width + 5;
    if (p.x > canvas.width + 5) p.x = -5;
  });
  requestAnimationFrame(animateParticles);
}

resize();
createParticles();
animateParticles();
window.addEventListener('resize', () => { resize(); createParticles(); });