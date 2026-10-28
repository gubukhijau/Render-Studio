import React, { useState, useEffect } from 'react';
import { Navbar } from './components/Navbar';
import { LandingPage } from './components/LandingPage';
import { RenderStudio } from './components/RenderStudio';
import { Gallery } from './components/Gallery';
import { AuthModal } from './components/AuthModal';
import { SetupGuideModal } from './components/SetupGuideModal';
import { UserSession, ConfigStatus } from './types/architecture';
import { getInitialSession, logOut } from './services/supabaseClient';

export default function App() {
  const [currentPage, setCurrentPage] = useState<'landing' | 'studio' | 'gallery' | 'docs'>('landing');
  const [user, setUser] = useState<UserSession>({
    id: 'guest_init',
    displayName: 'Guest Architect',
    role: 'Architect',
    isGuest: true,
  });
  const [configStatus, setConfigStatus] = useState<ConfigStatus | null>(null);
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [docsModalOpen, setDocsModalOpen] = useState(false);
  const [selectedSketchId, setSelectedSketchId] = useState<string | null>(null);

  useEffect(() => {
    // 1. Initialize user session
    getInitialSession().then((session) => {
      setUser(session);
    });

    // 2. Fetch server configuration & health status
    fetch('/api/config-status')
      .then((res) => res.json())
      .then((data: ConfigStatus) => {
        setConfigStatus(data);
      })
      .catch((err) => {
        console.warn('Could not fetch server config status:', err);
      });
  }, []);

  const handleStartRendering = (sketchId?: string) => {
    if (sketchId) {
      setSelectedSketchId(sketchId);
    }
    setCurrentPage('studio');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleLogout = async () => {
    await logOut();
    const guest = await getInitialSession();
    setUser(guest);
  };

  return (
    <div className="min-h-screen bg-[#0c0e12] text-[#f5f4ef] flex flex-col font-sans">
      
      {/* Top Navigation */}
      <Navbar
        currentPage={currentPage}
        setCurrentPage={(page) => {
          if (page === 'docs') {
            setDocsModalOpen(true);
          } else {
            setCurrentPage(page);
            window.scrollTo({ top: 0, behavior: 'smooth' });
          }
        }}
        user={user}
        configStatus={configStatus}
        onOpenAuth={() => setAuthModalOpen(true)}
        onOpenDocs={() => setDocsModalOpen(true)}
        onLogout={handleLogout}
      />

      {/* Main View Area */}
      <main className="flex-1">
        {currentPage === 'landing' && (
          <LandingPage
            onStartRendering={handleStartRendering}
            onOpenDocs={() => setDocsModalOpen(true)}
          />
        )}

        {currentPage === 'studio' && (
          <RenderStudio
            user={user}
            initialSketchId={selectedSketchId}
            onViewGallery={() => {
              setCurrentPage('gallery');
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
            onOpenDocs={() => setDocsModalOpen(true)}
          />
        )}

        {currentPage === 'gallery' && (
          <Gallery
            user={user}
            onOpenStudio={() => {
              setCurrentPage('studio');
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
          />
        )}
      </main>

      {/* Authentication Modal */}
      <AuthModal
        isOpen={authModalOpen}
        onClose={() => setAuthModalOpen(false)}
        onSuccess={(loggedUser) => {
          setUser(loggedUser);
        }}
      />

      {/* Setup Guide & Documentation Modal */}
      <SetupGuideModal
        isOpen={docsModalOpen}
        onClose={() => setDocsModalOpen(false)}
        configStatus={configStatus}
      />

    </div>
  );
}
