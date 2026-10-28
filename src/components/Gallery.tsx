import React, { useState, useEffect } from 'react';
import {
  Search,
  Filter,
  Trash2,
  Download,
  Eye,
  Calendar,
  Sparkles,
  Sliders,
  Layers,
  ArrowRight,
  SplitSquareVertical,
  Maximize2,
  X,
  AlertTriangle,
  FolderOpen
} from 'lucide-react';
import { RenderProject, ProjectType, UserSession } from '../types/architecture';
import { fetchUserProjects, deleteProjectLocally } from '../services/supabaseClient';

interface GalleryProps {
  user: UserSession;
  onOpenStudio: () => void;
}

export const Gallery: React.FC<GalleryProps> = ({ user, onOpenStudio }) => {
  const [projects, setProjects] = useState<RenderProject[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFilter, setSelectedFilter] = useState<string>('All');
  
  // Detail Modal State
  const [selectedProject, setSelectedProject] = useState<RenderProject | null>(null);
  const [compareMode, setCompareMode] = useState<'slider' | 'rendered' | 'input'>('slider');
  const [sliderPos, setSliderPos] = useState<number>(50);

  // Delete Confirmation Modal
  const [projectToDelete, setProjectToDelete] = useState<RenderProject | null>(null);

  useEffect(() => {
    loadProjects();
  }, [user.id]);

  const loadProjects = async () => {
    setLoading(true);
    try {
      const data = await fetchUserProjects(user.id);
      setProjects(data);
    } catch (err) {
      console.warn('Error loading gallery projects:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = (project: RenderProject) => {
    deleteProjectLocally(project.id);
    setProjects(projects.filter((p) => p.id !== project.id));
    if (selectedProject?.id === project.id) {
      setSelectedProject(null);
    }
    setProjectToDelete(null);
  };

  const handleDownloadImage = (url: string, title: string) => {
    const link = document.createElement('a');
    link.href = url;
    const clean = (title || 'architectural_render').toLowerCase().replace(/[^a-z0-9]/g, '_');
    link.download = `${clean}_${Date.now()}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Filter projects by category and search keyword
  const filteredProjects = projects.filter((project) => {
    const matchesCategory =
      selectedFilter === 'All' || project.projectType === selectedFilter;
    const matchesSearch =
      searchQuery.trim() === '' ||
      project.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      project.style.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (project.prompt && project.prompt.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchesCategory && matchesSearch;
  });

  const categories = ['All', 'Exterior', 'Interior', 'Landscape', 'Commercial'];

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8 min-h-[80vh]">
      
      {/* Gallery Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between pb-6 mb-8 border-b border-[#222731] gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="font-heading text-2xl sm:text-3xl font-bold text-[#f5f4ef]">
              Architectural Gallery
            </h1>
            <span className="rounded bg-[#252a36] px-2.5 py-0.5 text-xs font-mono font-medium text-[#d8a876]">
              {projects.length} {projects.length === 1 ? 'Render' : 'Renders'}
            </span>
          </div>
          <p className="mt-1 text-xs sm:text-sm text-[#8e8d85]">
            Review, inspect, compare, and download your photorealistic architectural generations.
          </p>
        </div>

        <button
          onClick={onOpenStudio}
          className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-[#c58f58] to-[#ab7540] px-4 py-2 text-xs font-bold text-[#0a0b0d] hover:brightness-110 transition shadow-md self-start md:self-auto"
        >
          <Sparkles className="h-3.5 w-3.5" />
          <span>New Render</span>
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 mb-8">
        
        {/* Category Pills */}
        <div className="flex flex-wrap items-center gap-1.5 rounded-xl border border-[#222731] bg-[#12151b] p-1">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedFilter(cat)}
              className={`rounded-lg px-3 py-1.5 text-xs font-medium transition ${
                selectedFilter === cat
                  ? 'bg-[#c58f58] text-[#0a0b0d] font-semibold'
                  : 'text-[#a6a49c] hover:text-[#f5f4ef] hover:bg-[#1a1f29]'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Search Bar */}
        <div className="relative min-w-[260px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-[#716d63]" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search projects, styles, materials..."
            className="w-full rounded-xl border border-[#252a36] bg-[#13161d] pl-9 pr-3.5 py-2 text-xs text-[#f5f4ef] placeholder-[#626877] focus:border-[#c58f58] focus:outline-none transition"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-[#716d63] hover:text-[#f5f4ef]"
            >
              Clear
            </button>
          )}
        </div>

      </div>

      {/* Projects Grid */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-24 text-center">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-[#c58f58] border-t-transparent mb-3" />
          <p className="text-xs font-mono text-[#8e8d85]">Loading projects from secure store...</p>
        </div>
      ) : filteredProjects.length === 0 ? (
        /* Empty State */
        <div className="flex flex-col items-center justify-center py-20 px-4 rounded-2xl border border-dashed border-[#252b38] bg-[#11141a] text-center max-w-xl mx-auto">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[#1b202a] text-[#d8a876] mb-4">
            <FolderOpen className="h-7 w-7 text-[#c58f58]" />
          </div>
          <h3 className="font-heading text-lg font-bold text-[#f5f4ef]">
            {searchQuery || selectedFilter !== 'All' ? 'No Matching Renders Found' : 'Your Gallery is Empty'}
          </h3>
          <p className="mt-1.5 text-xs text-[#8e8d85] max-w-sm">
            {searchQuery || selectedFilter !== 'All'
              ? 'Try modifying your search keywords or resetting the category filter.'
              : 'Launch Render Studio to upload your first architectural sketch and generate visualizations.'}
          </p>

          <button
            onClick={onOpenStudio}
            className="mt-6 flex items-center gap-2 rounded-xl bg-[#c58f58] px-5 py-2.5 text-xs font-bold text-[#0a0b0d] hover:bg-[#d8a876] transition shadow-md"
          >
            <Sparkles className="h-3.5 w-3.5" />
            <span>Generate First Render</span>
          </button>
        </div>
      ) : (
        /* Grid of Project Cards */
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredProjects.map((project) => (
            <div
              key={project.id}
              className="group rounded-2xl border border-[#222731] bg-[#13161c] overflow-hidden hover:border-[#c58f58]/60 hover:shadow-xl hover:-translate-y-1 transition duration-200 flex flex-col justify-between"
            >
              {/* Card Image Thumbnail with Hover Reveal */}
              <div 
                className="relative aspect-[16/10] w-full overflow-hidden bg-[#0a0b0d] cursor-pointer"
                onClick={() => setSelectedProject(project)}
              >
                {/* Rendered Output (Base) */}
                <img
                  src={project.renderedImageUrl || project.inputImageUrl}
                  alt={project.title}
                  className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                />

                {/* Badges Overlay */}
                <div className="absolute top-3 left-3 flex items-center gap-1.5">
                  <span className="rounded bg-[#0a0b0d]/85 px-2 py-0.5 text-[10px] font-mono text-[#d8a876] backdrop-blur border border-[#333a48]">
                    {project.projectType}
                  </span>
                  <span className="rounded bg-[#0a0b0d]/85 px-2 py-0.5 text-[10px] font-mono text-[#a6a49c] backdrop-blur border border-[#333a48]">
                    {project.aspectRatio}
                  </span>
                </div>

                {/* Inspect Overlay Trigger */}
                <div className="absolute inset-0 bg-[#0a0b0d]/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                  <span className="rounded-lg bg-[#c58f58] px-3 py-1.5 text-xs font-bold text-[#0a0b0d] flex items-center gap-1.5 shadow-lg">
                    <Eye className="h-3.5 w-3.5" />
                    Inspect Details
                  </span>
                </div>
              </div>

              {/* Card Content Details */}
              <div className="p-4 flex-1 flex flex-col justify-between">
                <div>
                  <div className="flex items-start justify-between gap-2">
                    <h3 
                      onClick={() => setSelectedProject(project)}
                      className="font-heading text-sm font-bold text-[#f5f4ef] hover:text-[#d8a876] transition cursor-pointer truncate"
                    >
                      {project.title}
                    </h3>
                  </div>

                  <p className="mt-1 text-xs text-[#8e8d85] flex items-center gap-2 font-mono">
                    <span className="text-[#c58f58]">{project.style}</span>
                    <span>&bull;</span>
                    <span className="capitalize">{project.lighting}</span>
                  </p>

                  {/* Materials Tag List */}
                  {project.materials && project.materials.length > 0 && (
                    <div className="mt-3 flex flex-wrap gap-1">
                      {project.materials.slice(0, 3).map((mat, i) => (
                        <span
                          key={i}
                          className="rounded bg-[#1a1f29] px-2 py-0.5 text-[10px] text-[#8e8d85] border border-[#262c38]"
                        >
                          {mat}
                        </span>
                      ))}
                      {project.materials.length > 3 && (
                        <span className="text-[10px] text-[#716d63] self-center">
                          +{project.materials.length - 3}
                        </span>
                      )}
                    </div>
                  )}
                </div>

                {/* Card Footer Actions */}
                <div className="mt-4 pt-3 border-t border-[#1f242e] flex items-center justify-between text-xs text-[#716d63]">
                  <span className="font-mono text-[10px]">
                    {new Date(project.createdAt).toLocaleDateString(undefined, {
                      month: 'short',
                      day: 'numeric',
                      year: 'numeric',
                    })}
                  </span>

                  <div className="flex items-center gap-1">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDownloadImage(project.renderedImageUrl, project.title);
                      }}
                      className="p-1.5 text-[#8e8d85] hover:text-[#f5f4ef] rounded-md hover:bg-[#1a1f2a] transition"
                      title="Download image"
                    >
                      <Download className="h-3.5 w-3.5" />
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setProjectToDelete(project);
                      }}
                      className="p-1.5 text-[#8e8d85] hover:text-rose-400 rounded-md hover:bg-rose-950/20 transition"
                      title="Delete project"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>

              </div>

            </div>
          ))}
        </div>
      )}

      {/* ---------------------------------------------------------------------- */}
      {/* PROJECT INSPECTION MODAL */}
      {/* ---------------------------------------------------------------------- */}
      {selectedProject && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-md p-4 animate-in fade-in duration-150"
          onClick={() => setSelectedProject(null)}
        >
          <div 
            className="relative w-full max-w-4xl max-h-[92vh] overflow-y-auto rounded-2xl bg-[#12151b] border border-[#2b3240] p-6 shadow-2xl flex flex-col gap-6"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="flex items-start justify-between border-b border-[#222731] pb-4">
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="font-heading text-xl font-bold text-[#f5f4ef]">
                    {selectedProject.title}
                  </h2>
                  <span className="rounded bg-[#c58f58]/20 px-2.5 py-0.5 text-xs font-mono text-[#d8a876]">
                    {selectedProject.projectType}
                  </span>
                </div>
                <p className="mt-1 text-xs text-[#8e8d85] font-mono">
                  Created on {new Date(selectedProject.createdAt).toLocaleString()}
                </p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleDownloadImage(selectedProject.renderedImageUrl, selectedProject.title)}
                  className="flex items-center gap-1.5 rounded-lg bg-[#c58f58] px-3.5 py-1.5 text-xs font-bold text-[#0a0b0d] hover:bg-[#d8a876] transition"
                >
                  <Download className="h-3.5 w-3.5" />
                  <span>Download</span>
                </button>
                <button
                  onClick={() => setSelectedProject(null)}
                  className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#181c24] text-[#8e8d85] hover:text-[#f5f4ef]"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            </div>

            {/* View Mode Switcher */}
            <div className="flex items-center justify-between">
              <span className="text-xs font-mono text-[#a6a49c]">Visual Comparison:</span>
              <div className="flex items-center gap-1 rounded-lg bg-[#181c24] p-1 border border-[#262c38]">
                <button
                  onClick={() => setCompareMode('slider')}
                  className={`px-3 py-1 text-xs rounded transition ${
                    compareMode === 'slider' ? 'bg-[#c58f58] text-[#0a0b0d] font-bold' : 'text-[#8e8d85] hover:text-[#f5f4ef]'
                  }`}
                >
                  Split Slider
                </button>
                <button
                  onClick={() => setCompareMode('rendered')}
                  className={`px-3 py-1 text-xs rounded transition ${
                    compareMode === 'rendered' ? 'bg-[#c58f58] text-[#0a0b0d] font-bold' : 'text-[#8e8d85] hover:text-[#f5f4ef]'
                  }`}
                >
                  AI Render
                </button>
                <button
                  onClick={() => setCompareMode('input')}
                  className={`px-3 py-1 text-xs rounded transition ${
                    compareMode === 'input' ? 'bg-[#c58f58] text-[#0a0b0d] font-bold' : 'text-[#8e8d85] hover:text-[#f5f4ef]'
                  }`}
                >
                  Original Input
                </button>
              </div>
            </div>

            {/* Comparison Display */}
            <div className="relative h-[360px] sm:h-[450px] w-full rounded-xl border border-[#262c38] overflow-hidden select-none bg-[#0a0b0d]">
              {compareMode === 'slider' ? (
                <>
                  <img
                    src={selectedProject.renderedImageUrl}
                    alt="Rendered Visualization"
                    className="absolute inset-0 h-full w-full object-contain"
                  />
                  <div
                    className="absolute inset-0 h-full overflow-hidden border-r-2 border-[#d8a876]"
                    style={{ width: `${sliderPos}%` }}
                  >
                    <img
                      src={selectedProject.inputImageUrl}
                      alt="Input Sketch"
                      className="absolute inset-0 h-full w-full object-contain bg-[#f8f7f4]"
                      style={{ width: '100%', minWidth: '100%' }}
                    />
                    <div className="absolute top-3 left-3 rounded bg-[#0a0b0d]/80 px-2 py-0.5 text-[10px] font-mono text-[#f5f4ef]">
                      SKETCH
                    </div>
                  </div>
                  <div className="absolute top-3 right-3 rounded bg-[#c58f58] px-2 py-0.5 text-[10px] font-mono font-bold text-[#0a0b0d]">
                    RENDER
                  </div>
                  <div
                    className="absolute top-0 bottom-0 w-1 bg-[#d8a876] pointer-events-none -ml-0.5 flex items-center justify-center"
                    style={{ left: `${sliderPos}%` }}
                  >
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[#d8a876] text-[#0a0b0d] shadow-lg">
                      <Sliders className="h-3.5 w-3.5" />
                    </div>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="100"
                    value={sliderPos}
                    onChange={(e) => setSliderPos(Number(e.target.value))}
                    aria-label="Modal comparison slider"
                    className="absolute inset-0 w-full h-full opacity-0 cursor-ew-resize z-20"
                  />
                </>
              ) : compareMode === 'rendered' ? (
                <img
                  src={selectedProject.renderedImageUrl}
                  alt="Rendered Only"
                  className="h-full w-full object-contain"
                />
              ) : (
                <img
                  src={selectedProject.inputImageUrl}
                  alt="Input Only"
                  className="h-full w-full object-contain bg-[#f8f7f4] p-2"
                />
              )}
            </div>

            {/* Metadata & Architectural Prompt */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="rounded-xl border border-[#222731] bg-[#161a22] p-4 text-xs">
                <span className="font-mono uppercase font-semibold text-[#d8a876] block mb-2">
                  Parameters Configured
                </span>
                <div className="grid grid-cols-2 gap-2 text-[#a6a49c]">
                  <div>
                    <span className="text-[#716d63] block">Style:</span>
                    <span className="text-[#f5f4ef] font-medium">{selectedProject.style}</span>
                  </div>
                  <div>
                    <span className="text-[#716d63] block">Lighting:</span>
                    <span className="text-[#f5f4ef] font-medium capitalize">{selectedProject.lighting}</span>
                  </div>
                  <div>
                    <span className="text-[#716d63] block">Aspect Ratio:</span>
                    <span className="text-[#f5f4ef] font-medium font-mono">{selectedProject.aspectRatio}</span>
                  </div>
                  <div>
                    <span className="text-[#716d63] block">Materials:</span>
                    <span className="text-[#f5f4ef] font-medium truncate block">
                      {selectedProject.materials?.join(', ') || 'None specified'}
                    </span>
                  </div>
                </div>
              </div>

              <div className="rounded-xl border border-[#222731] bg-[#161a22] p-4 text-xs flex flex-col justify-between">
                <div>
                  <span className="font-mono uppercase font-semibold text-[#d8a876] block mb-1.5">
                    Engineered AI Prompt
                  </span>
                  <p className="text-[#8e8d85] text-[11px] font-mono leading-relaxed max-h-24 overflow-y-auto pr-1">
                    {selectedProject.prompt}
                  </p>
                </div>
              </div>
            </div>

          </div>
        </div>
      )}

      {/* ---------------------------------------------------------------------- */}
      {/* DELETE CONFIRMATION MODAL */}
      {/* ---------------------------------------------------------------------- */}
      {projectToDelete && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in duration-100"
          onClick={() => setProjectToDelete(null)}
        >
          <div 
            className="w-full max-w-md rounded-2xl bg-[#14171e] border border-[#2e3442] p-6 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center gap-3 text-rose-400 mb-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-rose-950/40 border border-rose-900/50">
                <AlertTriangle className="h-5 w-5" />
              </div>
              <h3 className="font-heading text-lg font-bold text-[#f5f4ef]">
                Delete Render Project?
              </h3>
            </div>

            <p className="text-xs text-[#a6a49c] leading-relaxed">
              Are you sure you want to delete <span className="font-bold text-[#f5f4ef]">"{projectToDelete.title}"</span>? This will permanently remove the render and its metadata.
            </p>

            <div className="mt-6 flex items-center justify-end gap-3">
              <button
                onClick={() => setProjectToDelete(null)}
                className="rounded-lg border border-[#2a303e] px-4 py-2 text-xs font-semibold text-[#f5f4ef] hover:bg-[#1f242e] transition"
              >
                Cancel
              </button>
              <button
                onClick={() => handleDelete(projectToDelete)}
                className="rounded-lg bg-rose-600 px-4 py-2 text-xs font-bold text-white hover:bg-rose-700 transition"
              >
                Yes, Delete
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
