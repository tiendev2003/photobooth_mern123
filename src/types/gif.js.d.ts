declare module 'gif.js' {
  export interface GIFOptions {
    workers?: number;
    quality?: number;
    width?: number;
    height?: number;
    workerScript?: string;
    background?: string;
    transparent?: string | null;
    dither?: boolean;
    debug?: boolean;
    repeat?: number;  // Add the repeat property
  }
  
  export default class GIF {
    constructor(options: GIFOptions);
    on(event: 'finished', callback: (blob: Blob) => void): void;
    on(event: 'progress', callback: (progress: number) => void): void;
    on(event: string, callback: (...args: unknown[]) => void): void;
    render(): void;
    abort(): void;
    addFrame(imageElement: HTMLImageElement | HTMLCanvasElement, options?: {delay?: number, copy?: boolean, dispose?: number}): void;
  }
}
