import mongoose from "mongoose";

const fileSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  filename: String,
  fileUrl: String,
  fileType: String, // pdf, image, etc.
  uploadedAt: { type: Date, default: Date.now },
});

const File = mongoose.model("File", fileSchema);
export default File;
