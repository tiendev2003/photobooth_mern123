export const UPLOAD_CONFIG = {
  USE_EXTERNAL_API: true,

  EXTERNAL_DOMAIN:  process.env.NEXT_PUBLIC_EXTERNAL_DOMAIN || "https://danango.com",
  EXTERNAL_API_PATH:  process.env.NEXT_PUBLIC_EXTERNAL_API_PATH || "/api.php",
  EXTERNAL_UPLOADS_PATH:  process.env.NEXT_PUBLIC_EXTERNAL_UPLOADS_PATH || "/uploads",

  // External PHP API endpoints - auto-generated from domain and paths
  get EXTERNAL_API() {
    const baseUrl = `${this.EXTERNAL_DOMAIN}${this.EXTERNAL_API_PATH}`;
    return {
      BASE_URL: baseUrl,
      UPLOAD_VIDEO: `${baseUrl}?action=upload_video`,
      UPLOAD_IMAGE: `${baseUrl}?action=upload_image`,
      UPLOAD_GIF: `${baseUrl}?action=upload_gif`,
      UPLOAD_STORE: `${baseUrl}?action=upload_store`,
      GET_FILES: `${baseUrl}?action=get_files`,
      // Helper function to get full URL for uploaded files
      getFileUrl: (relativePath: string) =>
        `${this.EXTERNAL_DOMAIN}/${relativePath}`,
    };
  },

  // Internal Next.js API endpoints
  INTERNAL_API: {
    UPLOAD_VIDEO: "/api/images/video",
    UPLOAD_IMAGE: "/api/images",
    UPLOAD_GIF: "/api/images/gif",
  },
};

export type UploadMode = "external" | "internal";
