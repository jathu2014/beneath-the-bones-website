import { gestureFromHands, moveCamera } from './hand-gesture-math.mjs';

// Desktop pilot only. No camera request, model download or inference before opt-in.
const desktop = matchMedia('(min-width: 900px) and (hover: hover) and (pointer: fine)');
let active = null;

class HandControls {
  constructor(viewer) {
    this.viewer = viewer;
    this.wrapper = viewer.parentElement;
    this.panel = document.createElement('section');
    this.panel.className = 'hand-controls';
    this.panel.setAttribute('aria-label', `Camera hand controls: ${viewer.alt || '3D exhibit'}`);
    this.panel.innerHTML = `
      <div class="hand-controls-heading">
        <div><p class="hand-eyebrow">TOUCH-FREE EXPLORATION · DESKTOP PREVIEW</p>
        <p class="hand-summary">Explore with your hands</p></div>
        <button type="button" class="pill-btn hand-enable" aria-pressed="false">Enable hand gestures</button>
      </div>
      <p class="hand-instructions">Pinch your thumb and index finger, then move one hand to rotate. Pinch with both hands and move them apart to zoom in, or together to zoom out. Release to pause.</p>
      <p class="hand-privacy">Camera permission is required. Video is processed on your device, never uploaded or recorded. Keep your hands in view in a well-lit room.</p>
      <div class="hand-live" hidden>
        <video class="hand-video" autoplay muted playsinline aria-label="Mirrored camera preview"></video>
        <div><p class="hand-status" role="status" aria-live="polite"></p><p class="hand-tip">You can still use the mouse. Disable gestures to turn off the camera.</p></div>
      </div>`;
    this.wrapper.after(this.panel);
    this.button = this.panel.querySelector('button');
    this.live = this.panel.querySelector('.hand-live');
    this.video = this.panel.querySelector('video');
    this.status = this.panel.querySelector('.hand-status');
    this.button.addEventListener('click', () => this.running ? this.stop() : this.start());
    // Mouse input or anatomy hotspot navigation should start a fresh gesture baseline.
    this.wrapper.addEventListener('pointerdown', () => { this.previous = null; });
    this.observer = new IntersectionObserver(entries => {
      if (this.running && !entries[0].isIntersecting) this.stop('Camera stopped because the viewer left the screen.');
    });
    this.observer.observe(this.wrapper);
    this.syncVisibility();
    desktop.addEventListener('change', () => this.syncVisibility());
  }

  syncVisibility() {
    this.panel.hidden = !desktop.matches;
    if (!desktop.matches && this.running) this.stop();
  }

  say(message) {
    if (this.status.textContent !== message) this.status.textContent = message;
  }

  async start() {
    if (!desktop.matches) return;
    if (active) active.stop();
    active = this;
    this.running = true;
    const session = this.session = (this.session || 0) + 1;
    this.live.hidden = false;
    this.button.textContent = 'Disable hand gestures';
    this.button.setAttribute('aria-pressed', 'true');
    this.say('Allow camera access to begin.');
    try {
      if (!window.isSecureContext || !navigator.mediaDevices?.getUserMedia || !window.Worker || !window.createImageBitmap) {
        throw new Error('unsupported');
      }
      // Camera starts only after the visitor explicitly presses Enable.
      const stream = await navigator.mediaDevices.getUserMedia({ audio: false, video: { facingMode: 'user', width: { ideal: 640 }, height: { ideal: 480 }, frameRate: { ideal: 24, max: 30 } } });
      if (!this.running || this.session !== session) {
        stream.getTracks().forEach(track => track.stop()); return;
      }
      this.stream = stream;
      this.loadTimeout = setTimeout(() => this.stop('Hand tracking took too long to load. Check your connection and try again.'), 45000);
      stream.getVideoTracks().forEach(track => track.addEventListener('ended', () => {
        if (this.running) this.stop('Camera disconnected. Enable gestures to try again.');
      }));
      this.video.srcObject = stream;
      await this.video.play();
      if (!this.running || this.session !== session) return;
      this.say('Loading hand tracking…');
      await customElements.whenDefined('model-viewer');
      if (!this.running || this.session !== session) return;
      this.worker = new Worker(new URL('./hand-gestures-worker.js', import.meta.url));
      this.worker.onerror = () => this.stop('Hand tracking could not load. Check your connection and try again.');
      this.worker.onmessage = ({ data }) => {
        if (!this.running || this.session !== session) return;
        if (data.type === 'ready') {
          clearTimeout(this.loadTimeout);
          this.say('Ready — show your hand and pinch to rotate.');
          this.frame();
        } else if (data.type === 'hands') {
          this.apply(data.landmarks);
          this.frameTimer = setTimeout(() => this.frame(), 40);
        } else if (data.type === 'error') {
          this.stop('Hand tracking could not start. Check your connection and try again.');
        }
      };
      this.worker.postMessage({ type: 'init' });
    } catch (error) {
      if (this.session !== session) return;
      const message = error.name === 'NotAllowedError'
        ? 'Camera access was denied. Allow camera access in your browser, then try again.'
        : error.name === 'NotFoundError' ? 'No camera found. Connect a webcam and try again.'
        : error.name === 'NotReadableError' ? 'Camera is busy. Close other camera apps and try again.'
        : 'Camera controls are unavailable. Use a current desktop browser over HTTPS, or use the mouse.';
      this.stop(message);
    }
  }

