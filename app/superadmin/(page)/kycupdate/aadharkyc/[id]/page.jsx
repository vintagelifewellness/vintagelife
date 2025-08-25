'use client';

import React, { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import axios from 'axios';

export default function BankKycPage() {
  const { id: rawId } = useParams();
  const id = decodeURIComponent(rawId);

  const router = useRouter();
  const [userid, setUserid] = useState('');
  const [aadharno, setAadharno] = useState("");
  const [aadharfullname, setAadharfullname] = useState("");
  const [aadharimage, setAadharimage] = useState("");
  const [aadharimageback, setAadharimageback] = useState("");

  const [selectedFrontFile, setSelectedFrontFile] = useState(null);
  const [selectedBackFile, setSelectedBackFile] = useState(null);

  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);

  // Fetch user data
  useEffect(() => {
    const fetchUser = async () => {
      try {
        const res = await axios.get(`/api/user/find-admin-byemail/${id}`);
        const data = res.data;

        setAadharno(data.aadharno || "");
        setAadharfullname(data.aadharfullname || "");
        setAadharimage(data.aadharimage || "");
        setAadharimageback(data.aadharimageback || "");
        setUserid(data._id);
      } catch (error) {
        console.error("Failed to fetch user data:", error);
      }
    };

    if (id) fetchUser();
  }, [id]);

  // Handle image upload
  const handleImageUpload = async (file) => {
    if (!file) return null;
    setUploading(true);
    const formData = new FormData();
    formData.append("file", file);
    try {
      const response = await axios.post("/api/upload", formData);
      return response.data.file.secure_url;
    } catch (error) {
      console.error("Image upload failed:", error);
      return null;
    } finally {
      setUploading(false);
    }
  };

  // Handle form submit
  const handleSave = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      let frontImageUrl = aadharimage;
      let backImageUrl = aadharimageback;

      if (selectedFrontFile) {
        const uploadedUrl = await handleImageUpload(selectedFrontFile);
        if (uploadedUrl) frontImageUrl = uploadedUrl;
      }

      if (selectedBackFile) {
        const uploadedUrl = await handleImageUpload(selectedBackFile);
        if (uploadedUrl) backImageUrl = uploadedUrl;
      }

      await axios.patch("/api/user/update-user", {
        id: userid,
        aadharno,
        aadharfullname,
        aadharimage: frontImageUrl,
        aadharimageback: backImageUrl,
      });

      alert("Aadhar details updated successfully!");
      router.back();
    } catch (error) {
      console.error("Failed to update Aadhar details:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 max-w-xl mx-auto space-y-6 bg-white rounded shadow">
      <h1 className="text-2xl font-semibold text-gray-800">Edit Aadhaar Details</h1>

      <form className="space-y-4" onSubmit={handleSave}>
        {/* Aadhar Number */}
        <div className="flex flex-col">
          <label className="text-gray-600 mb-1">Aadhaar Number</label>
          <input
            type="text"
            value={aadharno}
            onChange={(e) => setAadharno(e.target.value)}
            className="border border-gray-300 rounded px-3 py-1"
          />
        </div>

        {/* Name */}
        <div className="flex flex-col">
          <label className="text-gray-600 mb-1">Full Name</label>
          <input
            type="text"
            value={aadharfullname}
            onChange={(e) => setAadharfullname(e.target.value)}
            className="border border-gray-300 rounded px-3 py-1"
          />
        </div>

        {/* Aadhaar Front Image */}
        <div className="flex flex-col">
          <label className="text-gray-600 mb-1">Aadhaar Front Image</label>
          <input
            type="file"
            onChange={(e) => setSelectedFrontFile(e.target.files[0])}
            className="border border-gray-300 rounded px-3 py-1"
          />
          {(selectedFrontFile || aadharimage) && (
            <img
              src={selectedFrontFile ? URL.createObjectURL(selectedFrontFile) : aadharimage}
              alt="Aadhaar Front Preview"
              className="mt-2 w-40 h-auto border rounded"
            />
          )}
        </div>

        {/* Aadhaar Back Image */}
        <div className="flex flex-col">
          <label className="text-gray-600 mb-1">Aadhaar Back Image</label>
          <input
            type="file"
            onChange={(e) => setSelectedBackFile(e.target.files[0])}
            className="border border-gray-300 rounded px-3 py-1"
          />
          {(selectedBackFile || aadharimageback) && (
            <img
              src={selectedBackFile ? URL.createObjectURL(selectedBackFile) : aadharimageback}
              alt="Aadhaar Back Preview"
              className="mt-2 w-40 h-auto border rounded"
            />
          )}
        </div>

        {/* Buttons */}
        <div className="flex gap-4 mt-4">
          <button
            type="submit"
            disabled={loading || uploading}
            className="bg-blue-600 text-white px-4 py-1 rounded hover:bg-blue-700 disabled:opacity-50"
          >
            {loading ? 'Saving...' : 'Update'}
          </button>
          <button
            type="button"
            className="bg-gray-300 text-gray-800 px-4 py-1 rounded hover:bg-gray-400"
            onClick={() => router.back()}
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
}
