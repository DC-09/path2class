/**
 * Path2Class — Orientation Module
 * Reads device compass heading and tilt for AR alignment.
 */

const Orientation = (() => {
  let currentHeading = 0;
  let beta = 0;   // front-back tilt
  let gamma = 0;  // left-right tilt
  let listening = false;

  function _onOrientation(event) {
    // iOS
    if (event.webkitCompassHeading !== undefined) {
      currentHeading = event.webkitCompassHeading;
    } else if (event.alpha !== null) {
      currentHeading = 360 - event.alpha;  // approximate for Android
    }
    beta = event.beta || 0;
    gamma = event.gamma || 0;
  }

  async function start() {
    if (listening) return true;

    // iOS 13+ requires explicit permission
    if (typeof DeviceOrientationEvent.requestPermission === 'function') {
      try {
        const response = await DeviceOrientationEvent.requestPermission();
        if (response !== 'granted') {
          console.warn('Orientation permission denied');
          return false;
        }
      } catch (err) {
        console.warn('Orientation permission error:', err);
        return false;
      }
    }

    window.addEventListener('deviceorientation', _onOrientation);
    listening = true;
    return true;
  }

  function stop() {
    window.removeEventListener('deviceorientation', _onOrientation);
    listening = false;
  }

  function getHeading() {
    return currentHeading;
  }

  function getTilt() {
    return { beta, gamma };
  }

  return { start, stop, getHeading, getTilt };
})();
