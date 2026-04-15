/**
 * Path2Class — Camera Module
 * Manages camera access, video stream, and frame capture.
 */

const Camera = (() => {
  let videoElement = null;
  let stream = null;

  async function start(videoEl) {
    videoElement = videoEl;

    const constraints = {
      video: {
        facingMode: 'environment',
        width: { ideal: 1280 },
        height: { ideal: 720 },
      },
    };

    try {
      stream = await navigator.mediaDevices.getUserMedia(constraints);
      videoElement.srcObject = stream;
      await videoElement.play();
      return true;
    } catch (err) {
      console.error('Camera access failed:', err);
      return false;
    }
  }

  function stop() {
    if (stream) {
      stream.getTracks().forEach((track) => track.stop());
      stream = null;
    }
    if (videoElement) {
      videoElement.srcObject = null;
    }
  }

  /**
   * Capture current frame as JPEG Blob.
   * @param {number} width - Output width (default 640)
   * @param {number} height - Output height (default 480)
   * @param {number} quality - JPEG quality 0-1 (default 0.65)
   * @returns {Promise<Blob>}
   */
  function captureFrame(width = 640, height = 480, quality = 0.65) {
    return new Promise((resolve) => {
      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');
      ctx.drawImage(videoElement, 0, 0, width, height);
      canvas.toBlob(resolve, 'image/jpeg', quality);
    });
  }

  function isActive() {
    return stream !== null && stream.active;
  }

  function getVideoSize() {
    if (!videoElement) return { width: 0, height: 0 };
    return {
      width: videoElement.videoWidth,
      height: videoElement.videoHeight,
    };
  }

  return { start, stop, captureFrame, isActive, getVideoSize };
})();
