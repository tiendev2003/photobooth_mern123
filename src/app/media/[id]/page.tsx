"use client";

import { ArrowLeft, Download, Film, Gift, Image as ImageIcon, Share2 } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";

interface MediaItem {
  id: string;
  filename: string;
  path: string;
  fileType: "IMAGE" | "VIDEO" | "GIF";
  createdAt: string;
  size: number;
}

export default function MediaPage() {
  const params = useParams();
  const id = params?.id as string;
  
  const [media, setMedia] = useState<MediaItem | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const fetchMedia = async () => {
      try {
        setLoading(true);
        const response = await fetch(`/api/images/${id}`);

        if (!response.ok) {
          throw new Error("Không tìm thấy media này hoặc đã hết hạn");
        }

        const data = await response.json();
        setMedia(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Có lỗi xảy ra");
      } finally {
        setLoading(false);
      }
    };

    if (id) {
      fetchMedia();
    }
  }, [id]);

  const handleDownload = () => {
    if (!media) return;

    // Properly construct the download URL
    const baseUrl = process.env.NEXT_PUBLIC_API_URL || '';
    const downloadUrl = baseUrl ? `${baseUrl}${media.path}` : media.path;
    
    // Ensure the path starts with a slash if it's a relative path
    const finalDownloadUrl = downloadUrl.startsWith('http') ? downloadUrl : 
                           downloadUrl.startsWith('/') ? downloadUrl : `/${downloadUrl}`;

    const link = document.createElement('a');
    link.href = finalDownloadUrl;
    link.download = media.filename;
    link.target = '_blank'; // Open in new tab to avoid CORS issues
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleShare = async () => {
    if (!media) return;

    if (navigator.share) {
      try {
        await navigator.share({
          title: 'Photobooth Media',
          text: 'Hãy xem media của tôi từ S Photobooth!',
          url: window.location.href,
        });
      } catch (err) {
        console.log('Error sharing:', err);
      }
    } else {
      // Fallback to clipboard copy
      try {
        await navigator.clipboard.writeText(window.location.href);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      } catch (err) {
        console.log('Error copying:', err);
      }
    }
  };

  // Helper function to render the appropriate media type
  const renderMedia = () => {
    if (!media) return null;

    // Properly construct the media URL
    const baseUrl = process.env.NEXT_PUBLIC_API_URL || '';
    const mediaUrl = baseUrl ? `${baseUrl}${media.path}` : media.path;
    
    // Ensure the path starts with a slash if it's a relative path
    const finalMediaUrl = mediaUrl.startsWith('http') ? mediaUrl : 
                         mediaUrl.startsWith('/') ? mediaUrl : `/${mediaUrl}`;

    switch (media.fileType) {
      case "IMAGE":
        return (
          <div className="relative w-full h-full">
            <Image
              src={finalMediaUrl}
              alt="Photobooth Image"
              className="rounded-xl shadow-lg object-contain"
              fill
              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 70vw, 60vw"
              priority
            />
          </div>
        );
      case "VIDEO":
        return (
          <div className="relative w-full h-full rounded-xl overflow-hidden">
            <video
              src={finalMediaUrl}
              controls
              autoPlay
              loop
              className="w-full h-full object-contain"
            >
              Your browser does not support the video tag.
            </video>
          </div>
        );
      case "GIF":
        return (
          <div className="relative w-full h-full">
            <Image
              src={finalMediaUrl}
              alt="Photobooth GIF"
              className="rounded-xl shadow-lg object-contain"
              fill
              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 70vw, 60vw"
              priority
            />
          </div>
        );
      default:
        return <div className="text-red-500">Định dạng không được hỗ trợ</div>;
    }
  };

  // Helper function to get the icon for media type
  const getMediaTypeIcon = () => {
    if (!media) return <ImageIcon />;

    switch (media.fileType) {
      case "IMAGE":
        return <ImageIcon className="w-6 h-6" />;
      case "VIDEO":
        return <Film className="w-6 h-6" />;
      case "GIF":
        return <Gift className="w-6 h-6" />;
      default:
        return <ImageIcon className="w-6 h-6" />;
    }
  };

  // Helper function to get the formatted time since creation
  const getTimeSince = () => {
    if (!media) return "";

    const createdAt = new Date(media.createdAt);
    const now = new Date();
    const diffMs = now.getTime() - createdAt.getTime();
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
            <p className="mt-4 text-lg">Đang tải media...</p>
          </div>
        ) : error ? (
          <div className="flex flex-col items-center justify-center h-[70vh] text-center">
            <div className="bg-red-500/20 p-8 rounded-lg">
              <h2 className="text-2xl font-bold text-red-300 mb-4">Lỗi</h2>
              <p className="text-xl">{error}</p>
              <p className="mt-4">Media này có thể không tồn tại hoặc đã bị xóa.</p>
              <Link
                href="/"
                className="mt-6 inline-block px-6 py-3 bg-pink-600 hover:bg-pink-700 rounded-full transition"
              >
                Quay về trang chủ
              </Link>
            </div>
          </div>
        ) : media ? (
          <>
            {/* Media title */}
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center">
                {getMediaTypeIcon()}
                <h2 className="text-xl font-medium ml-2">
                  {media.fileType === "IMAGE" ? "Ảnh" : media.fileType === "VIDEO" ? "Video" : "GIF"} từ S Photobooth
                </h2>
              </div>
              <div className="text-sm text-gray-300">
                {getTimeSince()}
              </div>
            </div>

            {/* Media display */}
            <div className="bg-black/20 backdrop-blur-sm rounded-xl p-4 mb-6 max-h-[70vh] flex items-center justify-center">
              <div className="relative w-full h-[60vh] max-w-3xl mx-auto">
                {renderMedia()}
              </div>
            </div>

            {/* Action buttons */}
            <div className="flex justify-center space-x-4 mt-6">
              <button
                onClick={handleDownload}
                className="flex items-center px-6 py-3 bg-pink-600 hover:bg-pink-700 rounded-full transition"
              >
                <Download className="mr-2" />
                Tải xuống
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
                Media này sẽ bị xóa sau 72 giờ
              </p>
            </div>
          </>
        ) : null}
      </div>
    </div>
  );
}
