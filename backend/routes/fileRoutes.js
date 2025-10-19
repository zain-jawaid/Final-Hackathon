import express from "express";
import multer from "multer";
import { verifyToken } from "../middleware/authMiddleware.js";
import cloudinary from "../utils/cloudinary.js";
import File from "../models/File.js";

const router = express.Router();

// multer setup
const storage = multer.memoryStorage();
const upload = multer({ storage });

// helper to upload buffer to Cloudinary
function uploadToCloudinary(fileBuffer, mimetype) {
  return new Promise((resolve, reject) => {
    // if the file is PDF, explicitly set resource_type = "raw"
    const isPdf = mimetype === "application/pdf";
    const options = {
      resource_type: isPdf ? "raw" : "auto",
      folder: "healthmate_uploads",
    };

    const stream = cloudinary.uploader.upload_stream(options, (error, result) => {
      if (error) reject(error);
      else resolve(result);
    });

    stream.end(fileBuffer);
  });
}


// 📤 upload endpoint
router.post("/upload", verifyToken, upload.single("file"), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ message: "No file uploaded" });

    const uploadResult = await uploadToCloudinary(req.file.buffer, req.file.mimetype);


    const newFile = new File({
      user: req.user.id,
      filename: req.file.originalname,
      fileUrl: uploadResult.secure_url,
      fileType: req.file.mimetype,
    });

    await newFile.save();

    res.json({
      message: "File uploaded successfully ✅",
      file: newFile,
    });
  } catch (err) {
    console.error("Upload error:", err);
    res.status(500).json({ message: "Server error", error: err.message });
  }
});
// Add this to /routes/fileRoute.js (at the end, before 'export default router;')

/* -------------------------------------------------------------------------- */
/* 📂 Get all files for the logged-in user                                     */
/* -------------------------------------------------------------------------- */
router.get("/", verifyToken, async (req, res) => {
  try {
    // Find all files for the current user (req.user.id)
    // Sort them by newest first (descending)
    const files = await File.find({ user: req.user.id }).sort({ uploadedAt: -1 });
    
    if (!files) {
      return res.json([]); // Return empty array, not an error
    }

    res.json(files);
  } catch (err) {
    console.error("Error fetching files:", err);
    res.status(500).json({ message: "Server error", error: err.message });
  }
});

export default router;
