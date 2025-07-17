// Utility functions for uploading to external PHP API
import { UPLOAD_CONFIG } from './uploadConfig';

export const UPLOAD_API_BASE_URL = UPLOAD_CONFIG.EXTERNAL_API.BASE_URL;

export interface UploadResponse {
  success: boolean;
  message: string;
  data?: {
    original_name: string;
    new_name: string;
    size: string;
    type: string;
    url: string;
    upload_time: string;
    dimensions?: string;
  };
}

/**
 * Upload video to external PHP API
 */
export const uploadVideoToExternalAPI = async (videoFile: File): Promise<string> => {
  try {
    console.log("Starting video upload to external API...");
    console.log("Video file:", {
      name: videoFile.name,
      size: videoFile.size,
      type: videoFile.type
    });

    // Create form data for upload
    const formData = new FormData();
    formData.append("video", videoFile);

    console.log("Sending upload request to external API");
    
    // Upload to external PHP API
    const uploadResponse = await fetch(UPLOAD_CONFIG.EXTERNAL_API.UPLOAD_VIDEO, {
      method: "POST",
      body: formData,
      headers: {
        // Don't set Content-Type header, let browser set it with boundary for FormData
      }
    });

    console.log("Upload response status:", uploadResponse);

    if (!uploadResponse.ok) {
      const errorText = await uploadResponse.text();
      console.error("Upload error response:", errorText);
      throw new Error(`Video upload failed: ${uploadResponse.statusText}`);
    }

    const data: UploadResponse = await uploadResponse.json();
    console.log("Video uploaded successfully:", data);

    if (!data.success || !data.data?.url) {
      throw new Error(data.message || "Upload failed");
    }

    // Return the full URL from the API using helper function
    const fullUrl = UPLOAD_CONFIG.EXTERNAL_API.getFileUrl(data.data.url);
    console.log("Final video URL:", fullUrl);
    return fullUrl;
  } catch (error) {
    console.error("Error uploading video to external API:", error);
    throw error;
  }
};

/**
 * Upload image to external PHP API
 */
export const uploadImageToExternalAPI = async (imageFile: File): Promise<string> => {
  try {
    console.log("Starting image upload to external API...");
    console.log("Image file:", {
      name: imageFile.name,
      size: imageFile.size,
      type: imageFile.type
    });

    // Create form data for upload
    const formData = new FormData();
    formData.append("image", imageFile);

    console.log("Sending upload request to external API");
    
    // Upload to external PHP API
    const uploadResponse = await fetch(UPLOAD_CONFIG.EXTERNAL_API.UPLOAD_IMAGE, {
      method: "POST",
      body: formData,
    });

    console.log("Upload response status:", uploadResponse.status);

    if (!uploadResponse.ok) {
      const errorText = await uploadResponse.text();
      console.error("Upload error response:", errorText);
      throw new Error(`Image upload failed: ${uploadResponse.statusText}`);
    }

    const data: UploadResponse = await uploadResponse.json();
    console.log("Image uploaded successfully:", data);

    if (!data.success || !data.data?.url) {
      throw new Error(data.message || "Upload failed");
    }

    // Return the full URL from the API using helper function
    const fullUrl = UPLOAD_CONFIG.EXTERNAL_API.getFileUrl(data.data.url);
    console.log("Final image URL:", fullUrl);
    return fullUrl;
  } catch (error) {
    console.error("Error uploading image to external API:", error);
    throw error;
  }
};

/**
 * Upload GIF to external PHP API
 */
