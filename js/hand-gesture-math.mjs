// Gesture geometry is separate from camera access so it can be tested independently.
export function readHand(points) {
  const distance = (a, b) => Math.hypot(a.x - b.x, a.y - b.y);
  const scale = Math.max(distance(points[0], points[9]), 0.025);
  return {
    x: (points[4].x + points[8].x) / 2,
    y: (points[4].y + points[8].y) / 2,
    pinch: distance(points[4], points[8]) / scale < 0.35,
  };
}

export function gestureFromHands(landmarks) {
  const hands = landmarks.map(readHand);
  // Require both pinches for zoom; an incidental second hand must not rotate.
  if (hands.length === 2) {
    if (!hands.every(hand => hand.pinch)) return null;
    return { mode: 'zoom', distance: Math.hypot(hands[0].x - hands[1].x, hands[0].y - hands[1].y) };
  }
  if (hands.length === 1 && hands[0].pinch) return { mode: 'rotate', x: hands[0].x, y: hands[0].y };
  return null;
}

export function moveCamera(previous, gesture, orbit, limits) {
  if (!previous || previous.mode !== gesture.mode) return orbit;
  if (gesture.mode === 'zoom') {
    const delta = Math.max(-0.08, Math.min(0.08, gesture.distance - previous.distance));
    return { ...orbit, radius: Math.max(limits.min, Math.min(limits.max, orbit.radius * Math.exp(-delta * 3))) };
  }
  const dx = Math.max(-0.06, Math.min(0.06, gesture.x - previous.x));
  const dy = Math.max(-0.06, Math.min(0.06, gesture.y - previous.y));
  return {
    ...orbit,
    theta: orbit.theta + dx * 4,
    phi: Math.max(0.15, Math.min(Math.PI - 0.15, orbit.phi - dy * 3)),
  };
}
