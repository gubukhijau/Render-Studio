# Deployment Guide: Google AI Studio -> GitHub -> Vercel

This guide outlines the step-by-step process for deploying **Architecture Render Studio** to production on Vercel and GitHub.

---

## 1. Pushing from Google AI Studio to GitHub

1. **Initialize Git Repository (if not already done)**:
   ```bash
   git init
   git add .
   git commit -m "feat: initial release of Architecture Render Studio"
   ```

2. **Connect to your GitHub Remote**:
   ```bash
   git branch -M main
   git remote add origin https://github.com/<your-username>/architecture-render-studio.git
   git push -u origin main
   ```

---

## 2. Deploying on Vercel

1. **Log in to Vercel**:
   Go to [vercel.com](https://vercel.com) and log in with your GitHub account.

2. **Import Project**:
   - Click **Add New...** > **Project**.
   - Select your `architecture-render-studio` repository.

3. **Configure Project Settings**:
   - **Framework Preset**: Vite or Other
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`
   - **Install Command**: `npm install`

4. **Add Environment Variables in Vercel**:
   Under **Settings > Environment Variables**, add:
   - `GEMINI_API_KEY`: Your Google Gemini API Key from [Google AI Studio](https://aistudio.google.com/)
   - `SUPABASE_URL`: Your Supabase Project URL (`https://<project-id>.supabase.co`)
   - `SUPABASE_SERVICE_ROLE_KEY`: Your Supabase Service Role Key (Keep private!)
   - `VITE_SUPABASE_URL`: Your Supabase Project URL
   - `VITE_SUPABASE_ANON_KEY`: Your Supabase Anon Public Key
   - `APP_URL`: Your production Vercel URL (e.g. `https://architecture-render-studio.vercel.app`)

5. **Deploy**:
   Click **Deploy**. Vercel will trigger the build pipeline and assign a production URL.

---

## 3. Post-Deployment Verification

1. Verify `/api/health` returns `200 OK`.
2. Verify `/api/config-status` shows `gemini.configured = true`.
3. Perform a test render using one of the built-in architectural sketches.
4. Verify the generated image downloads as a valid PNG and appears in the Gallery.
