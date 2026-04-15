/**
 * Path2Class — Chat Module
 * Manages the conversational assistant UI and API calls.
 */

const Chat = (() => {
  let messagesContainer = null;
  let inputField = null;
  let sessionId = null;
  let language = 'it';

  function init(messagesEl, inputEl) {
    messagesContainer = messagesEl;
    inputField = inputEl;
  }

  function setSession(sid) {
    sessionId = sid;
  }

  function setLanguage(lang) {
    language = lang;
  }

  function clearMessages() {
    if (messagesContainer) {
      messagesContainer.innerHTML = '';
    }
  }

  function addMessage(text, sender = 'user') {
    if (!messagesContainer) return;

    const msg = document.createElement('div');
    msg.className = `chat-msg chat-msg-${sender}`;
    msg.textContent = text;
    messagesContainer.appendChild(msg);
    messagesContainer.scrollTop = messagesContainer.scrollHeight;
  }

  async function sendMessage(text) {
    if (!text.trim()) return;

    addMessage(text, 'user');

    if (!sessionId) {
      addMessage('Nessuna sessione attiva. Scansiona un QR o seleziona una posizione di partenza.', 'system');
      return;
    }

    // Show typing indicator
    const typingEl = document.createElement('div');
    typingEl.className = 'chat-msg chat-msg-assistant chat-typing';
    typingEl.textContent = '...';
    messagesContainer.appendChild(typingEl);

    try {
      const response = await ApiClient.askAssistant(sessionId, text, language);
      typingEl.remove();
      addMessage(response.reply, 'assistant');

      // Show suggested actions
      if (response.suggested_actions && response.suggested_actions.length > 0) {
        _showSuggestions(response.suggested_actions);
      }
    } catch (err) {
      typingEl.remove();
      addMessage(`Errore: ${err.message}`, 'system');
    }
  }

  function _showSuggestions(actions) {
    const container = document.createElement('div');
    container.className = 'chat-suggestions';

    for (const action of actions) {
      const btn = document.createElement('button');
      btn.className = 'chat-suggestion-btn';
      btn.textContent = action.label;
      btn.addEventListener('click', () => {
        container.remove();
        sendMessage(action.label);
      });
      container.appendChild(btn);
    }

    messagesContainer.appendChild(container);
    messagesContainer.scrollTop = messagesContainer.scrollHeight;
  }

  return { init, setSession, setLanguage, clearMessages, addMessage, sendMessage };
})();
