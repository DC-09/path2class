/**
 * Path2Class — QR Scanner Module
 * Uses BarcodeDetector API (Chrome) with canvas fallback.
 */

const QRScanner = (() => {
  let detector = null;
  let scanning = false;
  let videoElement = null;
  let animFrameId = null;

  function _initDetector() {
    if ('BarcodeDetector' in window) {
      detector = new BarcodeDetector({ formats: ['qr_code'] });
    } else {
      console.warn(
        'BarcodeDetector not available. QR scanning will require a polyfill or manual entry.'
      );
    }
  }

  /**
   * Start scanning for QR codes from a video element.
   * @param {HTMLVideoElement} video
   * @param {Function} onDetected - callback(qrValue: string)
   */
  async function startScan(video, onDetected) {
    if (!detector) _initDetector();
    if (!detector) {
      console.error('QR scanning is not supported on this browser.');
      return false;
    }

    videoElement = video;
    scanning = true;

    const scan = async () => {
      if (!scanning) return;

      try {
        const barcodes = await detector.detect(videoElement);
        if (barcodes.length > 0) {
          const value = barcodes[0].rawValue;
          scanning = false;
          onDetected(value);
          return;
        }
      } catch (err) {
        // Detection may fail on some frames — just retry
      }

      animFrameId = requestAnimationFrame(scan);
    };

    scan();
    return true;
  }

  function stopScan() {
    scanning = false;
    if (animFrameId) {
      cancelAnimationFrame(animFrameId);
      animFrameId = null;
    }
  }

  /**
   * Parse a Path2Class QR value.
   * Expected format: URL with ?node=<node_id> or just the node_id string.
   */
  function parseQRValue(value) {
    if (!value) return null;

    try {
      const url = new URL(value);
      return url.searchParams.get('node') || null;
    } catch {
      // Not a URL — treat as raw node_id
      if (value.includes('_F') || value.includes('floor') || value.includes('building')) {
        return value;
      }
      return null;
    }
  }

  return { startScan, stopScan, parseQRValue };
})();
