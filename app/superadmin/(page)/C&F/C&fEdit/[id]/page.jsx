"use client";

import React, { useEffect, useState } from "react";
import axios from "axios";
import { useParams, useRouter } from "next/navigation";
import toast, { Toaster } from "react-hot-toast";

export default function CandFManagePoints() {
  const { id } = useParams();
  const email = decodeURIComponent(id);
  const router = useRouter();
  
  const [userData, setUserData] = useState(null);
  const [loading, setLoading] = useState(true);
  
  const [formData, setFormData] = useState({
    status: "1",
    addAmount: "",
    removeAmount: ""
  });

  const [error, setError] = useState(null);

  const fetchUser = async () => {
    try {
      setLoading(true);
      const res = await axios.get(`/api/candf/find-by-email/${email}`);
      setUserData(res.data);
      setFormData((prev) => ({
        ...prev,
        status: res.data?.status?.toString() || "1",
      }));
    } catch (err) {
      setError("C&F data laane mein error aaya bhai.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (email) fetchUser();
  }, [email]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);

      const currentPoints = parseFloat(userData.Availablepoint || 0);
      let newPoints = currentPoints;
      
      const addAmount = parseFloat(formData.addAmount || 0);
      const removeAmount = parseFloat(formData.removeAmount || 0);

      if (addAmount > 0) {
        newPoints = newPoints + addAmount;
      }
      if (removeAmount > 0) {
        if (newPoints < removeAmount) {
          toast.error("Account mein itne points nahi hain!");
          setLoading(false);
          return;
        }
        newPoints = newPoints - removeAmount;
      }

      let finalStatus = formData.status;
      let finalCnfType = userData.Cnftype;

      if (finalStatus === "0") {
          newPoints = 0; 
          finalCnfType = 0; 
          toast.success("Account Inactive & Removed from Active List");
      } else if (newPoints <= 0) {
          finalStatus = "0"; 
          finalCnfType = 0;
          toast.success("Points 0 ho gaye, Account Inactive ho gaya!");
      } else {
          finalStatus = "1";
          finalCnfType = 3;
      }

      const updateData = {
        id: userData._id,
        status: finalStatus,
        Cnftype: finalCnfType, 
        Availablepoint: newPoints.toString(),
        activedate: finalStatus === "1" ? new Date().toISOString() : null
      };

      await axios.patch("/api/candf/update-candf", updateData);

      toast.success("C&F Data Updated Successfully!");
      setFormData({ ...formData, addAmount: "", removeAmount: "" }); // Clean inputs
      
      setTimeout(() => {
        if (finalStatus === "1") {
          router.push("/superadmin/C&F/activeregistration"); 
        } else {
          router.push("/superadmin/C&F/pendingregistration"); 
        }
      }, 1000);

    } catch (err) {
      console.error("Update Error:", err);
      toast.error(err?.response?.data?.message || "Update fail ho gaya bhai!");
    } finally {
      setLoading(false);
    }
  };

  if (loading && !userData) return <div className="flex justify-center items-center h-screen"><p className="text-lg animate-pulse font-medium text-blue-600 dark:text-blue-400">Loading C&F Data...</p></div>;
  if (error) return <p className="p-4 text-center text-red-500 font-medium">{error}</p>;

  return (
    <div className="p-4 max-w-xl mx-auto space-y-6 mt-8">
      <h2 className="text-2xl font-bold text-center text-gray-800 dark:text-gray-100">Manage C&F Points</h2>

      {/* Top Banner - Soft Blue */}
      <div className="bg-slate-50 dark:bg-slate-800/50 p-6 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 text-center">
        <p className="font-medium text-lg text-gray-600 dark:text-gray-300">
          C&F Name: <span className="text-blue-600 dark:text-blue-400 font-bold">{userData?.cfName || userData?.companyName}</span>
        </p>
        
        <div className="mt-5 inline-block bg-white dark:bg-slate-800 px-8 py-4 rounded-xl shadow-sm border border-slate-100 dark:border-slate-700">
           <p className="text-xs text-gray-400 dark:text-gray-500 uppercase tracking-wider font-semibold mb-1">Total Available Points</p>
           <p className={`text-4xl font-extrabold tracking-tight ${userData?.Availablepoint > 0 ? "text-emerald-500 dark:text-emerald-400" : "text-rose-500 dark:text-rose-400"}`}>
             {userData?.Availablepoint || 0}
           </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6 bg-white dark:bg-slate-800 p-6 sm:p-8 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700">
        
        {/* Status Dropdown - Soft colors */}
        <div>
          <label className="block mb-2 text-sm font-semibold text-slate-700 dark:text-slate-300">Account Status</label>
          <select
            className={`w-full p-3 border rounded-xl outline-none focus:ring-2 transition-all text-sm font-medium
              ${formData.status === "1" 
                ? "border-emerald-200 focus:ring-emerald-200 bg-emerald-50/50 text-emerald-700 dark:border-emerald-800 dark:bg-emerald-900/20 dark:text-emerald-300" 
                : "border-rose-200 focus:ring-rose-200 bg-rose-50/50 text-rose-700 dark:border-rose-800 dark:bg-rose-900/20 dark:text-rose-300"
              }`}
            value={formData.status}
            onChange={(e) => setFormData({ ...formData, status: e.target.value })}
          >
            <option value="1">Active</option>
            <option value="0">Inactive</option>
          </select>
          {formData.status === "0" && <p className="text-[11px] text-rose-500 dark:text-rose-400 mt-2 font-medium">* On update, account will be inactive & points will reset to 0.</p>}
        </div>

        {/* Add Points - Subtle Green */}
        <div className="pt-5 border-t border-slate-100 dark:border-slate-700">
          <label className="block mb-2 text-sm font-semibold text-emerald-600 dark:text-emerald-400">Add Points (+)</label>
          <input
            type="number"
            className="w-full p-3 border border-slate-200 dark:border-slate-600 rounded-xl bg-slate-50 dark:bg-slate-700/50 text-slate-800 dark:text-white placeholder-slate-400 focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none transition-all"
            value={formData.addAmount}
            onChange={(e) => setFormData({ ...formData, addAmount: e.target.value })}
            placeholder="Enter amount to add"
          />
        </div>

        {/* Remove Points - Subtle Red */}
        <div className="pt-5 border-t border-slate-100 dark:border-slate-700">
          <label className="block mb-2 text-sm font-semibold text-rose-500 dark:text-rose-400">Remove Points (-)</label>
          <input
            type="number"
            className="w-full p-3 border border-slate-200 dark:border-slate-600 rounded-xl bg-slate-50 dark:bg-slate-700/50 text-slate-800 dark:text-white placeholder-slate-400 focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 outline-none transition-all"
            value={formData.removeAmount}
            onChange={(e) => setFormData({ ...formData, removeAmount: e.target.value })}
            placeholder="Enter amount to deduct"
          />
        </div>

        {/* Submit Button */}
        <button
          type="submit"
          disabled={loading}
          className="w-full mt-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3.5 rounded-xl transition-all active:scale-[0.98] disabled:opacity-70 shadow-sm shadow-blue-600/20"
        >
          {loading ? "Processing..." : "Update Wallet & Status"}
        </button>
      </form>

      <Toaster position="top-center" />
    </div>
  );
}