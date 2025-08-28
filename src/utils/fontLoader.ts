/**
 * PSI最適化: Web Font Loader（代替実装）
 * Google Fontsの非同期読み込みでレンダリングブロック完全解消
 */

interface FontLoadOptions {
  family: string;
  weights: string[];
  display?: 'auto' | 'block' | 'swap' | 'fallback' | 'optional';
}

class FontLoader {
  private static instance: FontLoader;
  private loadedFonts: Set<string> = new Set();

  private constructor() {}

  public static getInstance(): FontLoader {
    if (!FontLoader.instance) {
      FontLoader.instance = new FontLoader();
    }
    return FontLoader.instance;
  }

  /**
   * Google Fontsを非同期で読み込み
   */
  public async loadGoogleFont(options: FontLoadOptions): Promise<void> {
    const { family, weights, display = 'swap' } = options;
    const fontKey = `${family}-${weights.join(',')}`;

    // 既に読み込み済みの場合はスキップ
    if (this.loadedFonts.has(fontKey)) {
      return;
    }

    try {
      // CSS URLを構築
      const weightsParam = weights.join(';');
      const fontUrl = `https://fonts.googleapis.com/css2?family=${encodeURIComponent(family)}:wght@${weightsParam}&display=${display}`;

      // 非同期でCSSを読み込み
      await this.loadCSS(fontUrl);
      
      // フォントの実際の読み込みを待機
      await this.waitForFontLoad(family);
      
      this.loadedFonts.add(fontKey);
      
      if (import.meta.env.DEV) {
        console.log(`✅ Font loaded: ${family}`);
      }
    } catch (error) {
      console.error(`❌ Failed to load font: ${family}`, error);
    }
  }

  /**
   * CSSファイルを非同期で読み込み
   */
  private loadCSS(url: string): Promise<void> {
    return new Promise((resolve, reject) => {
      const link = document.createElement('link');
      link.rel = 'stylesheet';
      link.href = url;
      
      link.onload = () => resolve();
      link.onerror = () => reject(new Error(`Failed to load CSS: ${url}`));
      
      document.head.appendChild(link);
    });
  }

  /**
   * フォントの読み込み完了を待機
   */
  private waitForFontLoad(family: string): Promise<void> {
    return new Promise((resolve) => {
      // Font Loading APIが利用可能な場合
      if ('fonts' in document) {
        document.fonts.ready.then(() => {
          resolve();
        });
      } else {
        // フォールバック: 一定時間待機
        setTimeout(() => {
          resolve();
        }, 100);
      }
    });
  }

  /**
   * 複数フォントの一括読み込み
   */
  public async loadMultipleFonts(fontOptions: FontLoadOptions[]): Promise<void> {
    const loadPromises = fontOptions.map(options => this.loadGoogleFont(options));
    await Promise.all(loadPromises);
  }
}

// シングルトンインスタンスをエクスポート
export const fontLoader = FontLoader.getInstance();

// 便利な関数エクスポート
export const loadNotoSansJP = () => fontLoader.loadGoogleFont({
  family: 'Noto Sans JP',
  weights: ['400', '500', '600', '700'],
  display: 'swap'
});

// アプリケーション初期化時のフォント読み込み
export const initializeFonts = async (): Promise<void> => {
  try {
    await loadNotoSansJP();
  } catch (error) {
    console.error('Font initialization failed:', error);
  }
};
