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
 * Upload image to external PHP API with filter parameters
 */
export interface ImageFilterParams {
  filter: string;
  brightness: number;
  contrast: number;
  saturation: number;
  quality: number;
}

export const uploadImageWithFilterToExternalAPI = async (
  imageFile: File, 
  filterParams: ImageFilterParams
): Promise<string> => {
  try {
    console.log("Starting image upload with filter to external API...");
    console.log("Image file:", {
      name: imageFile.name,
      size: imageFile.size,
      type: imageFile.type
    });
    console.log("Filter parameters:", filterParams);

    // Create form data for upload with filter parameters
    const formData = new FormData();
    formData.append("image", imageFile);
    formData.append("filter", filterParams.filter);
    formData.append("brightness", filterParams.brightness.toString());
    formData.append("contrast", filterParams.contrast.toString());
    formData.append("saturation", filterParams.saturation.toString());
    formData.append("quality", filterParams.quality.toString());

    console.log("Sending upload request with filter parameters to external API");
    
    // Upload to external PHP API
    const uploadResponse = await fetch(UPLOAD_CONFIG.EXTERNAL_API.UPLOAD_IMAGE, {
      method: "POST",
      body: formData,
    });

    console.log("Upload response status:", uploadResponse.status);

    if (!uploadResponse.ok) {
      const errorText = await uploadResponse.text();
      console.error("Upload error response:", errorText);
      throw new Error(`Image upload with filter failed: ${uploadResponse.statusText}`);
    }

    const data: UploadResponse = await uploadResponse.json();
    console.log("Image with filter uploaded successfully:", data);

    if (!data.success || !data.data?.url) {
      throw new Error(data.message || "Upload failed");
    }

    // Return the full URL from the API using helper function
    const fullUrl = UPLOAD_CONFIG.EXTERNAL_API.getFileUrl(data.data.url);
    console.log("Final filtered image URL:", fullUrl);
    return fullUrl;
  } catch (error) {
    console.error("Error uploading image with filter to external API:", error);
    throw error;
  }
};
 
 