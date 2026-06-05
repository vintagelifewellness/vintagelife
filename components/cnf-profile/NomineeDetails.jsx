"use client";
import React, { useEffect, useState } from "react";
import axios from "axios";
import { useSession } from "next-auth/react";

const DetailField = ({ label, value }) => (
    <div>
        <label className="block text-sm font-semibold text-gray-600 dark:text-gray-400">
            {label}
        </label>
        <div className="mt-1 px-3 py-2 text-sm rounded-md bg-gray-50 dark:bg-gray-800 border text-gray-500 dark:text-gray-100 border-gray-200 dark:border-gray-700 min-h-[38px]">
            {value || <span className="text-gray-400 dark:text-gray-500">N/A</span>}
        </div>
    </div>
);

const CandFDetailsSkeleton = () => (
    <div className="bg-white dark:bg-gray-900 p-4 sm:p-6 border border-gray-200 dark:border-gray-800 rounded-2xl shadow-sm animate-pulse">
        <div className="flex justify-between items-center mb-6">
            <div className="h-6 rounded bg-gray-200 dark:bg-gray-700 w-1/3"></div>
            <div className="h-10 rounded-lg bg-gray-200 dark:bg-gray-700 w-20"></div>
        </div>
        {[3, 3, 2].map((fieldCount, sectionIndex) => (
            <div key={sectionIndex} className="mt-6">
                <div className="h-5 rounded bg-gray-200 dark:bg-gray-700 w-1/4 mb-4"></div>
                <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
                    {Array.from({ length: fieldCount }).map((_, i) => (
                        <div key={i} className="space-y-2">
                            <div className="h-4 rounded bg-gray-200 dark:bg-gray-700 w-1/2"></div>
                            <div className="h-9 rounded bg-gray-200 dark:bg-gray-700 w-full"></div>
                        </div>
                    ))}
                </div>
            </div>
        ))}
    </div>
);

