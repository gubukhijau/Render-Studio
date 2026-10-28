import React, { useState, useRef } from 'react';
import {
  Upload,
  Sparkles,
  Download,
  X,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  Eye,
  Sliders,
  Maximize2,
  Github,
  Code2,
  Check,
  FolderOpen,
  ArrowRight,
  ShieldCheck,
  FileCode
} from 'lucide-react';
import { UserSession, RenderProject } from '../types/architecture';
import { saveProjectLocally } from '../services/supabaseClient';

interface SimpleRenderWorkspaceProps {
  user: UserSession;
  onViewGallery: () => void;
  onOpenDocs: () => void;
}

export type VisualStyle = 'Minimalis' | 'Tropis' | 'Luxury';

interface StyleOption {
  id: VisualStyle;
  label: string;
  image: string;
  description: string;
}

export const SimpleRenderWorkspace: React.FC<SimpleRenderWorkspaceProps> = ({
  user,
  onViewGallery,
  onOpenDocs,
}) => {
  // 1. Upload state
  const [inputImageBase64, setInputImageBase64] = useState<string | null>(null);
  const [inputMimeType, setInputMimeType] = useState<string>('image/jpeg');
  const [dimensions, setDimensions] = useState<{ width: number; height: number } | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // 2. Visual style selection (3 options matching user reference image)
  const [selectedStyle, setSelectedStyle] = useState<VisualStyle>('Minimalis');

  // 3. Additional instruction input
  const [additionalInstruction, setAdditionalInstruction] = useState('');

  // 4. Processing & Result state
  const [status, setStatus] = useState<'idle' | 'processing' | 'success' | 'failed'>('idle');
  const [progressStep, setProgressStep] = useState('');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [renderedResult, setRenderedResult] = useState<RenderProject | null>(null);
  const [savedToGallery, setSavedToGallery] = useState(false);

  // 5. Result inspection
  const [sliderPos, setSliderPos] = useState<number>(50);
  const [showPromptModal, setShowPromptModal] = useState(false);
  const [copiedPrompt, setCopiedPrompt] = useState(false);

  // Style cards matching the reference design screenshot
  const styleOptions: StyleOption[] = [
    {
      id: 'Minimalis',
      label: 'Minimalis',
      image: 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=800&q=80',
      description: 'Garis geometri bersih, beton ekspos, kaca frameless, dan pencahayaan alami.',
    },
    {
      id: 'Tropis',
      label: 'Tropis',
      image: 'https://images.unsplash.com/photo-1613490493576-7fde63acd811?auto=format&fit=crop&w=800&q=80',
      description: 'Kisi-kisi kayu alami, vegetasi rimbun, kanopi peneduh, dan pantulan air.',
    },
    {
      id: 'Luxury',
      label: 'Luxury',
      image: 'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?auto=format&fit=crop&w=800&q=80',
      description: 'Material marmer & batu alam, ambient lighting sore hari, dan detail premium.',
    },
  ];

  // Client-side image handling & optimization
  const handleFile = (file: File) => {
    const validMimes = ['image/jpeg', 'image/png', 'image/webp'];
    if (!validMimes.includes(file.type)) {
      setErrorMessage('Format berkas tidak didukung. Harap pilih gambar JPEG, PNG, atau WebP.');
      return;
    }

    if (file.size > 15 * 1024 * 1024) {
      setErrorMessage('Ukuran berkas melebihi batas 15MB. Silakan unggah gambar yang lebih ringkas.');
      return;
    }

    setErrorMessage(null);
    const reader = new FileReader();
    reader.onload = (e) => {
      const rawDataUrl = e.target?.result as string;
      const img = new Image();
      img.onload = () => {
        const MAX_DIM = 1600;
        let { width, height } = img;
        if (width > MAX_DIM || height > MAX_DIM) {
          if (width > height) {
            height = Math.round((height * MAX_DIM) / width);
            width = MAX_DIM;
          } else {
            width = Math.round((width * MAX_DIM) / height);
            height = MAX_DIM;
          }
          const canvas = document.createElement('canvas');
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          if (ctx) {
            ctx.drawImage(img, 0, 0, width, height);
            const optimized = canvas.toDataURL('image/jpeg', 0.92);
            setInputImageBase64(optimized);
            setInputMimeType('image/jpeg');
            setDimensions({ width, height });
          } else {
            setInputImageBase64(rawDataUrl);
            setInputMimeType(file.type);
            setDimensions({ width: img.width, height: img.height });
          }
        } else {
          setInputImageBase64(rawDataUrl);
          setInputMimeType(file.type);
          setDimensions({ width: img.width, height: img.height });
        }
      };
      img.src = rawDataUrl;
    };
    reader.readAsDataURL(file);
  };

  const handleGenerate = async () => {
    if (!inputImageBase64) {
      setErrorMessage('Harap upload desain arsitektur terlebih dahulu sebelum melakukan render.');
      return;
    }

    setStatus('processing');
    setErrorMessage(null);
    setSavedToGallery(false);

    setProgressStep('Menganalisis geometri bangunan & mengunci desain asli...');
    const t1 = setTimeout(() => {
      setProgressStep('Mengaplikasikan PBR tekstur dan pencahayaan fotorealistik...');
    }, 2500);
    const t2 = setTimeout(() => {
      setProgressStep('Menyempurnakan bayangan fisik dan pantulan kaca...');
    }, 5500);

    try {
      const response = await fetch('/api/render', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(user.token ? { Authorization: `Bearer ${user.token}` } : {}),
        },
        body: JSON.stringify({
          imageData: inputImageBase64,
          mimeType: inputMimeType,
          style: selectedStyle,
          additionalPrompt: additionalInstruction,
          title: `Desain Arsitektur ${selectedStyle}`,
          model: 'free-architect-engine',
        }),
      });

      clearTimeout(t1);
      clearTimeout(t2);

      const responseText = await response.text();
      let data: any;
      try {
        data = JSON.parse(responseText);
      } catch {
        throw new Error('Server mengembalikan respons non-JSON. Periksa koneksi internet Anda.');
      }

      if (!response.ok || !data.success) {
        throw new Error(data.message || data.error || 'Gagal menghasilkan render visualisasi.');
      }

      const project: RenderProject = {
        id: data.projectId,
        userId: user.id,
        title: data.title || `Desain Arsitektur ${selectedStyle}`,
        projectType: 'Exterior',
        style: selectedStyle as any,
        materials: ['Beton', 'Kaca', 'Kayu Alami'],
        lighting: 'daylight',
        aspectRatio: '16:9',
        prompt: data.prompt,
        inputImageUrl: data.inputImageUrl,
        renderedImageUrl: data.renderedImageUrl,
        createdAt: data.createdAt || new Date().toISOString(),
        status: 'completed',
        modelUsed: data.modelUsed,
      };

      setRenderedResult(project);
      saveProjectLocally(project);
      setSavedToGallery(true);
      setStatus('success');

      // Scroll smoothly to result
      setTimeout(() => {
        const el = document.getElementById('render-output-section');
        if (el) el.scrollIntoView({ behavior: 'smooth' });
      }, 200);
    } catch (err: any) {
      clearTimeout(t1);
      clearTimeout(t2);
      setStatus('failed');
      setErrorMessage(err.message || 'Terjadi kesalahan saat memproses render visual.');
    }
  };

  const handleDownload = () => {
    if (!renderedResult?.renderedImageUrl) return;
    const a = document.createElement('a');
    a.href = renderedResult.renderedImageUrl;
    a.download = `arsitektur_render_${selectedStyle.toLowerCase()}_${Date.now()}.png`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  const copyPromptText = () => {
    if (renderedResult?.prompt) {
      navigator.clipboard.writeText(renderedResult.prompt);
      setCopiedPrompt(true);
      setTimeout(() => setCopiedPrompt(false), 2000);
    }
  };

  return (
    <div className="mx-auto max-w-4xl px-4 sm:px-6 py-8">
      
      {/* -------------------------------------------------------------------- */}
      {/* RENDER WORKSPACE HEADER (Matching Reference Screenshot)               */}
      {/* -------------------------------------------------------------------- */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-6 mb-8 border-b border-[#222731] gap-4">
        <div>
          <h2 className="text-xs font-mono font-bold tracking-widest text-[#8e8d85] uppercase">
            RENDER WORKSPACE
          </h2>
          <div className="flex items-center gap-2 mt-1">
            <h1 className="font-heading text-xl sm:text-2xl font-bold text-[#f5f4ef]">
              Architecture Render Studio
            </h1>
            <span className="rounded bg-emerald-950/40 border border-emerald-900/60 px-2 py-0.5 text-[10px] font-mono text-emerald-400">
              Open Source
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={onViewGallery}
            className="flex items-center gap-1.5 rounded-lg border border-[#2a303e] bg-[#14171e] px-3.5 py-1.5 text-xs text-[#a6a49c] hover:text-[#f5f4ef] hover:border-[#c58f58] transition"
          >
            <FolderOpen className="h-3.5 w-3.5 text-[#c58f58]" />
            <span>Galeri</span>
          </button>

          <a
            href="https://github.com"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 rounded-lg border border-[#2a303e] bg-[#14171e] px-3.5 py-1.5 text-xs text-[#a6a49c] hover:text-[#f5f4ef] transition"
            title="Open Source on GitHub (MIT License)"
          >
            <Github className="h-3.5 w-3.5 text-[#f5f4ef]" />
            <span className="hidden sm:inline">GitHub</span>
          </a>
        </div>
      </div>

      {/* -------------------------------------------------------------------- */}
      {/* 1. UPLOAD DESAIN ARSITEKTUR CARD                                     */}
      {/* -------------------------------------------------------------------- */}
      <div className="mb-8">
        {!inputImageBase64 ? (
          <div
            onDragOver={(e) => {
              e.preventDefault();
              setIsDragging(true);
            }}
            onDragLeave={(e) => {
              e.preventDefault();
              setIsDragging(false);
            }}
            onDrop={(e) => {
              e.preventDefault();
              setIsDragging(false);
              if (e.dataTransfer.files && e.dataTransfer.files[0]) {
                handleFile(e.dataTransfer.files[0]);
              }
            }}
            onClick={() => fileInputRef.current?.click()}
            className={`w-full rounded-2xl border-2 border-dashed p-10 text-center cursor-pointer transition flex flex-col items-center justify-center ${
              isDragging
                ? 'border-[#c58f58] bg-[#c58f58]/10'
                : 'border-[#262c38] hover:border-[#3d4557] bg-[#13161c]'
            }`}
          >
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-[#1a1f29] text-[#f5f4ef] mb-3">
              <Upload className="h-6 w-6 stroke-[1.8]" />
            </div>

            <h3 className="font-heading text-base font-bold text-[#f5f4ef]">
              Upload desain arsitektur
            </h3>

            <p className="mt-1 text-xs text-[#8e8d85]">
              JPG, PNG atau WebP &bull; Maksimum sesuai batas aplikasi
            </p>

            <button
              type="button"
              className="mt-5 rounded-lg bg-[#222732] border border-[#2f3645] px-5 py-2 text-xs font-semibold text-[#f5f4ef] hover:bg-[#2b313f] transition shadow-sm"
            >
              Pilih gambar
            </button>
          </div>
        ) : (
          <div className="relative rounded-2xl border border-[#262c38] bg-[#13161c] p-4 flex flex-col sm:flex-row items-center gap-4">
            <div className="relative h-44 sm:h-36 w-full sm:w-56 shrink-0 rounded-xl overflow-hidden bg-[#0a0b0d] border border-[#2a303e]">
              <img
                src={inputImageBase64}
                alt="Desain Asli"
                className="h-full w-full object-contain"
              />
            </div>

            <div className="flex-1 text-left min-w-0">
              <div className="flex items-center gap-2">
                <span className="font-heading text-sm font-bold text-[#f5f4ef]">
                  Desain Arsitektur Terunggah
                </span>
                <span className="rounded bg-emerald-950/40 border border-emerald-900/50 px-2 py-0.5 text-[10px] font-mono text-emerald-400">
                  Siap Render
                </span>
              </div>
              <p className="mt-1 text-xs text-[#8e8d85] font-mono">
                {dimensions ? `${dimensions.width} × ${dimensions.height} px` : 'Resolusi Optimal'}
              </p>
              <p className="mt-2 text-xs text-[#a6a49c]">
                Desain geometris asli akan dikunci 100%. Hanya realisme pencahayaan dan material fisik yang ditingkatkan.
              </p>

              <div className="mt-4 flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="rounded-lg border border-[#2f3645] bg-[#1a1f29] px-3 py-1.5 text-xs text-[#f5f4ef] hover:bg-[#232936] transition"
                >
                  Ganti gambar
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setInputImageBase64(null);
                    setDimensions(null);
                    setErrorMessage(null);
                  }}
                  className="rounded-lg border border-rose-900/40 bg-rose-950/20 px-3 py-1.5 text-xs text-rose-300 hover:bg-rose-950/40 transition"
                >
                  Hapus
                </button>
              </div>
            </div>
          </div>
        )}

        <input
          ref={fileInputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp"
          onChange={(e) => {
            if (e.target.files && e.target.files[0]) {
              handleFile(e.target.files[0]);
            }
          }}
          className="hidden"
        />
      </div>

      {/* -------------------------------------------------------------------- */}
      {/* 2. GAYA VISUAL (Matching Reference Screenshot)                       */}
      {/* -------------------------------------------------------------------- */}
      <div className="mb-8">
        <label className="block text-sm font-bold text-[#f5f4ef] mb-3">
          Gaya visual
        </label>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {styleOptions.map((opt) => {
            const isSelected = selectedStyle === opt.id;
            return (
              <div
                key={opt.id}
                onClick={() => setSelectedStyle(opt.id)}
                className={`group cursor-pointer rounded-2xl border overflow-hidden transition-all duration-200 ${
                  isSelected
                    ? 'border-[#c58f58] ring-2 ring-[#c58f58]/40 bg-[#161a22] shadow-xl'
                    : 'border-[#262c38] bg-[#13161c] hover:border-[#3e4658]'
                }`}
              >
                <div className="aspect-[4/3] w-full overflow-hidden bg-[#0c0e12]">
                  <img
                    src={opt.image}
                    alt={opt.label}
                    className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                  />
                </div>

                <div className="p-3 text-center">
                  <span
                    className={`font-heading text-sm font-bold transition ${
                      isSelected ? 'text-[#d8a876]' : 'text-[#f5f4ef]'
                    }`}
                  >
                    {opt.label}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* -------------------------------------------------------------------- */}
      {/* 3. INSTRUKSI TAMBAHAN (Matching Reference Screenshot)                */}
      {/* -------------------------------------------------------------------- */}
      <div className="mb-8">
        <label className="block text-sm font-bold text-[#f5f4ef] mb-2">
          Instruksi tambahan
        </label>

        <textarea
          rows={3}
          value={additionalInstruction}
          onChange={(e) => setAdditionalInstruction(e.target.value)}
          placeholder="Contoh: pertahankan bentuk bangunan, gunakan material beton ekspos, pencahayaan sore, tanaman tropis, dan hasil fotorealistik."
          className="w-full rounded-xl border border-[#2a303e] bg-[#161a22] p-3.5 text-xs text-[#f5f4ef] placeholder-[#626877] focus:border-[#c58f58] focus:outline-none transition resize-none leading-relaxed"
        />
      </div>

      {/* Error Banner */}
      {errorMessage && (
        <div className="mb-6 rounded-xl border border-rose-900/60 bg-rose-950/30 p-3.5 text-xs text-rose-300 flex items-start justify-between gap-3">
          <div className="flex items-start gap-2.5">
            <AlertCircle className="h-4 w-4 text-rose-400 shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold text-rose-200">Perhatian</p>
              <p className="mt-0.5 text-rose-300/90">{errorMessage}</p>
            </div>
          </div>
          <button onClick={() => setErrorMessage(null)} className="text-rose-400 hover:text-rose-200">
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      {/* -------------------------------------------------------------------- */}
      {/* 4. TOMBOL GENERATE RENDER (Matching Reference Screenshot)             */}
      {/* -------------------------------------------------------------------- */}
      <div className="mb-10">
        <button
          type="button"
          onClick={handleGenerate}
          disabled={status === 'processing'}
          className={`w-full rounded-xl py-4 px-6 text-sm font-bold text-[#f5f4ef] flex items-center justify-center gap-2 shadow-xl transition-all duration-200 ${
            status === 'processing'
              ? 'bg-[#1e232d] text-[#717887] cursor-not-allowed'
              : 'bg-[#212733] hover:bg-[#2a3242] active:scale-[0.99] border border-[#353d4f] hover:border-[#c58f58]'
          }`}
        >
          {status === 'processing' ? (
            <>
              <RefreshCw className="h-4 w-4 animate-spin text-[#d8a876]" />
              <span>Memproses Render Fotorealistik...</span>
            </>
          ) : (
            <>
              <Sparkles className="h-4 w-4 text-[#d8a876]" />
              <span>Generate Render</span>
            </>
          )}
        </button>

        {status === 'processing' && (
          <p className="mt-3 text-center text-xs font-mono text-[#d8a876] animate-pulse">
            {progressStep || 'Memproses peningkatan realisme...'}
          </p>
        )}
      </div>

      {/* -------------------------------------------------------------------- */}
      {/* 5. HASIL RENDER VISUALISASI                                          */}
      {/* -------------------------------------------------------------------- */}
      {status === 'success' && renderedResult && (
        <div id="render-output-section" className="rounded-2xl border border-[#2a303e] bg-[#12151b] p-6 shadow-2xl mb-12">
          
          <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 mb-4 border-b border-[#222731] gap-3">
            <div>
              <span className="text-[10px] font-mono uppercase tracking-widest text-emerald-400 font-bold">
                RENDER BERHASIL &bull; 100% DESAIN ASLI DIPERTAHANKAN
              </span>
              <h3 className="font-heading text-lg font-bold text-[#f5f4ef]">
                Visualisasi Fotorealistik {selectedStyle}
              </h3>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleDownload}
                className="flex items-center gap-1.5 rounded-lg bg-[#c58f58] px-4 py-2 text-xs font-bold text-[#0a0b0d] hover:bg-[#d8a876] transition shadow-md"
              >
                <Download className="h-3.5 w-3.5" />
                <span>Unduh Gambar (PNG)</span>
              </button>

              <button
                type="button"
                onClick={() => setShowPromptModal(true)}
                className="flex items-center gap-1.5 rounded-lg border border-[#2a303e] bg-[#181c24] px-3 py-2 text-xs text-[#a6a49c] hover:text-[#f5f4ef] transition"
                title="Lihat Prompt Master yang Digunakan"
              >
                <FileCode className="h-3.5 w-3.5 text-[#c58f58]" />
                <span className="hidden sm:inline">Prompt</span>
              </button>
            </div>
          </div>

          {/* Interactive Split Comparison Slider */}
          <div className="relative h-[360px] sm:h-[480px] w-full rounded-xl border border-[#252b37] overflow-hidden select-none bg-[#090b0e] group">
            
            {/* Rendered Image (Bottom Layer) */}
            <img
              src={renderedResult.renderedImageUrl}
              alt="Hasil Render Fotorealistik"
              className="absolute inset-0 h-full w-full object-contain"
            />

            {/* Input Image (Top Layer clipped by slider) */}
            <div
              className="absolute inset-0 h-full overflow-hidden border-r-2 border-[#d8a876]"
              style={{ width: `${sliderPos}%` }}
            >
              <img
                src={renderedResult.inputImageUrl}
                alt="Desain Asli"
                className="absolute inset-0 h-full w-full object-contain bg-[#f8f7f4]"
                style={{ width: '100%', minWidth: '100%' }}
              />
              <div className="absolute top-3 left-3 rounded bg-[#0a0b0d]/85 px-2.5 py-1 text-[11px] font-mono text-[#f5f4ef] backdrop-blur border border-[#333a48]">
                DESAIN ASLI
              </div>
            </div>

            <div className="absolute top-3 right-3 rounded bg-[#c58f58] px-2.5 py-1 text-[11px] font-mono font-bold text-[#0a0b0d] shadow">
              FOTOREALISTIK AI
            </div>

            {/* Slider Handle */}
            <div
              className="absolute top-0 bottom-0 w-1 bg-[#d8a876] pointer-events-none -ml-0.5 flex items-center justify-center"
              style={{ left: `${sliderPos}%` }}
            >
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[#d8a876] text-[#0a0b0d] shadow-xl">
                <Sliders className="h-3.5 w-3.5" />
              </div>
            </div>

            <input
              type="range"
              min="0"
              max="100"
              value={sliderPos}
              onChange={(e) => setSliderPos(Number(e.target.value))}
              aria-label="Before/After comparison slider"
              className="absolute inset-0 w-full h-full opacity-0 cursor-ew-resize z-20"
            />
          </div>

          <p className="mt-3 text-center text-xs text-[#8e8d85] font-mono">
            Geser pembatas tengah untuk membandingkan desain asli vs peningkatan realisme fotorealistik
          </p>

        </div>
      )}

      {/* -------------------------------------------------------------------- */}
      {/* MASTER PROMPT INSPECTOR MODAL                                         */}
      {/* -------------------------------------------------------------------- */}
      {showPromptModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-md p-4 animate-in fade-in duration-100"
          onClick={() => setShowPromptModal(false)}
        >
          <div
            className="relative w-full max-w-2xl max-h-[85vh] overflow-y-auto rounded-2xl bg-[#12151b] border border-[#2b3240] p-6 shadow-2xl flex flex-col gap-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-[#222731] pb-3">
              <div className="flex items-center gap-2">
                <FileCode className="h-4 w-4 text-[#c58f58]" />
                <h3 className="font-heading text-sm font-bold text-[#f5f4ef]">
                  Master Objective Prompt (Absolute Design Lock)
                </h3>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={copyPromptText}
                  className="flex items-center gap-1.5 rounded-lg border border-[#2f3645] bg-[#1a1f29] px-3 py-1.5 text-xs text-[#d8a876] hover:bg-[#232936] transition"
                >
                  {copiedPrompt ? <Check className="h-3.5 w-3.5 text-emerald-400" /> : <Code2 className="h-3.5 w-3.5" />}
                  <span>{copiedPrompt ? 'Tersalin' : 'Salin Prompt'}</span>
                </button>
                <button
                  type="button"
                  onClick={() => setShowPromptModal(false)}
                  className="flex h-7 w-7 items-center justify-center rounded-lg bg-[#181c24] text-[#8e8d85] hover:text-[#f5f4ef]"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            </div>

            <p className="text-xs text-[#8e8d85]">
              Prompt resmi yang digunakan oleh mesin render untuk memastikan 100% geometri, bukaan, atap, dan proporsi bangunan asli tidak diubah:
            </p>

            <pre className="p-4 rounded-xl bg-[#090b0e] border border-[#222731] font-mono text-[11px] text-[#b6b4aa] overflow-x-auto max-h-72 leading-relaxed whitespace-pre-wrap">
              {renderedResult?.prompt || 'Memuat prompt...'}
            </pre>
          </div>
        </div>
      )}

      {/* -------------------------------------------------------------------- */}
      {/* OPEN SOURCE FOOTER                                                   */}
      {/* -------------------------------------------------------------------- */}
      <footer className="mt-16 pt-8 border-t border-[#1f242e] text-center text-xs text-[#717887]">
        <div className="flex flex-wrap items-center justify-center gap-4 font-mono text-[11px] mb-2">
          <span>Lisensi MIT</span>
          <span>&bull;</span>
          <span>100% Open Source</span>
          <span>&bull;</span>
          <span>API Gratis Aktif</span>
          <span>&bull;</span>
          <span>Tanpa Biaya Berlangganan</span>
        </div>
        <p>Architecture Render Studio &mdash; Dibuat untuk arsitek, desainer, dan komunitas visualisasi.</p>
      </footer>

    </div>
  );
};
