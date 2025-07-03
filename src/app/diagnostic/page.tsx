"use client";

import { useEffect, useRef, useState } from 'react';

export default function MediaDiagnosticPage() {
  // State to store compatibility information
  const [compatInfo, setCompatInfo] = useState({
    mediaRecorderSupported: false,
    captureStreamSupported: false,
    webmSupported: false,
    mp4Supported: false,
    webpSupported: false,
    canvasSizeLimit: "Unknown"
  });
  
  // State to store test results
  const [testResults, setTestResults] = useState({
    canvasCreated: false,
    streamCreated: false,
    recorderCreated: false,
    recordingStarted: false,
    dataReceived: false,
    blobCreated: false,
    uploadAttempted: false,
    uploadSucceeded: false,
    error: ""
  });

  const canvasRef = useRef<HTMLCanvasElement>(null);
  
  // Check browser compatibility on load
  useEffect(() => {
    // Check MediaRecorder support
    const mediaRecorderSupported = typeof window !== 'undefined' && 
      'MediaRecorder' in window;
      
    // Check captureStream support
    let captureStreamSupported = false;
    try {
      const testCanvas = document.createElement('canvas');
      captureStreamSupported = !!testCanvas.captureStream;
    } catch (e) {
      console.error("Error testing captureStream:", e);
    }
    
    // Check codec support
    let webmSupported = false;
    let mp4Supported = false;
    let webpSupported = false;
    
    if (mediaRecorderSupported) {
      try {
        webmSupported = MediaRecorder.isTypeSupported('video/webm');
        mp4Supported = MediaRecorder.isTypeSupported('video/mp4');
        webpSupported = MediaRecorder.isTypeSupported('video/webp');
      } catch (e) {
        console.error("Error checking codec support:", e);
      }
    }
    
    // Try to determine canvas size limits
    let canvasSizeLimit = "Unknown";
    try {
      const testCanvas = document.createElement('canvas');
      let size = 1024;
      let success = true;
      
      while (success && size < 16384) {
        try {
          testCanvas.width = size;
          testCanvas.height = size;
          const ctx = testCanvas.getContext('2d');
          if (!ctx) break;
          ctx.fillRect(0, 0, 10, 10); // Test drawing
          size *= 2;
        } catch (e) {
          success = false;
        }
      }
      
      canvasSizeLimit = `${size / 2}x${size / 2}`;
    } catch (e) {
      console.error("Error determining canvas size limit:", e);
    }
    
    setCompatInfo({
      mediaRecorderSupported,
      captureStreamSupported,
      webmSupported,
      mp4Supported,
      webpSupported,
      canvasSizeLimit
    });
  }, []);
  
  // Run a test to create a short video
  const runVideoTest = async () => {
    // Reset test results
    setTestResults({
      canvasCreated: false,
      streamCreated: false,
      recorderCreated: false,
      recordingStarted: false,
      dataReceived: false,
      blobCreated: false,
      uploadAttempted: false,
      uploadSucceeded: false,
      error: ""
    });
    
    try {
      // 1. Create a canvas
      const canvas = document.createElement('canvas');
      canvas.width = 320;
      canvas.height = 240;
      const ctx = canvas.getContext('2d');
      
      if (!ctx) {
        throw new Error("Couldn't create canvas context");
      }
      
      setTestResults(prev => ({ ...prev, canvasCreated: true }));
      
      // 2. Try to create a stream
      let stream;
      try {
        stream = canvas.captureStream(30);
        setTestResults(prev => ({ ...prev, streamCreated: true }));
      } catch (e) {
        throw new Error(`Failed to create stream: ${e instanceof Error ? e.message : String(e)}`);
      }
      
      // 3. Try to create a MediaRecorder
      let mediaRecorder;
      let mimeType = "";
      
      // Try different MIME types
      const mimeTypes = [
        'video/webm;codecs=vp9',
        'video/webm;codecs=vp8',
        'video/webm',
        'video/mp4',
        ''  // Empty string = default
      ];
      
      for (const mime of mimeTypes) {
        if (!mime || MediaRecorder.isTypeSupported(mime)) {
          mimeType = mime;
          break;
        }
      }
      
      try {
        const options = mimeType ? { mimeType, videoBitsPerSecond: 1000000 } : {};
        mediaRecorder = new MediaRecorder(stream, options);
        setTestResults(prev => ({ ...prev, recorderCreated: true }));
      } catch (e) {
        throw new Error(`Failed to create MediaRecorder: ${e instanceof Error ? e.message : String(e)}`);
      }
      
      // 4. Prepare to record data
      const chunks: BlobPart[] = [];
      mediaRecorder.ondataavailable = (e) => {
        if (e.data && e.data.size > 0) {
          chunks.push(e.data);
          setTestResults(prev => ({ ...prev, dataReceived: true }));
        }
      };
      
      // 5. Start recording
      try {
        mediaRecorder.start(100);
        setTestResults(prev => ({ ...prev, recordingStarted: true }));
      } catch (e) {
        throw new Error(`Failed to start recording: ${e instanceof Error ? e.message : String(e)}`);
      }
      
      // 6. Draw something on the canvas
      const startTime = Date.now();
      const animate = () => {
        const elapsed = Date.now() - startTime;
        
        if (elapsed < 2000) {
          // Clear canvas
          ctx.fillStyle = 'white';
          ctx.fillRect(0, 0, canvas.width, canvas.height);
          
          // Draw a moving circle
          const x = canvas.width/2 + Math.sin(elapsed / 200) * 50;
          const y = canvas.height/2 + Math.cos(elapsed / 200) * 50;
          
          ctx.fillStyle = 'red';
          ctx.beginPath();
          ctx.arc(x, y, 20, 0, Math.PI * 2);
          ctx.fill();
          
          // Add text
          ctx.fillStyle = 'black';
          ctx.font = '20px Arial';
          ctx.fillText('Video Test', 20, 30);
          
          requestAnimationFrame(animate);
        } else {
          // Stop recording after 2 seconds
          try {
            mediaRecorder.stop();
          } catch (e) {
            console.error("Error stopping recorder:", e);
          }
        }
      };
      
      animate();
      
      // 7. When recording stops, create a blob and try to upload
      mediaRecorder.onstop = async () => {
        try {
          // Create blob
          const blob = new Blob(chunks, { type: mimeType || 'video/webm' });
          setTestResults(prev => ({ ...prev, blobCreated: true }));
          
          if (blob.size < 100) {
            throw new Error(`Blob too small (${blob.size} bytes), likely corrupt`);
          }
          
          // Show preview
          const videoElement = document.getElementById('preview') as HTMLVideoElement;
          if (videoElement) {
            videoElement.src = URL.createObjectURL(blob);
          }
          
          // Try to upload
          setTestResults(prev => ({ ...prev, uploadAttempted: true }));
          
          const formData = new FormData();
          formData.append('file', new File([blob], 'test.webm', { type: mimeType || 'video/webm' }));
          
          const response = await fetch('/api/images/video', {
            method: 'POST',
            body: formData
          });
          
          if (!response.ok) {
            throw new Error(`Upload failed: ${response.status} ${response.statusText}`);
          }
          
          const result = await response.json();
          setTestResults(prev => ({ 
            ...prev, 
            uploadSucceeded: true,
            error: `Upload succeeded! File ID: ${result.id}, Path: ${result.path}`
          }));
          
        } catch (e) {
          setTestResults(prev => ({ 
            ...prev, 
            error: `Error in onstop handler: ${e instanceof Error ? e.message : String(e)}`
          }));
        }
      };
      
    } catch (e) {
      setTestResults(prev => ({ 
        ...prev, 
        error: e instanceof Error ? e.message : String(e)
      }));
    }
  };
  
  return (
    <div className="p-8 max-w-4xl mx-auto">
      <h1 className="text-3xl font-bold mb-6">Media Diagnostic Tool</h1>
      
      <div className="mb-8 p-4 bg-gray-100 rounded-lg">
        <h2 className="text-xl font-bold mb-4">Browser Compatibility</h2>
        
        <div className="grid grid-cols-2 gap-4">
          <div>
            <p><span className="font-medium">MediaRecorder API:</span> {compatInfo.mediaRecorderSupported ? '✅ Supported' : '❌ Not Supported'}</p>
            <p><span className="font-medium">Canvas.captureStream:</span> {compatInfo.captureStreamSupported ? '✅ Supported' : '❌ Not Supported'}</p>
            <p><span className="font-medium">WebM Format:</span> {compatInfo.webmSupported ? '✅ Supported' : '❌ Not Supported'}</p>
          </div>
          <div>
            <p><span className="font-medium">MP4 Format:</span> {compatInfo.mp4Supported ? '✅ Supported' : '❌ Not Supported'}</p>
            <p><span className="font-medium">WebP Format:</span> {compatInfo.webpSupported ? '✅ Supported' : '❌ Not Supported'}</p>
            <p><span className="font-medium">Max Canvas Size:</span> {compatInfo.canvasSizeLimit}</p>
          </div>
        </div>
      </div>
      
      <div className="mb-8">
        <h2 className="text-xl font-bold mb-4">Run Video Generation Test</h2>
        <button 
          onClick={runVideoTest}
          className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
        >
          Test Video Generation
        </button>
      </div>
      
      <div className="grid grid-cols-2 gap-8">
        <div className="p-4 bg-gray-100 rounded-lg">
          <h3 className="text-lg font-bold mb-4">Test Results</h3>
          
          <ul className="space-y-2">
            <li>
              <span className="font-medium">Canvas Created:</span> 
              {testResults.canvasCreated ? '✅' : '❌'}
            </li>
            <li>
              <span className="font-medium">Stream Created:</span> 
              {testResults.streamCreated ? '✅' : '❌'}
            </li>
            <li>
              <span className="font-medium">Recorder Created:</span> 
              {testResults.recorderCreated ? '✅' : '❌'}
            </li>
            <li>
              <span className="font-medium">Recording Started:</span> 
              {testResults.recordingStarted ? '✅' : '❌'}
            </li>
            <li>
              <span className="font-medium">Data Received:</span> 
              {testResults.dataReceived ? '✅' : '❌'}
            </li>
            <li>
              <span className="font-medium">Blob Created:</span> 
              {testResults.blobCreated ? '✅' : '❌'}
            </li>
            <li>
              <span className="font-medium">Upload Attempted:</span> 
              {testResults.uploadAttempted ? '✅' : '❌'}
            </li>
            <li>
              <span className="font-medium">Upload Succeeded:</span> 
              {testResults.uploadSucceeded ? '✅' : '❌'}
            </li>
          </ul>
          
          {testResults.error && (
            <div className="mt-4 p-3 bg-red-100 border border-red-300 rounded">
              <h4 className="font-bold">Error:</h4>
              <p className="text-sm">{testResults.error}</p>
            </div>
          )}
        </div>
        
        <div className="p-4 bg-gray-100 rounded-lg">
          <h3 className="text-lg font-bold mb-4">Video Preview</h3>
          <video 
            id="preview" 
            controls 
            width="100%" 
            className="border border-gray-300"
          >
            <source src="" type="video/webm" />
            Your browser does not support the video tag.
          </video>
          <p className="mt-2 text-sm text-gray-600">
            If a video appears here, basic video generation is working.
          </p>
        </div>
      </div>
      
      <div className="mt-8 p-4 bg-yellow-100 rounded-lg">
        <h3 className="text-lg font-bold">Recommendations:</h3>
        <ul className="list-disc ml-6 mt-2">
          <li>If video generation is failing, try using a different browser (Chrome is recommended).</li>
          <li>Ensure your browser is up to date.</li>
          <li>Some mobile browsers have limited support for these APIs.</li>
          <li>If upload is failing but generation works, check network connectivity and server logs.</li>
        </ul>
      </div>
    </div>
  );
}
