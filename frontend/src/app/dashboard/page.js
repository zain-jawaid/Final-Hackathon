// app/dashboard/page.js
"use client";

import { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import axios from "axios";
import Link from "next/link";

export default function DashboardPage() {
    const [reports, setReports] = useState([]);
    const [selectedFile, setSelectedFile] = useState(null);
    const [status, setStatus] = useState(""); // e.g., "uploading", "analyzing", "error"
    const [error, setError] = useState(null);
    const { token, API_URL } = useAuth();

    // --- 1. Function to fetch all reports ---
    const fetchReports = async () => {
        if (!token) return;
        try {
            const response = await axios.get(`${API_URL}/files`, {
                headers: { Authorization: `Bearer ${token}` },
            });
            setReports(response.data);
        } catch (err) {
            console.error("Failed to fetch reports:", err);
            setError("Could not load your reports.");
        }
    };

    // --- 2. Fetch reports on component load ---
    useEffect(() => {
        fetchReports();
    }, [token]); // Re-run if token changes

    // --- 3. Handle file selection ---
    const handleFileChange = (e) => {
        setSelectedFile(e.target.files[0]);
        setError(null);
        setStatus("");
    };

    // --- 4. Handle the entire upload + analyze flow ---
    const handleUpload = async (e) => {
        e.preventDefault();
        if (!selectedFile) return;

        const formData = new FormData();
        formData.append("file", selectedFile);

        try {
            // --- STEP 1: Upload the file ---
            setStatus("uploading");
            const uploadResponse = await axios.post(
                `${API_URL}/files/upload`,
                formData,
                {
                    headers: {
                        "Content-Type": "multipart/form-data",
                        Authorization: `Bearer ${token}`,
                    },
                }
            );

            const newFile = uploadResponse.data.file;

            // --- STEP 2: Trigger AI analysis ---
            setStatus("analyzing");
            await axios.post(
                `${API_URL}/ai/analyze/${newFile._id}`,
                {}, // Empty body
                { headers: { Authorization: `Bearer ${token}` } }
            );

            // --- STEP 3: Success! ---
            setStatus("success");
            setSelectedFile(null); // Clear the input
            fetchReports(); // Refresh the list

            // Clear status after a few seconds
            setTimeout(() => setStatus(""), 3000);


        } catch (err) {
            console.error("Upload/Analyze failed:", err);
            setError(err.response?.data?.message || "An error occurred.");
            setStatus("error");
        }
    };

    // --- Helper for loading button text ---
    const getButtonText = () => {
        if (status === "uploading") return "Uploading...";
        if (status === "analyzing") return "Analyzing...";
        return "Upload and Analyze";
    };

    return (
        <div className="space-y-8">
            {/* --- 1. UPLOAD SECTION --- */}
            <div className="p-6 bg-white rounded-lg shadow">
                <h2 className="text-2xl font-semibold text-gray-900">
                    Upload New Report
                </h2>
                <p className="mt-1 text-sm text-gray-600">
                    Upload a PDF or image of your medical report.
                </p>
                <form className="mt-4 space-y-4" onSubmit={handleUpload}>
                    <input
                        type="file"
                        onChange={handleFileChange}
                        accept="application/pdf,image/*" // Accept PDF and images
                        className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100"
                    />
                    <button
                        type="submit"
                        disabled={!selectedFile || status === "uploading" || status === "analyzing"}
                        className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-md shadow-sm disabled:opacity-50 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                    >
                        {getButtonText()}
                    </button>
                    {status === "success" && <p className="text-sm text-green-600">File uploaded and analysis started!</p>}
                    {status === "error" && <p className="text-sm text-red-600">{error}</p>}
                </form>
            </div>

            {/* --- 2. REPORT LIST SECTION --- */}
            <div className="p-6 bg-white rounded-lg shadow">
                <h2 className="text-2xl font-semibold text-gray-900">
                    Your Medical Reports
                </h2>
                <div className="mt-4 space-y-3">
                    {reports.length === 0 && <p className="text-sm text-gray-500">You haven&apos;t uploaded any reports yet.</p>}
                    {reports.map((report) => (
                        <Link
                            key={report._id}
                            href={`/reports/${report._id}`} // <-- This is our next step
                            className="block p-4 bg-gray-50 rounded-md hover:bg-gray-100"
                        >
                            <p className="font-medium text-indigo-700">{report.filename}</p>
                            <p className="text-sm text-gray-600">
                                Uploaded on: {new Date(report.uploadedAt).toLocaleDateString()}
                            </p>
                        </Link>
                    ))}
                </div>
            </div>
        </div>
    );
}