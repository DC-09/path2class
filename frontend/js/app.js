/**
 * Path2Class — Main Application
 * Wires together all modules and manages screen transitions.
 */

(function () {
  'use strict';

  // --- Config ---
  const API_BASE = ''; // Same origin by default; change for dev (e.g., 'http://localhost:8000')

  // --- State ---
  let sessionId = null;
  let selectedDestination = null;
  let destinations = [];

  // --- DOM references ---
  const screens = {
    start: document.getElementById('screen-start'),
    ar: document.getElementById('screen-ar'),
    text: document.getElementById('screen-text'),
    arrival: document.getElementById('screen-arrival'),
  };

  const els = {
    // Start screen
    locationInfo: document.getElementById('location-info'),
    currentLocationLabel: document.getElementById('current-location-label'),
    destinationSearch: document.getElementById('destination-search'),
    destinationList: document.getElementById('destination-list'),
    accessibilityToggle: document.getElementById('accessibility-toggle'),
    languageSelect: document.getElementById('language-select'),
    btnStartAR: document.getElementById('btn-start-ar'),
    btnStartText: document.getElementById('btn-start-text'),
    btnScanQR: document.getElementById('btn-scan-qr'),

    // AR screen
    cameraFeed: document.getElementById('camera-feed'),
    arCanvas: document.getElementById('ar-canvas'),
    arStatusText: document.getElementById('ar-status-text'),
    arStepCounter: document.getElementById('ar-step-counter'),
    arStepLabel: document.getElementById('ar-step-label'),
    btnARChat: document.getElementById('btn-ar-chat'),
    btnARTextMode: document.getElementById('btn-ar-text-mode'),
    btnARStop: document.getElementById('btn-ar-stop'),

    // Text screen
    btnTextBack: document.getElementById('btn-text-back'),
    textRouteSummary: document.getElementById('text-route-summary'),
    textRouteSteps: document.getElementById('text-route-steps'),
    btnTextChat: document.getElementById('btn-text-chat'),

    // Chat panel
    chatPanel: document.getElementById('chat-panel'),
    chatMessages: document.getElementById('chat-messages'),
    chatInput: document.getElementById('chat-input'),
    btnChatSend: document.getElementById('btn-chat-send'),
    btnChatClose: document.getElementById('btn-chat-close'),

    // Arrival screen
    arrivalDestination: document.getElementById('arrival-destination'),
    btnNewNavigation: document.getElementById('btn-new-navigation'),
  };

  // --- Screen management ---
  function showScreen(name) {
    Object.values(screens).forEach((s) => s.classList.remove('active'));
    if (screens[name]) screens[name].classList.add('active');
  }

  function toggleChat(show) {
    els.chatPanel.classList.toggle('open', show);
    if (show) els.chatInput.focus();
  }

  // --- Initialization ---
  async function init() {
    ApiClient.init(API_BASE);
    Chat.init(els.chatMessages, els.chatInput);

    // Register service worker
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('/sw.js').catch((err) => {
        console.warn('SW registration failed:', err);
      });
    }

    // Check for QR parameter in URL
    const params = new URLSearchParams(window.location.search);
    const nodeFromURL = params.get('node');
    if (nodeFromURL) {
      await startSessionFromNode(nodeFromURL);
    }

    // Load destinations
    try {
      destinations = await ApiClient.getDestinations();
      _renderDestinations(destinations);
    } catch (err) {
      console.error('Failed to load destinations:', err);
    }

    // Bind events
    _bindEvents();
  }

  // --- Session from QR / node ---
  async function startSessionFromNode(nodeId) {
    try {
      const session = await ApiClient.startSession(nodeId);
      sessionId = session.session_id;
      Chat.setSession(sessionId);

      els.currentLocationLabel.textContent = session.location_label;
      els.locationInfo.style.display = 'block';

      _enableNavigationButtons();
    } catch (err) {
      console.error('Failed to start session:', err);
      alert(`Posizione non trovata: ${nodeId}`);
    }
  }

  // --- Destinations ---
  function _renderDestinations(list) {
    els.destinationList.innerHTML = '';
    for (const dest of list) {
      const li = document.createElement('li');
      li.textContent = `${dest.label} (${dest.building}, P${dest.floor})`;
      li.dataset.nodeId = dest.node_id;
      li.addEventListener('click', () => _selectDestination(dest));
      els.destinationList.appendChild(li);
    }
  }

  function _selectDestination(dest) {
    selectedDestination = dest;
    els.destinationSearch.value = dest.label;
    els.destinationList.innerHTML = '';
    _enableNavigationButtons();
  }

  function _enableNavigationButtons() {
    const ready = sessionId && selectedDestination;
    els.btnStartAR.disabled = !ready;
    els.btnStartText.disabled = !ready;
  }

  // --- AR Navigation ---
  async function startARNavigation() {
    if (!sessionId || !selectedDestination) return;

    const avoidStairs = els.accessibilityToggle.checked;
    const lang = els.languageSelect.value;
    Chat.setLanguage(lang);

    try {
      // Compute route
      const route = await ApiClient.computeRoute(sessionId, selectedDestination.node_id, avoidStairs);

      // Switch screen
      showScreen('ar');

      // Start camera
      const cameraOk = await Camera.start(els.cameraFeed);
      if (!cameraOk) {
        alert('Impossibile accedere alla fotocamera. Prova la modalita testo.');
        showScreen('start');
        return;
      }

      // Init AR overlay
      const vSize = Camera.getVideoSize();
      AROverlay.init(els.arCanvas, vSize.width, vSize.height);

      // Start orientation
      Orientation.start();

      // Update UI
      els.arStatusText.textContent = 'Navigazione attiva';
      _updateStepCounter(0, route.steps.length);
      if (route.steps.length > 0) {
        els.arStepLabel.textContent = route.steps[0].label;
      }

      // Start navigation loop
      Navigation.start(sessionId, {
        onUpdate: _onNavigationUpdate,
        onArrival: _onArrival,
        onError: (err) => {
          els.arStatusText.textContent = 'Errore di connessione...';
        },
      });
    } catch (err) {
      console.error('Failed to start AR:', err);
      alert(`Errore: ${err.message}`);
    }
  }

  function _onNavigationUpdate(result) {
    // Update AR overlay
    AROverlay.render({
      nextStep: result.next_step,
      detections: result.detections || [],
      positionConfirmed: result.position_confirmed,
      arrived: result.arrived,
    });

    // Update status bar
    if (result.next_step) {
      els.arStepLabel.textContent = result.next_step.label;
    }
    if (result.route_recalculated) {
      els.arStatusText.textContent = 'Percorso ricalcolato';
      setTimeout(() => {
        els.arStatusText.textContent = 'Navigazione attiva';
      }, 3000);
    }
  }

  function _onArrival() {
    Navigation.stop();
    Camera.stop();
    Orientation.stop();
    AROverlay.destroy();

    els.arrivalDestination.textContent = selectedDestination.label;
    showScreen('arrival');
  }

  function stopARNavigation() {
    Navigation.stop();
    Camera.stop();
    Orientation.stop();
    AROverlay.destroy();
    showScreen('start');
  }

  // --- Text Navigation ---
  async function startTextNavigation() {
    if (!sessionId || !selectedDestination) return;

    const avoidStairs = els.accessibilityToggle.checked;
    const lang = els.languageSelect.value;
    Chat.setLanguage(lang);

    try {
      await ApiClient.computeRoute(sessionId, selectedDestination.node_id, avoidStairs);
      const textRoute = await ApiClient.getTextRoute(sessionId);

      showScreen('text');

      els.textRouteSummary.textContent =
        `${textRoute.total_steps} passaggi — circa ${textRoute.estimated_walking_minutes} min a piedi`;

      els.textRouteSteps.innerHTML = '';
      for (const step of textRoute.steps) {
        const li = document.createElement('li');
        li.innerHTML = `<strong>${step.instruction}</strong>`;
        if (step.reference) {
          li.innerHTML += `<br><small>${step.reference}</small>`;
        }
        els.textRouteSteps.appendChild(li);
      }
    } catch (err) {
      console.error('Failed to get text route:', err);
      alert(`Errore: ${err.message}`);
    }
  }

  // --- QR Scanning ---
  async function scanQR() {
    // Create a temporary video element for scanning
    const tempVideo = document.createElement('video');
    tempVideo.setAttribute('autoplay', '');
    tempVideo.setAttribute('playsinline', '');

    const cameraOk = await Camera.start(tempVideo);
    if (!cameraOk) {
      alert('Impossibile accedere alla fotocamera per la scansione QR.');
      return;
    }

    els.btnScanQR.textContent = 'Scansione in corso...';
    els.btnScanQR.disabled = true;

    const success = await QRScanner.startScan(tempVideo, async (value) => {
      Camera.stop();
      els.btnScanQR.textContent = 'Scansiona QR';
      els.btnScanQR.disabled = false;

      const nodeId = QRScanner.parseQRValue(value);
      if (nodeId) {
        await startSessionFromNode(nodeId);
      } else {
        alert('QR code non riconosciuto come Path2Class.');
      }
    });

    if (!success) {
      Camera.stop();
      els.btnScanQR.textContent = 'Scansiona QR';
      els.btnScanQR.disabled = false;
      alert('Scansione QR non supportata su questo browser.');
    }

    // Timeout: stop after 15 seconds
    setTimeout(() => {
      if (QRScanner) QRScanner.stopScan();
      Camera.stop();
      els.btnScanQR.textContent = 'Scansiona QR';
      els.btnScanQR.disabled = false;
    }, 15000);
  }

  // --- Helpers ---
  function _updateStepCounter(current, total) {
    els.arStepCounter.textContent = `${current + 1} / ${total}`;
  }

  // --- Event Bindings ---
  function _bindEvents() {
    // Destination search filter
    els.destinationSearch.addEventListener('input', (e) => {
      const query = e.target.value.toLowerCase();
      const filtered = destinations.filter((d) => d.label.toLowerCase().includes(query));
      _renderDestinations(filtered);
    });

    // Navigation buttons
    els.btnStartAR.addEventListener('click', startARNavigation);
    els.btnStartText.addEventListener('click', startTextNavigation);
    els.btnScanQR.addEventListener('click', scanQR);

    // AR controls
    els.btnARChat.addEventListener('click', () => toggleChat(true));
    els.btnARTextMode.addEventListener('click', () => {
      stopARNavigation();
      startTextNavigation();
    });
    els.btnARStop.addEventListener('click', stopARNavigation);

    // Text controls
    els.btnTextBack.addEventListener('click', () => showScreen('start'));
    els.btnTextChat.addEventListener('click', () => toggleChat(true));

    // Chat
    els.btnChatClose.addEventListener('click', () => toggleChat(false));
    els.btnChatSend.addEventListener('click', () => {
      const text = els.chatInput.value.trim();
      if (text) {
        Chat.sendMessage(text);
        els.chatInput.value = '';
      }
    });
    els.chatInput.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        els.btnChatSend.click();
      }
    });

    // Arrival
    els.btnNewNavigation.addEventListener('click', () => {
      selectedDestination = null;
      els.destinationSearch.value = '';
      els.btnStartAR.disabled = true;
      els.btnStartText.disabled = true;
      Chat.clearMessages();
      showScreen('start');
    });
  }

  // --- Start ---
  document.addEventListener('DOMContentLoaded', init);
})();
