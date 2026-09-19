import React, { useState, useEffect, useCallback, Suspense, lazy } from 'react';
import Navbar from './components/Navbar';
import Hero from './components/Hero';
import ToolsGrid from './components/ToolsGrid';
import Footer from './components/Footer';
import NotificationBanner from './components/NotificationBanner';
import LoadingScreen from './components/LoadingScreen';
import { PDF_TOOLS } from './data/toolsData';
import { subscribeGlobalConfig, recordGlobalVisit } from './utils/syncService';

// Lazy load heavy components to ensure instant initial landing page load
const ToolWorkspace = lazy(() => import('./components/ToolWorkspace'));
const PrivacyModal = lazy(() => import('./components/PrivacyModal'));
const AdminDashboard = lazy(() => import('./components/AdminDashboard'));
const AdminLoginModal = lazy(() => import('./components/AdminLoginModal'));

export default function App() {
  const [isLoading, setIsLoading] = useState(true);
  const [activeToolId, setActiveToolId] = useState(null);
  const [initialFiles, setInitialFiles] = useState([]);
  const [isPrivacyOpen, setIsPrivacyOpen] = useState(false);
  
  // Admin authentication & modal states
  const [isAdminLoginOpen, setIsAdminLoginOpen] = useState(false);
  const [isAdminDashboardOpen, setIsAdminDashboardOpen] = useState(false);
  const [isAdminAuthenticated, setIsAdminAuthenticated] = useState(() => {
    try {
      return sessionStorage.getItem('pdfbolt_admin_session') === 'true';
    } catch (e) {
      return false;
    }
  });

  // Global tool statuses { [toolId]: boolean }
  const [toolStatuses, setToolStatuses] = useState(() => {
    try {
      const saved = localStorage.getItem('pdfbolt_tool_status');
      if (saved) return JSON.parse(saved);
    } catch (e) {}
    const initial = {};
    PDF_TOOLS.forEach(t => { initial[t.id] = true; });
    return initial;
  });

  // Global Push Notification state
  const [notification, setNotification] = useState(() => {
    try {
      const saved = localStorage.getItem('pdfbolt_global_notification');
      if (saved) return JSON.parse(saved);
    } catch (e) {}
    return { enabled: false };
  });

  // Open Admin Flow: Check authentication first
  const handleOpenAdmin = useCallback(() => {
    try {
      const isAuth = sessionStorage.getItem('pdfbolt_admin_session') === 'true';
      if (isAuth) {
        setIsAdminDashboardOpen(true);
      } else {
        setIsAdminLoginOpen(true);
      }
    } catch (e) {
      setIsAdminLoginOpen(true);
    }
  }, []);

  const handleAdminLoginSuccess = () => {
    setIsAdminAuthenticated(true);
    setIsAdminLoginOpen(false);
    setIsAdminDashboardOpen(true);
  };

  const handleAdminLogout = () => {
    try {
      sessionStorage.removeItem('pdfbolt_admin_session');
    } catch (e) {}
    setIsAdminAuthenticated(false);
    setIsAdminDashboardOpen(false);
    if (window.location.hash === '#admin') {
      window.history.replaceState(null, '', window.location.pathname);
    }
  };

  // Enforce clean light mode, record visitor, and listen for Admin gateway triggers
  useEffect(() => {
    document.documentElement.classList.remove('dark');

    // Global multi-device visitor tracking
    recordGlobalVisit();

    // Check URL hash trigger: #admin
    if (window.location.hash === '#admin') {
      handleOpenAdmin();
    }

    const handleHashChange = () => {
      if (window.location.hash === '#admin') {
        handleOpenAdmin();
      }
    };
    window.addEventListener('hashchange', handleHashChange);

    // Keyboard shortcut trigger: Ctrl + Shift + A (or Cmd + Shift + A)
    const handleKeyDown = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.shiftKey && (e.key === 'A' || e.key === 'a')) {
        e.preventDefault();
        handleOpenAdmin();
      }
    };
    window.addEventListener('keydown', handleKeyDown);

    // Global multi-user sync subscription (polls serverless API / KV for tool status & notifications)
    const unsubscribe = subscribeGlobalConfig((data) => {
      if (data) {
        const config = data.config || data;
        if (config.toolStatuses && Object.keys(config.toolStatuses).length > 0) {
          setToolStatuses(config.toolStatuses);
        }
        if (config.notification) {
          setNotification(config.notification);
        }
      }
    }, 35000);

    return () => {
      window.removeEventListener('hashchange', handleHashChange);
      window.removeEventListener('keydown', handleKeyDown);
      unsubscribe();
    };
  }, [handleOpenAdmin]);

  // Handle files dropped on the Hero dropzone
  const handleHeroFilesDropped = (files) => {
    if (!files || files.length === 0) return;
    setInitialFiles(files);

    const firstFile = files[0];
    const name = firstFile.name.toLowerCase();

    if (name.endsWith('.docx') || name.endsWith('.doc')) {
      setActiveToolId('word-to-pdf');
    } else if (name.endsWith('.xlsx') || name.endsWith('.xls') || name.endsWith('.csv')) {
      setActiveToolId('excel-to-pdf');
    } else if (name.endsWith('.pptx') || name.endsWith('.ppt')) {
      setActiveToolId('powerpoint-to-pdf');
    } else if (firstFile.type.startsWith('image/')) {
      setActiveToolId('images-to-pdf');
    } else if (files.length > 1) {
      setActiveToolId('merge');
    } else {
      setActiveToolId('edit'); // Open Edit PDF by default for single PDFs!
    }
  };

  const handleSelectTool = (toolId) => {
    setInitialFiles([]);
    setActiveToolId(toolId);
  };

  const handleCloseWorkspace = () => {
    setActiveToolId(null);
    setInitialFiles([]);
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-50/60 text-slate-900 antialiased selection:bg-sky-500 selection:text-white relative">
      {/* Smooth Loading Screen */}
      {isLoading && (
        <LoadingScreen onFinish={() => setIsLoading(false)} />
      )}

      {/* Global Broadcast Push Notification Banner */}
      <NotificationBanner notification={notification} />

      {/* Navigation (Clean Public Navbar - Admin button hidden) */}
      <Navbar
        onOpenPrivacy={() => setIsPrivacyOpen(true)}
        onSelectTool={handleSelectTool}
      />

      {/* Main Container with smooth power-on entrance */}
      <main className={`flex-1 transition-all duration-700 ease-out ${
        isLoading ? 'opacity-90 translate-y-2' : 'opacity-100 translate-y-0'
      }`}>
        {/* Hero Section */}
        <Hero
          onFileDropped={handleHeroFilesDropped}
          onSelectTool={handleSelectTool}
        />

        {/* Tools Catalog */}
        <ToolsGrid
          onSelectTool={handleSelectTool}
          toolStatuses={toolStatuses}
        />
      </main>

      <Suspense fallback={null}>
        {/* Active Tool Interactive Workspace */}
        {activeToolId && (
          <ToolWorkspace
            toolId={activeToolId}
            initialFiles={initialFiles}
            onClose={handleCloseWorkspace}
          />
        )}

        {/* Admin Password Login Modal */}
        {isAdminLoginOpen && (
          <AdminLoginModal
            isOpen={isAdminLoginOpen}
            onClose={() => {
              setIsAdminLoginOpen(false);
              if (window.location.hash === '#admin') {
                window.history.replaceState(null, '', window.location.pathname);
              }
            }}
            onSuccess={handleAdminLoginSuccess}
          />
        )}

        {/* Admin & Visitor Analytics Control Center */}
        {isAdminDashboardOpen && (
          <AdminDashboard
            isOpen={isAdminDashboardOpen}
            onClose={() => {
              setIsAdminDashboardOpen(false);
              if (window.location.hash === '#admin') {
                window.history.replaceState(null, '', window.location.pathname);
              }
            }}
            onToolsChanged={(updated) => setToolStatuses(updated)}
            onNotificationChanged={(updated) => setNotification(updated)}
            onLogout={handleAdminLogout}
          />
        )}

        {/* Privacy Guarantee Dialog */}
        {isPrivacyOpen && (
          <PrivacyModal
            isOpen={isPrivacyOpen}
            onClose={() => setIsPrivacyOpen(false)}
          />
        )}
      </Suspense>

      {/* Branded Footer with Discrete Admin Lock Gateway */}
      <Footer
        onSelectTool={handleSelectTool}
        onOpenPrivacy={() => setIsPrivacyOpen(true)}
        onOpenAdmin={handleOpenAdmin}
      />
    </div>
  );
}
