import type { Stage, ServiceError as ServiceErrorType } from '@/types/api';

export type ErrorCode =
  | 'VALIDATION'
  | 'GEMINI'
  | 'IMAGE_PROCESSING'
  | 'EXPORT'
  | 'CANCELLED'
  | 'UNKNOWN';

export class ServiceError extends Error implements ServiceErrorType {
  readonly code: ErrorCode;
  readonly stage?: Stage;
  readonly retryable: boolean;
  readonly details?: unknown;

  constructor(params: {
    code: ErrorCode;
    message: string;
    stage?: Stage;
    retryable?: boolean;
    details?: unknown;
  }) {
    super(params.message);
    this.name = 'ServiceError';
    this.code = params.code;
    this.stage = params.stage;
    this.retryable = params.retryable ?? false;
    this.details = params.details;
  }
}

export function normalizeError(error: unknown, stage?: Stage): ServiceError {
  if (error instanceof ServiceError) {
    return error;
  }

  if (error instanceof Error) {
    const message = error.message.toLowerCase();

    if (message.includes('api key') || message.includes('unauthorized') || message.includes('401')) {
      return new ServiceError({
        code: 'GEMINI',
        message: 'Invalid or missing API key',
        stage,
        retryable: false,
        details: error,
      });
    }

    if (message.includes('429') || message.includes('rate limit') || message.includes('quota')) {
      return new ServiceError({
        code: 'GEMINI',
        message: 'Rate limit exceeded. Please wait and try again.',
        stage,
        retryable: true,
        details: error,
      });
    }

    if (message.includes('5') && (message.includes('server') || message.includes('internal'))) {
      return new ServiceError({
        code: 'GEMINI',
        message: 'Gemini server error. Please retry.',
        stage,
        retryable: true,
        details: error,
      });
    }

    if (message.includes('network') || message.includes('fetch') || message.includes('timeout')) {
      return new ServiceError({
        code: 'GEMINI',
        message: 'Network error. Check your connection.',
        stage,
        retryable: true,
        details: error,
      });
    }

    if (message.includes('validation') || message.includes('invalid')) {
      return new ServiceError({
        code: 'VALIDATION',
        message: error.message,
        stage,
        retryable: false,
        details: error,
      });
    }

    return new ServiceError({
      code: 'UNKNOWN',
      message: error.message,
      stage,
      retryable: false,
      details: error,
    });
  }

  return new ServiceError({
    code: 'UNKNOWN',
    message: String(error),
    stage,
    retryable: false,
    details: error,
  });
}
