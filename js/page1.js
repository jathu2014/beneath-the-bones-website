// ===== PAGE 1 — SEE =====

const modelViewer = document.getElementById('whaleModel');
const animBtn = document.getElementById('animBtn');
const animIcon = document.getElementById('animIcon');
const animLabel = document.getElementById('animLabel');

let isPlaying = false;

// Toggle animation playback
function toggleAnimation() {
  if (!modelViewer) return;

  if (!isPlaying) {
    // Play the GLB animation
    modelViewer.play({ repetitions: 1 });
    modelViewer.autoRotate = false;
    isPlaying = true;
    animIcon.textContent = '⏹';
    animLabel.textContent = 'STOP ANIMATION';
    animBtn.classList.add('playing');
  } else {
    // Pause / reset
    modelViewer.pause();
    modelViewer.currentTime = 0;
    modelViewer.autoRotate = true;
    isPlaying = false;
    animIcon.textContent = '▶';
    animLabel.textContent = 'PLAY TRANSFORMATION';
    animBtn.classList.remove('playing');
  }
}

// Auto-reset button when animation finishes
modelViewer.addEventListener('finished', () => {
  isPlaying = false;
  animIcon.textContent = '▶';
  animLabel.textContent = 'PLAY TRANSFORMATION';
  animBtn.classList.remove('playing');
  modelViewer.autoRotate = true;
});

// Model loading progress
modelViewer.addEventListener('progress', (e) => {
  const bar = document.getElementById('progressBar');
  if (bar) bar.style.width = (e.detail.totalProgress * 100) + '%';
});