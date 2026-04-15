/**
 * Path2Class — Navigation Controller
 * Manages the AR navigation loop: frame capture -> detection -> position update -> overlay.
 */

const Navigation = (() => {
  let sessionId = null;
  let isRunning = false;
  let loopTimer = null;
  let detectionIntervalMs = 1200; // ~1 frame per second

  let onUpdate = null;   // callback(navResult)
  let onArrival = null;  // callback()
  let onError = null;    // callback(error)

  /**
   * Start the navigation loop.
   * @param {string} sid - Session ID
   * @param {Object} callbacks - { onUpdate, onArrival, onError }
   */
  function start(sid, callbacks = {}) {
    sessionId = sid;
    isRunning = true;
    onUpdate = callbacks.onUpdate || (() => {});
    onArrival = callbacks.onArrival || (() => {});
    onError = callbacks.onError || (() => {});
    _loop();
  }

  function stop() {
    isRunning = false;
    if (loopTimer) {
      clearTimeout(loopTimer);
      loopTimer = null;
    }
  }

  async function _loop() {
    if (!isRunning) return;

    try {
      // 1. Capture frame
      const frameBlob = await Camera.captureFrame(640, 480, 0.65);

      // 2. Send to YOLO
      const detectResult = await ApiClient.detectFrame(frameBlob, sessionId);
      const detections = detectResult.detections || [];

      // 3. Update position
      const heading = Orientation.getHeading();
      const navResult = await ApiClient.updateNavigation(sessionId, detections, heading);

      // 4. Notify
      navResult.detections = detections;
      onUpdate(navResult);

      // 5. Check arrival
      if (navResult.arrived) {
        isRunning = false;
        onArrival();
        return;
      }
    } catch (err) {
      console.warn('Navigation loop error:', err);
      onError(err);
    }

    // Schedule next iteration
    if (isRunning) {
      loopTimer = setTimeout(_loop, detectionIntervalMs);
    }
  }

  function setDetectionInterval(ms) {
    detectionIntervalMs = Math.max(500, ms);
  }

  function getSessionId() {
    return sessionId;
  }

  function isActive() {
    return isRunning;
  }

  return { start, stop, setDetectionInterval, getSessionId, isActive };
})();
