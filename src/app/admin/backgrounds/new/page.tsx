"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";

export default function NewBackgroundPage() {
  const router = useRouter();
  const [form, setForm] = useState({ name: "", isActive: true });
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target;
    setForm((f) => ({ ...f, [name]: type === "checkbox" ? checked : value }));
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setFile(file);
      setPreview(URL.createObjectURL(file));
    } else {
      setFile(null);
      setPreview("");
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!file) {
      setError("Vui lòng chọn ảnh background");
      return;
    }
    setLoading(true);
    try {
      const formData = new FormData();
      formData.append("name", form.name);
      formData.append("isActive", String(form.isActive));
      formData.append("file", file);

      const res = await fetch("/api/backgrounds", {
        method: "POST",
        body: formData,
        headers: {
          "Authorization": `Bearer ${localStorage.getItem("token")}`
        }
      });
      if (!res.ok) throw new Error("Không thể tạo background");
      router.push("/admin/backgrounds");
    } catch (err: any) {
      setError(err.message || "Lỗi không xác định");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-4 sm:p-6 min-h-screen flex items-center justify-center bg-gray-50">
      <div className="bg-white rounded-lg shadow-lg w-full max-w-md p-6">
        <h1 className="text-xl font-bold mb-4 text-gray-900">Thêm Background mới</h1>
        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block font-medium mb-1 text-gray-700">Tên background</label>
            <input name="name" value={form.name} onChange={handleChange} className="border px-3 py-2 w-full rounded focus:outline-none focus:ring-2 focus:ring-blue-500" required disabled={loading} />
          </div>
          <div>
            <label className="block font-medium mb-1 text-gray-700">Ảnh background</label>
            <input
              type="file"
              accept="image/*"
              onChange={handleFileChange}
              ref={fileInputRef}
              className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
              disabled={loading}
            />
            {preview && (
              <div className="mt-3">
                <img src={preview} alt="Preview" className="w-full h-40 object-contain rounded border" />
              </div>
            )}
          </div>
          <div>
            <label className="inline-flex items-center">
              <input type="checkbox" name="isActive" checked={form.isActive} onChange={handleChange} className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded" disabled={loading} />
              <span className="ml-2 text-gray-700">Hiện</span>
            </label>
          </div>
          {error && <div className="text-red-600 text-sm">{error}</div>}
          <div className="flex justify-end gap-2">
            <button type="button" onClick={() => router.push("/admin/backgrounds")} className="px-4 py-2 border rounded text-gray-700 hover:bg-gray-100" disabled={loading}>Huỷ</button>
            <button type="submit" className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 flex items-center gap-2 disabled:opacity-50" disabled={loading}>
              {loading && <svg className="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>}
              <span>Tạo mới</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
