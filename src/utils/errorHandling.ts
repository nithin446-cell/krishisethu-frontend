/**
 * Centralized error handling utilities
 */
import React from 'react';

export interface AppError {
  code: string;
  message: string;
  details?: any;
  timestamp: Date;
  userId?: string;
  context?: string;
}

export class CustomError extends Error {
  code: string;
  details?: any;
  context?: string;

  constructor(code: string, message: string, details?: any, context?: string) {
    super(message);
    this.name = 'CustomError';
    this.code = code;
    this.details = details;
    this.context = context;
  }
}

/**
 * Error codes for different types of errors
 */
export const ERROR_CODES = {
  // Authentication errors
  AUTH_FAILED: 'AUTH_FAILED',
  AUTH_EXPIRED: 'AUTH_EXPIRED',
  AUTH_REQUIRED: 'AUTH_REQUIRED',
  
  // Network errors
  NETWORK_ERROR: 'NETWORK_ERROR',
  API_ERROR: 'API_ERROR',
  TIMEOUT_ERROR: 'TIMEOUT_ERROR',
  
  // Validation errors
  VALIDATION_ERROR: 'VALIDATION_ERROR',
  INVALID_INPUT: 'INVALID_INPUT',
  MISSING_REQUIRED_FIELD: 'MISSING_REQUIRED_FIELD',
  
  // Business logic errors
  INSUFFICIENT_FUNDS: 'INSUFFICIENT_FUNDS',
  PRODUCE_NOT_AVAILABLE: 'PRODUCE_NOT_AVAILABLE',
  BID_TOO_LOW: 'BID_TOO_LOW',
  
  // System errors
  UNKNOWN_ERROR: 'UNKNOWN_ERROR',
  SERVER_ERROR: 'SERVER_ERROR',
  DATABASE_ERROR: 'DATABASE_ERROR'
} as const;

/**
 * Error messages in multiple languages
 */
export const ERROR_MESSAGES = {
  en: {
    [ERROR_CODES.AUTH_FAILED]: 'Authentication failed. Please check your credentials.',
    [ERROR_CODES.AUTH_EXPIRED]: 'Your session has expired. Please login again.',
    [ERROR_CODES.AUTH_REQUIRED]: 'Please login to continue.',
    [ERROR_CODES.NETWORK_ERROR]: 'Network error. Please check your connection.',
    [ERROR_CODES.API_ERROR]: 'Server error. Please try again later.',
    [ERROR_CODES.VALIDATION_ERROR]: 'Please check your input and try again.',
    [ERROR_CODES.PRODUCE_NOT_AVAILABLE]: 'This produce is no longer available.',
    [ERROR_CODES.BID_TOO_LOW]: 'Your bid is too low. Please increase your bid amount.',
    [ERROR_CODES.UNKNOWN_ERROR]: 'An unexpected error occurred. Please try again.'
  },
  hi: {
    [ERROR_CODES.AUTH_FAILED]: 'प्रमाणीकरण असफल। कृपया अपनी जानकारी जांचें।',
    [ERROR_CODES.AUTH_EXPIRED]: 'आपका सत्र समाप्त हो गया है। कृपया फिर से लॉगिन करें।',
    [ERROR_CODES.AUTH_REQUIRED]: 'जारी रखने के लिए कृपया लॉगिन करें।',
    [ERROR_CODES.NETWORK_ERROR]: 'नेटवर्क त्रुटि। कृपया अपना कनेक्शन जांचें।',
    [ERROR_CODES.API_ERROR]: 'सर्वर त्रुटि। कृपया बाद में पुनः प्रयास करें।',
    [ERROR_CODES.VALIDATION_ERROR]: 'कृपया अपना इनपुट जांचें और पुनः प्रयास करें।',
    [ERROR_CODES.PRODUCE_NOT_AVAILABLE]: 'यह फसल अब उपलब्ध नहीं है।',
    [ERROR_CODES.BID_TOO_LOW]: 'आपकी बोली बहुत कम है। कृपया अपनी बोली राशि बढ़ाएं।',
    [ERROR_CODES.UNKNOWN_ERROR]: 'एक अप्रत्याशित त्रुटि हुई। कृपया पुनः प्रयास करें।'
  }
};

/**
 * Log error to monitoring service
 */
export const logError = (error: AppError) => {
  // In production, send to error monitoring service like Sentry
  if (process.env.NODE_ENV === 'production') {
    // Sentry.captureException(error);
    console.error('Production Error:', error);
  } else {
    console.error('Development Error:', error);
  }
  
  // Store in local storage for debugging
  const errorLog = JSON.parse(localStorage.getItem('errorLog') || '[]');
  errorLog.push(error);
  
  // Keep only last 50 errors
  if (errorLog.length > 50) {
    errorLog.splice(0, errorLog.length - 50);
  }
  
  localStorage.setItem('errorLog', JSON.stringify(errorLog));
};

/**
 * Create standardized error object
 */
export const createError = (
  code: string,
  message?: string,
  details?: any,
  context?: string
): AppError => {
  return {
    code,
    message: message || 'An error occurred',
    details,
    timestamp: new Date(),
    context
  };
};

/**
 * Handle API errors consistently
 */
export const handleAPIError = (error: any, context?: string): AppError => {
  let appError: AppError;
  
  if (error.response) {
    // Server responded with error status
    const status = error.response.status;
    const data = error.response.data;
    
    switch (status) {
      case 401:
        appError = createError(ERROR_CODES.AUTH_FAILED, 'Unauthorized access', data, context);
        break;
      case 403:
        appError = createError(ERROR_CODES.AUTH_REQUIRED, 'Access forbidden', data, context);
        break;
      case 422:
        appError = createError(ERROR_CODES.VALIDATION_ERROR, 'Validation failed', data, context);
        break;
      case 500:
        appError = createError(ERROR_CODES.SERVER_ERROR, 'Internal server error', data, context);
        break;
      default:
        appError = createError(ERROR_CODES.API_ERROR, `API Error: ${status}`, data, context);
    }
  } else if (error.request) {
    // Network error
    appError = createError(ERROR_CODES.NETWORK_ERROR, 'Network connection failed', error.request, context);
  } else {
    // Unknown error
    appError = createError(ERROR_CODES.UNKNOWN_ERROR, error.message, error, context);
  }
  
  logError(appError);
  return appError;
};

/**
 * Get user-friendly error message
 */
export const getErrorMessage = (error: AppError, language: 'en' | 'hi' = 'en'): string => {
  const messages = ERROR_MESSAGES[language];
  return messages[error.code as keyof typeof messages] || error.message || 'An error occurred';
};

/**
 * React hook for error handling
 */
export const useErrorHandler = () => {
  const [error, setError] = React.useState<AppError | null>(null);
  
  const handleError = React.useCallback((error: any, context?: string) => {
    const appError = error instanceof CustomError 
      ? createError(error.code, error.message, error.details, context)
      : handleAPIError(error, context);
    
    setError(appError);
  }, []);
  
  const clearError = React.useCallback(() => {
    setError(null);
  }, []);
  
  return { error, handleError, clearError };
};