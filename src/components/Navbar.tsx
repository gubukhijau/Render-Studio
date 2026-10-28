import React from 'react';
import { 
  Building2, 
  Sparkles, 
  Layers, 
  Image as ImageIcon, 
  Compass, 
  User as UserIcon, 
  LogOut, 
  Sliders, 
  HelpCircle,
  Database,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';
import { UserSession, ConfigStatus } from '../types/architecture';

interface NavbarProps {
  currentPage: 'landing' | 'studio' | 'gallery' | 'docs';
  setCurrentPage: (page: 'landing' | 'studio' | 'gallery' | 'docs') => void;
  user: UserSession;
  configStatus: ConfigStatus | null;
  onOpenAuth: () => void;
  onOpenDocs: () => void;
  onLogout: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentPage,
  setCurrentPage,
  user,
  configStatus,
  onOpenAuth,
  onOpenDocs,
  onLogout,
}) => {
  const [userMenuOpen, setUserMenuOpen] = React.useState(false);

  return (
    <header className="sticky top-0 z-40 w-full border-b border-[#222731] bg-[#0c0e12]/90 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        
        {/* Brand Logo */}
        <div 
          onClick={() => setCurrentPage('landing')} 
          className="flex cursor-pointer items-center gap-3 group transition"
        >
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-br from-[#c58f58] via-[#a36f3c] to-[#6a421b] shadow-md shadow-amber-950/30 group-hover:scale-105 transition-transform duration-200">
            <Building2 className="h-5 w-5 text-stone-950" strokeWidth={2.2} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-heading text-base font-bold tracking-tight text-[#f5f4ef]">
                ARCHITECTURE
              </span>
              <span className="rounded bg-[#c58f58]/15 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-[#d8a876]">
                STUDIO
              </span>
            </div>
            <p className="text-[10px] text-[#8e8d85] font-mono tracking-wide -mt-0.5">
              AI PHOTOREALISTIC ENGINE
            </p>
          </div>
        </div>

        {/* Center Navigation Links */}
        <nav className="hidden md:flex items-center gap-1 rounded-full border border-[#222731] bg-[#14171e]/80 p-1">
          <button
            onClick={() => setCurrentPage('landing')}
            className={`flex items-center gap-2 rounded-full px-4 py-1.5 text-xs font-medium transition ${
              currentPage === 'landing'
                ? 'bg-[#222732] text-[#f5f4ef] shadow-sm'
                : 'text-[#a6a49c] hover:text-[#f5f4ef] hover:bg-[#1b1f28]'
            }`}
          >
            <Compass className="h-3.5 w-3.5 text-[#c58f58]" />
            Overview
          </button>

          <button
            onClick={() => setCurrentPage('studio')}
            className={`flex items-center gap-2 rounded-full px-4 py-1.5 text-xs font-medium transition ${
              currentPage === 'studio'
                ? 'bg-[#c58f58] text-[#0a0b0d] font-semibold shadow-sm shadow-amber-900/30'
                : 'text-[#a6a49c] hover:text-[#f5f4ef] hover:bg-[#1b1f28]'
            }`}
          >
            <Sparkles className="h-3.5 w-3.5" />
            Render Studio
          </button>

          <button
            onClick={() => setCurrentPage('gallery')}
            className={`flex items-center gap-2 rounded-full px-4 py-1.5 text-xs font-medium transition ${
              currentPage === 'gallery'
                ? 'bg-[#222732] text-[#f5f4ef] shadow-sm'
                : 'text-[#a6a49c] hover:text-[#f5f4ef] hover:bg-[#1b1f28]'
            }`}
          >
            <ImageIcon className="h-3.5 w-3.5 text-[#c58f58]" />
            Gallery
          </button>
        </nav>

        {/* Right Section: Model Badge & Profile */}
        <div className="flex items-center gap-3">
          
          {/* Active AI Model Badge */}
          <div 
            onClick={onOpenDocs}
            className="hidden sm:flex items-center gap-2 rounded-md border border-emerald-900/40 bg-emerald-950/20 px-2.5 py-1 text-[11px] text-emerald-400 hover:border-emerald-500/50 cursor-pointer transition"
            title="Engine: AI Gratis (100% Free Photorealistic Architecture Engine)"
          >
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            </span>
            <span className="font-mono font-medium text-emerald-300">AI Gratis (Aktif)</span>
          </div>

          {/* Database Setup Indicator */}
          <button
            onClick={onOpenDocs}
            className={`flex items-center gap-1.5 rounded-md border px-2.5 py-1 text-[11px] font-medium transition ${
              configStatus?.supabase?.configured
                ? 'border-emerald-900/50 bg-emerald-950/20 text-emerald-400'
                : 'border-[#383228] bg-[#1e1b16] text-[#d8a876] hover:bg-[#28231c]'
            }`}
            title="Database & Storage Configuration"
          >
            <Database className="h-3 w-3" />
            <span className="hidden lg:inline">
              {configStatus?.supabase?.configured ? 'Supabase Active' : 'DB Setup'}
            </span>
          </button>

          {/* User Profile / Auth Button */}
          {user.isGuest ? (
            <button
              onClick={onOpenAuth}
              className="flex items-center gap-1.5 rounded-lg border border-[#3c4352] bg-[#181c24] px-3 py-1.5 text-xs font-semibold text-[#f5f4ef] hover:border-[#c58f58] hover:text-[#d8a876] transition shadow-sm"
            >
              <UserIcon className="h-3.5 w-3.5 text-[#c58f58]" />
              <span>Sign In</span>
            </button>
          ) : (
            <div className="relative">
              <button
                onClick={() => setUserMenuOpen(!userMenuOpen)}
                className="flex items-center gap-2 rounded-lg border border-[#2a2f3b] bg-[#161a22] px-3 py-1.5 text-xs text-[#f5f4ef] hover:border-[#c58f58] transition"
              >
                <div className="flex h-5 w-5 items-center justify-center rounded-full bg-[#c58f58]/20 text-[10px] font-bold text-[#d8a876]">
                  {user.displayName.charAt(0).toUpperCase()}
                </div>
                <span className="max-w-[100px] truncate font-medium text-xs hidden sm:inline">
                  {user.displayName}
                </span>
              </button>

              {userMenuOpen && (
                <div 
                  className="absolute right-0 mt-2 w-52 rounded-xl border border-[#292e38] bg-[#15181e] p-2 shadow-2xl z-50 animate-in fade-in zoom-in-95 duration-100"
                  onClick={() => setUserMenuOpen(false)}
                >
                  <div className="px-3 py-2 border-b border-[#222731]">
                    <p className="text-xs font-semibold text-[#f5f4ef]">{user.displayName}</p>
                    <p className="text-[11px] text-[#8e8d85] truncate">{user.email || 'Architect'}</p>
                    <span className="inline-block mt-1 text-[9px] uppercase tracking-wider text-[#c58f58] bg-[#c58f58]/10 px-1.5 py-0.5 rounded">
                      {user.role}
                    </span>
                  </div>

                  <div className="mt-1">
                    <button
                      onClick={() => setCurrentPage('gallery')}
                      className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-xs text-[#a6a49c] hover:bg-[#1f242e] hover:text-[#f5f4ef]"
                    >
                      <ImageIcon className="h-3.5 w-3.5 text-[#c58f58]" />
                      My Render Gallery
                    </button>
                    <button
                      onClick={onOpenDocs}
                      className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-xs text-[#a6a49c] hover:bg-[#1f242e] hover:text-[#f5f4ef]"
                    >
                      <HelpCircle className="h-3.5 w-3.5 text-[#c58f58]" />
                      Setup & Architecture
                    </button>
                    <button
                      onClick={onLogout}
                      className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-xs text-rose-400 hover:bg-rose-950/30 hover:text-rose-300"
                    >
                      <LogOut className="h-3.5 w-3.5" />
                      Sign Out
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

        </div>

      </div>

      {/* Mobile Sub-Navigation Bar */}
      <div className="md:hidden flex items-center justify-around border-t border-[#222731] bg-[#0f1115] py-2 px-4">
        <button
          onClick={() => setCurrentPage('landing')}
          className={`flex flex-col items-center gap-1 text-[11px] ${
            currentPage === 'landing' ? 'text-[#d8a876] font-semibold' : 'text-[#8e8d85]'
          }`}
        >
          <Compass className="h-4 w-4" />
          <span>Home</span>
        </button>
        <button
          onClick={() => setCurrentPage('studio')}
          className={`flex flex-col items-center gap-1 text-[11px] ${
            currentPage === 'studio' ? 'text-[#d8a876] font-semibold' : 'text-[#8e8d85]'
          }`}
        >
          <Sparkles className="h-4 w-4" />
          <span>Studio</span>
        </button>
        <button
          onClick={() => setCurrentPage('gallery')}
          className={`flex flex-col items-center gap-1 text-[11px] ${
            currentPage === 'gallery' ? 'text-[#d8a876] font-semibold' : 'text-[#8e8d85]'
          }`}
        >
          <ImageIcon className="h-4 w-4" />
          <span>Gallery</span>
        </button>
        <button
          onClick={onOpenDocs}
          className={`flex flex-col items-center gap-1 text-[11px] ${
            currentPage === 'docs' ? 'text-[#d8a876] font-semibold' : 'text-[#8e8d85]'
          }`}
        >
          <Database className="h-4 w-4" />
          <span>Config</span>
        </button>
      </div>
    </header>
  );
};
