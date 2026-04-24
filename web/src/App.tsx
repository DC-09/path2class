import { useEffect } from 'react';
import { Navigate, Route, Routes } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import Splash from './pages/Splash';
import Landing from './pages/Landing';
import Destination from './pages/Destination';
import CameraPermission from './pages/CameraPermission';
import ArNav from './pages/ArNav';
import TextNav from './pages/TextNav';
import Arrived from './pages/Arrived';
import DebugGlass from './pages/DebugGlass';
import { AssistantSheet } from './components/assistant/AssistantSheet';
import { useSessionStore } from './stores/useSessionStore';

/**
 * App shell — routes match the 7 screens from the prototype.
 * Real app is full-screen (no phone frame — that was presentation only).
 */
function App() {
  // Keep i18next's active language in sync with the session store.
  const { i18n } = useTranslation();
  const language = useSessionStore((s) => s.language);
  useEffect(() => {
    if (i18n.language !== language) void i18n.changeLanguage(language);
  }, [i18n, language]);

  return (
    <div className="relative w-full h-full overflow-hidden">
      <Routes>
        <Route path="/" element={<Splash />} />
        <Route path="/landing" element={<Landing />} />
        <Route path="/destination" element={<Destination />} />
        <Route path="/permission" element={<CameraPermission />} />
        <Route path="/navigate/ar" element={<ArNav />} />
        <Route path="/navigate/text" element={<TextNav />} />
        <Route path="/arrived" element={<Arrived />} />
        <Route path="/debug/glass" element={<DebugGlass />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
      {/* Chat sheet is mounted at root so it overlays every screen. */}
      <AssistantSheet />
    </div>
  );
}

export default App;
