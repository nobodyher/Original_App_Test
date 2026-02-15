import { useState } from "react";
import { doc, updateDoc } from "firebase/firestore";
import { db } from "../firebase";
import { uploadToCloudinary } from "../services/cloudinaryService";
import type { AppUser, Toast } from "../types";

interface UsePhotoUploadResult {
  isUploading: boolean;
  handlePhotoChange: (e: React.ChangeEvent<HTMLInputElement>) => Promise<void>;
}

export const usePhotoUpload = (
  currentUser: AppUser | null,
  showNotification: (message: string, type?: Toast["type"]) => void
): UsePhotoUploadResult => {
  const [isUploading, setIsUploading] = useState(false);

  const handlePhotoChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !currentUser) return;

    try {
      setIsUploading(true);
      showNotification("Subiendo foto...", "info");

      // 1. Upload to Cloudinary
      const imageUrl = await uploadToCloudinary(file);

      // 2. Update Firestore
      const userRef = doc(db, "users", currentUser.id);
      await updateDoc(userRef, {
        photoURL: imageUrl,
      });

      showNotification("Foto de perfil actualizada", "success");
    } catch (error) {
      console.error("Error updating profile photo:", error);
      showNotification("Error al actualizar la foto", "error");
    } finally {
      setIsUploading(false);
      // Reset input value to allow selecting same file again if needed
      e.target.value = "";
    }
  };

  return { isUploading, handlePhotoChange };
};
