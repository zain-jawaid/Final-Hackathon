import mongoose from "mongoose";

const aiInsightSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  file: { type: mongoose.Schema.Types.ObjectId, ref: "File", required: true },
  summaryEnglish: String,
  summaryRomanUrdu: String,
  highlights: [String],
  questionsForDoctor: [String],
  suggestions: [String],
  createdAt: { type: Date, default: Date.now },
});

const AiInsight = mongoose.model("AiInsight", aiInsightSchema);
export default AiInsight;
