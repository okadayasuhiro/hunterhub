/**
 * ブラウザフィンガープリント生成ユーティリティ
 * 会員登録なしでユーザーを一意識別するためのフィンガープリント生成
 */

export interface FingerprintData {
  userAgent: string;
  language: string;
  languages: string[];
  timezone: string;
  screenResolution: string;
  screenColorDepth: number;
  screenPixelDepth: number;
  availableScreenSize: string;
  platform: string;
  hardwareConcurrency: number;
  deviceMemory?: number;
  canvasFingerprint: string;
  webglFingerprint: string;
  audioFingerprint: string;
  persistentId: string;
  timestamp: string;
}

export class BrowserFingerprint {
  private static instance: BrowserFingerprint;
  
  public static getInstance(): BrowserFingerprint {
    if (!BrowserFingerprint.instance) {
      BrowserFingerprint.instance = new BrowserFingerprint();
    }
    return BrowserFingerprint.instance;
  }

  /**
   * 完全なフィンガープリントデータを生成
   */
  public async generateFingerprint(): Promise<FingerprintData> {
    const fingerprint: FingerprintData = {
      // 基本ブラウザ情報
      userAgent: navigator.userAgent,
      language: navigator.language,
      languages: navigator.languages ? Array.from(navigator.languages) : [],
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      
      // 画面・デバイス情報
      screenResolution: `${screen.width}x${screen.height}`,
      screenColorDepth: screen.colorDepth,
      screenPixelDepth: screen.pixelDepth,
      availableScreenSize: `${screen.availWidth}x${screen.availHeight}`,
      platform: navigator.platform,
      hardwareConcurrency: navigator.hardwareConcurrency || 0,
      deviceMemory: (navigator as any).deviceMemory,
      
      // 高度なフィンガープリント
      canvasFingerprint: await this.generateCanvasFingerprint(),
      webglFingerprint: await this.generateWebGLFingerprint(),
      audioFingerprint: await this.generateAudioFingerprint(),
      
      // 永続ID
      persistentId: this.getPersistentId(),
      timestamp: new Date().toISOString()
    };

    return fingerprint;
  }

  /**
   * フィンガープリントデータをハッシュ化してユーザーIDを生成
   */
  public async hashFingerprint(fingerprint: FingerprintData): Promise<string> {
    // 重要なフィールドのみを使用してハッシュ生成
    const keyFields = {
      userAgent: fingerprint.userAgent,
      timezone: fingerprint.timezone,
      screenResolution: fingerprint.screenResolution,
      canvasFingerprint: fingerprint.canvasFingerprint,
      webglFingerprint: fingerprint.webglFingerprint,
      persistentId: fingerprint.persistentId
    };

    const dataString = JSON.stringify(keyFields);
    const encoder = new TextEncoder();
    const data = encoder.encode(dataString);
    
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
    
    return hashHex;
  }

