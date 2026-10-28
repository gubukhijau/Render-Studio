import { createClient, SupabaseClient, User } from '@supabase/supabase-js';
import { RenderProject, UserSession } from '../types/architecture';

// Read environment variables (supports Vite VITE_ prefix as well as Next.js NEXT_PUBLIC_ prefix)
const supabaseUrl =
  (import.meta.env.VITE_SUPABASE_URL as string) ||
  (import.meta.env.NEXT_PUBLIC_SUPABASE_URL as string) ||
  '';

const supabaseAnonKey =
  (import.meta.env.VITE_SUPABASE_ANON_KEY as string) ||
  (import.meta.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY as string) ||
  '';

export const isSupabaseConfigured = Boolean(
  supabaseUrl && supabaseUrl.trim().length > 0 &&
  supabaseAnonKey && supabaseAnonKey.trim().length > 0
);

export const supabase: SupabaseClient | null = isSupabaseConfigured
  ? createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
      },
    })
  : null;

const LOCAL_STORAGE_PROJECTS_KEY = 'architecture_studio_renders_v1';
const LOCAL_STORAGE_SESSION_KEY = 'architecture_studio_session_v1';

// -----------------------------------------------------------------------------
// AUTHENTICATION HELPERS
// -----------------------------------------------------------------------------
export async function getInitialSession(): Promise<UserSession> {
  if (supabase) {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        return {
          id: session.user.id,
          email: session.user.email,
          displayName: session.user.user_metadata?.full_name || session.user.email?.split('@')[0] || 'Architect',
          role: 'Lead Architect',
          isGuest: false,
          token: session.access_token,
        };
      }
    } catch (err) {
      console.warn('Error reading Supabase session:', err);
    }
  }

  // Fallback to local session
  const stored = localStorage.getItem(LOCAL_STORAGE_SESSION_KEY);
  if (stored) {
    try {
      return JSON.parse(stored);
    } catch {
      // ignore
    }
  }

  const guestSession: UserSession = {
    id: 'guest_' + Math.random().toString(36).substring(2, 9),
    displayName: 'Guest Architect',
    role: 'Architect',
    isGuest: true,
  };
  localStorage.setItem(LOCAL_STORAGE_SESSION_KEY, JSON.stringify(guestSession));
  return guestSession;
}

export async function loginWithEmail(email: string, password: string): Promise<{ success: boolean; user?: UserSession; error?: string }> {
  if (!supabase) {
    // Local mock signin for evaluation when keys not added
    const guest: UserSession = {
      id: 'local_user_' + btoa(email).slice(0, 8),
      email: email,
      displayName: email.split('@')[0],
      role: 'Lead Architect',
      isGuest: false,
    };
    localStorage.setItem(LOCAL_STORAGE_SESSION_KEY, JSON.stringify(guest));
    return { success: true, user: guest };
  }

  try {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) {
      return { success: false, error: error.message };
    }
    if (data.user) {
      const user: UserSession = {
        id: data.user.id,
        email: data.user.email,
        displayName: data.user.user_metadata?.full_name || data.user.email?.split('@')[0] || 'Architect',
        role: 'Lead Architect',
        isGuest: false,
        token: data.session?.access_token,
      };
      localStorage.setItem(LOCAL_STORAGE_SESSION_KEY, JSON.stringify(user));
      return { success: true, user };
    }
    return { success: false, error: 'User data not returned' };
  } catch (err: any) {
    return { success: false, error: err.message || 'Authentication error' };
  }
}

export async function signUpWithEmail(email: string, password: string, fullName: string): Promise<{ success: boolean; user?: UserSession; error?: string }> {
  if (!supabase) {
    const localUser: UserSession = {
      id: 'local_user_' + btoa(email).slice(0, 8),
      email: email,
      displayName: fullName || email.split('@')[0],
      role: 'Lead Architect',
      isGuest: false,
    };
    localStorage.setItem(LOCAL_STORAGE_SESSION_KEY, JSON.stringify(localUser));
    return { success: true, user: localUser };
  }

  try {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: fullName,
        },
      },
    });

    if (error) {
      return { success: false, error: error.message };
    }

    if (data.user) {
      const user: UserSession = {
        id: data.user.id,
        email: data.user.email,
        displayName: fullName || data.user.email?.split('@')[0] || 'Architect',
        role: 'Lead Architect',
        isGuest: false,
        token: data.session?.access_token,
      };
      localStorage.setItem(LOCAL_STORAGE_SESSION_KEY, JSON.stringify(user));
      return { success: true, user };
    }
    return { success: false, error: 'Sign up failed' };
  } catch (err: any) {
    return { success: false, error: err.message || 'Sign up error' };
  }
}

export async function logOut(): Promise<void> {
  if (supabase) {
    try {
      await supabase.auth.signOut();
    } catch (err) {
      console.warn('Sign out error:', err);
    }
  }

  const guestSession: UserSession = {
    id: 'guest_' + Math.random().toString(36).substring(2, 9),
    displayName: 'Guest Architect',
    role: 'Architect',
    isGuest: true,
  };
  localStorage.setItem(LOCAL_STORAGE_SESSION_KEY, JSON.stringify(guestSession));
}

// -----------------------------------------------------------------------------
// PROJECT / GALLERY DATA HELPERS
// -----------------------------------------------------------------------------
export async function fetchUserProjects(userId?: string): Promise<RenderProject[]> {
  // Try Supabase first if available
  if (supabase && userId && !userId.startsWith('guest_')) {
    try {
      const { data, error } = await supabase
        .from('render_projects')
        .select(`
          id,
          user_id,
          title,
          project_type,
          style,
          materials,
          lighting,
          aspect_ratio,
          prompt,
          status,
          created_at,
          render_images (image_type, storage_path)
        `)
        .order('created_at', { ascending: false });

      if (!error && data && data.length > 0) {
        // Map database records into RenderProject
        const mapped: RenderProject[] = data.map((item: any) => {
          return {
            id: item.id,
            userId: item.user_id,
            title: item.title,
            projectType: item.project_type,
            style: item.style,
            materials: Array.isArray(item.materials) ? item.materials : [],
            lighting: item.lighting,
            aspectRatio: item.aspect_ratio || '16:9',
            prompt: item.prompt,
            inputImageUrl: '',
            renderedImageUrl: '',
            createdAt: item.created_at,
            status: item.status,
          };
        });
        return mapped;
      }
    } catch (err) {
      console.warn('Supabase fetch error, fallback to local cache:', err);
    }
  }

  // Load from local storage
  const stored = localStorage.getItem(LOCAL_STORAGE_PROJECTS_KEY);
  if (stored) {
    try {
      return JSON.parse(stored);
    } catch {
      return [];
    }
  }
  return [];
}

export function saveProjectLocally(project: RenderProject): void {
  const current = getLocalProjects();
  // prepend new project
  const updated = [project, ...current.filter((p) => p.id !== project.id)];
  localStorage.setItem(LOCAL_STORAGE_PROJECTS_KEY, JSON.stringify(updated));
}

export function getLocalProjects(): RenderProject[] {
  const stored = localStorage.getItem(LOCAL_STORAGE_PROJECTS_KEY);
  if (stored) {
    try {
      return JSON.parse(stored);
    } catch {
      return [];
    }
  }
  return [];
}

export function deleteProjectLocally(id: string): void {
  const current = getLocalProjects();
  const updated = current.filter((p) => p.id !== id);
  localStorage.setItem(LOCAL_STORAGE_PROJECTS_KEY, JSON.stringify(updated));
}
