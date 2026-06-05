"use client";
import React, { useEffect, useState } from "react";
import axios from "axios";
import { useParams, useRouter } from "next/navigation";
import toast, { Toaster } from "react-hot-toast";
import { ShieldCheck, UserX, ArrowLeft, Settings } from "lucide-react";

export default function ManageStatusPage() {
  const { id } = useParams();
  const email = decodeURIComponent(id);
  const router = useRouter();
  
  const [userData, setUserData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [formData, setFormData] = useState({ status: "1" });

  // 1. Fetch User Data
  useEffect(() => {
    const fetchUser = async () => {
      try {
        setLoading(true);
        const res = await axios.get(`/api/candf/find-by-email/${email}`);
        setUserData(res.data);
        // Database se current status uthao
        setFormData({ status: res.data?.status?.toString() || "1" });
      } catch (err) {
        toast.error("User data nahi mil paya!");
      } finally {
        setLoading(false);
      }
    };
    if (email) fetchUser();
  }, [email]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);

      const isActivating = formData.status === "1";
      
      const updateData = {
        id: userData._id,
        status: formData.status,
        Cnftype: isActivating ? 3 : 0 
      };

      await axios.patch("/api/candf/update-candf", updateData);
      
      toast.success(isActivating ? "Account Activated!" : "Account Deactivated!");
      
      setTimeout(() => {
        if (isActivating) {
          router.push("/superadmin/C&F/activeregistration");
        } else {
          router.push("/superadmin/C&F/pendingregistration");
        }
      }, 1000);

    } catch (err) {
      toast.error("Status update fail ho gaya!");
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div className="flex justify-center items-center h-screen font-black text-blue-600 animate-pulse text-xl">Loading Control Panel...</div>;

  return (
    <div className="p-4 max-w-lg mx-auto mt-16">
      <Toaster position="top-center" />
      
      {/* Top Back Button */}
      <button onClick={() => router.back()} className="flex items-center gap-2 text-gray-500 hover:text-yellow-600 font-bold mb-4 transition-all">
        <ArrowLeft size={20} /> Back to Profile
      </button>

     
      <div className="bg-white  rounded-3xl shadow-2xl border-t-8 overflow-hidden">

        <div className="bg-gray-50 dark:bg-gray-900 p-8 text-center border-b relative overflow-hidden">
          {/* <div className="absolute top-[-20px] right-[-20px] text-yellow-100 dark:text-gray-800 opacity-50">
             <Settings size={120} className="animate-spin-slow" />
          </div> */}
          <div className="relative z-10">
            <h2 className="text-2xl font-black text-gray-800 dark:text-white uppercase tracking-wider flex items-center justify-center gap-2">
               Account Control
            </h2>
            <p className="text-blue-600 dark:text-blue-400 font-bold text-lg mt-2">
              {userData?.cfName || userData?.name}
            </p>
            <div className="mt-2 inline-block bg-white dark:bg-gray-800 px-3 py-1 rounded-lg shadow-sm border text-xs font-bold text-gray-500">
               ID: {userData?.dscode}
            </div>
          </div>
        </div>

       
        <form onSubmit={handleSubmit} className="p-8 space-y-8">
          <div>
            <label className="block text-sm font-black text-gray-400 uppercase tracking-widest mb-3">
              Set New Status
            </label>
            <select
              className={`w-full p-4 border-2 rounded-2xl outline-none transition-all font-black text-lg cursor-pointer ${
                formData.status === "1" 
                ? "border-green-500 bg-green-50 text-green-700 focus:ring-green-400 shadow-inner" 
                : "border-red-500 bg-red-50 text-red-700 focus:ring-red-400 shadow-inner"
              } dark:bg-gray-700 dark:text-white`}
              value={formData.status}
              onChange={(e) => setFormData({ status: e.target.value })}
            >
              <option value="1">ACTIVE</option>
              <option value="0"> INACTIVE</option>
            </select>
            
            {/* Dynamic Warning Message */}
            <div className={`mt-4 p-3 rounded-xl border flex gap-3 ${formData.status === "1" ? "bg-green-50 border-green-200 text-green-800" : "bg-red-50 border-red-200 text-red-800"}`}>
               {formData.status === "1" ? <ShieldCheck size={24} className="shrink-0"/> : <UserX size={24} className="shrink-0"/>}
               <p className="text-xs font-bold leading-relaxed">
                 {formData.status === "1" 
                   ? "By activating, this user will be moved to the Active Registry and can log in." 
                   : "By deactivating, this user will be removed from Active Registry and sent to Pending list."}
               </p>
            </div>
          </div>

          <div className="flex gap-4 pt-4 border-t dark:border-gray-700">
            <button
              type="button"
              onClick={() => router.back()}
              className="flex-1 px-6 py-4 bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-200 font-bold rounded-2xl hover:bg-gray-200 dark:hover:bg-gray-600 transition-all active:scale-95"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-[2] px-6 py-4 bg-blue-600 text-white font-black uppercase tracking-wider rounded-2xl shadow-xl shadow-blue-200 dark:shadow-none hover:bg-blue-700 active:scale-95 transition-all disabled:opacity-50"
            >
              {loading ? "Saving..." : "Save Changes"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}