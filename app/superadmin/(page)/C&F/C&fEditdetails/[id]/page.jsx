"use client";

import React, { useEffect, useState } from "react";
import axios from "axios";
import { useParams, useRouter } from "next/navigation";
import toast, { Toaster } from "react-hot-toast";

export default function UpdateCandFPage() {
  const { id } = useParams();
  const email = decodeURIComponent(id);
  const router = useRouter();

  const [userData, setUserData] = useState(null);
  const [formData, setFormData] = useState({});
  const [loading, setLoading] = useState(true);

  // 1. C&F Data Fetch karna
  const fetchUser = async () => {
    try {
      setLoading(true);
      const res = await axios.get(`/api/candf/find-by-email/${email}`);
      const { password, ...safeUserData } = res.data;
      setUserData(safeUserData);
      setFormData(safeUserData);
    } catch (err) {
      toast.error("C&F data fetch karne mein fail!");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUser();
  }, [email]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleAddressChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      address: { ...prev.address, [name]: value },
    }));
  };

  // 2. C&F Data Update submit karna
  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const updateData = { ...formData, id: formData._id };
      await axios.patch("/api/candf/update-candf", updateData);
      toast.success("C&F details updated successfully!");
      
      setTimeout(() => {
        router.push(`/superadmin/C&F/C&fEditdetails/${email}`);
      }, 1500);
    } catch (err) {
      toast.error("Update failed!");
    }
  };

  if (loading) return (
    <div className="flex justify-center items-center min-h-[50vh]">
      <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-indigo-600"></div>
    </div>
  );
  
  if (!userData) return <p className="p-6 text-center text-red-500 font-medium">C&F User not found</p>;

  return (
    <div className="max-w-6xl mx-auto px-4 py-8 mt-6">
      <div className="bg-white shadow-xl shadow-slate-200/50 rounded-2xl overflow-hidden border border-slate-100">
        
        {/* HEADER */}
        <div className="bg-slate-50 px-8 py-6 border-b border-slate-100 flex justify-between items-center">
          <div>
            <h2 className="text-2xl font-bold text-slate-800 tracking-tight">Update C&F Master Details</h2>
            <p className="text-sm text-slate-500 mt-1">Make changes to the C&F profile information below.</p>
          </div>
          <button 
            onClick={() => router.back()}
            className="text-sm font-medium text-indigo-600 hover:text-indigo-800 transition-colors bg-indigo-50 px-4 py-2 rounded-lg"
          >
            Go Back
          </button>
        </div>

        <Toaster position="top-center" />
        
        <form onSubmit={handleSubmit} className="px-8 py-8 space-y-10">
          
          {/* BUSINESS & OWNER INFORMATION */}
          <div className="bg-white rounded-xl">
            <h3 className="text-base font-semibold text-indigo-700 uppercase tracking-wider mb-5 pb-2 border-b border-slate-100 flex items-center gap-2">
               Business Information
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <Input label="Company Name (C&F)" name="cfName" value={formData.cfName} onChange={handleChange} />
              <Input label="Owner Name" name="name" value={formData.name} onChange={handleChange} />
              <Input label="Email (Login ID)" name="email" value={formData.email} onChange={handleChange} disabled={true} />
              <Input label="Mobile No" name="mobileNo" value={formData.mobileNo} onChange={handleChange} />
              <Input label="WhatsApp No" name="whatsappNo" value={formData.whatsappNo} onChange={handleChange} />
              <Input label="Establishment Date" name="establishmentDate" type="date" value={formData.establishmentDate?.split("T")[0] || ""} onChange={handleChange} />
            </div>
          </div>

          {/* KYC DETAILS */}
          <div className="bg-white rounded-xl mt-8">
            <h3 className="text-base font-semibold text-indigo-700 uppercase tracking-wider mb-5 pb-2 border-b border-slate-100 flex items-center gap-2">
               KYC Documents
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <Input label="PAN Number" name="panno" value={formData.panNumber || formData.panno} onChange={handleChange} />
              <Input label="Aadhar Number" name="aadharno" value={formData.aadharno} onChange={handleChange} />
            </div>
          </div>

          {/* BANK DETAILS */}
          <div className="bg-white rounded-xl mt-8">
            <h3 className="text-base font-semibold text-indigo-700 uppercase tracking-wider mb-5 pb-2 border-b border-slate-100 flex items-center gap-2">
               Bank Account Details
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <Input label="Bank Name" name="bankName" value={formData.bankName} onChange={handleChange} />
             <Input 
  label="Account Number" 
  name="acnumber"
  value={formData.acnumber || ""} 
  onChange={handleChange} 
/>
              <Input label="IFSC Code" name="ifscCode" value={formData.ifscCode} onChange={handleChange} />
            </div>
          </div>

          {/* ADDRESS */}
          <div className="bg-white rounded-xl mt-8">
            <h3 className="text-base font-semibold text-indigo-700 uppercase tracking-wider mb-5 pb-2 border-b border-slate-100 flex items-center gap-2">
               Warehouse/Office Address
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <Input label="Address Line 1" name="addressLine1" value={formData.address?.addressLine1 || ""} onChange={handleAddressChange} />
              <Input label="Address Line 2" name="addressLine2" value={formData.address?.addressLine2 || ""} onChange={handleAddressChange} />
              <Input label="City" name="city" value={formData.address?.city || ""} onChange={handleAddressChange} />
              <Input label="Landmark" name="landmark" value={formData.address?.landmark || ""} onChange={handleAddressChange} />
              <Input label="Pin Code" name="pinCode" value={formData.address?.pinCode || ""} onChange={handleAddressChange} />
              
              <div className="flex flex-col">
                <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">State</label>
                <select
                  name="state"
                  value={formData.address?.state || ""}
                  onChange={handleAddressChange}
                  className="w-full rounded-lg border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all shadow-sm"
                >
                  <option value="">Select a state</option>
                  {["Andhra Pradesh", "Bihar", "Delhi", "Gujarat", "Haryana", "Maharashtra", "Punjab", "Rajasthan", "Uttar Pradesh", "West Bengal"].map((state) => (
                    <option key={state} value={state}>{state}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* SUBMIT BUTTON */}
          <div className="pt-6 border-t border-slate-100 flex justify-end">
            <button 
              type="submit" 
              className="bg-indigo-600 hover:bg-indigo-700 text-white font-medium px-8 py-3 rounded-lg transition-all duration-200 shadow-md shadow-indigo-200 hover:shadow-lg hover:-translate-y-0.5"
            >
              Save C&F Changes
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

const Input = ({ label, name, value, onChange, type = "text", disabled = false }) => (
  <div className="flex flex-col">
    <label htmlFor={name} className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">
      {label}
    </label>
    <input
      type={type}
      name={name}
      id={name}
      value={value || ""}
      onChange={onChange}
      disabled={disabled}
      placeholder={`Enter ${label}`}
      className={`border text-sm rounded-lg px-4 py-2.5 transition-all shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 ${
        disabled 
        ? 'bg-slate-100 border-slate-200 text-slate-400 cursor-not-allowed' 
        : 'bg-slate-50 border-slate-200 text-slate-800 hover:border-indigo-300'
      }`}
    />
  </div>
);