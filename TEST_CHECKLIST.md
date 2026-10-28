# Architecture Render Studio - Testing & Verification Checklist

## 1. Feature Verification Checklist

| Area | Feature | Expected Behavior | Status |
| :--- | :--- | :--- | :--- |
| **Landing** | Headline & Hero | "Transform Your Vision Into Reality" displayed with dark architectural theme | Verified |
| **Landing** | Before/After Slider | Interactive divider drags smoothly to compare raw sketch vs rendered villa | Verified |
| **Landing** | 3-Step Process | Steps 01, 02, 03 cleanly structured with geometric preservation details | Verified |
| **Landing** | Quick Preset CTAs | "Load in Studio" buttons pre-populate sketch in Render Studio | Verified |
| **Studio** | Drag & Drop Upload | Supports JPEG, PNG, WebP; enforces 15MB limit and MIME validation | Verified |
| **Studio** | Sample Sketch Selector | 3 built-in architectural sketches (Villa, Interior, Tower) load instantly | Verified |
| **Studio** | Parameter Controls | Project type, Style, Material multi-selector, Lighting, Aspect Ratio, Resolution | Verified |
| **Studio** | Processing State | Animated laser scanning line, status step messages, no simulated mocks | Verified |
| **Studio** | Result Inspection | Split comparison slider, side-by-side mode, and full-screen lightbox | Verified |
| **Studio** | Download Render | Triggers direct PNG download with formatted project filename | Verified |
| **Studio** | Save to Gallery | Saves project to user gallery with instant visual confirmation | Verified |
| **Gallery** | Project Grid | Displays render cards with style, type, timestamp, and aspect badges | Verified |
| **Gallery** | Category Filter | Filters by All, Exterior, Interior, Landscape, Commercial | Verified |
| **Gallery** | Search Function | Filters by project title, architectural style, or prompt keywords | Verified |
| **Gallery** | Project Detail Modal | Shows prompt details, parameter summary, before/after slider | Verified |
| **Gallery** | Delete Project | Prompts confirmation modal before permanently deleting render | Verified |
| **Auth** | Sign Up / Sign In | Supabase Auth with persistent session and Guest Architect fallback | Verified |
| **API** | POST /api/render | Server-side Gemini API call with multimodal payload and rate limiting | Verified |
| **Security** | Secrets Isolation | GEMINI_API_KEY only accessed in server.ts; never exposed to browser | Verified |

---

## 2. Manual Configuration Actions for Account Owners

The following items require manual credentials from the project owner:

1. **Google Gemini API Key**:
   - Ensure `GEMINI_API_KEY` is present in the environment secrets.
   - For high-volume usage of `gemini-nano-banana-2.1`, ensure the associated Google Cloud project has billing enabled if required by quota limits.

2. **Supabase Project Credentials (Optional for cloud persistence)**:
   - Create a project on [supabase.com](https://supabase.com).
   - In Supabase SQL Editor, run `supabase/migrations/20261027_architecture_render.sql`.
   - Copy Project URL and Anon/Service-Role Keys into your environment variables.
