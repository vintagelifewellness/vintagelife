"use client";

import { useState } from "react";
import { Wallet, Wrench, X } from "lucide-react";

export default function WalletButton() {
  const [showMaintenance, setShowMaintenance] = useState(false);

  return (
    <>
      {/* AI-Themed Compact Wallet Button */}
      <button
        onClick={() => setShowMaintenance(true)}
        className="group flex items-center gap-2 rounded-full border border-white/10 bg-black/40 px-2 py-1.5 backdrop-blur-md transition-all duration-300 hover:border-green-500/50 hover:bg-black/60 hover:shadow-[0_0_15px_rgba(139,92,246,0.2)]"
      >
        <div className="flex h-6 w-6 items-center justify-center rounded-full bg-gradient-to-br from-green-500 to-green-600 shadow-inner">
          <Wallet className="h-3.5 w-3.5 text-white" />
        </div>

        <div className="hidden pr-2 text-left sm:block">
          <p className="text-[9px] font-medium uppercase tracking-wider text-gray-400">
            Wallet
          </p>
         
        </div>
      </button>

      {/* Futuristic Maintenance Modal */}
      {showMaintenance && (
        <div
          className="fixed inset-0 z-[9999] flex items-center justify-center   transition-opacity"
          onClick={() => setShowMaintenance(false)}
        >
          <div
            className="relative w-full max-w-xs overflow-hidden rounded-2xl border border-white/10 bg-[#09090b] p-5 shadow-[0_0_40px_rgba(139,92,246,0.15)]"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Ambient Background Glows */}
            <div className="absolute -right-10 -top-10 h-32 w-32 rounded-full bg-green-500/20 blur-3xl"></div>
            <div className="absolute -bottom-10 -left-10 h-32 w-32 rounded-full bg-green-500/20 blur-3xl"></div>

            {/* Close Button */}
            <div className="relative flex justify-end">
              <button
                onClick={() => setShowMaintenance(false)}
                className="rounded-full p-1 text-gray-500 transition hover:bg-white/10 hover:text-white"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Glowing Icon */}
            <div className="relative mt-1 flex justify-center">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl border border-green-500/30 bg-gradient-to-br from-green-500/20 to-green-600/20 shadow-[0_0_15px_rgba(139,92,246,0.2)]">
                <Wrench className="h-5 w-5 text-green-400" />
              </div>
            </div>

            {/* Content */}
            <div className="relative mt-4 text-center">
              <h3 className="text-base font-semibold text-gray-100">
                System Upgrades
              </h3>
              <p className="mt-1.5 text-xs leading-relaxed text-gray-400">
                Our wallet protocol is currently undergoing maintenance. Please check back shortly.
              </p>
            </div>
 
          </div>
        </div>
      )}
    </>
  );
}