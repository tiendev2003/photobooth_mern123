"use client";
import { useEffect, useState } from "react";
import Link from "next/link";

interface Background {
  id: string;
  name: string;
  url: string;
  isActive: boolean;
  createdAt: string;
}

export default function BackgroundsAdminPage() {
  const [backgrounds, setBackgrounds] = useState<Background[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setLoading(true);
    fetch("/api/backgrounds", {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${localStorage.getItem("token")}`
      }
    })
      .then((res) => {
        if (!res.ok) throw new Error("Không thể tải backgrounds");
        return res.json();
      })
      .then((data) => {
        setBackgrounds(data);
        setLoading(false);
      })
      .catch((err) => {
        setError(err.message);
        setLoading(false);
      });
  }, []);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border-l-4 border-red-400 p-4">
        <p className="text-red-700">{error}</p>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 min-h-screen bg-gray-50">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 space-y-4 sm:space-y-0">
        <h1 className="text-xl sm:text-2xl font-semibold text-gray-900">Quản lý Backgrounds</h1>
        <Link href="/admin/backgrounds/new" className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 flex items-center gap-2">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
          <span>Thêm Background</span>
        </Link>
      </div>

      {/* Desktop Table View */}
      <div className="hidden lg:block bg-white shadow overflow-hidden rounded-lg">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Ảnh</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Tên</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Trạng thái</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Ngày tạo</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Hành động</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {backgrounds.length > 0 ? (
                backgrounds.map((bg) => (
                  <tr key={bg.id} className={bg.isActive ? "" : "bg-gray-50 opacity-80"}>
                    <td className="px-6 py-4 whitespace-nowrap"><img src={bg.url} alt={bg.name} className="w-24 h-16 object-cover rounded shadow" /></td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{bg.name}</td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${bg.isActive ? 'bg-green-100 text-green-800' : 'bg-gray-200 text-gray-500'}`}>{bg.isActive ? 'Hiện' : 'Ẩn'}</span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{new Date(bg.createdAt).toLocaleString()}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <Link href={`/admin/backgrounds/${bg.id}`} className="text-blue-600 hover:text-blue-900 p-1 rounded-full hover:bg-blue-100" title="Sửa">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
                      </Link>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={5} className="px-6 py-4 text-center text-gray-500">Không có background nào</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Mobile Card View */}
      <div className="lg:hidden space-y-4">
        {backgrounds.length > 0 ? (
          backgrounds.map((bg) => (
            <div key={bg.id} className="bg-white rounded-lg shadow-md p-4 flex gap-4 items-center">
              <img src={bg.url} alt={bg.name} className="w-20 h-14 object-cover rounded shadow" />
              <div className="flex-1">
                <div className="font-semibold text-gray-900">{bg.name}</div>
                <div className="text-xs text-gray-500 mb-1">{new Date(bg.createdAt).toLocaleString()}</div>
                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${bg.isActive ? 'bg-green-100 text-green-800' : 'bg-gray-200 text-gray-500'}`}>{bg.isActive ? 'Hiện' : 'Ẩn'}</span>
              </div>
              <Link href={`/admin/backgrounds/${bg.id}`} className="text-blue-600 hover:text-blue-900 p-2 rounded-full hover:bg-blue-100" title="Sửa">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
              </Link>
            </div>
          ))
        ) : (
          <div className="bg-white rounded-lg shadow-md p-8 text-center text-gray-500">Không có background nào</div>
        )}
      </div>
    </div>
  );
}

