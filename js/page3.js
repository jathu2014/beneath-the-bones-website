// ===== PAGE 3 — FEEL =====

const swimWhale = document.getElementById('swimWhale');
const immerseBtn = document.getElementById('immerseBtn');
const immerseIcon = document.getElementById('immerseIcon');
const immerseText = document.getElementById('immerseText');
const immerseSub = document.getElementById('immerseSub');
const rippleContainer = document.getElementById('rippleContainer');

let isImmersing = false;
let hapticsEnabled = true;
let hapticTimer = null;
let wavesurfer = null;

// ===== HAPTIC PEAK TIMESTAMPS =====
// These are the seconds in the audio where vibration fires
// --> Get these times from your audio teammate and update this array
const HAPTIC_PEAKS = [
  { time: 5,  duration: 400, intensity: [0, 200, 0] },
  { time: 12, duration: 600, intensity: [0, 300, 100, 300, 0] },
  { time: 20, duration: 400, intensity: [0, 250, 0] },
  { time: 28, duration: 800, intensity: [0, 200, 100, 200, 100, 200, 0] },
  { time: 35, duration: 500, intensity: [0, 350, 0] },
  { time: 42, duration: 400, intensity: [0, 200, 0] },
  { time: 50, duration: 700, intensity: [0, 300, 150, 300, 0] },
];

// ===== VIBRATION SUPPORT CHECK =====
const hasVibration = 'vibrate' in navigator;

window.addEventListener('load', () => {
  const notice = document.getElementById('hapticNotice');
  const noticeText = document.getElementById('hapticNoticeText');
  const toggleRow = document.getElementById('hapticToggleRow');
  const hapticDot = document.querySelector('#statusHaptic .status-dot');

  if (hasVibration) {
    noticeText.textContent = '📳 Vibration supported — haptics active on this device';
    notice.style.borderColor = 'rgba(201,168,76,0.4)';
    toggleRow.style.display = 'flex';
    toggleRow.style.justifyContent = 'center';
  } else {
    noticeText.textContent = '⚠ Vibration not supported on this device — enjoy the visual and audio experience';
    hapticDot.parentElement.style.opacity = '0.3';
  }
});

// ===== WAVESURFER AUDIO =====
wavesurfer = WaveSurfer.create({
  container: document.createElement('div'), // hidden — no waveform UI on page3
  waveColor: 'rgba(201,168,76,0.3)',
  progressColor: 'rgba(201,168,76,0.8)',
  height: 0,
  backend: 'WebAudio',
});

// ⬇ SAME audio file as page 2
const AUDIO_SRC = 'assets/audio/whale-call.mp3';
wavesurfer.load(AUDIO_SRC);

wavesurfer.on('timeupdate', (currentTime) => {
  if (!isImmersing || !hapticsEnabled || !hasVibration) return;
  HAPTIC_PEAKS.forEach(peak => {
    if (Math.abs(currentTime - peak.time) < 0.12) {
      navigator.vibrate(peak.intensity);
    }
  });
});

wavesurfer.on('finish', () => {
  stopImmersion();
});

// ===== TOGGLE IMMERSION =====
function toggleImmersion() {
  if (!isImmersing) {
    startImmersion();
  } else {
    stopImmersion();
  }
}

function startImmersion() {
  isImmersing = true;

  // Play 3D animation
  if (swimWhale) {
    swimWhale.play();
    swimWhale.autoRotate = false;
  }

  // Play audio
  wavesurfer.play();

  // Activate ripple rings
  rippleContainer.classList.add('active');

  // Update button
  immerseBtn.classList.add('active');
  immerseIcon.textContent = '⏹';
  immerseText.textContent = 'STOP IMMERSION';
  immerseSub.textContent = 'Tap to end the experience';

  // Activate status dots
  setDot('statusAnim', true);
  setDot('statusAudio', true);
  setDot('statusHaptic', hasVibration && hapticsEnabled);

  // Initial haptic pulse to confirm it works
  if (hasVibration && hapticsEnabled) {
    navigator.vibrate([0, 200, 100, 200]);
  }
}

function stopImmersion() {
  isImmersing = false;

  // Stop animation
  if (swimWhale) {
    swimWhale.pause();
    swimWhale.autoRotate = true;
  }

  // Stop audio
  wavesurfer.pause();
  wavesurfer.setTime(0);

  // Stop haptics
  if (hasVibration) navigator.vibrate(0);

  // Deactivate ripples
  rippleContainer.classList.remove('active');

  // Reset button
  immerseBtn.classList.remove('active');
  immerseIcon.textContent = '▶';
  immerseText.textContent = 'BEGIN IMMERSION';
  immerseSub.textContent = 'Animation · Audio · Haptics';

  // Reset status dots
  setDot('statusAnim', false);
  setDot('statusAudio', false);
  setDot('statusHaptic', false);
}

function toggleHaptics(enabled) {
  hapticsEnabled = enabled;
  document.getElementById('toggleStatus').textContent = enabled ? 'ON' : 'OFF';
  if (!enabled && hasVibration) navigator.vibrate(0);
  if (isImmersing) setDot('statusHaptic', hasVibration && enabled);
}

function setDot(id, active) {
  const dot = document.querySelector(`#${id} .status-dot`);
  if (!dot) return;
  dot.className = 'status-dot ' + (active ? 'dot-active' : 'dot-inactive');
}