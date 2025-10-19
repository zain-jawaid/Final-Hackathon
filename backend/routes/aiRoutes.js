import express from "express";
import fetch from "node-fetch";
import dotenv from "dotenv";
import pdf from "pdf-parse-fork"; // ✅ stable PDF parser fork
import { v2 as cloudinary } from "cloudinary";

import File from "../models/File.js";
import Insight from "../models/Insight.js";
import { verifyToken } from "../middleware/authMiddleware.js";

dotenv.config();

cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
});

const router = express.Router();

/* -------------------------------------------------------------------------- */
/* 🧠 Helper: Extract text from Cloudinary PDF                                 */
/* -------------------------------------------------------------------------- */
async function extractTextFromPDF(url) {
    console.log("📄 Fetching PDF from Cloudinary securely:", url);

    function extractPublicId(cloudUrl) {
        const regex = /\/upload\/(?:v\d+\/)?([^?#]+)/;
        const match = cloudUrl.match(regex);
        if (!match || !match[1])
            throw new Error("Could not extract Cloudinary public ID from URL.");
        return match[1].replace(/\.[^/.]+$/, "");
    }

    let signedUrl;
    try {
        const publicId = extractPublicId(url);
        signedUrl = cloudinary.url(publicId, {
            resource_type: "raw",
            type: "upload",
            sign_url: true,
            secure: true,
            format: "pdf",
        });
    } catch (err) {
        console.warn("⚠️ Cloudinary signing failed, falling back to direct URL:", err.message);
        signedUrl = url;
    }

    const response = await fetch(signedUrl);
    if (!response.ok) {
        const fallbackResponse = await fetch(url);
        if (!fallbackResponse.ok)
            throw new Error(`Failed to fetch PDF: ${fallbackResponse.statusText}`);
        const fbBuffer = Buffer.from(await fallbackResponse.arrayBuffer());
        const fbData = await pdf(fbBuffer);
        return fbData.text;
    }

    const buffer = Buffer.from(await response.arrayBuffer());
    const data = await pdf(buffer);
    return data.text;
}

/* -------------------------------------------------------------------------- */
/* 🧠 Helper: Safe Gemini API call                                             */
/* -------------------------------------------------------------------------- */
async function safeGeminiCall(promptText) {
    try {
        const GEMINI_MODEL = "models/gemini-2.5-flash";
        const response = await fetch(
            `https://generativelanguage.googleapis.com/v1beta/${GEMINI_MODEL}:generateContent?key=${process.env.GEMINI_API_KEY}`,
            {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    contents: [
                        {
                            role: "user",
                            parts: [{ text: promptText }],
                        },
                    ],
                }),
            }
        );
        const data = await response.json();
        return data?.candidates?.[0]?.content?.parts?.[0]?.text || "";
    } catch (err) {
        console.error("⚠️ Gemini API call failed:", err);
        return "";
    }
}

/* -------------------------------------------------------------------------- */
/* 🧠 Main AI analysis route                                                   */
/* -------------------------------------------------------------------------- */
router.post("/analyze/:fileId", verifyToken, async (req, res) => {
    try {
        const cleanFileId = req.params.fileId.trim();
        const file = await File.findById(cleanFileId);
        if (!file) return res.status(404).json({ message: "File not found ❌" });

        const extractedText = await extractTextFromPDF(file.fileUrl);
        const limitedText = extractedText.slice(0, 8000);

        // --- Step 1: Structured English AI Analysis ---
        const englishPrompt = `
You are a medical report analysis assistant.
Analyze the following text from a lab report and respond ONLY in pure JSON with this structure:

{
  "summary": "Short plain-English summary of the report",
  "abnormalValues": ["List of all values that seem high or low"],
  "suggestions": ["Lifestyle, diet, or exercise recommendations"],
  "questionsForDoctor": ["Questions the user should ask their doctor"]
}

Do not include markdown or explanations — return raw JSON only.
Here is the report text:
${limitedText}
`;

        const aiText = await safeGeminiCall(englishPrompt);

        let aiOutput;
        try {
            aiOutput = JSON.parse(aiText);
        } catch (err) {
            console.error("⚠️ Failed to parse Gemini JSON:", err);
            aiOutput = {
                summary: "AI could not structure the data properly.",
                abnormalValues: [],
                suggestions: [],
                questionsForDoctor: [],
            };
        }

        // --- Step 2: Roman Urdu Translation ---
        const romanUrduPrompt = `Translate the following English text into Roman Urdu, keeping it simple and easy to understand:\n\n${aiOutput.summary}`;
        const romanUrduText = await safeGeminiCall(romanUrduPrompt);

        // --- Step 3: Save Insight in MongoDB ---
        const insight = await Insight.create({
            user: req.user.id,
            file: file._id,
            summaryEnglish: aiOutput.summary,
            summaryRomanUrdu: romanUrduText || "Roman Urdu translation unavailable.",
            highlights: aiOutput.abnormalValues || [],
            questionsForDoctor: aiOutput.questionsForDoctor || [],
            suggestions: aiOutput.suggestions || [],
        });

        res.json({ message: "AI analysis completed ✅", insight });
    } catch (err) {
        console.error("❌ Error in /analyze:", err);
        res.status(500).json({ message: "AI processing error", error: err.message });
    }
});

/* -------------------------------------------------------------------------- */
/* 🧩 Get AI Insight by File                                                   */
/* -------------------------------------------------------------------------- */
router.get("/insight/:fileId", verifyToken, async (req, res) => {
    try {
        // 👇✅ FIX APPLIED HERE: Added .populate("file")
        const insight = await Insight.findOne({ file: req.params.fileId }).populate("file");

        if (!insight) return res.status(404).json({ message: "Insight not found" });
        res.json(insight);
    } catch (err) {
        res.status(500).json({ message: "Server error", error: err.message });
    }
});

export default router;