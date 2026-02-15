/**
 * Cloudinary Image Upload Service
 */

const CLOUD_NAME = "dpj7g7cft";
const UPLOAD_PRESET = "voidly_app";

/**
 * Uploads an image file to Cloudinary
 * @param file The image file to upload
 * @returns Promise<string> The secure URL of the uploaded image
 */
export const uploadToCloudinary = async (file: File): Promise<string> => {
  const formData = new FormData();
  formData.append("file", file);
  formData.append("upload_preset", UPLOAD_PRESET);

  try {
    const response = await fetch(
      `https://api.cloudinary.com/v1_1/${CLOUD_NAME}/image/upload`,
      {
        method: "POST",
        body: formData,
      }
    );

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error?.message || "Error uploading to Cloudinary");
    }

    const data = await response.json();
    return data.secure_url;
  } catch (error) {
    console.error("Cloudinary upload failed:", error);
    throw error;
  }
};
