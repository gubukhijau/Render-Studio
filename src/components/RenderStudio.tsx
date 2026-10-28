import React, { useState, useRef, useEffect } from 'react';
import {
  Upload,
  Sparkles,
  Sliders,
  Image as ImageIcon,
  CheckCircle2,
  AlertCircle,
  Download,
  Eye,
  RefreshCw,
  FolderPlus,
  Layers,
  Sun,
  Palette,
  Maximize2,
  X,
  FileCheck,
  Building,
  Columns,
  SplitSquareVertical,
  HelpCircle,
  Cpu
} from 'lucide-react';
import { 
  ProjectType, 
  ArchitecturalStyle, 
  LightingOption, 
  AspectRatio, 
  AIModel, 
  Resolution,
  RenderProject, 
  UserSession 
} from '../types/architecture';
import { SAMPLE_SKETCHES } from '../data/sampleSketches';
import { saveProjectLocally } from '../services/supabaseClient';

interface RenderStudioProps {
  user: UserSession;
  initialSketchId?: string | null;
  onViewGallery: () => void;
  onOpenDocs: () => void;
}

export const RenderStudio: React.FC<RenderStudioProps> = ({
  user,
  initialSketchId,
  onViewGallery,
  onOpenDocs,
}) => {
  // Form State
  const [projectTitle, setProjectTitle] = useState('Modern Tropical Villa');
  const [projectType, setProjectType] = useState<ProjectType>('Exterior');
  const [style, setStyle] = useState<ArchitecturalStyle>('Modern Tropical');
  const [selectedMaterials, setSelectedMaterials] = useState<string[]>([
    'concrete',
    'natural wood',
    'glass',
  ]);
  const [lighting, setLighting] = useState<LightingOption>('golden hour');
  const [aspectRatio, setAspectRatio] = useState<AspectRatio>('16:9');
  const [additionalPrompt, setAdditionalPrompt] = useState('');
  const [model, setModel] = useState<AIModel>('gemini-nano-banana-2.1');
  const [imageSize, setImageSize] = useState<Resolution>('1K');

  // Image Upload State
  const [inputImageBase64, setInputImageBase64] = useState<string | null>(null);
  const [inputMimeType, setInputMimeType] = useState<string>('image/jpeg');
  const [inputImageDimensions, setInputImageDimensions] = useState<{ width: number; height: number } | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Generation & Status State
  const [status, setStatus] = useState<'idle' | 'uploading' | 'processing' | 'success' | 'failed'>('idle');
  const [progressStep, setProgressStep] = useState<string>('');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [renderedResult, setRenderedResult] = useState<RenderProject | null>(null);
  const [savedToGallery, setSavedToGallery] = useState(false);

  // Result View Modes
  const [viewMode, setViewMode] = useState<'split' | 'side-by-side'>('split');
  const [splitPos, setSplitPos] = useState<number>(50);
  const [lightboxOpen, setLightboxOpen] = useState(false);

  // Material choices
  const availableMaterials = [
    { id: 'concrete', label: 'Concrete (Board-Formed)' },
    { id: 'natural wood', label: 'Natural Wood / Teak' },
    { id: 'glass', label: 'Architectural Low-Iron Glass' },
    { id: 'stone', label: 'Natural Stone / Travertine' },
    { id: 'brick', label: 'Exposed Clay Brick' },
    { id: 'black steel', label: 'Black Coated Steel' },
    { id: 'bronze metal', label: 'Bronze / Copper Accents' },
    { id: 'terracotta', label: 'Terracotta Cladding' },
  ];

  // Initialize sketch if passed from hero
  useEffect(() => {
    if (initialSketchId) {
      const found = SAMPLE_SKETCHES.find((s) => s.id === initialSketchId);
      if (found) {
        loadSampleSketch(found);
      }
    } else if (!inputImageBase64) {
      // Default to first sketch for smooth test experience
      loadSampleSketch(SAMPLE_SKETCHES[0]);
    }
  }, [initialSketchId]);

  const loadSampleSketch = (sketch: typeof SAMPLE_SKETCHES[0]) => {
    setInputImageBase64(sketch.dataUrl);
    setInputMimeType('image/svg+xml');
    setProjectTitle(sketch.title);
    setProjectType(sketch.projectType);
    setStyle(sketch.defaultStyle);
    setSelectedMaterials(sketch.defaultMaterials);
    setLighting(sketch.defaultLighting);
    setAspectRatio(sketch.defaultAspectRatio);
    setInputImageDimensions({ width: 1200, height: 800 });
    setStatus('idle');
    setErrorMessage(null);
  };

  const toggleMaterial = (matId: string) => {
    if (selectedMaterials.includes(matId)) {
      if (selectedMaterials.length > 1) {
        setSelectedMaterials(selectedMaterials.filter((m) => m !== matId));
      }
    } else {
      setSelectedMaterials([...selectedMaterials, matId]);
    }
  };

  // Handle File selection
  const handleFile = (file: File) => {
    // Validate MIME type
    const validMimes = ['image/jpeg', 'image/png', 'image/webp'];
    if (!validMimes.includes(file.type)) {
      setErrorMessage('Invalid file format. Please upload JPEG, PNG, or WebP images.');
      return;
    }

    // Validate size (15MB)
    if (file.size > 15 * 1024 * 1024) {
      setErrorMessage('File size exceeds 15MB limit. Please upload a smaller image.');
      return;
    }

    setErrorMessage(null);
    setInputMimeType(file.type);

    const reader = new FileReader();
    reader.onload = (e) => {
      const dataUrl = e.target?.result as string;
      setInputImageBase64(dataUrl);

      // Measure dimensions
      const img = new Image();
      img.onload = () => {
        setInputImageDimensions({ width: img.width, height: img.height });
      };
      img.src = dataUrl;

      // Update title if generic
      if (projectTitle === 'Modern Tropical Villa') {
        const cleanName = file.name.replace(/\.[^/.]+$/, '').replace(/[-_]/g, ' ');
        setProjectTitle(cleanName);
      }
    };
    reader.readAsDataURL(file);
  };

  // Drag and Drop handlers
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFile(e.dataTransfer.files[0]);
    }
  };

  // ---------------------------------------------------------------------------
  // GENERATE RENDER ACTION (Server API call)
  // ---------------------------------------------------------------------------
  const handleGenerateRender = async () => {
    if (!inputImageBase64) {
      setErrorMessage('Please upload an architectural sketch or select a sample sketch before generating.');
      return;
    }

    setStatus('processing');
    setErrorMessage(null);
    setSavedToGallery(false);

    // Progressive status updates
    setProgressStep('Analyzing building geometry and architectural massing...');
    const t1 = setTimeout(() => {
      setProgressStep('Calculating physical material reflections and surface textures...');
    }, 2800);
    const t2 = setTimeout(() => {
      setProgressStep('Synthesizing camera perspective and ambient lighting...');
    }, 6000);
    const t3 = setTimeout(() => {
      setProgressStep('Finalizing photorealistic high-resolution rendering...');
    }, 9500);

    try {
      const response = await fetch('/api/render', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(user.token ? { Authorization: `Bearer ${user.token}` } : {}),
        },
        body: JSON.stringify({
          imageData: inputImageBase64,
          mimeType: inputMimeType === 'image/svg+xml' ? 'image/png' : inputMimeType,
          projectType,
          style,
          materials: selectedMaterials,
          lighting,
          aspectRatio,
          additionalPrompt,
          title: projectTitle,
          model,
          imageSize,
        }),
      });

      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.message || data.error || 'Failed to generate render.');
      }

      const newProject: RenderProject = {
        id: data.projectId,
        userId: user.id,
        title: data.title,
        projectType: data.projectType,
        style: data.style,
        materials: data.materials,
        lighting: data.lighting,
        aspectRatio: data.aspectRatio,
        prompt: data.prompt,
        inputImageUrl: data.inputImageUrl,
        renderedImageUrl: data.renderedImageUrl,
        createdAt: data.createdAt,
        status: 'completed',
        modelUsed: data.modelUsed,
      };

      setRenderedResult(newProject);
      saveProjectLocally(newProject);
      setSavedToGallery(true);
      setStatus('success');
    } catch (err: any) {
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
      console.error('Render error:', err);
      setStatus('failed');
      setErrorMessage(
        err.message || 'An error occurred during AI rendering. Please check your image or environment configuration.'
      );
    }
  };

  // Download high-resolution image
  const handleDownload = () => {
    if (!renderedResult?.renderedImageUrl) return;
    const link = document.createElement('a');
    link.href = renderedResult.renderedImageUrl;
    const cleanTitle = (projectTitle || 'architectural_render')
      .toLowerCase()
      .replace(/[^a-z0-9]/g, '_');
    link.download = `${cleanTitle}_${Date.now()}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
      
      {/* Studio Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between pb-6 mb-8 border-b border-[#222731] gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="font-heading text-2xl sm:text-3xl font-bold text-[#f5f4ef]">
              Architectural Render Studio
            </h1>
            <span className="rounded bg-[#c58f58]/20 px-2.5 py-0.5 text-xs font-mono font-medium text-[#d8a876] border border-[#c58f58]/40">
              PRO
            </span>
          </div>
          <p className="mt-1 text-xs sm:text-sm text-[#8e8d85]">
            Configure architectural materials, lighting environment, and generate photorealistic visualizations.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={onViewGallery}
            className="flex items-center gap-2 rounded-lg border border-[#2a2f3b] bg-[#14171e] px-4 py-2 text-xs font-semibold text-[#f5f4ef] hover:border-[#c58f58] transition"
          >
            <ImageIcon className="h-3.5 w-3.5 text-[#c58f58]" />
            <span>Open Gallery</span>
          </button>
        </div>
      </div>

      {/* Main Studio Grid: Left Canvas / Workspace & Right Settings Panel */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        
        {/* =================================================================== */}
        {/* LEFT WORKSPACE: Upload, Preview, Rendering, Results */}
        {/* =================================================================== */}
        <div className="lg:col-span-7 xl:col-span-8 flex flex-col gap-6">
          
          {/* Preset Architectural Sketches quick selector */}
          <div className="rounded-xl border border-[#222731] bg-[#13161c] p-4">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-mono font-semibold uppercase text-[#d8a876] flex items-center gap-1.5">
                <FileCheck className="h-3.5 w-3.5 text-[#c58f58]" />
                Sample Architectural Sketches
              </span>
              <span className="text-[11px] text-[#716d63]">1-Click load for testing</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
              {SAMPLE_SKETCHES.map((sketch) => (
                <button
                  key={sketch.id}
                  onClick={() => loadSampleSketch(sketch)}
                  className="flex items-center gap-2.5 rounded-lg border border-[#252b37] bg-[#181c24] p-2 text-left hover:border-[#c58f58] hover:bg-[#1f242f] transition text-xs group"
                >
                  <div className="h-10 w-12 rounded bg-white overflow-hidden shrink-0 border border-stone-300">
                    <img src={sketch.dataUrl} alt={sketch.title} className="h-full w-full object-cover" />
                  </div>
                  <div className="min-w-0">
                    <p className="font-medium text-[#f5f4ef] truncate group-hover:text-[#d8a876]">
                      {sketch.title}
                    </p>
                    <p className="text-[10px] text-[#716d63] uppercase">
                      {sketch.projectType} &bull; {sketch.defaultStyle}
                    </p>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Active Canvas Area */}
          <div className="relative rounded-2xl border border-[#262c38] bg-[#12151b] overflow-hidden min-h-[460px] flex flex-col justify-between shadow-2xl">
            
            {/* Top Bar of Canvas */}
            <div className="flex items-center justify-between border-b border-[#222731] bg-[#0d0f13] px-4 py-2.5 text-xs">
              <div className="flex items-center gap-2 text-[#a6a49c]">
                <Layers className="h-3.5 w-3.5 text-[#c58f58]" />
                <span className="font-mono text-xs text-[#f5f4ef]">
                  {renderedResult ? 'AI Render Result' : inputImageBase64 ? 'Active Design Input' : 'Dropzone'}
                </span>
                {inputImageDimensions && (
                  <span className="text-[10px] text-[#716d63] font-mono">
                    ({inputImageDimensions.width} &times; {inputImageDimensions.height})
                  </span>
                )}
              </div>

              {renderedResult && (
                <div className="flex items-center gap-1.5 rounded-lg bg-[#181c24] p-1 border border-[#252b37]">
                  <button
                    onClick={() => setViewMode('split')}
                    className={`flex items-center gap-1 rounded px-2.5 py-1 text-[11px] font-medium transition ${
                      viewMode === 'split' ? 'bg-[#c58f58] text-[#0a0b0d] font-semibold' : 'text-[#a6a49c] hover:text-[#f5f4ef]'
                    }`}
                  >
                    <SplitSquareVertical className="h-3 w-3" />
                    Split Slider
                  </button>
                  <button
                    onClick={() => setViewMode('side-by-side')}
                    className={`flex items-center gap-1 rounded px-2.5 py-1 text-[11px] font-medium transition ${
                      viewMode === 'side-by-side' ? 'bg-[#c58f58] text-[#0a0b0d] font-semibold' : 'text-[#a6a49c] hover:text-[#f5f4ef]'
                    }`}
                  >
                    <Columns className="h-3 w-3" />
                    Side-by-Side
                  </button>
                </div>
              )}
            </div>

            {/* Canvas Body */}
            <div className="relative flex-1 flex items-center justify-center p-4">
              
              {/* CASE 1: Processing Animation */}
              {status === 'processing' && (
                <div className="relative w-full h-[400px] flex flex-col items-center justify-center overflow-hidden rounded-xl bg-[#08090b]">
                  {/* Background reference image with animated scanning line */}
                  {inputImageBase64 && (
                    <img 
                      src={inputImageBase64} 
                      alt="Processing Reference" 
                      className="absolute inset-0 h-full w-full object-contain opacity-25 filter blur-xs"
                    />
                  )}

                  {/* Laser Scanning Line */}
                  <div className="absolute inset-x-0 h-1 bg-gradient-to-r from-transparent via-[#d8a876] to-transparent shadow-[0_0_15px_#c58f58] animate-bounce" />

                  {/* Processing Overlay Details */}
                  <div className="relative z-10 flex flex-col items-center text-center p-6 rounded-2xl bg-[#0f1115]/90 border border-[#2a2f3c] shadow-2xl backdrop-blur-md max-w-md">
                    <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-[#c58f58]/20 border border-[#c58f58]/40 mb-4 animate-spin">
                      <RefreshCw className="h-6 w-6 text-[#d8a876]" />
                    </div>

                    <h3 className="font-heading text-lg font-bold text-[#f5f4ef]">
                      Rendering Architectural Space
                    </h3>

                    <p className="mt-2 text-xs font-mono text-[#d8a876] animate-pulse">
                      {progressStep || 'Contacting Google Gemini Vision Engine...'}
                    </p>

                    <div className="mt-4 flex items-center gap-2 text-[11px] text-[#716d63] font-mono">
                      <span>Model: {model}</span>
                      <span>&bull;</span>
                      <span>Lighting: {lighting}</span>
                    </div>
                  </div>
                </div>
              )}

              {/* CASE 2: Finished Render Result */}
              {status === 'success' && renderedResult && (
                <div className="relative w-full h-full flex flex-col items-center justify-center">
                  
                  {viewMode === 'split' ? (
                    // Interactive Before/After Split View
                    <div className="relative w-full h-[400px] sm:h-[480px] overflow-hidden rounded-xl border border-[#262c38] select-none shadow-inner group">
                      
                      {/* Rendered Result Layer (Bottom) */}
                      <img
                        src={renderedResult.renderedImageUrl}
                        alt="AI Architectural Render"
                        className="absolute inset-0 h-full w-full object-contain bg-[#08090c]"
                      />

                      {/* Input Reference Layer (Top - clipped by slider) */}
                      <div 
                        className="absolute inset-0 h-full overflow-hidden border-r-2 border-[#d8a876]"
                        style={{ width: `${splitPos}%` }}
                      >
                        <img
                          src={renderedResult.inputImageUrl}
                          alt="Input Sketch"
                          className="absolute inset-0 h-full w-full object-contain bg-[#f8f7f4]"
                          style={{ width: '100%', minWidth: '100%' }}
                        />
                        <div className="absolute top-3 left-3 rounded bg-[#0a0b0d]/85 px-2.5 py-1 text-[11px] font-mono text-[#f5f4ef] backdrop-blur border border-[#333a48]">
                          SKETCH
                        </div>
                      </div>

                      <div className="absolute top-3 right-3 rounded bg-[#c58f58]/90 px-2.5 py-1 text-[11px] font-mono font-bold text-[#0a0b0d] shadow">
                        AI RENDER
                      </div>

                      {/* Slider handle */}
                      <div 
                        className="absolute top-0 bottom-0 w-1 bg-[#d8a876] pointer-events-none -ml-0.5 flex items-center justify-center"
                        style={{ left: `${splitPos}%` }}
                      >
                        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[#d8a876] text-[#0a0b0d] shadow-lg">
                          <Sliders className="h-3.5 w-3.5" />
                        </div>
                      </div>

                      <input
                        type="range"
                        min="0"
                        max="100"
                        value={splitPos}
                        onChange={(e) => setSplitPos(Number(e.target.value))}
                        aria-label="Split comparison slider"
                        className="absolute inset-0 w-full h-full opacity-0 cursor-ew-resize z-20"
                      />
                    </div>
                  ) : (
                    // Side-by-side View
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 w-full">
                      <div className="relative rounded-xl border border-[#252b37] overflow-hidden bg-[#f8f7f4] h-[340px] flex items-center justify-center">
                        <img 
                          src={renderedResult.inputImageUrl} 
                          alt="Original Design" 
                          className="h-full w-full object-contain p-2"
                        />
                        <div className="absolute top-3 left-3 rounded bg-[#0a0b0d]/80 px-2 py-0.5 text-[10px] font-mono text-[#f5f4ef]">
                          ORIGINAL SKETCH
                        </div>
                      </div>

                      <div className="relative rounded-xl border border-[#252b37] overflow-hidden bg-[#08090c] h-[340px] flex items-center justify-center">
                        <img 
                          src={renderedResult.renderedImageUrl} 
                          alt="Rendered Visualization" 
                          className="h-full w-full object-contain"
                        />
                        <div className="absolute top-3 right-3 rounded bg-[#c58f58] px-2 py-0.5 text-[10px] font-mono font-bold text-[#0a0b0d]">
                          AI PHOTOREALISM
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Result Actions Bar */}
                  <div className="mt-4 flex flex-wrap items-center justify-between w-full gap-3 pt-3 border-t border-[#1f242e]">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={handleDownload}
                        className="flex items-center gap-2 rounded-lg bg-[#c58f58] px-4 py-2 text-xs font-bold text-[#0a0b0d] hover:bg-[#d8a876] transition shadow-md"
                      >
                        <Download className="h-3.5 w-3.5" />
                        Download Render (PNG)
                      </button>

                      <button
                        onClick={() => setLightboxOpen(true)}
                        className="flex items-center gap-1.5 rounded-lg border border-[#2a2f3b] bg-[#161a22] px-3 py-2 text-xs text-[#f5f4ef] hover:border-[#c58f58] transition"
                        title="View Fullscreen"
                      >
                        <Maximize2 className="h-3.5 w-3.5" />
                        <span>Zoom</span>
                      </button>
                    </div>

                    <div className="flex items-center gap-2 text-xs">
                      {savedToGallery ? (
                        <span className="flex items-center gap-1 text-emerald-400 font-mono text-[11px]">
                          <CheckCircle2 className="h-3.5 w-3.5" />
                          Saved to Gallery
                        </span>
                      ) : (
                        <button
                          onClick={() => {
                            if (renderedResult) {
                              saveProjectLocally(renderedResult);
                              setSavedToGallery(true);
                            }
                          }}
                          className="flex items-center gap-1.5 rounded-lg border border-[#2a2f3b] bg-[#161a22] px-3 py-2 text-xs text-[#a6a49c] hover:text-[#f5f4ef]"
                        >
                          <FolderPlus className="h-3.5 w-3.5 text-[#c58f58]" />
                          Save to Gallery
                        </button>
                      )}
                    </div>
                  </div>

                </div>
              )}

              {/* CASE 3: Active Input Preview (When not generating and no finished result) */}
              {status !== 'processing' && status !== 'success' && inputImageBase64 && (
                <div className="relative w-full h-[400px] flex items-center justify-center rounded-xl bg-[#f8f7f4] border border-[#252b37] overflow-hidden group">
                  <img
                    src={inputImageBase64}
                    alt="Active Sketch Preview"
                    className="h-full w-full object-contain p-4"
                  />
                  
                  {/* Clear Image Button */}
                  <button
                    onClick={() => {
                      setInputImageBase64(null);
                      setInputImageDimensions(null);
                      setErrorMessage(null);
                    }}
                    className="absolute top-3 right-3 flex h-8 w-8 items-center justify-center rounded-lg bg-[#0a0b0d]/80 text-[#f5f4ef] hover:bg-rose-950 hover:text-rose-300 transition"
                    title="Remove Image"
                  >
                    <X className="h-4 w-4" />
                  </button>

                  <div className="absolute bottom-3 left-3 rounded bg-[#0a0b0d]/85 px-3 py-1.5 text-xs font-mono text-[#f5f4ef] backdrop-blur border border-[#333a48]">
                    Ready to render &bull; Adjust materials in right panel
                  </div>
                </div>
              )}

              {/* CASE 4: Empty Upload Dropzone */}
              {status !== 'processing' && status !== 'success' && !inputImageBase64 && (
                <div
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onDrop={handleDrop}
                  onClick={() => fileInputRef.current?.click()}
                  className={`w-full h-[380px] flex flex-col items-center justify-center rounded-xl border-2 border-dashed p-8 text-center cursor-pointer transition ${
                    isDragging
                      ? 'border-[#c58f58] bg-[#c58f58]/10'
                      : 'border-[#2d3442] hover:border-[#c58f58]/60 bg-[#14171f]'
                  }`}
                >
                  <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-[#1d222c] text-[#d8a876] mb-4 border border-[#2b3240] group-hover:scale-105 transition">
                    <Upload className="h-8 w-8 text-[#c58f58]" />
                  </div>

                  <h3 className="font-heading text-base font-bold text-[#f5f4ef]">
                    Upload Architectural Drawing or Sketch
                  </h3>

                  <p className="mt-1 text-xs text-[#a6a49c] max-w-sm">
                    Drag and drop your file here, or click to browse. Supports hand sketches, CAD elevations, and floorplan drafts.
                  </p>

                  <div className="mt-4 flex items-center gap-3 text-[11px] font-mono text-[#716d63]">
                    <span>JPEG, PNG, WebP</span>
                    <span>&bull;</span>
                    <span>Max 15MB</span>
                  </div>

                  <button
                    type="button"
                    className="mt-6 rounded-lg bg-[#222732] border border-[#2f3645] px-4 py-2 text-xs font-semibold text-[#d8a876] hover:bg-[#2a303e] transition"
                  >
                    Select File From Device
                  </button>
                </div>
              )}

              {/* Hidden File Input */}
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

            {/* Error Message Banner */}
            {errorMessage && (
              <div className="mx-4 mb-4 rounded-xl border border-rose-900/60 bg-rose-950/30 p-3.5 text-xs text-rose-300 flex items-start gap-3">
                <AlertCircle className="h-5 w-5 text-rose-400 shrink-0 mt-0.5" />
                <div className="flex-1">
                  <p className="font-semibold text-rose-200">Generation Notice</p>
                  <p className="mt-0.5 text-rose-300/90 leading-relaxed">{errorMessage}</p>
                </div>
                <button 
                  onClick={() => setErrorMessage(null)} 
                  className="text-rose-400 hover:text-rose-200"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            )}

            {/* Canvas Bottom Details */}
            {renderedResult && (
              <div className="border-t border-[#222731] bg-[#0e1014] px-4 py-2.5 flex flex-wrap items-center justify-between text-[11px] text-[#8e8d85] font-mono">
                <span>Model: {renderedResult.modelUsed || model}</span>
                <span>Aspect: {renderedResult.aspectRatio}</span>
                <span>Lighting: {renderedResult.lighting}</span>
              </div>
            )}

          </div>

        </div>

        {/* =================================================================== */}
        {/* RIGHT CONTROL PANEL: Project, Style, Materials, Lighting, Prompt */}
        {/* =================================================================== */}
        <div className="lg:col-span-5 xl:col-span-4 rounded-2xl border border-[#262c38] bg-[#12151b] p-5 shadow-2xl flex flex-col gap-5">
          
          <div className="flex items-center justify-between border-b border-[#222731] pb-3">
            <span className="font-heading text-sm font-bold text-[#f5f4ef] flex items-center gap-2">
              <Sliders className="h-4 w-4 text-[#c58f58]" />
              Architectural Parameters
            </span>
            <button
              onClick={onOpenDocs}
              className="text-[#8e8d85] hover:text-[#d8a876] transition"
              title="Documentation & Model Parameters"
            >
              <HelpCircle className="h-4 w-4" />
            </button>
          </div>

          {/* Project Title Input */}
          <div>
            <label className="block text-xs font-mono font-medium text-[#a6a49c] uppercase mb-1.5">
              Project Name
            </label>
            <input
              type="text"
              value={projectTitle}
              onChange={(e) => setProjectTitle(e.target.value)}
              placeholder="e.g. Minimalist Lake Villa"
              className="w-full rounded-lg border border-[#2a303e] bg-[#171b23] px-3.5 py-2 text-xs text-[#f5f4ef] placeholder-[#5a5f6e] focus:border-[#c58f58] focus:outline-none transition"
            />
          </div>

          {/* Project Type */}
          <div>
            <label className="block text-xs font-mono font-medium text-[#a6a49c] uppercase mb-1.5">
              Project Type
            </label>
            <div className="grid grid-cols-2 gap-2">
              {(['Exterior', 'Interior', 'Landscape', 'Commercial'] as ProjectType[]).map((type) => (
                <button
                  key={type}
                  type="button"
                  onClick={() => setProjectType(type)}
                  className={`rounded-lg border px-3 py-2 text-xs font-medium text-left transition ${
                    projectType === type
                      ? 'border-[#c58f58] bg-[#c58f58]/15 text-[#d8a876] font-semibold'
                      : 'border-[#252a35] bg-[#161a22] text-[#a6a49c] hover:border-[#384050]'
                  }`}
                >
                  {type}
                </button>
              ))}
            </div>
          </div>

          {/* Architectural Style */}
          <div>
            <label className="block text-xs font-mono font-medium text-[#a6a49c] uppercase mb-1.5">
              Architectural Style
            </label>
            <div className="grid grid-cols-2 gap-2">
              {(
                [
                  'Minimalist',
                  'Modern Tropical',
                  'Contemporary',
                  'Industrial',
                  'Scandinavian',
                  'Luxury',
                ] as ArchitecturalStyle[]
              ).map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => setStyle(s)}
                  className={`rounded-lg border px-3 py-2 text-xs font-medium text-left transition ${
                    style === s
                      ? 'border-[#c58f58] bg-[#c58f58]/15 text-[#d8a876] font-semibold'
                      : 'border-[#252a35] bg-[#161a22] text-[#a6a49c] hover:border-[#384050]'
                  }`}
                >
                  {s}
                </button>
              ))}
            </div>
          </div>

          {/* Material Palette Selection */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-mono font-medium text-[#a6a49c] uppercase flex items-center gap-1.5">
                <Palette className="h-3.5 w-3.5 text-[#c58f58]" />
                Material Palette ({selectedMaterials.length})
              </label>
              <span className="text-[10px] text-[#716d63]">Multi-select</span>
            </div>

            <div className="grid grid-cols-2 gap-1.5">
              {availableMaterials.map((mat) => {
                const isSelected = selectedMaterials.includes(mat.id);
                return (
                  <button
                    key={mat.id}
                    type="button"
                    onClick={() => toggleMaterial(mat.id)}
                    className={`rounded-lg border px-2.5 py-1.5 text-[11px] text-left transition flex items-center justify-between ${
                      isSelected
                        ? 'border-[#c58f58] bg-[#c58f58]/15 text-[#d8a876] font-medium'
                        : 'border-[#222731] bg-[#151921] text-[#8e8d85] hover:border-[#333a48]'
                    }`}
                  >
                    <span className="truncate">{mat.label}</span>
                    {isSelected && <CheckCircle2 className="h-3 w-3 text-[#c58f58] shrink-0 ml-1" />}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Lighting Environment */}
          <div>
            <label className="block text-xs font-mono font-medium text-[#a6a49c] uppercase mb-1.5 flex items-center gap-1.5">
              <Sun className="h-3.5 w-3.5 text-[#c58f58]" />
              Atmospheric Lighting
            </label>
            <div className="grid grid-cols-3 gap-1.5">
              {(
                ['daylight', 'golden hour', 'overcast', 'sunset', 'night'] as LightingOption[]
              ).map((light) => (
                <button
                  key={light}
                  type="button"
                  onClick={() => setLighting(light)}
                  className={`rounded-lg border px-2 py-1.5 text-[11px] capitalize text-center transition ${
                    lighting === light
                      ? 'border-[#c58f58] bg-[#c58f58]/15 text-[#d8a876] font-semibold'
                      : 'border-[#222731] bg-[#151921] text-[#8e8d85] hover:border-[#333a48]'
                  }`}
                >
                  {light}
                </button>
              ))}
            </div>
          </div>

          {/* Aspect Ratio & Resolution Grid */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-mono font-medium text-[#a6a49c] uppercase mb-1.5">
                Aspect Ratio
              </label>
              <div className="grid grid-cols-2 gap-1.5">
                {(['16:9', '3:2', '4:3', '1:1'] as AspectRatio[]).map((ar) => (
                  <button
                    key={ar}
                    type="button"
                    onClick={() => setAspectRatio(ar)}
                    className={`rounded-lg border px-2 py-1.5 text-[11px] font-mono text-center transition ${
                      aspectRatio === ar
                        ? 'border-[#c58f58] bg-[#c58f58]/15 text-[#d8a876] font-bold'
                        : 'border-[#222731] bg-[#151921] text-[#8e8d85] hover:border-[#333a48]'
                    }`}
                  >
                    {ar}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-xs font-mono font-medium text-[#a6a49c] uppercase mb-1.5">
                Resolution
              </label>
              <div className="grid grid-cols-3 gap-1.5">
                {(['1K', '2K', '4K'] as Resolution[]).map((res) => (
                  <button
                    key={res}
                    type="button"
                    onClick={() => setImageSize(res)}
                    className={`rounded-lg border px-1 py-1.5 text-[11px] font-mono text-center transition ${
                      imageSize === res
                        ? 'border-[#c58f58] bg-[#c58f58]/15 text-[#d8a876] font-bold'
                        : 'border-[#222731] bg-[#151921] text-[#8e8d85] hover:border-[#333a48]'
                    }`}
                  >
                    {res}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* AI Model Selector */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-mono font-medium text-[#a6a49c] uppercase flex items-center gap-1.5">
                <Cpu className="h-3.5 w-3.5 text-[#c58f58]" />
                AI Model Engine
              </label>
              <span className="text-[10px] text-[#c58f58] font-mono">Official SDK</span>
            </div>
            <select
              value={model}
              onChange={(e) => setModel(e.target.value as AIModel)}
              className="w-full rounded-lg border border-[#2a303e] bg-[#171b23] px-3 py-2 text-xs text-[#f5f4ef] focus:border-[#c58f58] focus:outline-none transition font-mono"
            >
              <option value="gemini-nano-banana-2.1">gemini-nano-banana-2.1 (Recommended: 1K-4K High-Quality)</option>
              <option value="gemini-3.1-flash-lite-image">gemini-3.1-flash-lite-image (Fast Generation)</option>
            </select>
          </div>

          {/* Additional Instructions / Prompt Textarea */}
          <div>
            <label className="block text-xs font-mono font-medium text-[#a6a49c] uppercase mb-1.5">
              Additional Instructions (Optional)
            </label>
            <textarea
              rows={2}
              value={additionalPrompt}
              onChange={(e) => setAdditionalPrompt(e.target.value)}
              placeholder="e.g. Add cascading ivy on stone walls, warm interior spotlights, calm water reflection in the foreground..."
              className="w-full rounded-lg border border-[#2a303e] bg-[#171b23] p-3 text-xs text-[#f5f4ef] placeholder-[#5a5f6e] focus:border-[#c58f58] focus:outline-none transition resize-none"
            />
          </div>

          {/* PRIMARY CTA: GENERATE RENDER */}
          <button
            onClick={handleGenerateRender}
            disabled={status === 'processing' || !inputImageBase64}
            className={`w-full rounded-xl py-3.5 px-4 text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-2 shadow-xl transition-all duration-200 ${
              status === 'processing' || !inputImageBase64
                ? 'bg-[#222731] text-[#6b7280] cursor-not-allowed'
                : 'bg-gradient-to-r from-[#c58f58] via-[#d8a876] to-[#ab7540] text-[#0a0b0d] hover:brightness-110 active:scale-[0.99] shadow-amber-950/30'
            }`}
          >
            {status === 'processing' ? (
              <>
                <RefreshCw className="h-4 w-4 animate-spin" />
                <span>Generating Visualization...</span>
              </>
            ) : (
              <>
                <Sparkles className="h-4 w-4" />
                <span>Generate Render</span>
              </>
            )}
          </button>

          {!inputImageBase64 && (
            <p className="text-[11px] text-center text-[#716d63]">
              Upload a sketch or choose a preset above to activate generation.
            </p>
          )}

        </div>

      </div>

      {/* Lightbox Zoom Modal */}
      {lightboxOpen && renderedResult && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-md p-4 animate-in fade-in duration-150"
          onClick={() => setLightboxOpen(false)}
        >
          <div className="relative max-w-6xl max-h-[90vh] overflow-hidden rounded-xl bg-[#0a0b0d] border border-[#2b3240] p-2" onClick={(e) => e.stopPropagation()}>
            <button
              onClick={() => setLightboxOpen(false)}
              className="absolute top-4 right-4 z-10 flex h-9 w-9 items-center justify-center rounded-lg bg-[#0a0b0d]/80 text-[#f5f4ef] hover:bg-[#1a1f29] transition"
            >
              <X className="h-5 w-5" />
            </button>
            <img
              src={renderedResult.renderedImageUrl}
              alt="High Res Render Zoom"
              className="max-h-[85vh] w-auto object-contain rounded-lg"
            />
          </div>
        </div>
      )}

    </div>
  );
};
