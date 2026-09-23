// ===== PAGE 2 — HEAR =====

let wavesurfer = null;
let isPlaying = false;

// Initialize WaveSurfer
wavesurfer = WaveSurfer.create({
  container: '#waveform',
  waveColor: 'rgba(201, 168, 76, 0.35)',
  progressColor: 'rgba(201, 168, 76, 0.9)',
  cursorColor: '#C9A84C',
  barWidth: 2,
  barGap: 2,
  barRadius: 2,
  height: 80,
  normalize: true,
  backend: 'WebAudio',
});

// ⬇ SWAP THIS PATH when your audio file is ready
// Put your MP3 in assets/audio/ and update the filename below
const AUDIO_SRC = 'assets/audio/whale-call.mp3';

wavesurfer.load(AUDIO_SRC);

// Hide notice once audio loads
wavesurfer.on('ready', () => {
  document.getElementById('audioNotice').style.display = 'none';
  updateTotalTime();
});

// Show notice if audio fails to load
wavesurfer.on('error', () => {
  document.getElementById('audioNotice').style.display = 'block';
});

// Update current time display
wavesurfer.on('timeupdate', (time) => {
  document.getElementById('currentTime').textContent = formatTime(time);
});

// Reset on finish
wavesurfer.on('finish', () => {
  isPlaying = false;
  document.getElementById('playBtn').textContent = '▶';
});

// ===== Controls =====

function toggleAudio() {
  wavesurfer.playPause();
  isPlaying = !isPlaying;
  document.getElementById('playBtn').textContent = isPlaying ? '⏸' : '▶';
}

function rewindAudio() {
  const current = wavesurfer.getCurrentTime();
  wavesurfer.setTime(Math.max(0, current - 10));
}

function forwardAudio() {
  const current = wavesurfer.getCurrentTime();
  const duration = wavesurfer.getDuration();
  wavesurfer.setTime(Math.min(duration, current + 10));
}

function setVolume(value) {
  wavesurfer.setVolume(parseFloat(value));
}

// ===== Helpers =====

function formatTime(secs) {
  const m = Math.floor(secs / 60);
  const s = Math.floor(secs % 60);
  return `${m}:${s.toString().padStart(2, '0')}`;
}

function updateTotalTime() {
  const duration = wavesurfer.getDuration();
  document.getElementById('totalTime').textContent = formatTime(duration);
}