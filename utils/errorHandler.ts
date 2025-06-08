import { Alert } from 'react-native';

export interface AppError extends Error {
  code?: string;
  severity?: 'low' | 'medium' | 'high' | 'critical';
  context?: Record<string, any>;
}

export class ErrorHandler {
  static createError(
    message: string, 
    code?: string, 
    severity: AppError['severity'] = 'medium',
    context?: Record<string, any>
  ): AppError {
    const error = new Error(message) as AppError;
    error.code = code;
    error.severity = severity;
    error.context = context;
    return error;
  }

  static handleError(error: AppError | Error, showUserMessage = true): void {
    const appError = error as AppError;
    
    // Log error details
    console.error('Error occurred:', {
      message: error.message,
      code: appError.code,
      severity: appError.severity,
      context: appError.context,
      stack: error.stack,
    });

    // Show user-friendly message based on severity
    if (showUserMessage) {
      const userMessage = this.getUserMessage(appError);
      if (userMessage) {
        Alert.alert(
          this.getErrorTitle(appError.severity || 'medium'),
          userMessage,
          [{ text: 'OK' }]
        );
      }
    }

    // Report critical errors (in production, you might send to crash reporting service)
    if (appError.severity === 'critical') {
      this.reportCriticalError(appError);
    }
  }

  private static getUserMessage(error: AppError): string | null {
    const { code, severity } = error;

    // Return user-friendly messages based on error code
    switch (code) {
      case 'STORAGE_ERROR':
        return 'データの保存中にエラーが発生しました。アプリを再起動してください。';
      
      case 'NOTIFICATION_PERMISSION_DENIED':
        return '通知の許可が必要です。設定から通知を有効にしてください。';
      
      case 'NOTIFICATION_SCHEDULE_FAILED':
        return '通知の設定に失敗しました。タスクは作成されましたが、リマインダーが動作しない可能性があります。';
      
      case 'TASK_CREATE_FAILED':
        return 'タスクの作成に失敗しました。もう一度お試しください。';
      
      case 'TASK_UPDATE_FAILED':
        return 'タスクの更新に失敗しました。もう一度お試しください。';
      
      case 'TASK_DELETE_FAILED':
        return 'タスクの削除に失敗しました。もう一度お試しください。';
      
      case 'EXECUTION_COMPLETE_FAILED':
        return 'タスクの完了処理に失敗しました。もう一度お試しください。';
      
      case 'DATA_LOAD_FAILED':
        return 'データの読み込みに失敗しました。アプリを再起動してください。';
      
      case 'NETWORK_ERROR':
        return 'ネットワークエラーが発生しました。接続を確認してください。';
      
      default:
        // Only show generic message for medium and high severity errors
        if (severity === 'medium' || severity === 'high') {
          return '予期しないエラーが発生しました。もう一度お試しください。';
        }
        return null; // Don't show message for low severity errors
    }
  }

  private static getErrorTitle(severity: AppError['severity']): string {
    switch (severity) {
      case 'low':
        return '情報';
      case 'medium':
        return 'エラー';
      case 'high':
        return '重要なエラー';
      case 'critical':
        return '重大なエラー';
      default:
        return 'エラー';
    }
  }

  private static reportCriticalError(error: AppError): void {
    // In production, you would send this to a crash reporting service
    // like Sentry, Crashlytics, etc.
    console.error('CRITICAL ERROR REPORTED:', {
      message: error.message,
      code: error.code,
      context: error.context,
      stack: error.stack,
      timestamp: new Date().toISOString(),
    });
  }

  // Wrapper functions for common operations
  static async withErrorHandling<T>(
    operation: () => Promise<T>,
    context: string,
    showUserMessage = true
  ): Promise<T | null> {
    try {
      return await operation();
    } catch (error) {
      const appError = this.createError(
        `${context}: ${error instanceof Error ? error.message : 'Unknown error'}`,
        'OPERATION_FAILED',
        'medium',
        { context }
      );
      this.handleError(appError, showUserMessage);
      return null;
    }
  }

  static wrapWithErrorHandling<T extends any[], R>(
    fn: (...args: T) => Promise<R>,
    context: string,
    showUserMessage = true
  ) {
    return async (...args: T): Promise<R | null> => {
      return this.withErrorHandling(() => fn(...args), context, showUserMessage);
    };
  }
}

// Pre-defined error creators for common scenarios
export const createStorageError = (message: string, context?: Record<string, any>) =>
  ErrorHandler.createError(message, 'STORAGE_ERROR', 'high', context);

export const createNotificationError = (message: string, context?: Record<string, any>) =>
  ErrorHandler.createError(message, 'NOTIFICATION_SCHEDULE_FAILED', 'low', context);

export const createTaskError = (message: string, operation: string, context?: Record<string, any>) =>
  ErrorHandler.createError(message, `TASK_${operation.toUpperCase()}_FAILED`, 'medium', context);

export const createCriticalError = (message: string, context?: Record<string, any>) =>
  ErrorHandler.createError(message, 'CRITICAL_ERROR', 'critical', context);