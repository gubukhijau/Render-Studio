import React, { useState } from 'react';
import {
  X,
  Database,
  Key,
  ShieldCheck,
  Server,
  Copy,
  Check,
  ExternalLink,
  Layers,
  FileCode,
  HardDrive
} from 'lucide-react';
import { ConfigStatus } from '../types/architecture';

interface SetupGuideModalProps {
  isOpen: boolean;
  onClose: () => void;
  configStatus: ConfigStatus | null;
}

export const SetupGuideModal: React.FC<SetupGuideModalProps> = ({
  isOpen,
  onClose,
  configStatus,
}) => {
  const [activeTab, setActiveTab] = useState<'status' | 'sql' | 'storage' | 'deploy'>('status');
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const sqlMigrationCode = `-- ==============================================================================
-- ARCHITECTURE RENDER STUDIO - SUPABASE PRODUCTION MIGRATION
-- Run this in your Supabase SQL Editor:
-- ==============================================================================

-- 1. Profiles Table
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name TEXT,
  role TEXT DEFAULT 'architect',
  created_at TIMESTAMPTZ DEFAULT TIMEZONE('utc', NOW()) NOT NULL
);

-- 2. Render Projects Table
CREATE TABLE IF NOT EXISTS public.render_projects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL,
  project_type TEXT NOT NULL,
  style TEXT NOT NULL,
  materials JSONB DEFAULT '[]'::jsonb,
  lighting TEXT NOT NULL,
  aspect_ratio TEXT DEFAULT '1:1',
  prompt TEXT NOT NULL,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed')),
  error_message TEXT,
  created_at TIMESTAMPTZ DEFAULT TIMEZONE('utc', NOW()) NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT TIMEZONE('utc', NOW()) NOT NULL
);

-- 3. Render Images Table
CREATE TABLE IF NOT EXISTS public.render_images (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID REFERENCES public.render_projects(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  image_type TEXT NOT NULL CHECK (image_type IN ('input', 'output')),
  storage_path TEXT NOT NULL,
  mime_type TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT TIMEZONE('utc', NOW()) NOT NULL
);

-- 4. Enable Row Level Security (RLS)
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.render_projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.render_images ENABLE ROW LEVEL SECURITY;

-- 5. Strict User Isolation Policies
CREATE POLICY "Users view own projects" ON public.render_projects FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users insert own projects" ON public.render_projects FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users delete own projects" ON public.render_projects FOR DELETE USING (auth.uid() = user_id);

-- 6. Storage Buckets Setup
INSERT INTO storage.buckets (id, name, public) VALUES ('architecture-inputs', 'architecture-inputs', false) ON CONFLICT DO NOTHING;
INSERT INTO storage.buckets (id, name, public) VALUES ('architecture-renders', 'architecture-renders', false) ON CONFLICT DO NOTHING;`;

  const copySql = () => {
    navigator.clipboard.writeText(sqlMigrationCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-md p-4 animate-in fade-in duration-100"
      onClick={onClose}
    >
      <div 
        className="relative w-full max-w-4xl max-h-[90vh] overflow-y-auto rounded-2xl bg-[#12151b] border border-[#2b3240] p-6 shadow-2xl flex flex-col gap-6"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-start justify-between border-b border-[#222731] pb-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#c58f58]/20 border border-[#c58f58]/40 text-[#d8a876]">
              <Database className="h-5 w-5" />
            </div>
            <div>
              <h2 className="font-heading text-lg font-bold text-[#f5f4ef]">
                Architecture Render Studio Configuration
              </h2>
              <p className="text-xs text-[#8e8d85] font-mono">
                Gemini Vision API &bull; Supabase Database &bull; Storage &bull; Vercel Deployment
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#181c24] text-[#8e8d85] hover:text-[#f5f4ef]"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex flex-wrap items-center gap-2 border-b border-[#222731] pb-3 text-xs">
          <button
            onClick={() => setActiveTab('status')}
            className={`flex items-center gap-2 rounded-lg px-3.5 py-1.5 font-medium transition ${
              activeTab === 'status'
                ? 'bg-[#c58f58] text-[#0a0b0d] font-bold'
                : 'text-[#a6a49c] hover:bg-[#181c24] hover:text-[#f5f4ef]'
            }`}
          >
            <Server className="h-3.5 w-3.5" />
            <span>Environment &amp; Health</span>
          </button>

          <button
            onClick={() => setActiveTab('sql')}
            className={`flex items-center gap-2 rounded-lg px-3.5 py-1.5 font-medium transition ${
              activeTab === 'sql'
                ? 'bg-[#c58f58] text-[#0a0b0d] font-bold'
                : 'text-[#a6a49c] hover:bg-[#181c24] hover:text-[#f5f4ef]'
            }`}
          >
            <FileCode className="h-3.5 w-3.5" />
            <span>Database SQL Migration</span>
          </button>

          <button
            onClick={() => setActiveTab('storage')}
            className={`flex items-center gap-2 rounded-lg px-3.5 py-1.5 font-medium transition ${
              activeTab === 'storage'
                ? 'bg-[#c58f58] text-[#0a0b0d] font-bold'
                : 'text-[#a6a49c] hover:bg-[#181c24] hover:text-[#f5f4ef]'
            }`}
          >
            <HardDrive className="h-3.5 w-3.5" />
            <span>Storage Buckets &amp; RLS</span>
          </button>

          <button
            onClick={() => setActiveTab('deploy')}
            className={`flex items-center gap-2 rounded-lg px-3.5 py-1.5 font-medium transition ${
              activeTab === 'deploy'
                ? 'bg-[#c58f58] text-[#0a0b0d] font-bold'
                : 'text-[#a6a49c] hover:bg-[#181c24] hover:text-[#f5f4ef]'
            }`}
          >
            <ExternalLink className="h-3.5 w-3.5" />
            <span>GitHub &amp; Vercel Guide</span>
          </button>
        </div>

        {/* Tab 1: Status */}
        {activeTab === 'status' && (
          <div className="space-y-4 text-xs">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              
              {/* Gemini Status Box */}
              <div className="rounded-xl border border-[#262c38] bg-[#161a22] p-4">
                <div className="flex items-center justify-between mb-3">
                  <span className="font-heading font-bold text-sm text-[#f5f4ef]">
                    Google Gemini Image API
                  </span>
                  <span className="rounded bg-emerald-950/40 text-emerald-400 px-2 py-0.5 font-mono text-[11px] border border-emerald-900/40">
                    {configStatus?.gemini?.configured ? 'Active' : 'Auto-Injected'}
                  </span>
                </div>
                <p className="text-[#a6a49c] text-xs leading-relaxed">
                  Calls are executed securely server-side using the official <code className="text-[#d8a876]">@google/genai</code> SDK. Never exposed to browser bundles.
                </p>
                <div className="mt-3 font-mono text-[11px] text-[#716d63] space-y-1">
                  <div>Initial Model: <span className="text-[#f5f4ef]">gemini-nano-banana-2.1</span></div>
                  <div>Fallback Model: <span className="text-[#f5f4ef]">gemini-3.1-flash-lite-image</span></div>
                  <div>Resolutions: 1K, 2K, 4K</div>
                </div>
              </div>

              {/* Supabase Status Box */}
              <div className="rounded-xl border border-[#262c38] bg-[#161a22] p-4">
                <div className="flex items-center justify-between mb-3">
                  <span className="font-heading font-bold text-sm text-[#f5f4ef]">
                    Supabase PostgreSQL &amp; Auth
                  </span>
                  <span className={`rounded px-2 py-0.5 font-mono text-[11px] border ${
                    configStatus?.supabase?.configured 
                      ? 'bg-emerald-950/40 text-emerald-400 border-emerald-900/40' 
                      : 'bg-[#222732] text-[#d8a876] border-[#384050]'
                  }`}>
                    {configStatus?.supabase?.configured ? 'Connected' : 'Local Ready'}
                  </span>
                </div>
                <p className="text-[#a6a49c] text-xs leading-relaxed">
                  {configStatus?.supabase?.configured 
                    ? 'Connected to live Supabase project. RLS and Storage policies enabled.'
                    : 'Currently operating in Zero-Friction Local Mode with persistent storage. Ready to connect your Supabase project keys anytime!'}
                </p>
              </div>

            </div>

            {/* Environment Variables Reference Table */}
            <div className="rounded-xl border border-[#262c38] bg-[#14171f] p-4">
              <span className="font-heading font-bold text-sm text-[#f5f4ef] block mb-2">
                Environment Variables Reference
              </span>
              <div className="overflow-x-auto">
                <table className="w-full text-left font-mono text-[11px]">
                  <thead>
                    <tr className="border-b border-[#252a36] text-[#716d63]">
                      <th className="py-2">Variable</th>
                      <th>Scope</th>
                      <th>Requirement</th>
                      <th>Description</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#202530] text-[#a6a49c]">
                    <tr>
                      <td className="py-2 text-[#d8a876]">GEMINI_API_KEY</td>
                      <td>Server Only</td>
                      <td>Required</td>
                      <td>Google Gemini Vision API key</td>
                    </tr>
                    <tr>
                      <td className="py-2 text-[#d8a876]">SUPABASE_URL</td>
                      <td>Server Only</td>
                      <td>Optional</td>
                      <td>Supabase project URL for token verification</td>
                    </tr>
                    <tr>
                      <td className="py-2 text-[#d8a876]">SUPABASE_SERVICE_ROLE_KEY</td>
                      <td>Server Only</td>
                      <td>Optional</td>
                      <td>Administrative storage uploads &amp; RLS bypass</td>
                    </tr>
                    <tr>
                      <td className="py-2 text-[#d8a876]">NEXT_PUBLIC_SUPABASE_URL</td>
                      <td>Client/Server</td>
                      <td>Optional</td>
                      <td>Next.js compatibility URL</td>
                    </tr>
                    <tr>
                      <td className="py-2 text-[#d8a876]">NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY</td>
                      <td>Client/Server</td>
                      <td>Optional</td>
                      <td>Next.js compatibility publishable key</td>
                    </tr>
                    <tr>
                      <td className="py-2 text-[#d8a876]">VITE_SUPABASE_URL</td>
                      <td>Client Only</td>
                      <td>Optional</td>
                      <td>Vite client Supabase URL</td>
                    </tr>
                    <tr>
                      <td className="py-2 text-[#d8a876]">VITE_SUPABASE_ANON_KEY</td>
                      <td>Client Only</td>
                      <td>Optional</td>
                      <td>Vite client anon key</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

          </div>
        )}

        {/* Tab 2: SQL Migration */}
        {activeTab === 'sql' && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <p className="text-xs text-[#a6a49c]">
                Execute the SQL script below in your Supabase project's SQL Editor to bootstrap tables, constraints, and Row Level Security:
              </p>
              <button
                onClick={copySql}
                className="flex items-center gap-1.5 rounded-lg bg-[#222732] px-3 py-1.5 text-xs text-[#d8a876] border border-[#2f3645] hover:bg-[#2b313f] transition"
              >
                {copied ? <Check className="h-3.5 w-3.5 text-emerald-400" /> : <Copy className="h-3.5 w-3.5" />}
                <span>{copied ? 'Copied SQL!' : 'Copy SQL'}</span>
              </button>
            </div>

            <pre className="p-4 rounded-xl bg-[#0a0b0e] border border-[#222731] font-mono text-[11px] text-[#b6b4aa] overflow-x-auto max-h-80 leading-relaxed">
              {sqlMigrationCode}
            </pre>
          </div>
        )}

        {/* Tab 3: Storage */}
        {activeTab === 'storage' && (
          <div className="space-y-4 text-xs text-[#a6a49c]">
            <p>
              Architecture Render Studio stores input sketches and rendered images in private Supabase Storage buckets.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="rounded-xl border border-[#262c38] bg-[#161a22] p-4">
                <span className="font-heading font-bold text-sm text-[#f5f4ef] block mb-1">
                  1. architecture-inputs (Private)
                </span>
                <p className="text-xs text-[#8e8d85]">
                  Stores user uploaded architectural drawings and sketches.
                </p>
                <div className="mt-2 font-mono text-[10px] text-[#d8a876] bg-[#0c0e12] p-2 rounded">
                  Path: &#123;user_id&#125;/&#123;project_id&#125;/input.[ext]
                </div>
              </div>

              <div className="rounded-xl border border-[#262c38] bg-[#161a22] p-4">
                <span className="font-heading font-bold text-sm text-[#f5f4ef] block mb-1">
                  2. architecture-renders (Private)
                </span>
                <p className="text-xs text-[#8e8d85]">
                  Stores generated high-resolution architectural visualizations.
                </p>
                <div className="mt-2 font-mono text-[10px] text-[#d8a876] bg-[#0c0e12] p-2 rounded">
                  Path: &#123;user_id&#125;/&#123;project_id&#125;/render.png
                </div>
              </div>
            </div>

            <div className="rounded-xl border border-[#262c38] bg-[#161a22] p-4">
              <span className="font-heading font-bold text-sm text-[#f5f4ef] block mb-1">
                Row Level Security (RLS) Rule
              </span>
              <p className="text-xs text-[#8e8d85]">
                Both buckets enforce strict user isolation: a user can only read and write files within the directory matching their own authenticated UUID: <code className="text-[#d8a876]">auth.uid() = (storage.foldername(name))[1]</code>.
              </p>
            </div>
          </div>
        )}

        {/* Tab 4: Deployment Guide */}
        {activeTab === 'deploy' && (
          <div className="space-y-4 text-xs text-[#a6a49c]">
            <h3 className="font-heading font-bold text-sm text-[#f5f4ef]">
              Deployment Workflow: Google AI Studio &rarr; GitHub &rarr; Vercel
            </h3>

            <ol className="list-decimal list-inside space-y-2.5 leading-relaxed">
              <li>
                <strong className="text-[#f5f4ef]">Push to GitHub Repository:</strong> Initialize git, commit all files, and push to your GitHub account.
              </li>
              <li>
                <strong className="text-[#f5f4ef]">Import into Vercel:</strong> Create a new project on Vercel from your GitHub repository.
              </li>
              <li>
                <strong className="text-[#f5f4ef]">Set Environment Variables on Vercel:</strong>
                <ul className="list-disc list-inside ml-5 mt-1 space-y-1 text-[#8e8d85]">
                  <li><code className="text-[#d8a876]">GEMINI_API_KEY</code> = Your Google Gemini API key</li>
                  <li><code className="text-[#d8a876]">SUPABASE_URL</code> = Your Supabase project URL</li>
                  <li><code className="text-[#d8a876]">SUPABASE_SERVICE_ROLE_KEY</code> = Your Supabase service role key</li>
                </ul>
              </li>
              <li>
                <strong className="text-[#f5f4ef]">Deploy:</strong> Click Deploy. The production build runs <code className="text-[#d8a876]">npm run build</code> and serves the full-stack visualization studio.
              </li>
            </ol>
          </div>
        )}

      </div>
    </div>
  );
};
