import mongoose from "mongoose";
import File from "./File.js";
import User from "./User.js";

const insightSchema = new mongoose.Schema({
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    // 👇 Is this ref spelled "File" (capital F)?
    file: { type: mongoose.Schema.Types.ObjectId, ref: "File", required: true },
    summaryEnglish: String,
    summaryRomanUrdu: String,
    highlights: [String],
    questionsForDoctor: [String],
    suggestions: [String],
    createdAt: { type: Date, default: Date.now },
});

export default mongoose.model("Insight", insightSchema);
