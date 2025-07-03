/**
 * MediaRecorder and Canvas captureStream polyfills for better browser compatibility
 * This should be imported before any code that uses these features
 */

// Ensure this only runs in the browser
if (typeof window !== 'undefined') {
  // Helper function to detect browser type and version
  const detectBrowser = () => {
    const userAgent = navigator.userAgent.toLowerCase();
    if (userAgent.indexOf('edge') > -1) return 'edge';
    if (userAgent.indexOf('edg') > -1) return 'edge-chromium';
    if (userAgent.indexOf('opr') > -1) return 'opera';
    if (userAgent.indexOf('chrome') > -1) return 'chrome';
    if (userAgent.indexOf('firefox') > -1) return 'firefox';
    if (userAgent.indexOf('safari') > -1) return 'safari';
    if (userAgent.indexOf('trident') > -1) return 'ie';
    return 'unknown';
  };
  
  const browser = detectBrowser();
  
  // Canvas.captureStream polyfill for Safari
  if (!HTMLCanvasElement.prototype.captureStream) {
    console.log('Canvas.captureStream not supported in this browser, attempting polyfill');
    try {
      // Try to use the browser-specific version if available
      const canvas = document.createElement('canvas');
      // Use any to bypass TypeScript checking as webkitCaptureStream is vendor-specific
      const anyCanvas = canvas as any;
      
      if (anyCanvas.webkitCaptureStream) {
        HTMLCanvasElement.prototype.captureStream = function(frameRate) {
          // Use any to access non-standard property
          return (this as any).webkitCaptureStream(frameRate);
        };
        console.log('Using webkit prefixed version of captureStream');
      } else {
        console.warn('No captureStream alternative available for this browser');
      }
    } catch (e) {
      console.error('Failed to create captureStream polyfill', e);
    }
  }
  
  // MediaRecorder polyfill for Safari and older browsers
  if (typeof window.MediaRecorder === 'undefined') {
    console.warn('MediaRecorder not supported in this browser');
    
    // Import polyfill dynamically only if needed
    // Note: In a real app, you'd need to install and bundle the polyfill library
    // For example: npm install media-recorder-js
    
    // Mock implementation for type safety
    // This won't actually work but prevents errors
    window.MediaRecorder = class MockMediaRecorder {
      static isTypeSupported() {
        return false;
      }
      
      constructor() {
        console.error('MediaRecorder is not supported in this browser');
        throw new Error('MediaRecorder is not supported in this browser');
      }
      
      // Basic mock methods
      start() {}
      stop() {}
      pause() {}
      resume() {}
    } as any;
  }
}

export default {};
