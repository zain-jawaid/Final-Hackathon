"use client";

import { useState, useEffect } from "react";
import { useAuth } from "../../context/AuthContext";
import { useParams } from "next/navigation";
import axios from "axios";
import Link from "next/link";

export default function ReportViewPage() {
    const [insight, setInsight] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [viewLang, setViewLang] = useState("en"); // 'en' or 'ru'
    const { token, API_URL } = useAuth();
    const params = useParams(); // Gets the { fileId: "..." } from the URL
    const { fileId } = params;

    useEffect(() => {
        const fetchInsight = async () => {
            console.log("📌 useEffect triggered");
            console.log("fileId:", fileId);
            console.log("token:", token);
            console.log("API_URL:", API_URL);

            if (!token || !fileId) {
                console.warn("⚠️ Token or fileId missing, skipping fetch");
                setLoading(false);
                return;
            }

            setLoading(true);
            try {
                const response = await axios.get(
                    `${API_URL}/ai/insight/${fileId}`,
                    { headers: { Authorization: `Bearer ${token}` } }
                );
                console.log("✅ Insight fetched successfully:", response.data);

                setInsight(response.data);
                setError(null);
            } catch (err) {
                console.error("❌ Failed to fetch insight:", err);
                setError(err.response?.data?.message || "Could not load analysis.");
            } finally {
                setLoading(false);
                console.log("🔹 Loading state set to false");
            }
        };

        fetchInsight();
    }, [token, fileId, API_URL]);

    // --- Loading and Error States ---
    if (loading) {
        return (
            <div className="p-8 text-center">
                <p className="text-lg text-gray-700">🧠 Analyzing your report... Please wait.</p>
                <p className="text-sm text-gray-500 mt-2">Check console for debug logs.</p>
            </div>
        );
    }

    if (error) {
        return (
            <div className="p-8 text-center">
                <p className="text-lg text-red-600">{error}</p>
                <Link href="/dashboard" className="mt-4 text-indigo-600 hover:underline">
                    &larr; Back to Dashboard
                </Link>
            </div>
        );
    }

    if (!insight) return null; // Should be covered by loading/error

    console.log("📌 Rendering main content for insight:", insight);

    // --- Main Content ---
    return (
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">

            {/* --- 1. Report Viewer (Left Side) --- */}
            <div className="p-6 bg-white rounded-lg shadow">
                <h2 className="pb-2 mb-4 text-2xl font-semibold text-gray-900 border-b">
                    {insight.file?.filename || "Report File"}
                </h2>

                {/* Display PDF or Image */}
                {insight.file?.fileType === "application/pdf" ? (
                    <iframe
                        src={insight.file.fileUrl}
                        className="w-full border rounded-md h-96 md:h-[600px]"
                        title="Report"
                    ></iframe>
                ) : (
                    <img
                        src={insight.file?.fileUrl}
                        alt="Medical Report"
                        className="object-contain w-full border rounded-md h-96 md:h-[600px]"
                    />
                )}
            </div>

            {/* --- 2. AI Analysis (Right Side) --- */}
            <div className="p-6 space-y-6 bg-white rounded-lg shadow">
                <h2 className="text-2xl font-semibold text-gray-900">
                    🧠 AI Analysis
                </h2>

                {/* --- Bilingual Toggle --- */}
                <div className="flex p-1 space-x-1 bg-gray-200 rounded-md">
                    <button
                        onClick={() => setViewLang("en")}
                        className={`w-full px-3 py-2 rounded-md ${viewLang === 'en' ? 'bg-white shadow' : 'text-gray-700'}`}
                    >
                        English
                    </button>
                    <button
                        onClick={() => setViewLang("ru")}
                        className={`w-full px-3 py-2 rounded-md ${viewLang === 'ru' ? 'bg-white shadow' : 'text-gray-700'}`}
                    >
                        Roman Urdu
                    </button>
                </div>

                {/* --- Summary --- */}
                <div>
                    <h3 className="text-lg font-semibold text-gray-800">Summary</h3>
                    <p className="mt-1 text-gray-700">
                        {viewLang === "en" ? insight.summaryEnglish : insight.summaryRomanUrdu}
                    </p>
                </div>

                {/* --- Highlights --- */}
                <div>
                    <h3 className="text-lg font-semibold text-gray-800">Key Highlights</h3>
                    <ul className="mt-1 space-y-1 list-disc list-inside text-gray-700">
                        {insight.highlights?.length > 0 ? (
                            insight.highlights.map((item, i) => <li key={i}>{item}</li>)
                        ) : (
                            <li>No abnormal values found.</li>
                        )}
                    </ul>
                </div>

                {/* --- Questions for Doctor --- */}
                <div>
                    <h3 className="text-lg font-semibold text-gray-800">Questions to Ask Your Doctor</h3>
                    <ul className="mt-1 space-y-1 list-disc list-inside text-gray-700">
                        {insight.questionsForDoctor?.map((item, i) => (
                            <li key={i}>{item}</li>
                        ))}
                    </ul>
                </div>

                {/* --- Disclaimer --- */}
                <div className="p-3 text-sm text-center text-gray-600 bg-gray-100 rounded-md">
                    <p><strong>Disclaimer:</strong> {viewLang === "en"
                        ? "AI is for understanding only, not for medical advice."
                        : "Yeh AI sirf samajhne ke liye hai, ilaaj ke liye nahi."}
                    </p>
                </div>
            </div>

        </div>
    );
}
