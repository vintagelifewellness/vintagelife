"use client";

import React, { useState, useEffect, useRef } from "react";
import { useSidebar } from "@/app/context/SidebarContext";
import { ThemeToggleButton } from "./ThemeToggleButton";
import Link from "next/link";
import { signOut, useSession } from "next-auth/react";
import { LogOut, ChevronDown, Phone } from "lucide-react";
import Image from "next/image";
import axios from "axios";
import WalletButton from "./WalletButton";
import Cookies from "js-cookie";

// Custom hook for fetching user data
const useUserData = (session) => {
  const [userData, setUserData] = useState({ img: "", userstatus: "", dsid: "", mobile: "", usertype: "" });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  console.log(session)
  useEffect(() => {
    const fetchUserData = async () => {
      if (!session?.user?.email) {
        setLoading(false);
        return;
      }

      try {
        const response = await axios.get(
          `/api/user/find-admin-byemail/${session.user.email}`
        );
        const data = response.data;


        if (data?.name) {
          setUserData({
            img: data.image,
            userstatus: data.defaultdata,
            dsid: data.dscode,
            mobile: data.mobileNo,
            usertype: data.usertype,
            activesp: data.activesp

          });

          if (data.defaultdata !== "user") {
            await signOut({ callbackUrl: "/" });
          }
        }
      } catch (err) {
        setError(err);
      } finally {
        setLoading(false);
      }
    };

    fetchUserData();
  }, [session?.user?.email]);

  return { ...userData, loading, error };
};

// Custom hook for handling keyboard shortcuts
const useKeydown = (callback, ref) => {
  useEffect(() => {
    const handleKeyDown = (event) => {
      if ((event.metaKey || event.ctrlKey) && event.key === "k") {
        event.preventDefault();
        ref.current?.focus();
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [callback, ref]);
};

const AppHeader = () => {
  const [isApplicationMenuOpen, setApplicationMenuOpen] = useState(false);
  const { isMobileOpen, toggleSidebar, toggleMobileSidebar } = useSidebar();
  const inputRef = useRef(null);
  const { data: session } = useSession();
  const { img, userstatus, dsid, mobile, usertype, loading, error, activesp } = useUserData(session);

  const handleToggle = () => {
    if (window.innerWidth >= 991) {
      toggleSidebar();
    } else {
      toggleMobileSidebar();
    }
  };

  useKeydown(() => inputRef.current?.focus(), inputRef);

  return (
    <header className="sticky top-0 z-40 flex w-full  borderw bgn ">
      <div className="flex flex-grow items-center justify-between px-4 py-3 sm:px-6 lg:px-8">
        <div className="flex items-center">
          <button
            onClick={handleToggle}
            aria-label="Toggle Sidebar"
            className="mr-4 textw"
          >
            {isMobileOpen ? (
              <svg
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  d="M18 6L6 18M6 6l12 12"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            ) : (
              <svg
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  d="M4 6h16M4 12h16M4 18h7"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            )}
          </button>
          <div className="lg:hidden">
            <Image
              width={40}
              height={40}
              src="/images/logo/logo-blank.png"
              alt="Logo"
            />
          </div>
        </div>

        <div className="flex items-center gap-x-4">
          {/* <ThemeToggleButton /> */}
  <WalletButton />
          <div className="relative">
            <button
              onClick={() => setApplicationMenuOpen(!isApplicationMenuOpen)}
              className="flex items-center gap-2 rounded-full  p-1 "
            >
              <Image
                width={36}
                height={36}
                src={img || "/images/user/icon-5359553_640.webp"}
                alt="User"
                className="rounded-full object-cover"
              />
              <span className="hidden text-sm font-medium textw  md:block">
                {session?.user?.name}
              </span>
              <ChevronDown
                className={`hidden h-5 w-5 textw transition-transform  md:block ${isApplicationMenuOpen ? "rotate-180" : ""
                  }`}
              />
            </button>
            {isApplicationMenuOpen && (
              <div className="absolute right-0 mt-3 w-72 rounded-2xl bg-white shadow-2xl ring-1 ring-black/5 overflow-hidden z-50 animate-fadeIn">

                {/* Profile Header */}
                <div className="relative overflow-hidden bg-gradient-to-br from-[#0b1329] via-[#111c3d] to-[#182858] px-5 py-5 text-white">

                  {/* Decorative circle */}
                  <div className="absolute -right-8 -top-8 h-24 w-24 rounded-full bg-[#E6B964]/10" />
                  <div className="absolute -bottom-10 -left-8 h-24 w-24 rounded-full bg-white/5" />

                  <div className="relative flex items-center gap-3">

                    {/* Avatar */}
                    <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-[#E6B964] to-[#c9963e] text-lg font-bold text-[#0b1329] shadow-lg">
                      {(session?.user?.name || "U")
                        .charAt(0)
                        .toUpperCase()}
                    </div>

                    <div className="min-w-0">
                      <p className="truncate text-base font-semibold">
                        {session?.user?.name || "User"}
                      </p>

                      <p className="mt-0.5 text-xs text-white/60">
                        DSID: {dsid || session?.user?.dscode || "NA"}
                      </p>
                    </div>
                  </div>

                  {/* Status */}
                  <div className="relative mt-4 flex items-center justify-between">

                    <div className="flex items-center gap-2 text-xs text-white/70">
                      <Phone className="h-3.5 w-3.5" />
                      <span>   {mobile || session?.user?.mobileNo}</span>
                    </div>

                    <span
                      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-semibold ${usertype === "0"
                        ? "bg-red-500/15 text-red-300"
                        : "bg-green-500/15 text-green-300"
                        }`}
                    >
                      <span
                        className={`h-1.5 w-1.5 rounded-full ${usertype === "0"
                          ? "bg-red-400"
                          : "bg-green-400"
                          }`}
                      />

                      {usertype === "0" ? "Inactive" : "Active"}
                    </span>
                  </div>
                </div>

                {/* Account Information */}
                {/* Account Information */}
                <div className="px-4 py-3">
                  <div className="rounded-xl border border-gray-100 bg-gray-50 p-3 space-y-2.5">

                    {/* Account ID */}
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-gray-500">
                        Account ID
                      </span>

                      <span className="text-xs font-semibold text-gray-800">
                        {dsid || session?.user?.dscode || "NA"}
                      </span>
                    </div>

                    {/* RP */}
                    {activesp && (
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-gray-500">
                          Active RP
                        </span>

                        <span className="text-xs font-semibold text-gray-800">
                          {activesp}
                        </span>
                      </div>
                    )}

                    {/* Mobile */}
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-gray-500">
                        Mobile
                      </span>

                      <span className="text-xs font-medium text-gray-800">
                        {mobile || session?.user?.mobileNo}
                      </span>
                    </div>

                  </div>
                </div>

                {/* Logout */}
                <div className="border-t border-gray-100 p-2">

                  <button
                    onClick={() => {
                      Cookies.remove("hasSeenModal");
                      signOut();
                    }}
                    className="group flex w-full items-center gap-3 rounded-xl px-3 py-3 text-sm font-medium text-gray-700 transition-all duration-200 hover:bg-red-50 hover:text-red-600"
                  >
                    <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-gray-100 transition-colors group-hover:bg-red-100">
                      <LogOut className="h-4 w-4 text-gray-500 transition-colors group-hover:text-red-500" />
                    </div>

                    <div className="flex-1 text-left">
                      <p className="font-semibold">
                        Logout
                      </p>

                      <p className="text-[11px] text-gray-400 group-hover:text-red-400">
                        Sign out from your account
                      </p>
                    </div>
                  </button>

                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};

export default AppHeader;