export const uploadGifToExternalAPI = async (gifFile: File): Promise<string> => {
  try {
    console.log("Starting GIF upload to external API...");
    console.log("GIF file:", {
      name: gifFile.name,
      size: gifFile.size,
      type: gifFile.type
    });

    // Create form data for upload
    const formData = new FormData();
    formData.append("gif", gifFile);

    console.log("Sending upload request to external API");
    
    // Upload to external PHP API
    const uploadResponse = await fetch(UPLOAD_CONFIG.EXTERNAL_API.UPLOAD_GIF, {
      method: "POST",
      body: formData,
    });

    console.log("Upload response status:", uploadResponse.status);

    if (!uploadResponse.ok) {
      const errorText = await uploadResponse.text();
      console.error("Upload error response:", errorText);
      throw new Error(`GIF upload failed: ${uploadResponse.statusText}`);
    }

    const data: UploadResponse = await uploadResponse.json();
    console.log("GIF uploaded successfully:", data);

    if (!data.success || !data.data?.url) {
      throw new Error(data.message || "Upload failed");
    }

    // Return the full URL from the API using helper function
    const fullUrl = UPLOAD_CONFIG.EXTERNAL_API.getFileUrl(data.data.url);
    console.log("Final GIF URL:", fullUrl);
    return fullUrl;
  } catch (error) {
    console.error("Error uploading GIF to external API:", error);
    throw error;
  }
};
 

/**
 * Upload image with store
 * @param imageFile - The image file to upload
 * */

export const uploadImageWithStore = async (imageFile: File): Promise<string> => {
  try {
    console.log("Starting image upload with store...");
    console.log("Image file:", {
      name: imageFile.name,
      size: imageFile.size,
      type: imageFile.type
    });

    // Create form data for upload
    const formData = new FormData();
    formData.append("store", imageFile);

    console.log("Sending upload request to external API with store");
    
    // Upload to external PHP API
    const uploadResponse = await fetch(UPLOAD_CONFIG.EXTERNAL_API.UPLOAD_STORE, {
      method: "POST",
      body: formData,
    });

    console.log("Upload response status:", uploadResponse.status);

    if (!uploadResponse.ok) {
      const errorText = await uploadResponse.text();
      console.error("Upload error response:", errorText);
      throw new Error(`Image upload with store failed: ${uploadResponse.statusText}`);
    }

    const data: UploadResponse = await uploadResponse.json();
    console.log("Image uploaded successfully with store:", data);

    if (!data.success || !data.data?.url) {
      throw new Error(data.message || "Upload failed");
    }

    // Return the full URL from the API using helper function
    const fullUrl = UPLOAD_CONFIG.EXTERNAL_API.getFileUrl(data.data.url);
    console.log("Final image URL with store:", fullUrl);
    return fullUrl;
  } catch (error) {
    console.error("Error uploading image with store:", error);
    throw error;
  }
}

// upload for frame

export const uploadFrameToExternalAPI = async (frameFile: File): Promise<string> => {
  try {
    console.log("Starting frame upload to external API...");
    console.log("Frame file:", {
      name: frameFile.name,
      size: frameFile.size,
      type: frameFile.type
    });

    // Create form data for upload
    const formData = new FormData();
    formData.append("frame", frameFile);

    console.log("Sending upload request to external API");
    
    // Upload to external PHP API
    const uploadResponse = await fetch(UPLOAD_CONFIG.EXTERNAL_API.UPLOAD_FRAME, {
      method: "POST",
      body: formData,
    });

    console.log("Upload response status:", uploadResponse.status);

    if (!uploadResponse.ok) {
      const errorText = await uploadResponse.text();
      console.error("Upload error response:", errorText);
      throw new Error(`Frame upload failed: ${uploadResponse.statusText}`);
    }

    const data: UploadResponse = await uploadResponse.json();
    console.log("Frame uploaded successfully:", data);

    if (!data.success || !data.data?.url) {
      throw new Error(data.message || "Upload failed");
    }

    // Return the full URL from the API using helper function
    const fullUrl = UPLOAD_CONFIG.EXTERNAL_API.getFileUrl(data.data.url);
    console.log("Final frame URL:", fullUrl);
    return fullUrl;
  } catch (error) {
    console.error("Error uploading frame to external API:", error);
    throw error;
  }
}

/**
 * Delete frame file from external API
 */
 