export default function CandFDetails() {
    const { data: session, update } = useSession();
    const [data, setData] = useState(null);
    const [isFetching, setIsFetching] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isModalOpen, setIsModalOpen] = useState(false);

    // 👇 Schema ke hisaab se naamo ko update kiya gaya hai
    const [formData, setFormData] = useState({
        cfName: "", name: "", bankName: "",
        acnumber: "", ifscCode: "", panno: "" 
    });

    useEffect(() => {
        const fetchUserData = async () => {
            if (!session?.user?.email) return;
            setIsFetching(true);
            try {
                const response = await axios.get(`/api/candf/find-by-email/${session.user.email}`);
                
                if (response.data?._id) {
                    const candfData = response.data;
                    setData(candfData);
                    
                    setFormData({
                        cfName: candfData.cfName || "", 
                        name: candfData.name || "",     
                        bankName: candfData.bankName || "",
                        acnumber: candfData.acnumber || "", // Match with schema
                        ifscCode: candfData.ifscCode || "",
                        panno: candfData.panno || "",       // Match with schema
                    });
                }
            } catch (error) {
                console.error("Failed to fetch C&F data:", error);
            } finally {
                setIsFetching(false);
            }
        };
        fetchUserData();
    }, [session?.user?.email]);

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleUpdate = async (e) => {
        e.preventDefault();
        if (!data?._id) return;
        setIsSubmitting(true);
        try {
            const payload = {
                id: data._id,
                cfName: formData.cfName,
                name: formData.name,
                bankName: formData.bankName,
                acnumber: formData.acnumber,
                ifscCode: formData.ifscCode,
                panno: formData.panno,
            };
            
            await axios.patch("/api/candf/update-candf", payload);

            setData(prev => ({ ...prev, ...payload }));
            await update();
            setIsModalOpen(false);

        } catch (error) {
            console.error("Failed to update C&F details:", error);
        } finally {
            setIsSubmitting(false);
        }
    };

    if (isFetching) {
        return <CandFDetailsSkeleton />;
    }

    const formFields = [
        { label: "Firm/Agency Name", name: "cfName", type: "text" },
        { label: "Owner Name", name: "name", type: "text" },
        { label: "Bank Name", name: "bankName", type: "text" },
        { label: "Account No", name: "acnumber", type: "number" }, // Updated name
        { label: "IFSC Code", name: "ifscCode", type: "text" },
        { label: "PAN No", name: "panno", type: "text" },          // Updated name
    ];

    return (
        <div>
            <div className="bg-white dark:bg-gray-900 p-4 sm:p-6 border border-gray-200 dark:border-gray-800 shadow-sm">
                <div className="flex justify-between items-center mb-4">
                    <h4 className="text-xl font-bold text-gray-900 dark:text-white">
                        C&F Profile & KYC Details
                    </h4>
                    {!isFetching && data?.status == 1 && (
                        <button
                            onClick={() => setIsModalOpen(true)}
                            className="flex w-full items-center justify-center gap-2 rounded border border-gray-300 bg-white px-4 py-1 text-sm font-medium text-gray-700 shadow-theme-xs hover:bg-gray-50 hover:text-gray-800 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-400 dark:hover:bg-white/[0.03] dark:hover:text-gray-200 lg:inline-flex lg:w-auto"
                        >
                            Edit
                        </button>
                    )}
                </div>

                <div className="space-y-6">
                    <section>
                        <h5 className="text-lg font-semibold text-gray-800 dark:text-gray-200 border-b border-gray-200 dark:border-gray-700 pb-2 mb-4">Business Details</h5>
                        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
                            <DetailField label="Firm/Agency Name" value={data?.cfName} />
                            <DetailField label="Owner Name" value={data?.name} />
                        </div>
                    </section>
                    <section>
                        <h5 className="text-lg font-semibold text-gray-800 dark:text-gray-200 border-b border-gray-200 dark:border-gray-700 pb-2 mb-4">Payment Details</h5>
                        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
                            <DetailField label="Bank Name" value={data?.bankName} />
                            <DetailField label="Account No" value={data?.acnumber} /> {/* Updated display */}
                            <DetailField label="IFSC Code" value={data?.ifscCode} />
                        </div>
                    </section>
                    <section>
                        <h5 className="text-lg font-semibold text-gray-800 dark:text-gray-200 border-b border-gray-200 dark:border-gray-700 pb-2 mb-4">KYC Details</h5>
                        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
                            <DetailField label="PAN No" value={data?.panno} /> {/* Updated display */}
                        </div>
                    </section>
                </div>
            </div>

            {isModalOpen && (
                <div className="fixed inset-0 flex items-center justify-center bg-black/60 backdrop-blur-sm z-50 p-4" onClick={() => setIsModalOpen(false)}>
                    <div className="relative max-w-2xl w-full bg-white dark:bg-gray-900 shadow-2xl rounded-2xl p-6 border border-gray-200 dark:border-gray-700" onClick={(e) => e.stopPropagation()}>
                        <h4 className="mb-6 text-xl font-bold text-center text-gray-900 dark:text-white">
                            Edit C&F Information
                        </h4>
                        
                        <form onSubmit={handleUpdate}>
                            <div className="max-h-[60vh] overflow-y-auto pr-2 grid grid-cols-1 sm:grid-cols-2 gap-4">
                                {formFields.map((field) => (
                                    <div key={field.name}>
                                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                            {field.label}
                                        </label>
                                        <input 
                                            type={field.type} 
                                            name={field.name} 
                                            value={formData[field.name]} 
                                            onChange={handleChange} 
                                            className="w-full px-4 py-2 text-gray-900 dark:text-gray-200 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-500 focus:outline-none" 
                                            placeholder={`Enter ${field.label}`}
                                        />
                                    </div>
                                ))}
                            </div>
                            
                            <div className="flex justify-end gap-3 pt-6">
                                <button type="button" className="px-4 py-2 text-sm font-bold bg-transparent border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-800 dark:text-gray-200" onClick={() => setIsModalOpen(false)}>
                                    Cancel
                                </button>
                                <button type="submit" className="px-4 py-2 text-sm font-bold bg-blue-600 text-white rounded-lg hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600 disabled:opacity-50" disabled={isSubmitting}>
                                    {isSubmitting ? "Saving..." : "Save Changes"}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}