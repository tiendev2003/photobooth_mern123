// Universal upload functions that can switch between external and internal APIs
import { uploadGifToExternalAPI, uploadImageToExternalAPI, uploadVideoToExternalAPI } from './uploadApi';
import { UPLOAD_CONFIG } from './uploadConfig';

  
/**
 * Universal video upload function
 * Switches between external and internal API based on configuration
 */
export const uploadVideo = async (videoUrl: string): Promise<string> => {
  if (UPLOAD_CONFIG.USE_EXTERNAL_API) {
    // Use external PHP API
    const response = await fetch(videoUrl);
    if (!response.ok) {
      throw new Error(`Failed to fetch video blob: ${response.statusText}`);
    }
    
    const blob = await response.blob();
    const file = new File([blob], "photobooth.webm", { type: "video/webm" });
    
    return await uploadVideoToExternalAPI(file);
  } else {
    // Use internal Next.js API (original implementation)
    const response = await fetch(videoUrl);
    if (!response.ok) {
      throw new Error(`Failed to fetch video blob: ${response.statusText}`);
    }
    
    const blob = await response.blob();
    const file = new File([blob], "photobooth.webm", { type: "video/webm" });
    
    const formData = new FormData();
    formData.append("file", file);
    
    const uploadResponse = await fetch(UPLOAD_CONFIG.INTERNAL_API.UPLOAD_VIDEO, {
      method: "POST",
      body: formData,
      headers: {
        "Authorization": `Bearer ${localStorage.getItem("token") || ""}`,
      }
    });

    if (!uploadResponse.ok) {
      throw new Error(`Video upload failed: ${uploadResponse.statusText}`);
    }

    const data = await uploadResponse.json();
    
    // Handle different response formats
    if (data && data.path) {
      return data.path;
    } else if (data && data.data && data.data.url) {
      return data.data.url;
    } else if (data && data.url) {
      return data.url;
    } else {
      throw new Error("Invalid response format from server");
    }
  }
};

/**
 * Universal image upload function
 * Switches between external and internal API based on configuration
 */
export const uploadImage = async (imageFile: File): Promise<string> => {
  if (UPLOAD_CONFIG.USE_EXTERNAL_API) {
    // Use external PHP API
    return await uploadImageToExternalAPI(imageFile);
  } else {
    // Use internal Next.js API (original implementation)
    const formData = new FormData();
    formData.append("file", imageFile);

    const uploadResponse = await fetch(UPLOAD_CONFIG.INTERNAL_API.UPLOAD_IMAGE, {
      method: "POST",
      body: formData,
      headers: {
        "Authorization": `Bearer ${localStorage.getItem("token") || ""}`,
      }
    });

    if (!uploadResponse.ok) {
      if (uploadResponse.status === 413) {
        throw new Error("Ảnh quá lớn để tải lên. Hệ thống đang tối ưu hóa để giải quyết vấn đề này.");
      }
      throw new Error("Lỗi khi tải ảnh lên");
    }

    const data = await uploadResponse.json();
    return data.data.url;
  }
};

/**
 * Universal GIF upload function
 * Switches between external and internal API based on configuration
 */
export const uploadGif = async (gifUrl: string): Promise<string> => {
  if (UPLOAD_CONFIG.USE_EXTERNAL_API) {
    // Use external PHP API
    const response = await fetch(gifUrl);
    const blob = await response.blob();
    const file = new File([blob], "photobooth.gif", { type: "image/gif" });
    
    return await uploadGifToExternalAPI(file);
  } else {
    // Use internal Next.js API (original implementation)
    const response = await fetch(gifUrl);
    const blob = await response.blob();
    const file = new File([blob], "photobooth.gif", { type: "image/gif" });

    const formData = new FormData();
    formData.append("file", file);

    const uploadResponse = await fetch(UPLOAD_CONFIG.INTERNAL_API.UPLOAD_GIF, {
      method: "POST",
      body: formData,
      headers: {
        "Authorization": `Bearer ${localStorage.getItem("token") || ""}`,
      }
    });

    if (!uploadResponse.ok) {
      throw new Error(`GIF upload failed: ${uploadResponse.statusText}`);
    }

    const data = await uploadResponse.json();
    
    // Handle different response formats
    if (data && data.path) {
      return data.path;
    } else if (data && data.data && data.data.url) {
      return data.data.url;
    } else if (data && data.url) {
      return data.url;
    } else {
      throw new Error("Invalid response format from server");
    }
  }
};

 