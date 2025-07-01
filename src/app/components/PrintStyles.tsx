"use client";


/**
 * Component to add global print styles to the application
 * These styles will only apply during printing
 */
export default function PrintStyles() {
  return (
    <style jsx global>{`
      @media print {
        @page {
          size: auto;
          margin: 0mm;
        }
        
        body * {
          visibility: hidden;
        }
        
        #print-content,
        #print-content * {
          visibility: visible;
        }
        
        #print-content {
          position: fixed;
          left: 0;
          top: 0;
          width: 100%;
          height: 100%;
          display: flex;
          justify-content: center;
          align-items: center;
          background: white;
        }
        
        #print-content img {
          max-width: 100%;
          max-height: 100%;
          width: auto;
          height: auto;
          object-fit: contain;
        }
        
        .print-overlay {
          display: none !important;
        }
      }
    `}</style>
  );
}
