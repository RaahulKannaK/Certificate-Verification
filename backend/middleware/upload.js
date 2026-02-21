import multer from "multer";
import { CloudinaryStorage } from "multer-storage-cloudinary";
import cloudinary from "../config/cloudinary.js";

const storage = new CloudinaryStorage({
  cloudinary,
  params: {
    folder: "certificates",
    resource_type: "auto", // supports PDF & images
  },
});

const upload = multer({ storage });

export default upload;