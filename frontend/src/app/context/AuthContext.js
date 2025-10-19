// app/context/AuthContext.js
"use client"; // <-- This is crucial for Next.js App Router

import React, { createContext, useState, useContext, useEffect } from "react";
import { useRouter } from "next/navigation"; // <-- Use Next.js router

const AuthContext = createContext();

// Define your backend URL
const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api";

export const AuthProvider = ({ children }) => {
    const [token, setToken] = useState(null);
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true); // Prevent layout shifts
    const router = useRouter();

    useEffect(() => {
        // Check local storage for token on app load
        const storedToken = localStorage.getItem("healthmate_token");
        const storedUser = localStorage.getItem("healthmate_user");

        if (storedToken && storedUser) {
            setToken(storedToken);
            setUser(JSON.parse(storedUser));
        }
        setLoading(false);
    }, []);

    const login = (newToken, newUser) => {
        setToken(newToken);
        setUser(newUser);
        localStorage.setItem("healthmate_token", newToken);
        localStorage.setItem("healthmate_user", JSON.stringify(newUser));
        router.push("/dashboard"); // Redirect to dashboard on login
    };

    const logout = () => {
        setToken(null);
        setUser(null);
        localStorage.removeItem("healthmate_token");
        localStorage.removeItem("healthmate_user");
        router.push("/login"); // Redirect to login on logout
    };

    return (
        <AuthContext.Provider
            value={{
                token,
                user,
                login,
                logout,
                loading,
                isAuthenticated: !!token,
                API_URL // Expose the API_URL for other components
            }}
        >
            {!loading && children}
        </AuthContext.Provider>
    );
};

// Custom hook to use the auth context
export const useAuth = () => {
    return useContext(AuthContext);
};