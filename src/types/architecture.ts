export type ProjectType = 'Exterior' | 'Interior' | 'Landscape' | 'Commercial';

export type ArchitecturalStyle =
  | 'Minimalist'
  | 'Modern Tropical'
  | 'Contemporary'
  | 'Industrial'
  | 'Scandinavian'
  | 'Luxury';

export type LightingOption =
  | 'daylight'
  | 'golden hour'
  | 'overcast'
  | 'sunset'
  | 'night';

export type AspectRatio = '1:1' | '4:3' | '3:2' | '16:9';

export type AIModel = 'gemini-nano-banana-2.1' | 'gemini-3.1-flash-lite-image';

export type Resolution = '1K' | '2K' | '4K';

export interface RenderProject {
  id: string;
  userId?: string;
  title: string;
  projectType: ProjectType;
  style: ArchitecturalStyle;
  materials: string[];
  lighting: LightingOption;
  aspectRatio: AspectRatio;
  prompt: string;
  inputImageUrl: string;
  renderedImageUrl: string;
  createdAt: string;
  status: 'completed' | 'processing' | 'failed';
  errorMessage?: string;
  modelUsed?: string;
}

export interface UserSession {
  id: string;
  email?: string;
  displayName: string;
  role: string;
  isGuest: boolean;
  token?: string;
}

export interface ConfigStatus {
  gemini: {
    configured: boolean;
    defaultModel: string;
    fallbackModel: string;
    supportedResolutions: string[];
    supportedAspectRatios: string[];
  };
  supabase: {
    configured: boolean;
    urlProvided: boolean;
    hasServiceKey: boolean;
    hasAnonKey: boolean;
    mode: 'connected' | 'local_ready';
  };
}
