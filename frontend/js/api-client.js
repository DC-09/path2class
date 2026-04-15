/**
 * Path2Class — API Client
 * Handles all REST API communication with the backend.
 */

const ApiClient = (() => {
  // Configured at init; defaults to same origin
  let BASE_URL = '';

  function init(baseUrl) {
    BASE_URL = baseUrl || '';
  }

  async function _fetch(path, options = {}) {
    const url = `${BASE_URL}${path}`;
    const res = await fetch(url, options);
    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      throw new Error(body.detail || `API error ${res.status}`);
    }
    return res.json();
  }

  // --- Session ---

  function startSession(startNode) {
    return _fetch('/api/session/start', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ start_node: startNode }),
    });
  }

  // --- Navigation ---

  function getDestinations() {
    return _fetch('/api/navigation/destinations');
  }

  function computeRoute(sessionId, destinationNode, avoidStairs = false) {
    return _fetch('/api/navigation/route', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        session_id: sessionId,
        destination_node: destinationNode,
        avoid_stairs: avoidStairs,
      }),
    });
  }

  function updateNavigation(sessionId, detections, heading) {
    return _fetch('/api/navigation/update', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        session_id: sessionId,
        detections: detections,
        heading: heading,
      }),
    });
  }

  function getTextRoute(sessionId) {
    return _fetch(`/api/navigation/text_route?session_id=${sessionId}`);
  }

  // --- Detection ---

  async function detectFrame(imageBlob, sessionId) {
    const formData = new FormData();
    formData.append('image', imageBlob, 'frame.jpg');
    formData.append('session_id', sessionId || '');

    return _fetch('/api/detect', {
      method: 'POST',
      body: formData,
    });
  }

  // --- Assistant ---

  function askAssistant(sessionId, message, language = 'it') {
    return _fetch('/api/assistant/route_help', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        session_id: sessionId,
        user_message: message,
        user_language: language,
      }),
    });
  }

  return {
    init,
    startSession,
    getDestinations,
    computeRoute,
    updateNavigation,
    getTextRoute,
    detectFrame,
    askAssistant,
  };
})();
