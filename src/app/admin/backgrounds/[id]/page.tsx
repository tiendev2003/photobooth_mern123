"use client";
import { useEffect, useRef, useState } from "react";
import { useRouter, useParams } from "next/navigation";
  const { uploadImageWithStore } = require('@/lib/utils/uploadApi');

export default function EditBackgroundPage() {
 
  
  const router = useRouter();
  const params = useParams();
  const id = params?.id as string;
  const [bg, setBg] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({ name: "", url: "", isActive: true });
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string>("");
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!id) return;
    fetch(`/api/backgrounds/${id}`,{
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${localStorage.getItem("token")}`
      }
    })
      .then((res) => res.json())
      .then((data) => {
        setBg(data);
        setForm({ name: data.name, url: data.url, isActive: data.isActive });
        setPreview(data.url);
        setLoading(false);
      });
  }, [id]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target;
    setForm((f: any) => ({ ...f, [name]: type === "checkbox" ? checked : value }));
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setFile(file);
      setPreview(URL.createObjectURL(file));
    } else {
      setFile(null);
      setPreview(bg?.url || "");
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSaving(true);
    let url = form.url;
    try {
      if (file) {
        url = await uploadImageWithStore(file);
      }
      const res = await fetch(`/api/backgrounds/${id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${localStorage.getItem("token")}`
        },
        body: JSON.stringify({ ...form, url }),
      });
      if (!res.ok) throw new Error("Không thể cập nhật background");
      router.push("/admin/backgrounds");
    } catch (err: any) {
      setError(err.message || "Lỗi không xác định");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm("Xác nhận xóa?")) return;
    await fetch(`/api/backgrounds/${id}`, { method: "DELETE" });
    router.push("/admin/backgrounds");
  };

  if (loading) return <div>Đang tải...</div>;
  if (!bg) return <div>Không tìm thấy background</div>;

  return (
    <div className="p-4 sm:p-6 min-h-screen flex items-center justify-center bg-gray-50">
      <div className="bg-white rounded-lg shadow-lg w-full max-w-md p-6">
        <h1 className="text-xl font-bold mb-4 text-gray-900">Sửa Background</h1>
        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block font-medium mb-1 text-gray-700">Tên background</label>
            <input name="name" value={form.name} onChange={handleChange} className="border px-3 py-2 w-full rounded focus:outline-none focus:ring-2 focus:ring-blue-500" required disabled={saving} />
          </div>
          <div>
            <label className="block font-medium mb-1 text-gray-700">Ảnh background</label>
            <input
              type="file"
              accept="image/*"
              onChange={handleFileChange}
              ref={fileInputRef}
              className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
              disabled={saving}
            />
            {preview && (
              <div className="mt-3">
                <img src={preview} alt="Preview" className="w-full h-40 object-contain rounded border" />
              </div>
            )}
          </div>
          <div>
            <label className="inline-flex items-center">
              <input type="checkbox" name="isActive" checked={form.isActive} onChange={handleChange} className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded" disabled={saving} />
              <span className="ml-2 text-gray-700">Hiện</span>
            </label>
          </div>
          {error && <div className="text-red-600 text-sm">{error}</div>}
          <div className="flex justify-between gap-2">
            <button type="button" onClick={() => router.push("/admin/backgrounds")}
              className="px-4 py-2 border rounded text-gray-700 hover:bg-gray-100" disabled={saving}>Huỷ</button>
            <div className="flex gap-2">
              <button type="button" onClick={handleDelete} className="bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600" disabled={saving}>Xóa</button>
              <button type="submit" className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 flex items-center gap-2 disabled:opacity-50" disabled={saving}>
                {saving && <svg className="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>}
                <span>Lưu</span>
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );

}