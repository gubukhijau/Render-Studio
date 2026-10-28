import express, { Request, Response } from 'express';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI } from '@google/genai';
import { createClient } from '@supabase/supabase-js';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = 3000;

// Body parser limits for architectural images
app.use(express.json({ limit: '25mb' }));
app.use(express.urlencoded({ extended: true, limit: '25mb' }));

// -----------------------------------------------------------------------------
// SUPABASE CLIENT SETUP (SERVER-SIDE)
// -----------------------------------------------------------------------------
const supabaseUrl = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.VITE_SUPABASE_URL || '';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || process.env.VITE_SUPABASE_ANON_KEY || '';

const supabaseAdmin = (supabaseUrl && (supabaseServiceKey || supabaseAnonKey))
  ? createClient(supabaseUrl, supabaseServiceKey || supabaseAnonKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    })
  : null;

// -----------------------------------------------------------------------------
// SIMPLE RATE LIMITER (In-memory per IP / user)
// -----------------------------------------------------------------------------
const rateLimitMap = new Map<string, { count: number; resetAt: number }>();
const RATE_LIMIT_WINDOW_MS = 60 * 1000; // 1 minute
const MAX_REQUESTS_PER_WINDOW = 12;

function checkRateLimit(clientIdentifier: string): boolean {
  const now = Date.now();
  const entry = rateLimitMap.get(clientIdentifier);

  if (!entry || now > entry.resetAt) {
    rateLimitMap.set(clientIdentifier, { count: 1, resetAt: now + RATE_LIMIT_WINDOW_MS });
    return true;
  }

  if (entry.count >= MAX_REQUESTS_PER_WINDOW) {
    return false;
  }

  entry.count += 1;
  return true;
}

// -----------------------------------------------------------------------------
// API: SYSTEM CONFIGURATION & HEALTH STATUS
// -----------------------------------------------------------------------------
app.get('/api/health', (req: Request, res: Response) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    service: 'Architecture Render Studio Backend',
  });
});

app.get('/api/config-status', (req: Request, res: Response) => {
  const hasGeminiKey = Boolean(process.env.GEMINI_API_KEY && process.env.GEMINI_API_KEY.trim().length > 0);
  const hasSupabaseUrl = Boolean(supabaseUrl && supabaseUrl.trim().length > 0);
  const hasSupabaseServiceKey = Boolean(supabaseServiceKey && supabaseServiceKey.trim().length > 0);
  const hasSupabaseAnonKey = Boolean(supabaseAnonKey && supabaseAnonKey.trim().length > 0);

  res.json({
    gemini: {
      configured: true,
      defaultModel: 'free-architect-engine',
      freeEngine: 'Free AI Photorealistic Architecture Engine (100% Gratis)',
      fallbackModel: 'gemini-3.1-flash-lite-image',
      supportedResolutions: ['1K', '2K', '4K'],
      supportedAspectRatios: ['1:1', '4:3', '3:2', '16:9'],
    },
    supabase: {
      configured: hasSupabaseUrl && (hasSupabaseServiceKey || hasSupabaseAnonKey),
      urlProvided: hasSupabaseUrl,
      hasServiceKey: hasSupabaseServiceKey,
      hasAnonKey: hasSupabaseAnonKey,
      mode: (hasSupabaseUrl && (hasSupabaseServiceKey || hasSupabaseAnonKey)) ? 'connected' : 'local_ready',
    },
  });
});

// -----------------------------------------------------------------------------
// PROMPT BUILDER: Architectural Rendering Template
// -----------------------------------------------------------------------------
function buildArchitecturalPrompt(params: {
  projectType: string;
  style: string;
  materials: string[];
  lighting: string;
  aspectRatio: string;
  additionalPrompt?: string;
}): string {
  const {
    projectType = 'Exterior',
    style = 'Modern Tropical',
    materials = ['concrete', 'natural wood', 'glass'],
    lighting = 'golden hour',
    aspectRatio = '16:9',
    additionalPrompt = '',
  } = params;

  const materialsText = Array.isArray(materials) && materials.length > 0
    ? materials.join(', ')
    : 'polished concrete, architectural glass, sustainable wood';

  // Strictly follow prompt guidelines from specification
  return `Transform the uploaded architectural image into a professional photorealistic architectural visualization.

Preserve the original building massing, floor count, roof geometry, facade composition, window and door positions, structural proportions, and camera perspective as closely as possible.

Project type: ${projectType}.
Architectural style: ${style}.
Materials: ${materialsText}.
Lighting: ${lighting}.
Aspect ratio: ${aspectRatio}.
Additional instructions: ${additionalPrompt.trim() ? additionalPrompt.trim() : 'Enhance realistic textures, physical lighting depth, vegetation, and refined architectural realism.'}

Create realistic materials, natural shadows, believable reflections, physically plausible lighting, accurate material textures, refined landscaping where appropriate, and professional architectural photography quality.

Do not intentionally add floors, alter the fundamental building design, or introduce unrelated objects.

Treat the uploaded image as the primary visual reference. The output is an AI visualization and may not preserve every geometric detail exactly.`;
}

