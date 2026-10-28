import React, { useState } from 'react';
import { 
  Building2, 
  X, 
  Mail, 
  Lock, 
  User as UserIcon, 
  Sparkles, 
  ArrowRight,
  AlertCircle,
  CheckCircle2
} from 'lucide-react';
import { loginWithEmail, signUpWithEmail } from '../services/supabaseClient';
import { UserSession } from '../types/architecture';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (user: UserSession) => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
}) => {
  const [mode, setMode] = useState<'login' | 'signup'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);

    if (!email || !password) {
      setErrorMsg('Please enter both email and password.');
      return;
    }

    setLoading(true);
    try {
      if (mode === 'login') {
        const res = await loginWithEmail(email, password);
        if (res.success && res.user) {
          onSuccess(res.user);
          onClose();
        } else {
          setErrorMsg(res.error || 'Login failed. Please check your credentials.');
        }
      } else {
        const res = await signUpWithEmail(email, password, fullName);
        if (res.success && res.user) {
          setSuccessMsg('Account created successfully! You are now logged in.');
          setTimeout(() => {
            if (res.user) onSuccess(res.user);
            onClose();
          }, 1200);
        } else {
          setErrorMsg(res.error || 'Failed to create account.');
        }
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'An unexpected authentication error occurred.');
    } finally {
      setLoading(false);
    }
  };

  const handleGuestContinue = () => {
    const guestUser: UserSession = {
      id: 'guest_' + Math.random().toString(36).substring(2, 9),
      displayName: 'Guest Architect',
      role: 'Architect',
      isGuest: true,
    };
    onSuccess(guestUser);
    onClose();
  };

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in duration-100"
      onClick={onClose}
    >
      <div 
        className="relative w-full max-w-md rounded-2xl bg-[#12151b] border border-[#2b3240] p-6 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 flex h-8 w-8 items-center justify-center rounded-lg bg-[#181c24] text-[#8e8d85] hover:text-[#f5f4ef] transition"
        >
          <X className="h-4 w-4" />
        </button>

        {/* Modal Brand Header */}
        <div className="flex items-center gap-3 mb-6">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-[#c58f58] to-[#966533]">
            <Building2 className="h-5 w-5 text-[#0a0b0d]" />
          </div>
          <div>
            <h3 className="font-heading text-lg font-bold text-[#f5f4ef]">
              Architecture Render Studio
            </h3>
            <p className="text-xs text-[#8e8d85] font-mono">
              Supabase Authentication Portal
            </p>
          </div>
        </div>

        {/* Mode Tabs */}
        <div className="grid grid-cols-2 gap-1 rounded-xl bg-[#181c24] p-1 mb-6 border border-[#262c38]">
          <button
            type="button"
            onClick={() => {
              setMode('login');
              setErrorMsg(null);
            }}
            className={`py-2 text-xs font-semibold rounded-lg transition ${
              mode === 'login'
                ? 'bg-[#c58f58] text-[#0a0b0d]'
                : 'text-[#8e8d85] hover:text-[#f5f4ef]'
            }`}
          >
            Sign In
          </button>
          <button
            type="button"
            onClick={() => {
              setMode('signup');
              setErrorMsg(null);
            }}
            className={`py-2 text-xs font-semibold rounded-lg transition ${
              mode === 'signup'
                ? 'bg-[#c58f58] text-[#0a0b0d]'
                : 'text-[#8e8d85] hover:text-[#f5f4ef]'
            }`}
          >
            Create Account
          </button>
        </div>

        {/* Messages */}
        {errorMsg && (
          <div className="mb-4 rounded-xl border border-rose-900/60 bg-rose-950/30 p-3 text-xs text-rose-300 flex items-start gap-2.5">
            <AlertCircle className="h-4 w-4 shrink-0 text-rose-400 mt-0.5" />
            <span>{errorMsg}</span>
          </div>
        )}

        {successMsg && (
          <div className="mb-4 rounded-xl border border-emerald-900/60 bg-emerald-950/30 p-3 text-xs text-emerald-300 flex items-start gap-2.5">
            <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-400 mt-0.5" />
            <span>{successMsg}</span>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {mode === 'signup' && (
            <div>
              <label className="block text-xs font-mono uppercase text-[#a6a49c] mb-1.5">
                Full Name / Studio Name
              </label>
              <div className="relative">
                <UserIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-[#716d63]" />
                <input
                  type="text"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="e.g. Maya Lin Architect"
                  className="w-full rounded-xl border border-[#2a303e] bg-[#161a22] pl-9 pr-3.5 py-2.5 text-xs text-[#f5f4ef] placeholder-[#626877] focus:border-[#c58f58] focus:outline-none transition"
                />
              </div>
            </div>
          )}

          <div>
            <label className="block text-xs font-mono uppercase text-[#a6a49c] mb-1.5">
              Email Address
            </label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-[#716d63]" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="architect@studio.com"
                className="w-full rounded-xl border border-[#2a303e] bg-[#161a22] pl-9 pr-3.5 py-2.5 text-xs text-[#f5f4ef] placeholder-[#626877] focus:border-[#c58f58] focus:outline-none transition"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-mono uppercase text-[#a6a49c] mb-1.5">
              Password
            </label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-[#716d63]" />
              <input
                type="password"
                required
                minLength={6}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••••••"
                className="w-full rounded-xl border border-[#2a303e] bg-[#161a22] pl-9 pr-3.5 py-2.5 text-xs text-[#f5f4ef] placeholder-[#626877] focus:border-[#c58f58] focus:outline-none transition"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-xl bg-gradient-to-r from-[#c58f58] to-[#ab7540] py-3 text-xs font-bold uppercase tracking-wider text-[#0a0b0d] hover:brightness-110 transition shadow-lg flex items-center justify-center gap-2"
          >
            {loading ? (
              <span>Authenticating...</span>
            ) : mode === 'login' ? (
              <>
                <span>Sign In to Studio</span>
                <ArrowRight className="h-4 w-4" />
              </>
            ) : (
              <>
                <span>Create Architect Profile</span>
                <ArrowRight className="h-4 w-4" />
              </>
            )}
          </button>
        </form>

        {/* Guest fallback button */}
        <div className="mt-6 pt-4 border-t border-[#222731] text-center">
          <button
            type="button"
            onClick={handleGuestContinue}
            className="text-xs text-[#d8a876] hover:text-[#f5f4ef] transition font-mono flex items-center justify-center gap-1.5 mx-auto"
          >
            <Sparkles className="h-3.5 w-3.5 text-[#c58f58]" />
            <span>Continue as Guest Architect</span>
          </button>
        </div>

      </div>
    </div>
  );
};
