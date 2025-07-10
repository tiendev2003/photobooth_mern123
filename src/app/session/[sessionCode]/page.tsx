"use client";

import { ArrowLeft, Download, Share2 } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";

interface MediaSession {
  id: string;
  sessionCode: string;
  imageUrl?: string;
  videoUrl?: string;
  gifUrl?: string;
  status: 'PROCESSING' | 'COMPLETED' | 'EXPIRED';
  expiresAt: string;
  createdAt: string;
}

export default function SessionPage() {
  const params = useParams();
  const sessionCode = params?.sessionCode as string;
  const [session, setSession] = useState<MediaSession | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const fetchSession = async () => {
      try {
        setLoading(true);
        const response = await fetch(`/api/media-session/${sessionCode}`);
        
        if (!response.ok) {
          if (response.status === 404) {
            throw new Error("Không tìm thấy session này");
          } else if (response.status === 410) {
            throw new Error("Session này đã hết hạn");
          }
          const errorData = await response.json();
          throw new Error(errorData.error || 'Có lỗi xảy ra khi tải session');
        }

        const sessionData = await response.json();
        setSession(sessionData);
      } catch (err) {
        console.error('Error fetching session:', err);
        setError(err instanceof Error ? err.message : 'Có lỗi xảy ra');
      } finally {
        setLoading(false);
      }
    };

    if (sessionCode) {
      fetchSession();
    }
  }, [sessionCode]);

  const downloadMedia = (url: string, filename: string) => {
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    link.target = '_blank';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleDownloadAll = () => {
    if (!session) return;

    const mediaItems = [
      { url: session.imageUrl, filename: 'photobooth-image.jpg' },
      { url: session.videoUrl, filename: 'photobooth-video.webm' },
      { url: session.gifUrl, filename: 'photobooth-gif.gif' },
    ].filter(item => item.url);

    mediaItems.forEach((item, index) => {
      setTimeout(() => {
        downloadMedia(item.url!, item.filename);
      }, index * 1000); // Delay between downloads
    });
  };

  const handleShare = async () => {
    if (!session) return;

    if (navigator.share) {
      try {
        await navigator.share({
          title: 'S Photobooth Media Session',
          text: `Xem media từ S Photobooth Session: ${session.sessionCode}`,
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

  const renderMedia = (type: string, url: string) => {
    if (type === 'Video') {
      return (
        <div className="relative w-full bg-black rounded-lg overflow-hidden">
          <video
            src={url}
            controls
            className="w-full h-auto max-h-[80vh] object-contain"
            style={{ minHeight: '200px' }}
            preload="metadata"
          >
            Your browser does not support the video tag.
          </video>
        </div>
      );
    } else {
      return (
        <div className="relative w-full bg-black rounded-lg overflow-hidden">
          <Image
            src={url}
            alt={`Photobooth ${type}`}
            className="w-full h-auto max-h-[80vh] object-contain"
            width={800}
            height={600}
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
            style={{ minHeight: '200px' }}
            unoptimized={type === 'GIF'} // Important for GIFs
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

  const getStatusText = (status: string) => {
    switch (status) {
      case 'PROCESSING':
        return 'Đang xử lý';
      case 'COMPLETED':
        return 'Hoàn thành';
      case 'EXPIRED':
        return 'Đã hết hạn';
      default:
        return status;
    }
  };

  const mediaItems = session ? [
    { type: 'Image', url: session.imageUrl, filename: 'photobooth-image.jpg' },
    { type: 'Video', url: session.videoUrl, filename: 'photobooth-video.webm' },
    { type: 'GIF', url: session.gifUrl, filename: 'photobooth-gif.gif' },
  ].filter(item => item.url) : [];

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
        ) : !session ? (
          <div className="flex flex-col items-center justify-center h-[70vh] text-center">
            <div className="bg-yellow-500/20 p-8 rounded-lg">
              <h2 className="text-2xl font-bold text-yellow-300 mb-4">Không tìm thấy session</h2>
              <p className="text-xl">Session bạn đang tìm không tồn tại hoặc đã hết hạn.</p>
              <Link
                href="/"
                className="mt-6 inline-block px-6 py-3 bg-pink-600 hover:bg-pink-700 rounded-full transition"
              >
                Quay về trang chủ
              </Link>
            </div>
          </div>
        ) : (
          <>
            {/* Session info */}
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center">
                <h2 className="text-2xl font-bold mr-4">
                  Media Session: {session.sessionCode}
                </h2>
                <span className={`px-3 py-1 rounded-full text-sm ${
                  session.status === 'COMPLETED' ? 'bg-green-600/40' :
                  session.status === 'PROCESSING' ? 'bg-yellow-600/40' :
                  'bg-red-600/40'
                }`}>
                  {getStatusText(session.status)} • {mediaItems.length} media
                </span>
              </div>
              <div className="text-sm text-gray-300">
                {getTimeSince(session.createdAt)}
              </div>
            </div>

            {/* Check if session is still processing */}
            {session.status === 'PROCESSING' ? (
              <div className="flex flex-col items-center justify-center h-[50vh] text-center">
                <div className="bg-yellow-500/20 p-8 rounded-lg">
                  <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-yellow-500 mx-auto mb-4"></div>
                  <h2 className="text-2xl font-bold text-yellow-300 mb-4">Đang xử lý</h2>
                  <p className="text-xl">Media của bạn đang được xử lý...</p>
                  <p className="text-gray-300 mt-2">Vui lòng kiểm tra lại sau vài phút.</p>
                </div>
              </div>
            ) : mediaItems.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-[50vh] text-center">
                <div className="bg-gray-500/20 p-8 rounded-lg">
                  <h2 className="text-2xl font-bold text-gray-300 mb-4">Chưa có media</h2>
                  <p className="text-xl">Session này chưa có media nào được tạo.</p>
                </div>
              </div>
            ) : (
              <>
                {/* Media grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
                  {mediaItems.map((item, index) => (
                    <div key={index} className="bg-black/20 backdrop-blur-sm rounded-xl p-4 flex flex-col">
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center text-sm text-gray-300">
                          <span className="ml-2">
                            {item.type} {index + 1}
                          </span>
                        </div>
                        <button
                          onClick={() => downloadMedia(item.url!, item.filename)}
                          className="text-pink-400 hover:text-pink-300 transition"
                        >
                          <Download className="w-4 h-4" />
                        </button>
                      </div>
                      <div className="flex-1 flex items-center justify-center">
                        {renderMedia(item.type, item.url!)}
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
              </>
            )}

            {/* Session details */}
            <div className="mt-12 text-center">
              <div className="bg-black/20 backdrop-blur-sm rounded-lg p-6 inline-block">
                <p className="text-lg font-semibold mb-2">Tạo bởi S Photobooth - Lưu giữ khoảnh khắc đẹp</p>
                <p className="text-sm text-gray-400">
                  Session hết hạn: {new Date(session.expiresAt).toLocaleString('vi-VN')}
                </p>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
