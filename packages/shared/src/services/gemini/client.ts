import { GoogleGenAI, type GenerateContentParameters } from '@google/genai';
import { getApiKey } from '@/services/config/apiKeyManager';
import { GEMINI_MODELS } from '@/constants/gemini';
import { ServiceError } from '@/utils/errors';

function getAI(apiKey?: string): GoogleGenAI {
  const key = apiKey ?? getApiKey();
  if (!key) {
    throw new ServiceError({
      code: 'GEMINI',
      message: 'Gemini API key is not configured. Please set your API key first.',
      retryable: false,
    });
  }
  return new GoogleGenAI({ apiKey: key });
}

type GenerateParams = Omit<GenerateContentParameters, 'model'>;

export async function generateContentWithFallback(
  primaryModel: string,
  fallbackModel: string,
  params: GenerateParams,
  apiKey?: string,
) {
  const ai = getAI(apiKey);

  try {
    return await ai.models.generateContent({
      model: primaryModel,
      ...params,
    });
  } catch (error) {
    console.warn(`Model ${primaryModel} failed, retrying with ${fallbackModel}`, error);

    const fallbackParams: Record<string, unknown> = { ...params };

    // gemini-2.5-flash-image has limited config support — strip unsupported fields
    if (fallbackModel === GEMINI_MODELS.IMAGE_FALLBACK) {
      const config = fallbackParams['config'] as Record<string, unknown> | undefined;
      if (config) {
        const imageConfig = config['imageConfig'] as Record<string, unknown> | undefined;
        if (imageConfig) {
          const { imageSize: _unused, ...restImageConfig } = imageConfig; // eslint-disable-line @typescript-eslint/no-unused-vars
          config['imageConfig'] = restImageConfig;
        }
        delete config['responseMimeType'];
        delete config['responseSchema'];
      }
    }

    // gemini-2.5-flash doesn't support aspectRatio/imageSize in imageConfig
    if (fallbackModel === GEMINI_MODELS.FLASH_FALLBACK) {
      const config = fallbackParams['config'] as Record<string, unknown> | undefined;
      if (config) {
        const imageConfig = config['imageConfig'] as Record<string, unknown> | undefined;
        if (imageConfig) {
          const { imageSize: _a, aspectRatio: _b, ...restImageConfig } = imageConfig; // eslint-disable-line @typescript-eslint/no-unused-vars
          if (Object.keys(restImageConfig).length > 0) {
            config['imageConfig'] = restImageConfig;
          } else {
            delete config['imageConfig'];
          }
        }
      }
    }

    return await ai.models.generateContent({
      model: fallbackModel,
      ...(fallbackParams as GenerateParams),
    });
  }
}

export async function generateText(params: GenerateParams, apiKey?: string) {
  return generateContentWithFallback(
    GEMINI_MODELS.TEXT_PRIMARY,
    GEMINI_MODELS.TEXT_FALLBACK,
    params,
    apiKey,
  );
}

export async function generateImage(params: GenerateParams, apiKey?: string) {
  return generateContentWithFallback(
    GEMINI_MODELS.IMAGE_PRIMARY,
    GEMINI_MODELS.IMAGE_FALLBACK,
    params,
    apiKey,
  );
}

export async function generateWithFlash(params: GenerateParams, apiKey?: string) {
  return generateContentWithFallback(
    GEMINI_MODELS.FLASH_PRIMARY,
    GEMINI_MODELS.FLASH_FALLBACK,
    params,
    apiKey,
  );
}
