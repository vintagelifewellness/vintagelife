"use client";
import React, { useEffect, useState } from "react";
import axios from "axios";
import Image from "next/image";
import { useSession } from "next-auth/react";
import { X } from "lucide-react";
import Link from "next/link";

export default function AadharcardDetails() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const { data: session } = useSession();
  const [data, setData] = useState(null);
  const [kyc, setKyc] = useState();

  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  const [isEditing, setIsEditing] = useState(false);

  const [aadharno, setaadharno] = useState("");
  const [aadharfullname, setAadharfullname] = useState("");
  const [aadharimage, setaadharimage] = useState("");
  const [aadharimageback, setaadharimageback] = useState("");

  const [uploadingFront, setUploadingFront] = useState(false);
  const [uploadingBack, setUploadingBack] = useState(false);

  useEffect(() => {
    const fetchUserData = async () => {
      if (!session?.user?.email) return;
      setFetching(true);
      setLoading(true);
      try {
        const response = await axios.get(
          `/api/user/find-admin-byemail/${session.user.email}`
        );
        if (response.data) {
          setData(response.data);
          setaadharno(response.data.aadharno || "");
          setAadharfullname(response.data.aadharfullname || "");
          setaadharimage(response.data.aadharimage || "");
          setaadharimageback(response.data.aadharimageback || "");

          const dscode = response.data.dscode;
          if (dscode) {
            const kycResponse = await axios.get(
              `/api/kyc/fetchsingle/${dscode}`
            );
            setKyc(kycResponse.data.data);
          }
        }
      } catch (error) {
        console.error("Failed to fetch user data:", error);
      } finally {
        setFetching(false);
        setLoading(false);
      }
    };
    fetchUserData();
  }, [session?.user?.email]);

  const handleImageUpload = async (file, isFront = true) => {
    isFront ? setUploadingFront(true) : setUploadingBack(true);
    const formData = new FormData();
    formData.append("file", file);
    try {
      const response = await axios.post("/api/upload", formData);
      return response.data.file.secure_url;
    } catch (error) {
      console.error("Image upload failed:", error);
      return null;
    } finally {
      isFront ? setUploadingFront(false) : setUploadingBack(false);
    }
  };

  const handleSave = async () => {
    setLoading(true);
    try {
      await axios.patch("/api/user/update-user", {
        id: session?.user?.id,
        aadharno,
        aadharfullname,
        aadharimage,
        aadharimageback,
      });
      setIsEditing(false);
    } catch (error) {
      console.error("Failed to update aadhar details:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <div className="rounded bordernormal p-2 dark:border-gray-800 dark:bg-white/[0.03] lg:p-6">
        {fetching ? (
          <p className="text-gray-400">Loading KYC status...</p>
        ) : kyc ? (
          <p>
            {kyc.rejectedaadhar ? (
              <span className="text-red-600 font-semibold">Rejected</span>
            ) : kyc.aadharkkyc ? (
              <span className="text-green-600 font-semibold">Approved</span>
            ) : (
              <span className="text-yellow-600 font-semibold">Pending</span>
            )}
          </p>
        ) : (
          <p className="text-gray-500">No KYC data found</p>
        )}

        {!kyc?.aadharkkyc && <p>{kyc?.aadharresn}</p>}

        <p className="my-4 text-2xl font-light text-[#3A5335] dark:text-white/90">
          Aadhar card
        </p>

        {fetching ? (
          <div className="animate-pulse space-y-4">
            <div className="h-8 bg-gray-300 rounded-md dark:bg-gray-700 w-3/4"></div>
            <div className="h-12 bg-gray-300 rounded-md dark:bg-gray-700 w-full"></div>
            <div className="h-40 bg-gray-300 rounded-md dark:bg-gray-700 w-full"></div>
          </div>
        ) : (
          <>
            <div className="grid lg:grid-cols-2 gap-4">
              {/* Aadhar No */}
              <div className="col-span-1">
                <p className="mb-2 text-md text-gray-500 dark:text-gray-400">
                  Aadhar Card No
                </p>
                <input
                  type="text"
                  value={aadharno}
                  onChange={(e) => setaadharno(e.target.value)}
                  disabled={!isEditing}
                  className="p-2 rounded-md text-md bg-black/10 text-gray-800 dark:text-white/90 border border-gray-300 dark:border-gray-700 w-full"
                />
              </div>

              {/* Full Name */}
              <div className="col-span-1">
                <p className="mb-2 text-md text-gray-500 dark:text-gray-400">
                  Full Name in Aadhar
                </p>
                <input
                  type="text"
                  value={aadharfullname}
                  onChange={(e) => setAadharfullname(e.target.value)}
                  disabled={!isEditing}
                  className="p-2 rounded-md text-md bg-black/10 text-gray-800 dark:text-white/90 border border-gray-300 dark:border-gray-700 w-full"
                />
              </div>

              {/* Front Side */}
              <div
                className={`border border-gray-300 dark:border-gray-700 rounded-md p-4 flex items-center justify-center bg-black/10 dark:bg-gray-800 h-40 mt-4 overflow-hidden relative ${
                  isEditing ? "cursor-pointer" : "cursor-default"
                }`}
                onClick={() =>
                  isEditing &&
                  document.getElementById("aadhar-front-upload").click()
                }
              >
                {uploadingFront ? (
                  <div className="animate-pulse bg-gray-300 dark:bg-gray-700 w-full h-full flex items-center justify-center">
                    <p className="text-gray-500">Uploading...</p>
                  </div>
                ) : aadharimage ? (
                  <Link href={aadharimage} target="_blank">
                    <Image
                      src={aadharimage}
                      alt="Aadhar Front"
                      layout="fill"
                      objectFit="cover"
                      className="rounded-md"
                    />
                  </Link>
                ) : (
                  <p className="text-gray-500">Click to upload front</p>
                )}
              </div>

              {/* Back Side */}
              <div
                className={`border border-gray-300 dark:border-gray-700 rounded-md p-4 flex items-center justify-center bg-black/10 dark:bg-gray-800 h-40 mt-4 overflow-hidden relative ${
                  isEditing ? "cursor-pointer" : "cursor-default"
                }`}
                onClick={() =>
                  isEditing &&
                  document.getElementById("aadhar-back-upload").click()
                }
              >
                {uploadingBack ? (
                  <div className="animate-pulse bg-gray-300 dark:bg-gray-700 w-full h-full flex items-center justify-center">
                    <p className="text-gray-500">Uploading...</p>
                  </div>
                ) : aadharimageback ? (
                  <Link href={aadharimageback} target="_blank">
                    <Image
                      src={aadharimageback}
                      alt="Aadhar Back"
                      layout="fill"
                      objectFit="cover"
                      className="rounded-md"
                    />
                  </Link>
                ) : (
                  <p className="text-gray-500">Click to upload back</p>
                )}
              </div>

              {/* Hidden File Inputs */}
              <input
                type="file"
                id="aadhar-front-upload"
                className="hidden"
                onChange={async (e) => {
                  const file = e.target.files[0];
                  if (file) {
                    const url = await handleImageUpload(file, true);
                    if (url) setaadharimage(url);
                  }
                }}
              />
              <input
                type="file"
                id="aadhar-back-upload"
                className="hidden"
                onChange={async (e) => {
                  const file = e.target.files[0];
                  if (file) {
                    const url = await handleImageUpload(file, false);
                    if (url) setaadharimageback(url);
                  }
                }}
              />
            </div>

            {/* Action Buttons */}
            {!kyc?.aadharkkyc && (
              <div className="mt-4 flex gap-4">
                {isEditing ? (
                  <button
                    className="bg-blue-500 text-white p-2 rounded-md disabled:opacity-50"
                    onClick={handleSave}
                    disabled={loading || uploadingFront || uploadingBack}
                  >
                    {loading ? "Saving..." : "Save"}
                  </button>
                ) : (
                  <button
                    className="bg-gray-700 text-white p-2 rounded-md"
                    onClick={() => setIsEditing(true)}
                  >
                    Edit
                  </button>
                )}
              </div>
            )}
          </>
        )}
      </div>

      {/* Image Preview Modal */}
      {isModalOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center p-4 z-50"
          onClick={() => setIsModalOpen(false)}
        >
          <div
            className="relative bg-white dark:bg-gray-800 rounded-lg shadow-lg p-4"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              className="absolute top-2 right-2 text-gray-600 dark:text-white"
              onClick={() => setIsModalOpen(false)}
            >
              <X size={24} />
            </button>
            <Image
              src={aadharimage || ""}
              alt="aadhar Card"
              width={500}
              height={300}
              className="rounded-md"
            />
          </div>
        </div>
      )}
    </>
  );
}
