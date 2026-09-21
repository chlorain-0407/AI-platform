import { GoogleGenAI, Type } from '@google/genai';

let aiClient: GoogleGenAI | null = null;

/**
 * Returns a lazily-initialized GoogleGenAI client singleton.
 */
export function getGenAI(): GoogleGenAI | null {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return null;
  }
  if (!aiClient) {
    aiClient = new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        },
      },
    });
  }
  return aiClient;
}

/**
 * Standard supported models in order of priority and availability.
 * 'gemini-3.1-flash-lite' is the lightweight, ultra-low latency, high-stability tier.
 * 'gemini-flash-latest' automatically routes to latest stable flash capacity.
 * 'gemini-3.8-flash' is the standard high-fidelity model.
 * Note: 'gemini-3.6-flash' and older 1.5/2.0 models are obsolete/deprecated and excluded.
 */
export const ALLOWED_MODELS = [
  'gemini-3.1-flash-lite',
  'gemini-flash-latest',
  'gemini-3.8-flash',
] as const;

/**
 * Normalizes user/db-stored model names to valid active models.
 * Defaults to 'gemini-3.1-flash-lite' for peak stability.
 */
export function normalizeModelName(model?: string): string {
  if (!model) return 'gemini-3.1-flash-lite';
  const clean = model.trim().toLowerCase();

  // Replace obsolete or deprecated models with stable flash aliases
  if (clean === 'gemini-3.6-flash' || clean.startsWith('gemini-1.5') || clean.startsWith('gemini-2.0')) {
    return 'gemini-3.1-flash-lite';
  }
  if (clean === 'gemini-flash' || clean === 'flash') {
    return 'gemini-flash-latest';
  }
  if (clean === 'gemini-lite' || clean === 'flash-lite' || clean === 'gemini-3.1-flash-lite') {
    return 'gemini-3.1-flash-lite';
  }
  if (clean === 'gemini-3.8-flash' || clean === 'gemini-flash-latest') {
    return clean;
  }

  return 'gemini-3.1-flash-lite';
}

interface GenerateGeminiOptions {
  prompt: string;
  systemInstruction?: string;
  responseSchema?: any;
  responseMimeType?: string;
  preferredModel?: string;
  temperature?: number;
}

interface GenerateGeminiResult<T = any> {
  data: T;
  rawText: string;
  usedModel: string;
}

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function isTransientError(err: any): boolean {
  if (!err) return false;
  const status = err.status || err.code || err?.error?.code || err?.error?.status;
  const message = (err.message || JSON.stringify(err)).toLowerCase();
  
  return (
    status === 503 ||
    status === 'UNAVAILABLE' ||
    status === 429 ||
    status === 'RESOURCE_EXHAUSTED' ||
    message.includes('503') ||
    message.includes('unavailable') ||
    message.includes('high demand') ||
    message.includes('rate limit') ||
    message.includes('quota') ||
    message.includes('econnreset') ||
    message.includes('etimedout')
  );
}

/**
 * Calls Gemini API with automatic model failover and retry on 503 high-demand spikes.
 */
export async function generateContentWithFallback<T = any>(
  options: GenerateGeminiOptions
): Promise<GenerateGeminiResult<T> | null> {
  const ai = getGenAI();
  if (!ai) {
    return null;
  }

  const {
    prompt,
    systemInstruction,
    responseSchema,
    responseMimeType = 'application/json',
    preferredModel,
    temperature = 0.7,
  } = options;

  // Build candidate models list: prioritize gemini-3.1-flash-lite for peak availability and stability
  const candidateSet = new Set<string>();
  if (preferredModel) {
    candidateSet.add(normalizeModelName(preferredModel));
  }
  candidateSet.add('gemini-3.1-flash-lite');
  candidateSet.add('gemini-flash-latest');
  candidateSet.add('gemini-3.8-flash');

  const candidateModels = Array.from(candidateSet);

  for (const model of candidateModels) {
    let attempts = 0;
    const maxAttemptsForModel = 2; // Try once, retry once if 503

    while (attempts < maxAttemptsForModel) {
      attempts++;
      try {
        const config: Record<string, any> = {
          responseMimeType,
          temperature,
        };

        if (systemInstruction) {
          config.systemInstruction = systemInstruction;
        }

        if (responseSchema) {
          config.responseSchema = responseSchema;
        }

        const response = await ai.models.generateContent({
          model,
          contents: prompt,
          config,
        });

        const rawText = response.text?.trim() || '';
        if (!rawText) {
          throw new Error('Empty response from model');
        }

        let parsedData: any = rawText;
        if (responseMimeType === 'application/json') {
          try {
            parsedData = JSON.parse(rawText);
          } catch {
            // Strip markdown code fences if model enclosed JSON in ```json
            const cleaned = rawText
              .replace(/^```(?:json)?\s*/i, '')
              .replace(/\s*```$/i, '')
              .trim();
            parsedData = JSON.parse(cleaned);
          }
        }

        return {
          data: parsedData as T,
          rawText,
          usedModel: model,
        };
      } catch (err: any) {
        const isTransient = isTransientError(err);
        if (isTransient && attempts < maxAttemptsForModel) {
          // Wait 600ms before retrying the same model
          console.log(`[Gemini] Model ${model} is experiencing high demand (503), retrying in 600ms...`);
          await sleep(600);
          continue;
        }

        if (isTransient) {
          console.log(`[Gemini] Model ${model} unavailable due to demand spikes, switching to fallback model...`);
        } else {
          console.log(`[Gemini] Model ${model} returned error, attempting fallback model...`);
        }
        break; // Advance to next model in candidateModels
      }
    }
  }

  return null;
}
