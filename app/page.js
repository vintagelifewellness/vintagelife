"use client";

import Link from "next/link";

export default function Home() {
  return (
    <div className="relative flex items-center justify-center h-screen overflow-hidden bgw">
      {/* Glassmorphism Card */}
      <div className="backdrop-blur-2xl bg-white/10 p-10 rounded-3xl shadow-[0_0_30px_rgba(0,0,0,0.1)] border border-white/20 w-full max-w-md text-center">
        
        <h1 className="text-4xl font-extrabold  drop-shadow-sm">
          Vintage Life Wellness
        </h1>
        <p className=" mt-2">
          Transform Your Life, Build Your Future 🚀
        </p>

        <div className="mt-8 flex flex-col gap-4">
          {/* Sign Up */}
          <Link
            href="/signup"
            className="relative overflow-hidden w-full py-4 text-lg font-bold text-white rounded-xl shadow-lg bg-gradient-to-r from-pink-500 to-orange-500 transition-all duration-300 "
          >
            <span className="relative z-10">Join Now</span>
            <span className="absolute inset-0 bg-white/20 opacity-0 hover:opacity-100 transition"></span>
          </Link>

          {/* Login */}
          <Link
            href="/signin"
            className="relative overflow-hidden w-full py-4 text-lg font-bold text-gray-900 bg-white/80 rounded-xl shadow-lg border border-gray-200 transition-all duration-300 hover:bg-white"
          >
            <span className="relative z-10">Login</span>
            <span className="absolute inset-0 bg-yellow-200/20 opacity-0 hover:opacity-100 transition"></span>
          </Link>
        </div>
      </div>
    </div>
  );
}
