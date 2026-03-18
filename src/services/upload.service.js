import api from "./api.service";
import axios from "axios";

export const uploadService = {
  async getPresignedUrl(payload) {
    const { data } = await api.post("/api/uploads/presigned-url", payload);
    return data.data;
  },

  async uploadToS3(presignedUrl, file, onProgress) {
    await axios.put(presignedUrl, file, {
      headers: { "Content-Type": file.type },
      onUploadProgress: (progressEvent) => {
        if (onProgress) {
          const percent = Math.round(
            (progressEvent.loaded * 100) / progressEvent.total,
          );
          onProgress(percent);
        }
      },
    });
  },

  async confirmUpload(uploadId) {
    const { data } = await api.post("/api/uploads/confirm", { uploadId });
    return data.data;
  },

  async getStatus(uploadId) {
    const { data } = await api.get(`/api/uploads/${uploadId}/status`);
    return data.data;
  },

  async getUploads(params = {}) {
    const { data } = await api.get("/api/uploads", { params });
    return data.data;
  },

  async deleteUpload(uploadId) {
    await api.delete(`/api/uploads/${uploadId}`);
  },

  // Full upload flow: presign → upload to S3 → confirm
  async uploadVideo({ file, movieId, onProgress }) {
    // Step 1: Get presigned URL
    const { uploadId, presignedUrl } = await this.getPresignedUrl({
      fileName: file.name,
      mimeType: file.type,
      sizeBytes: file.size,
      movieId,
    });

    // Step 2: Upload directly to S3
    await this.uploadToS3(presignedUrl, file, onProgress);

    // Step 3: Confirm and trigger transcoding
    return await this.confirmUpload(uploadId);
  },
};
