import { useEffect, useState } from 'react';

interface MediaSessionStatus {
  image: boolean;
  video: boolean;
  gif: boolean;
  sessionUrl: string | null;
  error: string | null;
  loading: boolean;
}

export function useMediaSessionStatus() {
  const [status, setStatus] = useState<MediaSessionStatus>({
    image: false,
    video: false,
    gif: false,
    sessionUrl: null,
    error: null,
    loading: true
  });

  useEffect(() => {
    const checkMediaSession = async () => {
      try {
        const sessionCode = localStorage.getItem("mediaSessionCode");
        if (!sessionCode) {
          setStatus(prev => ({ ...prev, error: "No session code found", loading: false }));
          return;
        }

        // Create session URL
        const baseUrl = typeof window !== 'undefined' ?
          `${window.location.protocol}//${window.location.host}` : '';
        const sessionUrl = `${baseUrl}/session/${sessionCode}`;

        // Check localStorage for existing media
        const imageUrl = localStorage.getItem("imageQrCode");
        const videoUrl = localStorage.getItem("videoQrCode");
        const gifUrl = localStorage.getItem("gifQrCode");

        setStatus({
          image: !!imageUrl,
          video: !!videoUrl,
          gif: !!gifUrl,
          sessionUrl,
          error: null,
          loading: false
        });

        // Set up polling for media completion
        const pollInterval = setInterval(async () => {
          try {
            const response = await fetch(`/api/media-session/${sessionCode}`);
            if (response.ok) {
              const sessionData = await response.json();
              
              setStatus(prev => ({
                ...prev,
                image: !!(sessionData.imageUrl || localStorage.getItem("imageQrCode")),
                video: !!(sessionData.videoUrl || localStorage.getItem("videoQrCode")),
                gif: !!(sessionData.gifUrl || localStorage.getItem("gifQrCode"))
              }));

              // If all media is ready, stop polling
              if (sessionData.imageUrl && sessionData.videoUrl && sessionData.gifUrl) {
                clearInterval(pollInterval);
              }
            }
          } catch (error) {
            console.error('Error polling media session:', error);
          }
        }, 2000); // Poll every 2 seconds

        // Clean up interval after 5 minutes
        setTimeout(() => {
          clearInterval(pollInterval);
        }, 5 * 60 * 1000);

        return () => clearInterval(pollInterval);
      } catch (error) {
        console.error('Error checking media session:', error);
        setStatus(prev => ({ 
          ...prev, 
          error: 'Error checking media session', 
          loading: false 
        }));
      }
    };

    checkMediaSession();
  }, []);

  return status;
}

// Helper function to check media availability
export function checkMediaAvailability(): {
  image: boolean;
  video: boolean;
  gif: boolean;
  sessionCode: string | null;
} {
  const sessionCode = localStorage.getItem("mediaSessionCode");
  const imageUrl = localStorage.getItem("imageQrCode");
  const videoUrl = localStorage.getItem("videoQrCode");
  const gifUrl = localStorage.getItem("gifQrCode");

  return {
    image: !!imageUrl,
    video: !!videoUrl,
    gif: !!gifUrl,
    sessionCode
  };
}

// Helper function to generate QR code data
export function generateQRCodeData(sessionCode: string): string {
  if (typeof window !== 'undefined') {
    const baseUrl = `${window.location.protocol}//${window.location.host}`;
    return `${baseUrl}/session/${sessionCode}`;
  }
  return `session/${sessionCode}`;
}

// Helper function to check if session is ready
export function isSessionReady(): boolean {
  const { image, sessionCode } = checkMediaAvailability();
  return !!(image && sessionCode);
}

// Helper function to get session URL
export function getSessionUrl(): string | null {
  const sessionCode = localStorage.getItem("mediaSessionCode");
  if (!sessionCode) return null;

  if (typeof window !== 'undefined') {
    const baseUrl = `${window.location.protocol}//${window.location.host}`;
    return `${baseUrl}/session/${sessionCode}`;
  }
  
  return null;
}
