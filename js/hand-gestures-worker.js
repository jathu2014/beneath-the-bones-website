// Run inference off the UI thread to keep animation, audio and haptic timing responsive.
let tracker;
self.onmessage = async ({ data }) => {
  try {
    if (data.type === 'init') {
      const { FilesetResolver, HandLandmarker } = await import('https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.21/vision_bundle.mjs');
      const vision = await FilesetResolver.forVisionTasks('https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.21/wasm');
      tracker = await HandLandmarker.createFromOptions(vision, {
        baseOptions: {
          modelAssetPath: 'https://storage.googleapis.com/mediapipe-models/hand_landmarker/hand_landmarker/float16/1/hand_landmarker.task',
          delegate: 'CPU',
        },
        runningMode: 'VIDEO', numHands: 2,
        minHandDetectionConfidence: 0.65, minHandPresenceConfidence: 0.65,
        minTrackingConfidence: 0.65,
      });
      self.postMessage({ type: 'ready' });
    } else if (data.type === 'frame') {
      try {
        const result = tracker.detectForVideo(data.frame, data.timestamp);
        self.postMessage({ type: 'hands', landmarks: result.landmarks });
      } finally {
        data.frame.close();
      }
    }
  } catch (error) {
    self.postMessage({ type: 'error', message: error.message });
  }
};
