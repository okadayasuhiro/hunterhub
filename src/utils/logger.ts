/**
 * 本番最適化: 環境別ログ制御ユーティリティ
 * 開発環境では詳細ログ、本番環境では必要最小限のログのみ出力
 */

export enum LogLevel {
  ERROR = 0,
  WARN = 1,
  INFO = 2,
  DEBUG = 3
}

class Logger {
  private static instance: Logger;
  private logLevel: LogLevel;

  private constructor() {
    // 本番環境では ERROR と WARN のみ
    // 開発環境では全てのログレベル
    this.logLevel = import.meta.env.PROD ? LogLevel.WARN : LogLevel.DEBUG;
  }

  public static getInstance(): Logger {
    if (!Logger.instance) {
      Logger.instance = new Logger();
    }
    return Logger.instance;
  }

  /**
   * エラーログ（本番でも出力）
   */
  public error(message: string, ...args: any[]): void {
    if (this.logLevel >= LogLevel.ERROR) {
      console.error(`❌ ${message}`, ...args);
    }
  }

  /**
   * 警告ログ（本番でも出力）
   */
  public warn(message: string, ...args: any[]): void {
    if (this.logLevel >= LogLevel.WARN) {
      console.warn(`⚠️ ${message}`, ...args);
    }
  }

  /**
   * 情報ログ（開発環境のみ）
   */
  public info(message: string, ...args: any[]): void {
    if (this.logLevel >= LogLevel.INFO) {
      console.log(`ℹ️ ${message}`, ...args);
    }
  }

  /**
   * デバッグログ（開発環境のみ）
   */
  public debug(message: string, ...args: any[]): void {
    if (this.logLevel >= LogLevel.DEBUG) {
      console.log(`🔍 ${message}`, ...args);
    }
  }

  /**
   * パフォーマンスログ（開発環境のみ）
   */
  public perf(message: string, duration?: number, ...args: any[]): void {
    if (this.logLevel >= LogLevel.DEBUG) {
      const perfMessage = duration !== undefined 
        ? `${message} (${duration.toFixed(2)}ms)` 
        : message;
      console.log(`🚀 ${perfMessage}`, ...args);
    }
  }

  /**
   * 成功ログ（開発環境のみ）
   */
  public success(message: string, ...args: any[]): void {
    if (this.logLevel >= LogLevel.DEBUG) {
      console.log(`✅ ${message}`, ...args);
    }
  }

  /**
   * 条件付きログ（開発環境のみ）
   */
  public devOnly(callback: () => void): void {
    if (import.meta.env.DEV) {
      callback();
    }
  }
}

// シングルトンインスタンスをエクスポート
export const logger = Logger.getInstance();

// 便利な関数エクスポート
export const logError = (message: string, ...args: any[]) => logger.error(message, ...args);
export const logWarn = (message: string, ...args: any[]) => logger.warn(message, ...args);
export const logInfo = (message: string, ...args: any[]) => logger.info(message, ...args);
export const logDebug = (message: string, ...args: any[]) => logger.debug(message, ...args);
export const logPerf = (message: string, duration?: number, ...args: any[]) => logger.perf(message, duration, ...args);
export const logSuccess = (message: string, ...args: any[]) => logger.success(message, ...args);
export const devOnly = (callback: () => void) => logger.devOnly(callback);
