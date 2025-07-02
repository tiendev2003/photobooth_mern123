import Image from 'next/image';

export default function AppShell() {
  return (
    <div className="fixed inset-0 flex flex-col items-center justify-center bg-white dark:bg-gray-900 z-50">
      <div className="animate-pulse">
        <Image
          src="/logo.svg"
          alt="S Photobooth"
          width={150}
          height={150}
          className="mb-8"
        />
      </div>
      <div className="w-48 h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
        <div className="w-full h-full bg-blue-500 animate-pulse"></div>
      </div>
      <p className="mt-4 text-gray-500 dark:text-gray-400">Đang tải S Photobooth...</p>
    </div>
  );
}