  /**
   * Canvas指紋生成
   */
  private async generateCanvasFingerprint(): Promise<string> {
    try {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      if (!ctx) return 'no-canvas';

      canvas.width = 200;
      canvas.height = 50;

      // 複雑な描画でブラウザ・デバイス固有の差異を検出
      ctx.textBaseline = 'top';
      ctx.font = '14px Arial';
      ctx.fillStyle = '#f60';
      ctx.fillRect(125, 1, 62, 20);
      ctx.fillStyle = '#069';
      ctx.fillText('HunterHub 🎯 Canvas', 2, 15);
      ctx.fillStyle = 'rgba(102, 204, 0, 0.7)';
      ctx.fillText('フィンガープリント', 4, 45);

      // グラデーション追加
      const gradient = ctx.createLinearGradient(0, 0, 200, 50);
      gradient.addColorStop(0, 'red');
      gradient.addColorStop(1, 'blue');
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 25, 200, 25);

      const dataURL = canvas.toDataURL();
      return await this.simpleHash(dataURL);
    } catch (error) {
      console.warn('Canvas fingerprint generation failed:', error);
      return 'canvas-error';
    }
  }

  /**
   * WebGL指紋生成
   */
  private async generateWebGLFingerprint(): Promise<string> {
    try {
      const canvas = document.createElement('canvas');
      const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl') as WebGLRenderingContext;
      if (!gl) return 'no-webgl';

      const debugInfo = gl.getExtension('WEBGL_debug_renderer_info');
      const vendor = debugInfo ? gl.getParameter(debugInfo.UNMASKED_VENDOR_WEBGL) : '';
      const renderer = debugInfo ? gl.getParameter(debugInfo.UNMASKED_RENDERER_WEBGL) : '';
      
      const webglInfo = {
        vendor: vendor || gl.getParameter(gl.VENDOR),
        renderer: renderer || gl.getParameter(gl.RENDERER),
        version: gl.getParameter(gl.VERSION),
        shadingLanguageVersion: gl.getParameter(gl.SHADING_LANGUAGE_VERSION),
        maxTextureSize: gl.getParameter(gl.MAX_TEXTURE_SIZE),
        maxViewportDims: gl.getParameter(gl.MAX_VIEWPORT_DIMS),
        extensions: gl.getSupportedExtensions()?.sort() || []
      };

      return await this.simpleHash(JSON.stringify(webglInfo));
    } catch (error) {
      console.warn('WebGL fingerprint generation failed:', error);
      return 'webgl-error';
    }
  }

  /**
   * Audio指紋生成
   */
  private async generateAudioFingerprint(): Promise<string> {
    try {
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      const oscillator = audioContext.createOscillator();
      const analyser = audioContext.createAnalyser();
      const gainNode = audioContext.createGain();
      const scriptProcessor = audioContext.createScriptProcessor(4096, 1, 1);

      oscillator.type = 'triangle';
      oscillator.frequency.setValueAtTime(10000, audioContext.currentTime);

      gainNode.gain.setValueAtTime(0, audioContext.currentTime);
      oscillator.connect(analyser);
      analyser.connect(scriptProcessor);
      scriptProcessor.connect(gainNode);
      gainNode.connect(audioContext.destination);

      oscillator.start(0);
      
      const audioData = new Uint8Array(analyser.frequencyBinCount);
      analyser.getByteFrequencyData(audioData);
      
      oscillator.stop();
      audioContext.close();

      const audioFingerprint = Array.from(audioData).slice(0, 50).join(',');
      return await this.simpleHash(audioFingerprint);
    } catch (error) {
      console.warn('Audio fingerprint generation failed:', error);
      return 'audio-error';
    }
  }

  /**
   * 永続IDの取得・生成
   */
  private getPersistentId(): string {
    const storageKey = 'hunterhub_persistent_id';
    let persistentId = localStorage.getItem(storageKey);
    
    if (!persistentId) {
      // UUID v4 形式の永続ID生成
      persistentId = 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
        const r = Math.random() * 16 | 0;
        const v = c === 'x' ? r : (r & 0x3 | 0x8);
        return v.toString(16);
      });
      
      localStorage.setItem(storageKey, persistentId);
    }
    
    return persistentId;
  }

  /**
   * 簡易ハッシュ関数
   */
  private async simpleHash(str: string): Promise<string> {
    const encoder = new TextEncoder();
    const data = encoder.encode(str);
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('').substring(0, 16);
  }

  /**
   * フィンガープリントの品質スコア計算
   */
  public calculateFingerprintQuality(fingerprint: FingerprintData): number {
    let score = 0;
    
    // 各要素の独自性スコア
    if (fingerprint.canvasFingerprint && fingerprint.canvasFingerprint !== 'canvas-error') score += 30;
    if (fingerprint.webglFingerprint && fingerprint.webglFingerprint !== 'webgl-error') score += 25;
    if (fingerprint.audioFingerprint && fingerprint.audioFingerprint !== 'audio-error') score += 20;
    if (fingerprint.screenResolution && fingerprint.screenResolution !== '0x0') score += 10;
    if (fingerprint.timezone) score += 5;
    if (fingerprint.languages.length > 0) score += 5;
    if (fingerprint.hardwareConcurrency > 0) score += 3;
    if (fingerprint.deviceMemory) score += 2;
    
    return Math.min(score, 100);
  }
}