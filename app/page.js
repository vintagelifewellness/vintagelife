"use client";
import Link from "next/link";
import { useState } from "react";

export default function Home() {
  const [userType, setUserType] = useState("user");

  return (
    // min-h-screen ensures it doesn't break on short mobile devices. px-4 gives breathing room on edges.
    <div className="relative flex items-center justify-center min-h-screen px-4 py-8 overflow-hidden bg-gradient-to-br from-[#f3f7f4] to-[#e4ede6]">
      
      {/* Decorative Background Elements for a premium feel */}
      <div className="absolute top-[-10%] left-[-10%] w-96 h-96 bg-[#0b5911]/10 rounded-full blur-3xl"></div>
      <div className="absolute bottom-[-10%] right-[-10%] w-96 h-96 bg-[#0b5911]/10 rounded-full blur-3xl"></div>

      {/* Glassmorphism Card */}
      <div className="relative z-10 w-full max-w-md p-8 sm:p-12 backdrop-blur-xl bg-white/70 rounded-[2rem] shadow-2xl border border-white text-center transition-all duration-500">
        
        {/* Title Section */}
        <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-gray-900 drop-shadow-sm">
          Vintage Life Wellness
        </h1>

        {/* Dynamic Subtitle - using min-height so it doesn't jump layout when text length changes */}
        <div className="min-h-[60px] sm:min-h-[48px] flex items-center justify-center mt-3">
          <p className="text-sm sm:text-base text-gray-600 font-medium leading-relaxed">
            {userType === "user" 
              ? "Sign in to manage your wellness journey and shop premium products." 
              : "Access the partner portal for Clearing & Forwarding agents."}
          </p>
        </div>

        {/* Premium Segmented Control Toggle */}
        <div className="flex justify-center mt-6 mb-8">
          <div className="flex bg-gray-200/60 p-1.5 rounded-full shadow-inner w-full sm:w-[85%] relative border border-gray-100">
            <button
              onClick={() => setUserType("user")}
              className={`cursor-pointer flex-1 py-2.5 text-xs sm:text-sm font-bold tracking-wide rounded-full transition-all duration-300 z-10 ${
                userType === "user"
                  ? "bg-white text-[#0b5911] shadow-md" 
                  : "text-gray-500 hover:text-gray-800"
              }`}
            >
              Customer
            </button>
            <button
              onClick={() => setUserType("cf")}
              className={`cursor-pointer flex-1 py-2.5 text-xs sm:text-sm font-bold tracking-wide rounded-full transition-all duration-300 z-10 ${
                userType === "cf"
                  ? "bg-white text-[#0b5911] shadow-md" 
                  : "text-gray-500 hover:text-gray-800"
              }`}
            >
              C&F Partner
            </button>
          </div>
        </div>

        <div className="flex flex-col gap-4">
         
          <Link
            href={userType === "cf" ? "/signupc&f" : "/signup"}
            className="group relative flex items-center justify-center w-full py-4 text-base sm:text-lg font-bold text-white bg-[#0b5911] rounded-2xl shadow-lg transition-all duration-300 hover:bg-[#08420c] hover:shadow-xl hover:-translate-y-0.5 active:translate-y-0"
          >
            <span>
              {userType === "cf" ? "Apply as C&F Partner" : "Create an Account"}
            </span>
          </Link>

          <Link
            href={userType === "cf" ? "/signinc&f" : "/signin"}
            className="group relative flex items-center justify-center w-full py-4 text-base sm:text-lg font-bold text-[#0b5911] bg-white rounded-2xl shadow-sm border-2 border-gray-100 transition-all duration-300 hover:border-[#0b5911]/30 hover:bg-gray-50 hover:-translate-y-0.5 active:translate-y-0"
          >
            <span>
              {userType === "cf" ? "C&F Login" : "Log In"}
            </span>
          </Link>

        </div>

      </div>
    </div>
  );
}