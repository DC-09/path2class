/**
 * Path2Class — AR Overlay Module
 * Draws navigation overlays (arrows, highlights, labels) on the AR canvas.
 */

const AROverlay = (() => {
  let canvas = null;
  let ctx = null;
  let videoWidth = 640;
  let videoHeight = 480;

  function init(canvasEl, vw, vh) {
    canvas = canvasEl;
    ctx = canvas.getContext('2d');
    videoWidth = vw || 640;
    videoHeight = vh || 480;
    _resize();
    window.addEventListener('resize', _resize);
  }

  function _resize() {
    if (!canvas) return;
    canvas.width = canvas.parentElement.clientWidth;
    canvas.height = canvas.parentElement.clientHeight;
  }

  function clear() {
    if (!ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
  }

  /**
   * Render full navigation state.
   * @param {Object} navState - { nextStep, detections, positionConfirmed, arrived }
   */
  function render(navState) {
    clear();

    if (navState.arrived) {
      _drawNotification('Sei arrivato a destinazione!', '#FFD700');
      return;
    }

    // Direction arrow
    if (navState.nextStep) {
      _drawDirectionArrow(navState.nextStep.action, navState.nextStep.label);
    }

    // Detection highlights
    if (navState.detections) {
      for (const det of navState.detections) {
        _drawDetectionHighlight(det, navState.nextStep);
      }
    }

    // Position confirmation
    if (navState.positionConfirmed) {
      _drawConfirmBadge();
    }
  }

  function _drawDirectionArrow(action, label) {
    const cx = canvas.width / 2;
    const cy = canvas.height * 0.7;

    ctx.save();
    ctx.translate(cx, cy);

    let rotation = 0;
    if (action === 'turn_right') rotation = Math.PI / 2;
    else if (action === 'turn_left') rotation = -Math.PI / 2;
    else if (action === 'go_back') rotation = Math.PI;
    else if (action === 'climb_stairs') rotation = -Math.PI / 6; // slight up
    else if (action === 'use_elevator') rotation = -Math.PI / 6;
    // go_straight, arrive_room = 0

    ctx.rotate(rotation);

    // Arrow shape
    ctx.fillStyle = 'rgba(0, 200, 100, 0.85)';
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.9)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(0, -50);
    ctx.lineTo(30, 10);
    ctx.lineTo(12, 10);
    ctx.lineTo(12, 50);
    ctx.lineTo(-12, 50);
    ctx.lineTo(-12, 10);
    ctx.lineTo(-30, 10);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    ctx.restore();

    // Label background
    const labelY = cy + 65;
    ctx.fillStyle = 'rgba(0, 0, 0, 0.75)';
    const textWidth = ctx.measureText(label || '').width;
    const boxW = Math.max(textWidth + 24, 200);
    ctx.fillRect(cx - boxW / 2, labelY, boxW, 32);

    // Label text
    ctx.fillStyle = '#FFFFFF';
    ctx.font = '15px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(label || '', cx, labelY + 16);
  }

  function _drawDetectionHighlight(det, nextStep) {
    if (!det.bbox) return;

    const scaleX = canvas.width / videoWidth;
    const scaleY = canvas.height / videoHeight;

    const x = det.bbox.x1 * scaleX;
    const y = det.bbox.y1 * scaleY;
    const w = (det.bbox.x2 - det.bbox.x1) * scaleX;
    const h = (det.bbox.y2 - det.bbox.y1) * scaleY;

    // Choose color based on relevance
    let color = 'rgba(100, 200, 255, 0.7)';
    if (det.class_name === 'staircase' && nextStep?.action === 'climb_stairs') {
      color = 'rgba(255, 180, 0, 0.8)';
    } else if (det.class_name === 'elevator_door' && nextStep?.action === 'use_elevator') {
      color = 'rgba(0, 180, 255, 0.8)';
    } else if (det.class_name === 'sign_room_number') {
      color = 'rgba(0, 255, 130, 0.8)';
    } else if (det.class_name === 'path2class_qr') {
      color = 'rgba(255, 255, 0, 0.8)';
    }

    // Box
    ctx.strokeStyle = color;
    ctx.lineWidth = 3;
    ctx.strokeRect(x, y, w, h);

    // Label
    const label = det.class_name.replace(/_/g, ' ');
    ctx.fillStyle = color;
    const tw = ctx.measureText(label).width;
    ctx.fillRect(x, y - 20, tw + 10, 20);
    ctx.fillStyle = '#000';
    ctx.font = '12px sans-serif';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'middle';
    ctx.fillText(label, x + 5, y - 10);
  }

  function _drawConfirmBadge() {
    const size = 14;
    const x = canvas.width - 30;
    const y = 30;

    ctx.fillStyle = 'rgba(0, 200, 100, 0.9)';
    ctx.beginPath();
    ctx.arc(x, y, size, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#FFF';
    ctx.font = 'bold 14px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('✓', x, y);
  }

  function _drawNotification(text, color) {
    const cx = canvas.width / 2;
    const cy = canvas.height / 2;

    ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
    ctx.fillRect(cx - 180, cy - 30, 360, 60);

    ctx.fillStyle = color;
    ctx.font = 'bold 20px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(text, cx, cy);
  }

  function destroy() {
    window.removeEventListener('resize', _resize);
    canvas = null;
    ctx = null;
  }

  return { init, clear, render, destroy };
})();
