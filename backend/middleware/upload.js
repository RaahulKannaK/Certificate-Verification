import multer from "multer";
import { CloudinaryStorage } from "multer-storage-cloudinary";
import cloudinary from "../config/cloudinary.js";

const storage = new CloudinaryStorage({
  cloudinary,
  params: {
    folder: "certificates",
    resource_type: "raw", // ✅ BEST for PDFs
    format: async (req, file) => "pdf",
    public_id: (req, file) =>
      `cert-${Date.now()}`,
  },
});

const upload = multer({ storage });

console.log("Cloudinary storage initialized");

export default upload;