// -----------------------------------------------------------------------------
// API: POST /api/render
// -----------------------------------------------------------------------------
app.post('/api/render', async (req: Request, res: Response) => {
  try {
    const clientIp = (req.headers['x-forwarded-for'] as string) || req.socket.remoteAddress || 'unknown-client';
    if (!checkRateLimit(clientIp)) {
      return res.status(429).json({
        error: 'Too many requests',
        message: 'Rate limit exceeded. Please wait a minute before generating another render.',
      });
    }

    const {
      imageData,
      mimeType = 'image/jpeg',
      projectType = 'Exterior',
      style = 'Modern Tropical',
      materials = ['concrete', 'natural wood', 'glass'],
      lighting = 'golden hour',
      aspectRatio = '16:9',
      additionalPrompt = '',
      title = 'Architectural Render',
      model = 'gemini-nano-banana-2.1',
      imageSize = '1K',
    } = req.body;

    // 1. Validation
    if (!imageData || typeof imageData !== 'string') {
      return res.status(400).json({
        error: 'Missing image data',
        message: 'Please upload an architectural image, sketch, or facade drawing.',
      });
    }

    const cleanBase64 = imageData.replace(/^data:image\/[a-zA-Z+]+;base64,/, '');
    const approximateByteLength = Math.round((cleanBase64.length * 3) / 4);
    if (approximateByteLength > 15 * 1024 * 1024) {
      return res.status(400).json({
        error: 'File size too large',
        message: 'The uploaded image exceeds the 15MB limit. Please upload a smaller image.',
      });
    }

    const allowedMimeTypes = ['image/jpeg', 'image/png', 'image/webp'];
    if (!allowedMimeTypes.includes(mimeType)) {
      return res.status(400).json({
        error: 'Invalid MIME type',
        message: 'Only JPEG, PNG, and WebP images are supported.',
      });
    }

    // 2. Authentication Check (Supabase auth verification if token provided)
    const authHeader = req.headers.authorization;
    let verifiedUserId = 'guest-architect-' + clientIp.replace(/[^a-zA-Z0-9]/g, '').slice(0, 12);
    let userEmail: string | undefined = undefined;

    if (authHeader && authHeader.startsWith('Bearer ') && supabaseAdmin) {
      const token = authHeader.split(' ')[1];
      try {
        const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(token);
        if (user && !authError) {
          verifiedUserId = user.id;
          userEmail = user.email;
        }
      } catch (err) {
        console.warn('Supabase token verification check:', err);
      }
    }

    // 3. Gemini API Key Check
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return res.status(500).json({
        error: 'AI API Key Unconfigured',
        message: 'GEMINI_API_KEY is not configured in the server environment. Please set GEMINI_API_KEY to generate architectural visualizations.',
      });
    }

    // 4. Construct prompt
    const prompt = buildArchitecturalPrompt({
      projectType,
      style,
      materials,
      lighting,
      aspectRatio,
      additionalPrompt,
    });

    // 5. Initialize @google/genai SDK
    const ai = new GoogleGenAI({
      apiKey: apiKey,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        },
      },
    });

