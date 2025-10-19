// app/dashboard/layout.js
"use client";

import { useAuth } from "../context/AuthContext";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import Link from "next/link";

// This is the main layout for the entire logged-in app
export default function DashboardLayout({ children }) {
    const { isAuthenticated, loading, logout, user } = useAuth();
    const router = useRouter();

    useEffect(() => {
        // If auth is still loading, wait.
        if (loading) return;

        // If not authenticated, redirect to login page.
        if (!isAuthenticated) {
            router.replace("/login");
        }
    }, [isAuthenticated, loading, router]);

    // While loading or if not authenticated, show a loading message
    // to prevent flashing the dashboard content.
    if (loading || !isAuthenticated) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <p>Loading...</p>
            </div>
        );
    }

    // If authenticated, show the dashboard layout
    return (
        <div className="min-h-screen bg-gray-100">
            {/* --- Navbar --- */}
            <nav className="bg-white shadow-sm">
                <div className="max-w-4xl px-4 mx-auto">
                    <div className="flex items-center justify-between h-16">
                        <Link href="/dashboard" className="text-2xl font-bold text-indigo-600">
                            HealthMate
                        </Link>
                        <div className="flex items-center space-x-4">
                            <span className="text-sm text-gray-700">Hi, {user?.name}!</span>
                            <button
                                onClick={logout} // <-- Logout button
                                className="px-3 py-2 text-sm font-medium text-gray-700 bg-gray-200 rounded-md hover:bg-gray-300"
                            >
                                Logout
                            </button>
                        </div>
                    </div>
                </div>
            </nav>

            {/* --- Page Content --- */}
            <main className="max-w-4xl p-4 mx-auto">
                {children} {/* <-- This is where your page.js will go */}
            </main>
        </div>
    );
}