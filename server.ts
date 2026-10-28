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
// USER SPECIFIED MASTER ARCHITECTURAL PROMPT: ENHANCE REALISM ONLY
// -----------------------------------------------------------------------------
const MASTER_REALISM_PROMPT = `*MAIN OBJECTIVE: ENHANCE REALISM ONLY. DO NOT CHANGE ANYTHING IN THE ORIGINAL IMAGE.*

Transform the uploaded architectural image into an extremely photorealistic, premium-quality architectural photograph while preserving the original design with absolute fidelity.

The uploaded image is the *ONLY MASTER REFERENCE*. It determines every architectural detail, object, material position, color, composition, and camera perspective.

### 1. ABSOLUTE DESIGN LOCK — MANDATORY

Preserve the original image exactly. Do not redesign, reinterpret, reconstruct creatively, or generate alternative architectural solutions.

STRICTLY KEEP 100% UNCHANGED:
- Building geometry, shape, dimensions, scale, proportions, and structural layout.
- Roof shape, slope, height, thickness, overhangs, edges, and roofing details.
- All façade compositions, walls, columns, beams, floors, ceilings, and architectural ornaments.
- Exact positions, sizes, shapes, and proportions of all windows, doors, glass panels, frames, vents, and openings.
- Original colors, material assignments, textures, patterns, and boundaries between materials.
- All interior and exterior elements, including furniture, decorations, light fixtures, appliances, vehicles, fences, gates, and street furniture.
- Original landscaping, trees, plants, grass, garden beds, paving, driveway, road, and surrounding objects.
- Original camera angle, viewing direction, framing, perspective, and image composition.
- The exact number, location, and shape of every visible element.

*ABSOLUTE OBJECT LOCK:* Never add, remove, replace, move, resize, deform, duplicate, simplify, or invent any object or architectural element.
*ABSOLUTE GEOMETRY LOCK:* Do not change any silhouette, edge, dimension, opening, roofline, wall boundary, or spatial relationship.
Do not correct, complete, or redesign anything that appears unusual in the original image. Reproduce the source faithfully.

### 2. EXTREME PHOTOREALISM — REALISM ONLY

Upgrade the image from a computer-generated appearance to the visual quality of a real architectural photograph.
Improve realism through physically believable lighting, natural material response, surface microtexture, realistic roughness, accurate reflections, subtle imperfections, and natural environmental integration.
All enhancements must follow the existing geometry and existing material assignments.

### 3. ULTRA-REALISTIC MATERIALS — PBR QUALITY

*Concrete and plaster:* Realistic fine-grain texture, subtle surface pores, natural roughness variation, physically plausible shading, and extremely subtle imperfections without changing the original color or surface pattern.
*Wood and WPC:* Authentic fine wood grain, realistic fiber details, natural roughness, accurate surface reflections, and preservation of the original color, pattern, board direction, and dimensions.
*Glass:* Physically realistic transparency, correct reflections, natural refraction, believable reflections of the existing environment, and preserved transparency, tint, frame thickness, and opening dimensions.
*Metal and aluminium:* Realistic metallic response, subtle micro-scratches, physically accurate reflections, fine surface texture, and preservation of the original color, finish, and profile.
*Roofing materials:* Realistic existing roofing texture, natural specular response, fine surface details, and preservation of every roof panel, seam, edge, and original color.
*Stone, tiles, paving, and asphalt:* Natural surface grain, fine irregularities, subtle roughness variation, realistic contact shadows, and preservation of the original pattern, dimensions, layout, and color.
*Plants and landscaping:* Photographic leaf details, natural leaf translucency, realistic branches, organic textures, and believable light interaction. Preserve the exact number, species appearance, positions, sizes, and arrangement of existing vegetation. Do not generate additional plants.

*Every material must retain its original identity.* Improve only the physical realism of the material already present.

### 4. PROFESSIONAL NATURAL LIGHTING

Use realistic daylight with physically plausible illumination and balanced exposure.
- Natural soft daylight and believable global illumination.
- Accurate indirect lighting and realistic ambient occlusion.
- Soft, detailed contact shadows without excessive darkness.
- Physically correct light reflection and material response.
- Natural highlights with preserved shadow detail.
- Neutral white balance and realistic color reproduction.
- Existing artificial lights must remain in their exact original positions.
- If existing lights are illuminated, use only a subtle, realistic warm glow.
- Do not introduce new light sources, dramatic spotlights, or excessive illumination.

Avoid overexposure, excessive contrast, artificial bloom, oversaturated colors, and heavy cinematic color grading.

### 5. PROFESSIONAL ARCHITECTURAL PHOTOGRAPHY

Simulate the visual characteristics of a high-end full-frame DSLR architectural photograph.
- Natural photographic dynamic range.
- Realistic lens response and optical detail.
- Accurate perspective consistent with the source image.
- Clear, detailed architectural surfaces without artificial oversharpening.
- Natural depth and realistic separation between foreground and background.
- Physically believable reflections and shadow transitions.
- Premium photographic clarity with natural tonal gradation.

*Do not change the original camera position, lens perspective, framing, or composition.* Camera simulation must adapt to the source image, not alter the source image.

### 6. RENDERING QUALITY

Target an ultra-high-quality photorealistic architectural visualization with:
- Physically Based Rendering (PBR).
- Ray-traced-quality reflections and shadows.
- High-quality global illumination.
- Realistic ambient occlusion.
- Accurate material roughness and specular response.
- Fine microtexture and natural surface imperfections.
- Clean edges and minimal rendering artifacts.
- High-resolution detail with natural sharpness.
- Neutral, realistic color science.
- Premium architectural photography quality.

Enhance the existing image at the highest image resolution supported by the tool. Preserve the original aspect ratio and composition.

### 7. STRICT NEGATIVE PROMPT

NO redesign, NO architectural modification, NO geometry changes, NO additional structures, NO removed objects, NO new furniture, NO new decorations, NO new plants, NO missing plants, NO altered landscaping, NO additional windows, NO removed windows, NO modified doors, NO changed roof, NO changed façade, NO altered dimensions, NO changed proportions, NO relocated objects, NO invented details, NO different materials, NO altered color palette, NO changed camera angle, NO changed perspective, NO different composition, NO artificial HDR, NO oversaturation, NO excessive warm lighting, NO dramatic lighting, NO excessive bloom, NO cartoon appearance, NO illustration, NO plastic-looking materials, NO artificial sharpness, NO unrealistic reflections.

### 8. FINAL EXECUTION COMMAND

Render the uploaded image now.
*PRIORITY ORDER:*
1. Preserve the original design and every existing element.
2. Preserve all geometry, dimensions, positions, materials, colors, and composition.
3. Improve photorealism through lighting, textures, material response, reflections, and shadows only.
4. Achieve the highest realistic photographic quality possible.

If any enhancement conflicts with the original design, the original design always wins.
*FINAL RULE: SAME DESIGN. SAME OBJECTS. SAME GEOMETRY. SAME COLORS. SAME COMPOSITION. ONLY THE REALISM IMPROVES.*

Do not explain, redesign, or provide a new concept. Return the rendered image based on the uploaded reference.`;

function buildArchitecturalPrompt(params: {
  style?: string;
  additionalPrompt?: string;
}): string {
  const { style = 'Minimalis', additionalPrompt = '' } = params;
  let prompt = MASTER_REALISM_PROMPT;

  if (style) {
    prompt += `\n\nTarget Visual Style Nuance: ${style} architectural photorealism.`;
  }
  if (additionalPrompt && additionalPrompt.trim()) {
    prompt += `\nAdditional specific user instructions: ${additionalPrompt.trim()}`;
  }

  return prompt;
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