  async frame() {
    const session = this.session;
    if (!this.running || !this.worker) return;
    try {
      const frame = await createImageBitmap(this.video);
      if (!this.running || this.session !== session) { frame.close(); return; }
      this.worker.postMessage({ type: 'frame', frame, timestamp: performance.now() }, [frame]);
    } catch {
      if (this.running && this.session === session) this.stop('Camera frames are unavailable. Disable other camera apps, then try again.');
    }
  }

  apply(landmarks) {
    if (!this.viewer.loaded) {
      this.previous = null;
      this.say('Waiting for the 3D model to load…'); return;
    }
    const gesture = gestureFromHands(landmarks);
    if (!gesture) {
      this.previous = null;
      this.say(landmarks.length ? 'Hand detected — pinch to rotate; pinch both hands to zoom.' : 'No hands detected — hold your hands in front of the camera.');
      this.restoreRotation();
      return;
    }
    if (!this.limits) {
      const radius = this.viewer.getCameraOrbit().radius;
      this.limits = { min: radius * 0.45, max: radius * 2.2 };
    }
    if (this.restoreAutoRotate === undefined) this.restoreAutoRotate = this.viewer.autoRotate;
    this.viewer.autoRotate = false;
    const orbit = this.viewer.getCameraOrbit();
    const next = moveCamera(this.previous, gesture, orbit, this.limits);
    this.viewer.cameraOrbit = `${next.theta}rad ${next.phi}rad ${next.radius}m`;
    this.previous = gesture;
    this.say(gesture.mode === 'zoom' ? 'Zooming — move your pinched hands apart or together.' : 'Rotating — move your pinched hand. Release to pause.');
  }

  restoreRotation() {
    // Do not restart auto rotation during an active model animation.
    if (this.restoreAutoRotate !== undefined) {
      if (this.viewer.paused) this.viewer.autoRotate = this.restoreAutoRotate;
      this.restoreAutoRotate = undefined;
    }
  }

  stop(message = 'Camera off. Enable hand gestures whenever you are ready.') {
    this.running = false;
    this.session = (this.session || 0) + 1;
    clearTimeout(this.loadTimeout);
    clearTimeout(this.frameTimer);
    this.worker?.terminate();
    this.worker = null;
    this.stream?.getTracks().forEach(track => track.stop());
    this.stream = null;
    this.video.srcObject = null;
    this.restoreRotation();
    this.previous = null;
    this.limits = null;
    this.button.textContent = 'Enable hand gestures';
    this.button.setAttribute('aria-pressed', 'false');
    this.say(message);
    if (active === this) active = null;
  }
}

document.querySelectorAll('model-viewer').forEach(viewer => new HandControls(viewer));
window.addEventListener('pagehide', () => active?.stop());
document.addEventListener('visibilitychange', () => {
  if (document.hidden) active?.stop('Camera stopped while this tab was hidden.');
});
