"use client";

import { ArrowLeft, Download, Share2 } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";

interface MediaSessionTemp {
  id: string;
  sessionCode: string;
  mediaUrls: string[];
  createdAt: string;
  expiresAt: string;
}

export default function MediaSessionTempPage() {
  const params = useParams();
  const sessionCode = params?.sessionCode as string;
  
  const [session, setSession] = useState<MediaSessionTemp | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const fetchSession = async () => {
      try {
        setLoading(true);
        const response = await fetch(`/api/media-session-temp/${sessionCode}`);

        if (!response.ok) {
          if (response.status === 404) {
            throw new Error("Không tìm thấy session này");
          } else if (response.status === 410) {
            throw new Error("Session này đã hết hạn");
          }
          throw new Error("Có lỗi xảy ra khi tải session");
        }

        const data = await response.json();
        console.log("Fetched session data:", data);
        setSession(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Có lỗi xảy ra");
      } finally {
        setLoading(false);
      }
    };

    if (sessionCode) {
      fetchSession();
    }
  }, [sessionCode]);

  const handleDownloadAll = () => {
    if (!session || !session.mediaUrls.length) return;

    session.mediaUrls.forEach((mediaUrl, index) => {
      setTimeout(() => {
        const link = document.createElement('a');
        link.href = mediaUrl;
        link.download = `photobooth-${index + 1}.jpg`;
        link.target = '_blank';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      }, index * 1000); // Delay between downloads
    });
  };

  const handleShare = async () => {
    if (!session) return;

    if (navigator.share) {
      try {
        await navigator.share({
          title: 'S Photobooth Media Session',
          text: `Xem ${session.mediaUrls.length} media từ S Photobooth!`,
          url: window.location.href,
        });
      } catch (err) {
        console.log('Error sharing:', err);
      }
    } else {
      try {
        await navigator.clipboard.writeText(window.location.href);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      } catch (err) {
        console.log('Error copying:', err);
      }
    }
  };

  const renderMedia = (mediaUrl: string, index: number) => {
    console.log(`Rendering media ${index + 1}:`, mediaUrl);
    // Check if it's a video based on the URL
    const isVideo = mediaUrl.includes('.mp4') || mediaUrl.includes('.webm') || mediaUrl.includes('/videos/');
    const isGif = mediaUrl.includes('.gif') || mediaUrl.includes('/gifs/');

    if (isVideo) {
      return (
        <div className="relative w-full bg-black rounded-lg overflow-hidden">
          <video
            src={mediaUrl}
            controls
            className="w-full h-auto max-h-[80vh] object-contain"
            style={{ minHeight: '200px' }}
          >
            Your browser does not support the video tag.
          </video>
        </div>
      );
    } else {
      return (
        <div className="relative w-full bg-black rounded-lg overflow-hidden">
          <Image
            src={mediaUrl}
            alt={`Photobooth ${isGif ? 'GIF' : 'Image'} ${index + 1}`}
            className="w-full h-auto max-h-[80vh] object-contain"
            width={800}
            height={600}
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
            style={{ minHeight: '200px' }}
            unoptimized
          />
        </div>
      );
    }
  };

  const getTimeSince = (createdAt: string) => {
    const created = new Date(createdAt);
    const now = new Date();
    const diffMs = now.getTime() - created.getTime();
    const diffMinutes = Math.floor(diffMs / 60000);

    if (diffMinutes < 1) return "Vài giây trước";
    if (diffMinutes < 60) return `${diffMinutes} phút trước`;

    const diffHours = Math.floor(diffMinutes / 60);
    if (diffHours < 24) return `${diffHours} giờ trước`;

    const diffDays = Math.floor(diffHours / 24);
    return `${diffDays} ngày trước`;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 to-indigo-900 text-white">
      {/* Background graphics */}
      <div className="absolute inset-0 bg-[url('/anh/bg.png')] bg-cover bg-center opacity-20" />
      <div className="absolute bottom-0 w-full h-1/3 bg-gradient-to-t from-black to-transparent z-0"></div>

      {/* Content */}
      <div className="relative z-10 container mx-auto px-4 pt-8 pb-16">
        {/* Header */}
        <header className="flex justify-between items-center mb-8">
          <Link
            href="/"
            className="flex items-center text-white hover:text-pink-300 transition"
          >
            <ArrowLeft className="mr-2" />
            <span>Trang chủ</span>
          </Link>
          <h1 className="text-2xl md:text-3xl font-bold text-center">S Photobooth</h1>
          <div className="w-24"></div>
        </header>

        {loading ? (
          <div className="flex flex-col items-center justify-center h-[70vh]">
            <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-pink-500"></div>
            <p className="mt-4 text-lg">Đang tải session...</p>
          </div>
        ) : error ? (
          <div className="flex flex-col items-center justify-center h-[70vh] text-center">
            <div className="bg-red-500/20 p-8 rounded-lg">
              <h2 className="text-2xl font-bold text-red-300 mb-4">Lỗi</h2>
              <p className="text-xl">{error}</p>
              <Link
                href="/"
                className="mt-6 inline-block px-6 py-3 bg-pink-600 hover:bg-pink-700 rounded-full transition"
              >
                Quay về trang chủ
              </Link>
            </div>
          </div>
        ) : session ? (
          <>
            {/* Session info */}
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center">
                <h2 className="text-2xl font-bold mr-4">
                  Media Session: {session.sessionCode}
                </h2>
                <span className="bg-pink-600/40 px-3 py-1 rounded-full text-sm">
                  {session.mediaUrls.length} media
                </span>
              </div>
              <div className="text-sm text-gray-300">
                {getTimeSince(session.createdAt)}
              </div>
            </div>

            {/* Media grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
              {session.mediaUrls.map((mediaUrl, index) => (
                <div key={index} className="bg-black/20 backdrop-blur-sm rounded-xl p-4 flex flex-col">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center text-sm text-gray-300">
                      <span className="ml-2">
                        Media {index + 1}
                      </span>
                    </div>
                    <button
                      onClick={() => {
                        const link = document.createElement('a');
                        link.href = mediaUrl;
                        link.download = `photobooth-${index + 1}`;
                        link.target = '_blank';
                        document.body.appendChild(link);
                        link.click();
                        document.body.removeChild(link);
                      }}
                      className="text-pink-400 hover:text-pink-300 transition"
                    >
                      <Download className="w-4 h-4" />
                    </button>
                  </div>
                  <div className="flex-1 flex items-center justify-center">
                    {renderMedia(mediaUrl, index)}
                  </div>
                </div>
              ))}
            </div>

            {/* Action buttons */}
            <div className="flex justify-center space-x-4 mt-6">
              <button
                onClick={handleDownloadAll}
                className="flex items-center px-6 py-3 bg-pink-600 hover:bg-pink-700 rounded-full transition"
              >
                <Download className="mr-2" />
                Tải tất cả
              </button>
              <button
                onClick={handleShare}
                className="flex items-center px-6 py-3 bg-purple-600 hover:bg-purple-700 rounded-full transition"
              >
                <Share2 className="mr-2" />
                {copied ? "Đã sao chép!" : "Chia sẻ"}
              </button>
            </div>

            {/* Branding */}
            <div className="mt-12 text-center">
              <p>Tạo bởi S Photobooth - Lưu giữ khoảnh khắc đẹp</p>
              <p className="text-sm text-gray-400 mt-2">
                Session này sẽ bị xóa sau 72 giờ
              </p>
            </div>
          </>
        ) : null}
      </div>
    </div>
  );
}
