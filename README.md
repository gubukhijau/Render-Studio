# Architecture Render Studio

> **Transform Your Vision Into Reality**
> A high-performance, full-stack AI platform built for architects, interior designers, property developers, and students to convert sketches, facade drawings, interior layouts, and building concepts into photorealistic 3D architectural visualizations.

---

## 1. Project Overview & Architecture

Architecture Render Studio combines modern web technologies with the Google Gemini Multimodal Vision API to perform physically plausible image-to-image architectural rendering.

```
+-------------------------------------------------------------------------+
|                                CLIENT                                   |
|  React 19 + TypeScript + Tailwind CSS (Manrope & Space Grotesk)         |
|  - Landing Page: Interactive Before/After visual comparison             |
|  - Render Studio: Drag-and-drop sketch upload & parameter controls      |
|  - Gallery: User renders with before/after inspection slider & download |
|  - Auth: Supabase Auth session with local guest evaluation fallback     |
+-------------------------------------------------------------------------+
                                    |
                            HTTP / REST API
                                    |
+-------------------------------------------------------------------------+
|                          FULL-STACK SERVER                              |
|  Express 4 + Vite SSR Middleware (server.ts)                            |
|  - POST /api/render: Multimodal input processing & rate limiting        |
|  - GET /api/config-status: Gemini & Supabase integration status         |
|  - Strict architectural prompt construction & geometric preservation    |
+-------------------------------------------------------------------------+
           |                                              |
           v                                              v
+-----------------------+                    +----------------------------+
|   GOOGLE GEMINI API   |                    |          SUPABASE          |
|  @google/genai SDK    |                    |  PostgreSQL Database (RLS) |
|  - nano-banana-2.1    |                    |  Private Storage Buckets   |
|  - 3.1-flash-lite     |                    |  User Profiles & Auth      |
+-----------------------+                    +----------------------------+
```

---

## 2. Tech Stack

- **Framework**: React 19, TypeScript, Express, Vite
- **Styling**: Tailwind CSS, custom architectural blueprint grid & charcoal palette
- **Icons**: Lucide React
- **AI Vision Engine**: Google Gemini API via `@google/genai` TypeScript SDK
  - **Primary Model**: `gemini-nano-banana-2.1` (Configurable 1K, 2K, 4K resolutions, non-standard aspect ratios)
  - **Fallback Model**: `gemini-3.1-flash-lite-image` (High throughput)
- **Database**: Supabase PostgreSQL with strict Row Level Security (RLS)
- **Authentication**: Supabase Auth (Email / Password + Session persistence)
- **Storage**: Supabase Storage (`architecture-inputs`, `architecture-renders`)
- **Version Control & Deployments**: GitHub, Vercel, Google AI Studio

---

## 3. Directory Structure

```
├── .env.example                               # Environment variable blueprint
├── DEPLOYMENT.md                              # Google AI Studio -> GitHub -> Vercel deployment guide
├── TEST_CHECKLIST.md                          # Comprehensive QA & verification checklist
├── index.html                                 # Entry HTML with typography and metadata
├── metadata.json                              # Applet metadata & major capabilities
├── package.json                               # Dependencies & build scripts
├── server.ts                                  # Express full-stack API & Gemini integration
├── src/
│   ├── App.tsx                                # Main application root & view router
│   ├── components/
│   │   ├── AuthModal.tsx                      # Supabase Auth modal
│   │   ├── Gallery.tsx                        # Gallery grid, search & inspection modal
│   │   ├── LandingPage.tsx                    # Hero, Before/After comparison, workflow
│   │   ├── Navbar.tsx                         # Header with model badge & profile
│   │   ├── RenderStudio.tsx                   # Upload dropzone, parameters, split slider
│   │   └── SetupGuideModal.tsx                # Config status, SQL copy, storage guide
│   ├── data/
│   │   └── sampleSketches.ts                  # Built-in sample architectural sketches
│   ├── services/
│   │   └── supabaseClient.ts                  # Supabase client & local cache layer
│   ├── types/
│   │   └── architecture.ts                    # TypeScript types & interfaces
│   ├── index.css                              # Tailwind base, fonts, scrollbar
│   └── main.tsx                               # React DOM entry
├── supabase/
│   └── migrations/
│       └── 20261027_architecture_render.sql   # Complete PostgreSQL schema & RLS policies
├── tsconfig.json                              # TypeScript configuration
└── vite.config.ts                             # Vite configuration
```

---

## 4. Setup & Running Locally

### Prerequisites
- Node.js >= 20
- npm or pnpm
- Google Gemini API key (from [Google AI Studio](https://aistudio.google.com/))

### Installation

1. Clone or download the repository:
   ```bash
   git clone <your-repo-url>
   cd architecture-render-studio
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Set up environment variables:
   ```bash
   cp .env.example .env
   ```
   Add your `GEMINI_API_KEY` to `.env`.

4. Start development server:
   ```bash
   npm run dev
   ```
   Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## 5. Environment Variables Guide

| Variable | Scope | Required | Description |
| :--- | :--- | :--- | :--- |
| `GEMINI_API_KEY` | Server Only | **Yes** | API key for Google Gemini model generation. Never exposed to browser. |
| `SUPABASE_URL` | Server Only | Optional | Supabase project URL for server-side auth token verification. |
| `SUPABASE_SERVICE_ROLE_KEY` | Server Only | Optional | Secret service-role key for backend storage uploads. |
| `NEXT_PUBLIC_SUPABASE_URL` | Client/Server | Optional | Supabase URL for Next.js / client compatibility. |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | Client/Server | Optional | Supabase anon key for client authentication. |
| `VITE_SUPABASE_URL` | Client Only | Optional | Client Supabase URL for Vite SPA. |
| `VITE_SUPABASE_ANON_KEY` | Client Only | Optional | Client Supabase anon key for Vite SPA. |
| `APP_URL` | Server Only | Optional | Base URL of deployed application. |

---

## 6. Supabase Database & Storage Setup

1. Open your [Supabase Dashboard](https://supabase.com).
2. Navigate to the **SQL Editor**.
3. Open `supabase/migrations/20261027_architecture_render.sql` from this repository and run the script.
4. The migration script will create:
   - `profiles` table linked to `auth.users`
   - `render_projects` table for storing project metadata
   - `render_images` table referencing input and output assets
   - `render_usage` table for audit logging
   - Row Level Security (RLS) policies guaranteeing strict user isolation
   - Private Storage buckets: `architecture-inputs` and `architecture-renders`
