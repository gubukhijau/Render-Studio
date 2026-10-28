import React, { useState } from 'react';
import { 
  Sparkles, 
  ArrowRight, 
  CheckCircle2, 
  Maximize2, 
  Sun, 
  Layers, 
  Sliders, 
  Building, 
  ShieldCheck, 
  Download, 
  Eye, 
  Palette,
  Camera,
  Cpu
} from 'lucide-react';
import { SAMPLE_SKETCHES } from '../data/sampleSketches';

interface LandingPageProps {
  onStartRendering: (initialSketchId?: string) => void;
  onOpenDocs: () => void;
}

export const LandingPage: React.FC<LandingPageProps> = ({
  onStartRendering,
  onOpenDocs,
}) => {
  // Before / After Slider Position (0 to 100%)
  const [sliderPos, setSliderPos] = useState<number>(50);

  // Showcase image comparison
  const sampleComparison = {
    sketch: SAMPLE_SKETCHES[0].dataUrl,
    // Realistic generated visualization representation
    render: 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=1600&q=80',
    title: 'Modern Minimalist Villa Facade',
    style: 'Modern Tropical Luxury',
    materials: ['Polished Concrete', 'Teak Timber Slats', 'Low-Iron Glass', 'Travertine'],
    lighting: 'Golden Hour Sunset',
  };

  const architecturalStyles = [
    {
      name: 'Modern Tropical',
      desc: 'Deep cantilevers, lush native landscaping, natural teak slats, and water reflections.',
      image: 'https://images.unsplash.com/photo-1613490493576-7fde63acd811?auto=format&fit=crop&w=800&q=80',
      tag: 'RESIDENTIAL',
    },
    {
      name: 'Minimalist Monolith',
      desc: 'Board-formed concrete, clean rectilinear massing, frameless ribbon windows.',
      image: 'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?auto=format&fit=crop&w=800&q=80',
      tag: 'FACADE',
    },
    {
      name: 'Scandinavian Serenity',
      desc: 'Pale oak flooring, high-contrast black steel accents, abundant natural northern daylight.',
      image: 'https://images.unsplash.com/photo-1618221195710-dd6b41faaea6?auto=format&fit=crop&w=800&q=80',
      tag: 'INTERIOR',
    },
    {
      name: 'Contemporary Commercial',
      desc: 'High-performance curtain wall glass, parametric shading fins, double-height lobby atrium.',
      image: 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?auto=format&fit=crop&w=800&q=80',
      tag: 'COMMERCIAL',
    },
  ];

  return (
    <div className="flex flex-col min-h-screen bg-[#0c0e12] text-[#f5f4ef]">
      
      {/* ---------------------------------------------------------------------- */}
      {/* 1. HERO SECTION */}
      {/* ---------------------------------------------------------------------- */}
      <section className="relative overflow-hidden pt-12 pb-20 lg:pt-20 lg:pb-32 border-b border-[#1f242e] bg-blueprint-grid">
        {/* Ambient Gradient Glows */}
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[300px] bg-gradient-to-r from-[#c58f58]/10 via-[#c58f58]/20 to-transparent blur-3xl pointer-events-none rounded-full" />
        
        <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 text-center">
          
          {/* Engineering Pill */}
          <div className="inline-flex items-center gap-2 rounded-full border border-[#373d4b] bg-[#161a22]/90 px-3.5 py-1 text-xs font-mono text-[#d8a876] shadow-inner mb-6 backdrop-blur">
            <Cpu className="h-3.5 w-3.5 text-[#c58f58]" />
            <span>POWERED BY FREE AI ARCHITECTURAL ENGINE &amp; SUPABASE</span>
          </div>

          {/* Main Headline */}
          <h1 className="font-heading text-4xl sm:text-6xl lg:text-7xl font-extrabold tracking-tight text-[#f5f4ef] max-w-5xl mx-auto leading-[1.1]">
            Transform Your Vision <br />
            <span className="bg-gradient-to-r from-[#f5f4ef] via-[#d8a876] to-[#c58f58] bg-clip-text text-transparent">
              Into Photorealistic Reality
            </span>
          </h1>

          {/* Subtitle */}
          <p className="mt-6 text-base sm:text-lg lg:text-xl text-[#a6a49c] max-w-3xl mx-auto leading-relaxed font-normal">
            The next-generation architectural visualization engine. Convert hand-drawn sketches, facade drafts, 3D wireframes, and interior layouts into high-resolution, physically accurate renders in seconds.
          </p>

          {/* Hero CTAs */}
          <div className="mt-9 flex flex-wrap items-center justify-center gap-4">
            <button
              onClick={() => onStartRendering()}
              className="group flex items-center gap-2.5 rounded-xl bg-gradient-to-r from-[#c58f58] to-[#ab7540] px-7 py-3.5 text-sm font-semibold text-[#0a0b0d] shadow-lg shadow-amber-950/40 hover:from-[#d8a876] hover:to-[#be8449] hover:scale-[1.02] active:scale-[0.98] transition-all duration-200"
            >
              <Sparkles className="h-4 w-4" />
              <span>Start Rendering</span>
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
            </button>

            <button
              onClick={onOpenDocs}
              className="flex items-center gap-2 rounded-xl border border-[#2a2f3b] bg-[#141820] px-6 py-3.5 text-sm font-medium text-[#f5f4ef] hover:border-[#c58f58]/60 hover:bg-[#1a1f2a] transition duration-200"
            >
              <span>Architecture Specs &amp; DB Setup</span>
            </button>
          </div>

          {/* Stat Badges */}
          <div className="mt-14 grid grid-cols-2 sm:grid-cols-4 gap-4 max-w-4xl mx-auto border-t border-[#1f242e] pt-8 text-left">
            <div className="border-l-2 border-[#c58f58] pl-4">
              <div className="font-heading text-2xl font-bold text-[#f5f4ef]">100%</div>
              <div className="text-xs text-[#8e8d85] font-mono mt-0.5">GEOMETRY PRESERVED</div>
            </div>
            <div className="border-l-2 border-[#c58f58] pl-4">
              <div className="font-heading text-2xl font-bold text-[#f5f4ef]">4K Ultra</div>
              <div className="text-xs text-[#8e8d85] font-mono mt-0.5">MAX RESOLUTION</div>
            </div>
            <div className="border-l-2 border-[#c58f58] pl-4">
              <div className="font-heading text-2xl font-bold text-[#f5f4ef]">8+ Materials</div>
              <div className="text-xs text-[#8e8d85] font-mono mt-0.5">PHYSICAL TEXTURES</div>
            </div>
            <div className="border-l-2 border-[#c58f58] pl-4">
              <div className="font-heading text-2xl font-bold text-[#f5f4ef]">RLS Storage</div>
              <div className="text-xs text-[#8e8d85] font-mono mt-0.5">PRIVATE &amp; SECURE</div>
            </div>
          </div>

        </div>
      </section>

      {/* ---------------------------------------------------------------------- */}
      {/* 2. INTERACTIVE BEFORE & AFTER SHOWCASE */}
      {/* ---------------------------------------------------------------------- */}
      <section className="py-20 lg:py-28 bg-[#0f1115] border-b border-[#1f242e]">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          
          <div className="text-center max-w-3xl mx-auto mb-12">
            <div className="text-xs font-mono font-semibold uppercase tracking-widest text-[#d8a876] mb-2">
              Visual Demonstration
            </div>
            <h2 className="font-heading text-3xl sm:text-4xl font-bold text-[#f5f4ef]">
              From Raw Architectural Line-Work to Reality
            </h2>
            <p className="mt-3 text-sm sm:text-base text-[#a6a49c]">
              Drag the interactive divider to observe how the AI model translates structural geometry, floor heights, and window openings into material textures and lighting.
            </p>
          </div>

          {/* Interactive Comparison Container */}
          <div className="relative mx-auto max-w-5xl rounded-2xl border border-[#2a2f3c] bg-[#14171e] p-3 sm:p-4 shadow-2xl">
            
            <div className="relative h-[340px] sm:h-[480px] lg:h-[540px] w-full overflow-hidden rounded-xl select-none group">
              
              {/* After: Rendered Realistic Image (Base layer) */}
              <img
                src={sampleComparison.render}
                alt="AI Photorealistic Architectural Render"
                className="absolute inset-0 h-full w-full object-cover"
              />

              {/* Before: Raw Sketch Image (Clipped layer) */}
              <div 
                className="absolute inset-0 h-full w-full overflow-hidden border-r-2 border-[#d8a876]"
                style={{ width: `${sliderPos}%` }}
              >
                <img
                  src={sampleComparison.sketch}
                  alt="Original Architectural Sketch"
                  className="absolute inset-0 h-full w-full object-cover bg-white"
                  style={{ width: '100%', minWidth: '100%' }}
                />
                
                {/* Before Label */}
                <div className="absolute top-4 left-4 rounded-md bg-[#0a0b0d]/85 px-3 py-1.5 text-xs font-mono font-semibold text-[#f5f4ef] backdrop-blur border border-[#333a48]">
                  INPUT: ARCHITECTURAL SKETCH
                </div>
              </div>

              {/* After Label */}
              <div className="absolute top-4 right-4 rounded-md bg-[#c58f58]/90 px-3 py-1.5 text-xs font-mono font-semibold text-[#0a0b0d] backdrop-blur shadow-md">
                OUTPUT: AI VISUALIZATION
              </div>

              {/* Slider Handle Divider */}
              <div 
                className="absolute top-0 bottom-0 w-1 bg-[#d8a876] cursor-ew-resize -ml-0.5 flex items-center justify-center pointer-events-none"
                style={{ left: `${sliderPos}%` }}
              >
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#d8a876] text-[#0a0b0d] shadow-xl border-2 border-[#14171e]">
                  <Sliders className="h-4 w-4" />
                </div>
              </div>

              {/* Invisible Range Input for Dragging */}
              <input
                type="range"
                min="0"
                max="100"
                value={sliderPos}
                onChange={(e) => setSliderPos(Number(e.target.value))}
                aria-label="Before and after comparison slider"
                className="absolute inset-0 w-full h-full opacity-0 cursor-ew-resize z-20"
              />
            </div>

            {/* Showcase Metadata Bar */}
            <div className="mt-4 flex flex-wrap items-center justify-between gap-4 px-2 pt-1 text-xs">
              <div className="flex items-center gap-3">
                <span className="font-heading font-semibold text-sm text-[#f5f4ef]">
                  {sampleComparison.title}
                </span>
                <span className="rounded bg-[#222732] px-2.5 py-0.5 text-[#d8a876] font-mono">
                  {sampleComparison.style}
                </span>
              </div>

              <div className="flex items-center gap-2">
                <span className="text-[#8e8d85]">Try this preset:</span>
                <button
                  onClick={() => onStartRendering('villa-monolith')}
                  className="rounded-lg bg-[#c58f58]/20 border border-[#c58f58]/40 px-3 py-1 text-xs font-medium text-[#d8a876] hover:bg-[#c58f58] hover:text-[#0a0b0d] transition"
                >
                  Load in Studio
                </button>
              </div>
            </div>

          </div>

        </div>
      </section>

      {/* ---------------------------------------------------------------------- */}
      {/* 3. THREE-STEP WORKFLOW */}
      {/* ---------------------------------------------------------------------- */}
      <section className="py-20 lg:py-28 bg-[#0c0e12] border-b border-[#1f242e]">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          
          <div className="text-center max-w-3xl mx-auto mb-16">
            <div className="text-xs font-mono font-semibold uppercase tracking-widest text-[#d8a876] mb-2">
              Simple &amp; Powerful Workflow
            </div>
            <h2 className="font-heading text-3xl sm:text-4xl font-bold text-[#f5f4ef]">
              How Architecture Render Studio Works
            </h2>
            <p className="mt-3 text-sm sm:text-base text-[#a6a49c]">
              Built to integrate seamlessly into your design practice, whether conceptualizing an initial facade pitch or refining an interior space.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            
            {/* Step 1 */}
            <div className="relative rounded-2xl border border-[#222731] bg-[#14171e] p-8 flex flex-col justify-between hover:border-[#c58f58]/40 transition group">
              <div>
                <div className="flex items-center justify-between mb-6">
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-[#222732] text-[#d8a876] group-hover:scale-110 transition">
                    <Building className="h-6 w-6 text-[#c58f58]" />
                  </div>
                  <span className="font-mono text-3xl font-black text-[#292e3a]">01</span>
                </div>
                <h3 className="font-heading text-xl font-bold text-[#f5f4ef] mb-2">
                  Upload Your Vision
                </h3>
                <p className="text-sm text-[#a6a49c] leading-relaxed">
                  Provide your architectural concept. Upload hand sketches, CAD line-work, facade elevations, or 3D block models (JPEG, PNG, WebP).
                </p>
              </div>
              <div className="mt-6 pt-4 border-t border-[#1f242e] text-xs font-mono text-[#8e8d85]">
                PRESERVES MASSING &amp; PERSPECTIVE
              </div>
            </div>

            {/* Step 2 */}
            <div className="relative rounded-2xl border border-[#222731] bg-[#14171e] p-8 flex flex-col justify-between hover:border-[#c58f58]/40 transition group">
              <div>
                <div className="flex items-center justify-between mb-6">
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-[#222732] text-[#d8a876] group-hover:scale-110 transition">
                    <Palette className="h-6 w-6 text-[#c58f58]" />
                  </div>
                  <span className="font-mono text-3xl font-black text-[#292e3a]">02</span>
                </div>
                <h3 className="font-heading text-xl font-bold text-[#f5f4ef] mb-2">
                  Curate Materials &amp; Light
                </h3>
                <p className="text-sm text-[#a6a49c] leading-relaxed">
                  Select your architectural style (Modern Tropical, Minimalist, Scandinavian, Luxury) and choose physical materials like concrete, glass, wood, stone, and brick.
                </p>
              </div>
              <div className="mt-6 pt-4 border-t border-[#1f242e] text-xs font-mono text-[#8e8d85]">
                GOLDEN HOUR, DAYLIGHT &amp; DUSK
              </div>
            </div>

            {/* Step 3 */}
            <div className="relative rounded-2xl border border-[#222731] bg-[#14171e] p-8 flex flex-col justify-between hover:border-[#c58f58]/40 transition group">
              <div>
                <div className="flex items-center justify-between mb-6">
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-[#222732] text-[#d8a876] group-hover:scale-110 transition">
                    <Camera className="h-6 w-6 text-[#c58f58]" />
                  </div>
                  <span className="font-mono text-3xl font-black text-[#292e3a]">03</span>
                </div>
                <h3 className="font-heading text-xl font-bold text-[#f5f4ef] mb-2">
                  Generate &amp; Download
                </h3>
                <p className="text-sm text-[#a6a49c] leading-relaxed">
                  The AI engine synthesizes natural lighting, reflections, atmospheric depth, and realistic vegetation. Export high-res renders directly to your gallery.
                </p>
              </div>
              <div className="mt-6 pt-4 border-t border-[#1f242e] text-xs font-mono text-[#8e8d85]">
                INSTANT HI-RES PNG DOWNLOAD
              </div>
            </div>

          </div>

        </div>
      </section>

      {/* ---------------------------------------------------------------------- */}
      {/* 4. ARCHITECTURAL STYLES SHOWCASE */}
      {/* ---------------------------------------------------------------------- */}
      <section className="py-20 lg:py-28 bg-[#0f1115] border-b border-[#1f242e]">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          
          <div className="flex flex-col md:flex-row md:items-end justify-between mb-12">
            <div>
              <div className="text-xs font-mono font-semibold uppercase tracking-widest text-[#d8a876] mb-2">
                Aesthetic Versatility
              </div>
              <h2 className="font-heading text-3xl sm:text-4xl font-bold text-[#f5f4ef]">
                Calibrated Architectural Vocabularies
              </h2>
            </div>
            <button
              onClick={() => onStartRendering()}
              className="mt-4 md:mt-0 flex items-center gap-2 text-sm font-semibold text-[#d8a876] hover:text-[#f5f4ef] transition"
            >
              <span>Explore all styles in Studio</span>
              <ArrowRight className="h-4 w-4" />
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {architecturalStyles.map((item, idx) => (
              <div 
                key={idx}
                className="group relative overflow-hidden rounded-2xl border border-[#222731] bg-[#14171e] transition hover:-translate-y-1 hover:border-[#c58f58]/50 hover:shadow-xl"
              >
                <div className="aspect-[4/3] w-full overflow-hidden">
                  <img
                    src={item.image}
                    alt={item.name}
                    className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-[#0a0b0d] via-[#0a0b0d]/40 to-transparent" />
                </div>
                
                <div className="absolute top-3 right-3 rounded bg-[#0a0b0d]/80 px-2 py-0.5 text-[10px] font-mono uppercase tracking-wider text-[#d8a876] backdrop-blur">
                  {item.tag}
                </div>

                <div className="p-5">
                  <h3 className="font-heading text-lg font-bold text-[#f5f4ef] group-hover:text-[#d8a876] transition">
                    {item.name}
                  </h3>
                  <p className="mt-2 text-xs text-[#a6a49c] line-clamp-2 leading-relaxed">
                    {item.desc}
                  </p>
                </div>
              </div>
            ))}
          </div>

        </div>
      </section>

      {/* ---------------------------------------------------------------------- */}
      {/* 5. READY TO RENDER CTA SECTION */}
      {/* ---------------------------------------------------------------------- */}
      <section className="relative overflow-hidden py-20 lg:py-28 bg-gradient-to-b from-[#0c0e12] to-[#14171e] border-b border-[#1f242e]">
        <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8 text-center relative z-10">
          
          <div className="inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-[#c58f58]/15 text-[#d8a876] mb-6 border border-[#c58f58]/30">
            <Sparkles className="h-7 w-7 text-[#c58f58]" />
          </div>

          <h2 className="font-heading text-3xl sm:text-5xl font-extrabold text-[#f5f4ef] tracking-tight">
            Ready to Visualize Your Next Landmark?
          </h2>

          <p className="mt-4 text-base sm:text-lg text-[#a6a49c] max-w-2xl mx-auto">
            Experience the real AI rendering engine. Test with built-in architectural sketches or upload your own project files.
          </p>

          <div className="mt-8 flex flex-wrap items-center justify-center gap-4">
            <button
              onClick={() => onStartRendering()}
              className="flex items-center gap-2.5 rounded-xl bg-gradient-to-r from-[#c58f58] to-[#ab7540] px-8 py-4 text-sm font-bold text-[#0a0b0d] shadow-xl shadow-amber-950/40 hover:from-[#d8a876] hover:to-[#be8449] hover:scale-105 active:scale-95 transition-all"
            >
              <Sparkles className="h-4 w-4" />
              <span>Open Render Studio</span>
              <ArrowRight className="h-4 w-4" />
            </button>
          </div>

          <p className="mt-6 text-xs text-[#8e8d85] font-mono">
            Zero mock responses. Powered by server-side Google GenAI and Supabase Storage.
          </p>

        </div>
      </section>

      {/* ---------------------------------------------------------------------- */}
      {/* 6. PROFESSIONAL ARCHITECTURAL FOOTER */}
      {/* ---------------------------------------------------------------------- */}
      <footer className="bg-[#08090b] py-12 border-t border-[#1a1e27] text-xs text-[#8e8d85]">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row items-center justify-between gap-6">
          
          <div className="flex items-center gap-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#c58f58]/20 border border-[#c58f58]/40">
              <Building className="h-4 w-4 text-[#d8a876]" />
            </div>
            <div>
              <p className="font-heading font-bold text-sm text-[#f5f4ef]">
                ARCHITECTURE RENDER STUDIO
              </p>
              <p className="text-[11px] text-[#716d63]">
                AI-Driven Computational Visualization Platform
              </p>
            </div>
          </div>

          <div className="flex items-center gap-6 font-mono text-[11px]">
            <button 
              onClick={() => onStartRendering()} 
              className="hover:text-[#d8a876] transition"
            >
              Studio
            </button>
            <button 
              onClick={onOpenDocs} 
              className="hover:text-[#d8a876] transition"
            >
              Supabase SQL
            </button>
            <button 
              onClick={onOpenDocs} 
              className="hover:text-[#d8a876] transition"
            >
              Deployment Guide
            </button>
          </div>

          <div className="text-right text-[11px]">
            <p>&copy; {new Date().getFullYear()} Architecture Render Studio.</p>
            <p className="text-[#625e54]">Engineered for Architects &amp; Designers.</p>
          </div>

        </div>
      </footer>

    </div>
  );
};