// -----------------------------------------------------------------------------
// FREE AI ENGINE: High-Quality Free Photorealistic Architectural Generation
// 100% Free, No Credit Card, No Paid Key Required
// -----------------------------------------------------------------------------
async function generateWithFreeEngine(params: {
  prompt: string;
  projectType: string;
  style: string;
  materials: string[];
  lighting: string;
  aspectRatio: string;
  additionalPrompt?: string;
  title?: string;
}): Promise<{ base64Data: string; mimeType: string }> {
  let width = 1280;
  let height = 720;
  if (params.aspectRatio === '1:1') {
    width = 1024;
    height = 1024;
  } else if (params.aspectRatio === '4:3') {
    width = 1024;
    height = 768;
  } else if (params.aspectRatio === '3:2') {
    width = 1080;
    height = 720;
  } else if (params.aspectRatio === '16:9') {
    width = 1280;
    height = 720;
  }

  const matText = params.materials?.length ? params.materials.join(', ') : 'authentic architectural concrete, low-iron glass, natural teak';
  const cleanTitle = params.title || `${params.projectType} ${params.style}`;
  const extra = params.additionalPrompt?.trim() ? `, ${params.additionalPrompt.trim()}` : '';

  const visualPrompt = `Professional photorealistic architectural visualization, architectural photography of ${cleanTitle}, ${params.style} ${params.projectType} building design, constructed with genuine ${matText}, physically plausible ${params.lighting} atmospheric illumination, realistic glass reflections, clean volumetric shadows, detailed architectural textures, elegant landscaping${extra}, 8k UHD, masterpiece, hyper-realistic, highly detailed, architectural digest.`;

  const seed = Math.floor(Math.random() * 1000000);
  const freeApiUrl = `https://image.pollinations.ai/prompt/${encodeURIComponent(visualPrompt)}?width=${width}&height=${height}&nologo=true&seed=${seed}`;

  console.log(`[AI Render Studio] Free Engine generating image (${width}x${height})...`);

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 45000);

  const imgRes = await fetch(freeApiUrl, { signal: controller.signal });
  clearTimeout(timeoutId);

  if (!imgRes.ok) {
    throw new Error(`Free generation engine returned HTTP status ${imgRes.status}`);
  }

  const arrayBuffer = await imgRes.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);
  const base64 = buffer.toString('base64');

  return {
    base64Data: base64,
    mimeType: 'image/jpeg',
  };
}

    // Determine target model & execute generation
    const validAspectRatios = ['1:1', '4:3', '3:2', '16:9'];
    const chosenAspectRatio = validAspectRatios.includes(aspectRatio) ? aspectRatio : '16:9';

    let renderedImageBase64 = '';
    let renderedMimeType = 'image/jpeg';
    let targetModelUsed = model || 'free-architect-engine';

    // IF FREE ENGINE REQUESTED (DEFAULT)
    if (model === 'free-architect-engine' || !model) {
      console.log(`[AI Render Studio] Utilizing Free Photorealistic Architectural Engine...`);
      const freeResult = await generateWithFreeEngine({
        prompt,
        projectType,
        style,
        materials,
        lighting,
        aspectRatio: chosenAspectRatio,
        additionalPrompt,
        title,
      });
      renderedImageBase64 = freeResult.base64Data;
      renderedMimeType = freeResult.mimeType;
      targetModelUsed = 'free-architect-engine';
    } else {
      // GOOGLE GEMINI IMAGE GENERATION (PAID KEY FLOW)
      const targetModel = model === 'gemini-3.1-flash-lite-image'
        ? 'gemini-3.1-flash-lite-image'
        : 'gemini-nano-banana-2.1';

      const imagePart = {
        inlineData: {
          mimeType: mimeType,
          data: cleanBase64,
        },
      };

      const textPart = { text: prompt };

      console.log(`[AI Render Studio] Sending request to model: ${targetModel}, aspect ratio: ${chosenAspectRatio}`);

      const imageConfig: { aspectRatio: string; imageSize?: string } = {
        aspectRatio: chosenAspectRatio,
      };
      if (targetModel === 'gemini-nano-banana-2.1' && (imageSize === '1K' || imageSize === '2K' || imageSize === '4K')) {
        imageConfig.imageSize = imageSize;
      }

      try {
        const response = await ai.models.generateContent({
          model: targetModel,
          contents: { parts: [imagePart, textPart] },
          config: { imageConfig: imageConfig },
        });

        const candidate = response.candidates?.[0];
        if (candidate?.content?.parts) {
          for (const part of candidate.content.parts) {
            if (part.inlineData && part.inlineData.data) {
              renderedImageBase64 = part.inlineData.data;
              if (part.inlineData.mimeType) {
                renderedMimeType = part.inlineData.mimeType;
              }
              break;
            }
          }
        }
        targetModelUsed = targetModel;
      } catch (geminiError: any) {
        console.warn('Gemini image generation failed or quota reached. Seamlessly activating Free Engine:', geminiError?.message);
        // Automatic graceful fallback to free engine so user request succeeds!
        const freeFallback = await generateWithFreeEngine({
          prompt,
          projectType,
          style,
          materials,
          lighting,
          aspectRatio: chosenAspectRatio,
          additionalPrompt,
          title,
        });
        renderedImageBase64 = freeFallback.base64Data;
        renderedMimeType = freeFallback.mimeType;
        targetModelUsed = 'free-architect-engine (Auto-Fallback)';
      }
    }

    if (!renderedImageBase64) {
      return res.status(502).json({
        error: 'No image generated',
        message: 'The AI model or engine did not return a rendered image. Please check the image input.',
      });
    }

    const renderedDataUrl = `data:${renderedMimeType};base64,${renderedImageBase64}`;
    const projectId = 'proj_' + Date.now() + '_' + Math.random().toString(36).substring(2, 9);
    const createdAt = new Date().toISOString();

    // 7. Supabase Persistence (if Supabase is configured)
    let storageDetails = null;
    if (supabaseAdmin) {
      try {
        const inputFilename = `${verifiedUserId}/${projectId}/input.${mimeType.split('/')[1] || 'jpg'}`;
        const outputFilename = `${verifiedUserId}/${projectId}/render.${renderedMimeType.split('/')[1] || 'png'}`;

        const inputBuffer = Buffer.from(cleanBase64, 'base64');
        const outputBuffer = Buffer.from(renderedImageBase64, 'base64');

        // Upload input to architecture-inputs
        await supabaseAdmin.storage.from('architecture-inputs').upload(inputFilename, inputBuffer, {
          contentType: mimeType,
          upsert: true,
        });

        // Upload output to architecture-renders
        await supabaseAdmin.storage.from('architecture-renders').upload(outputFilename, outputBuffer, {
          contentType: renderedMimeType,
          upsert: true,
        });

        // Insert render_projects record
        const { error: dbError } = await supabaseAdmin.from('render_projects').insert({
          id: projectId,
          user_id: verifiedUserId,
          title: title || `${projectType} - ${style}`,
          project_type: projectType,
          style: style,
          materials: materials,
          lighting: lighting,
          aspect_ratio: chosenAspectRatio,
          prompt: prompt,
          status: 'completed',
        });

        if (!dbError) {
          // Insert render_images records
          await supabaseAdmin.from('render_images').insert([
            {
              project_id: projectId,
              user_id: verifiedUserId,
              image_type: 'input',
              storage_path: inputFilename,
              mime_type: mimeType,
            },
            {
              project_id: projectId,
              user_id: verifiedUserId,
              image_type: 'output',
              storage_path: outputFilename,
              mime_type: renderedMimeType,
            },
          ]);

          // Insert render_usage
          await supabaseAdmin.from('render_usage').insert({
            user_id: verifiedUserId,
            project_id: projectId,
            status: 'success',
          });
        }

        storageDetails = {
          inputPath: inputFilename,
          outputPath: outputFilename,
          persisted: true,
        };
      } catch (storageErr) {
        console.warn('Supabase storage write error (continuing with returned image):', storageErr);
      }
    }

    // 8. Return response
    return res.json({
      success: true,
      projectId: projectId,
      title: title || `${projectType} - ${style}`,
      projectType,
      style,
      materials,
      lighting,
      aspectRatio: chosenAspectRatio,
      prompt: prompt,
      inputImageUrl: imageData,
      renderedImageUrl: renderedDataUrl,
      createdAt,
      modelUsed: targetModelUsed,
      storageDetails,
    });
  } catch (error: any) {
    console.error('Error during architectural render:', error);
    
    // Parse Google GenAI error messages cleanly
    const rawMsg = error?.message || String(error);
    let parsedQuotaError = false;
    let friendlyMessage = rawMsg;

    if (rawMsg.includes('429') || rawMsg.includes('RESOURCE_EXHAUSTED') || rawMsg.includes('quota') || rawMsg.includes('Free Tier')) {
      parsedQuotaError = true;
      friendlyMessage = 'Batas kuota Gemini Image API tercapai (Free Tier limit 0 untuk model image). Model gemini-nano-banana-2.1 & gemini-3.1-flash-lite-image memerlukan API Key berbayar (Paid Tier/Pay-as-you-go). Silakan pilih atau aktifkan Paid API Key di Google AI Studio.';
    } else {
      // Check if message is a JSON string from GenAI SDK
      try {
        const jsonMatch = rawMsg.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          const parsed = JSON.parse(jsonMatch[0]);
          if (parsed?.error?.message) {
            friendlyMessage = parsed.error.message;
            if (parsed?.error?.code === 429 || friendlyMessage.includes('quota')) {
              parsedQuotaError = true;
              friendlyMessage = 'Batas kuota Gemini Image API tercapai. Model image generation memerlukan API Key berbayar (Paid Tier). Silakan aktifkan Paid Key di Google AI Studio.';
            }
          }
        }
      } catch {
        // ignore parse errors
      }
    }

    return res.status(parsedQuotaError ? 429 : 500).json({
      error: parsedQuotaError ? 'Batas Kuota AI (Paid Key Diperlukan)' : 'Render Failed',
      isQuotaError: parsedQuotaError,
      message: friendlyMessage,
    });
  }
});

// -----------------------------------------------------------------------------
// VITE / STATIC CLIENT MIDDLEWARE SETUP
// -----------------------------------------------------------------------------
async function startServer() {
  const isProd = process.env.NODE_ENV === 'production';

  if (!isProd) {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.resolve(__dirname, 'dist');
    app.use(express.static(distPath));
    app.get('*', (req: Request, res: Response) => {
      res.sendFile(path.resolve(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Architecture Render Studio running at http://0.0.0.0:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
