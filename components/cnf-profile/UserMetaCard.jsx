"use client";
import React, { useEffect, useState } from "react";
import Image from "next/image";
import axios from "axios";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";

const InfoPill = ({ label, value }) => (
    <div className="bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-200 font-medium px-3 py-1.5 rounded-full text-sm shadow-sm">
        <span className="font-semibold text-gray-800 dark:text-gray-100">{label}:</span> {value || "N/A"}
    </div>
);

const KycBadge = ({ kyc }) => {
    if (kyc?.rejectedaadhar) return <span className="text-red-600 dark:text-red-500 font-bold">Rejected</span>;
    if (kyc?.aadharkkyc) return <span className="text-green-600 dark:text-green-500 font-bold">Approved</span>;
    return <span className="text-yellow-500 dark:text-yellow-400 font-bold">Pending</span>;
};

export default function CandFMetaCard() {
    const { data: session, update } = useSession();
    const [candfData, setCandfData] = useState(null);
    const [kycData, setKycData] = useState(null);
    const [isFetching, setIsFetching] = useState(true);
    const [isUpdating, setIsUpdating] = useState(false);

    // Modal States
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [isHistoryModalOpen, setIsHistoryModalOpen] = useState(false); // 🚨 HISTORY MODAL STATE
    const [historyList, setHistoryList] = useState([]); // 🚨 HISTORY DATA STATE
    const [loadingHistory, setLoadingHistory] = useState(false);

    const [nameInput, setNameInput] = useState("");
    const [imageFile, setImageFile] = useState(null);

    useEffect(() => {
        const fetchAllData = async () => {
            if (!session?.user?.email) return;
            setIsFetching(true);
            try {
                const userRes = await axios.get(`/api/candf/find-by-email/${session.user.email}`);
                const fetchedData = userRes.data;
                if (fetchedData?._id) {
                    setCandfData(fetchedData);
                    setNameInput(fetchedData.companyName || fetchedData.name || ""); 
                    const kycCode = fetchedData.dscode || fetchedData.candfCode || fetchedData._id;
                    const kycRes = await axios.get(`/api/kyc/fetchsingle/${kycCode}`);
                    setKycData(kycRes.data?.data);
                }
            } catch (error) { console.error(error); } finally { setIsFetching(false); }
        };
        fetchAllData();
    }, [session?.user?.email]);

    // 🚨 FUNCTION TO FETCH HISTORY
   // 🚨 IS WALE FUNCTION KO UPDATE KARO
// 1. Pehle fetchHistory function ko update karo
const fetchHistory = async () => {
    setIsHistoryModalOpen(true);
    setLoadingHistory(true);
    try {
        const code = candfData?.dscode || candfData?.candfCode;
        // Wahi API use kar rahe hain jo SuperAdmin me chal rahi hai
        const res = await axios.get(`/api/candf/point-history-fetch?dscode=${code}`);
        
        if (res.data.success) {
            setHistoryList(res.data.data || []);
        }
    } catch (error) {
        console.error("History fetch error:", error);
    } finally {
        setLoadingHistory(false);
    }
};

    const handleUpdateProfile = async (e) => {
        e.preventDefault();
        setIsUpdating(true);
        let imageUrl = candfData?.image || "";
        if (imageFile) {
            const formData = new FormData();
            formData.append("file", imageFile);
            const uploadRes = await axios.post("/api/upload", formData);
            imageUrl = uploadRes.data.file.secure_url;
        }
        try {
            await axios.patch("/api/candf/update-candf", { id: candfData?._id, companyName: nameInput, image: imageUrl });
            setCandfData(prev => ({ ...prev, companyName: nameInput, image: imageUrl }));
            await update({ ...session, user: { ...session.user, name: nameInput, image: imageUrl } });
            setIsEditModalOpen(false);
        } catch (error) { console.error(error); } finally { setIsUpdating(false); }
    };

    if (isFetching) return <div className="p-10 text-center text-gray-500">Loading Profile...</div>;

    return (
        <div className="bg-white dark:bg-gray-900 p-6 sm:p-8 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-800 flex flex-col md:flex-row items-center md:items-start gap-6 relative mb-6">
            
            {/* Profile Image & Status */}
            <div className="relative shrink-0 mt-2">
                <div className="w-28 h-28 sm:w-32 sm:h-32 rounded-full p-1 border-2 border-dashed border-gray-300 dark:border-gray-600">
                    <Image width={120} height={120} src={candfData?.image || "/images/user/icon-5359553_640.webp"} alt="Profile" className="w-full h-full rounded-full object-cover shadow-inner" />
                </div>
                <div className={`absolute -bottom-3 left-1/2 transform -translate-x-1/2 px-4 py-1 rounded-full text-[10px] sm:text-xs font-black uppercase tracking-widest border-2 border-white dark:border-gray-900 shadow-lg ${candfData?.status == "1" ? "bg-green-500" : "bg-red-500"} text-white`}>
                    {candfData?.status == "1" ? "ACTIVE" : "INACTIVE"}
                </div>
            </div>

            {/* Info Section */}
            <div className="flex-1 text-center md:text-left mt-4 md:mt-2">
                <h2 className="text-2xl sm:text-3xl font-black text-gray-900 dark:text-white uppercase tracking-tight">
                    {candfData?.companyName || candfData?.name || "Unknown C&F"}
                </h2>
                <div className="flex flex-wrap items-center justify-center md:justify-start gap-2 mt-3">
                    <InfoPill label="DS Code" value={candfData?.dscode || candfData?.candfCode} />
                    <div className="bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200 font-medium px-3 py-1.5 rounded-full text-sm shadow-sm flex items-center gap-1">
                        <span className="font-semibold">KYC:</span> <KycBadge kyc={kycData} />
                    </div>
                </div>

                {/* 🚨 BUTTONS */}
                <div className="flex flex-wrap items-center justify-center md:justify-start gap-3 mt-5">
                    <button onClick={() => setIsEditModalOpen(true)} className="px-6 py-2 text-sm font-bold text-blue-600 bg-blue-50 border border-blue-200 rounded-lg hover:bg-blue-600 hover:text-white transition-all">
                        Edit Profile
                    </button>

                    <button onClick={fetchHistory} className="px-6 py-2 text-sm font-bold text-indigo-600 bg-indigo-50 border border-indigo-200 rounded-lg hover:bg-indigo-600 hover:text-white transition-all flex items-center gap-2">
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M3 3v18h18"/><path d="m19 9-5 5-4-4-3 3"/></svg>
                        Point History
                    </button>
                </div>
            </div>

            {/* Points Cards */}
            <div className="flex w-full md:w-auto gap-3 sm:gap-4 mt-6 md:mt-2">
                <div className="flex-1 md:flex-none bg-blue-50 dark:bg-blue-900/20 border border-blue-100 rounded-2xl p-4 text-center min-w-[120px]">
                    <p className="text-[10px] font-bold text-blue-500 uppercase">Available Pts</p>
                    <p className="text-xl font-black text-blue-700 dark:text-blue-300">{candfData?.Availablepoint || 0}</p>
                </div>
                <div className="flex-1 md:flex-none bg-orange-50 dark:bg-orange-900/20 border border-orange-100 rounded-2xl p-4 text-center min-w-[120px]">
                    <p className="text-[10px] font-bold text-orange-500 uppercase">Used Pts</p>
                    <p className="text-xl font-black text-orange-700 dark:text-orange-300">{candfData?.Usepoint || 0}</p>
                </div>
            </div>

            {/* 🚨 HISTORY MODAL */}
            {isHistoryModalOpen && (
                <div className="fixed inset-0 flex items-center justify-center bg-black/70 backdrop-blur-md z-[999] p-4" onClick={() => setIsHistoryModalOpen(false)}>
                    <div className="relative max-w-4xl w-full bg-white dark:bg-gray-900 shadow-2xl rounded-3xl overflow-hidden border border-gray-200 dark:border-gray-800" onClick={(e) => e.stopPropagation()}>
                        <div className="p-6 border-b dark:border-gray-800 flex justify-between items-center bg-gray-50 dark:bg-gray-800/50">
                            <h4 className="text-xl font-black text-gray-900 dark:text-white flex items-center gap-2">
                                📊 POINT TRANSACTION HISTORY
                            </h4>
                            <button onClick={() => setIsHistoryModalOpen(false)} className="text-gray-500 hover:text-red-500 transition-colors text-2xl font-bold">&times;</button>
                        </div>

                        <div className="p-6 max-h-[60vh] overflow-y-auto">
                            {loadingHistory ? (
                                <div className="text-center py-10 font-bold text-blue-500 animate-pulse">Fetching records...</div>
                            ) : historyList.length > 0 ? (
                                <div className="overflow-x-auto">
                                    <table className="w-full text-left text-sm">
                                        <thead>
                                            <tr className="bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 uppercase text-[10px] font-black tracking-widest">
                                                <th className="px-4 py-3">Date</th>
                                                <th className="px-4 py-3">Type</th>
                                                <th className="px-4 py-3">Points</th>
                                                <th className="px-4 py-3">New Balance</th>
                                                <th className="px-4 py-3">Remarks</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y dark:divide-gray-800">
                                            {historyList.map((item, index) => (
                                                <tr key={index} className="hover:bg-gray-50 dark:hover:bg-gray-800/40 transition-colors">
                                                    <td className="px-4 py-3 text-gray-600 dark:text-gray-400 font-medium">
                                                        {new Date(item.date).toLocaleDateString()}
                                                    </td>
                                                    <td className="px-4 py-3 font-bold">
                                                        <span className={item.transactionType === "Debited" ? "text-red-500" : "text-green-500"}>
                                                            {item.transactionType}
                                                        </span>
                                                    </td>
                                                    <td className="px-4 py-3 font-black text-gray-900 dark:text-white">
                                                        {item.addedPoints > 0 ? `+${item.addedPoints}` : item.addedPoints}
                                                    </td>
                                                    <td className="px-4 py-3 font-bold text-blue-600">{item.newBalance}</td>
                                                    <td className="px-4 py-3 text-gray-500 text-xs italic">{item.remarks}</td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            ) : (
                                <div className="text-center py-10 text-gray-400 font-medium">No history found for this code.</div>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* Edit Modal (Keeping your original logic) */}
           {isHistoryModalOpen && (
    <div className="fixed inset-0 flex items-center justify-center bg-black/70 backdrop-blur-md z-[999] p-4" onClick={() => setIsHistoryModalOpen(false)}>
        <div className="relative max-w-5xl w-full bg-white dark:bg-gray-900 shadow-2xl rounded-3xl overflow-hidden border border-gray-200 dark:border-gray-800" onClick={(e) => e.stopPropagation()}>
            
            {/* Modal Header */}
            <div className="p-6 border-b dark:border-gray-800 flex justify-between items-center bg-gray-50 dark:bg-gray-800/50">
                <h4 className="text-xl font-black text-gray-900 dark:text-white uppercase tracking-tight">
                    📊 Point Transaction History <span className="text-blue-600">({candfData?.dscode || candfData?.candfCode})</span>
                </h4>
                <button onClick={() => setIsHistoryModalOpen(false)} className="p-2 hover:bg-red-100 hover:text-red-500 rounded-full transition-all text-2xl font-bold">&times;</button>
            </div>

            {/* Modal Body (The Table) */}
            <div className="p-4 max-h-[70vh] overflow-y-auto">
                {loadingHistory ? (
                    <div className="flex justify-center items-center py-20 text-blue-600 font-bold animate-pulse">
                        <div className="w-6 h-6 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mr-3"></div>
                        Fetching History...
                    </div>
                ) : historyList.length > 0 ? (
                    <div className="overflow-x-auto rounded-xl border border-gray-100 dark:border-gray-800">
                        <table className="w-full text-left whitespace-nowrap">
                            <thead className="bg-gray-50 dark:bg-gray-800 text-gray-600 dark:text-gray-400">
                                <tr>
                                    <th className="p-4 text-xs font-black uppercase">Date</th>
                                    <th className="p-4 text-xs font-black uppercase">Transaction Details</th>
                                    <th className="p-4 text-xs font-black uppercase text-center">Points</th>
                                    <th className="p-4 text-xs font-black uppercase">Old Bal</th>
                                    <th className="p-4 text-xs font-black uppercase text-blue-600">New Bal</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y dark:divide-gray-800">
                                {historyList.map((row, index) => {
                                    const points = Number(row.addedPoints || 0);
                                    const isNegative = points < 0;
                                    const remarksLower = (row.remarks || "").toLowerCase();
                                    const isCancelRefund = remarksLower.includes('cancel') || remarksLower.includes('refund');
                                    const isOrder = remarksLower.includes('order') || remarksLower.includes('approv');

                                    return (
                                        <tr key={index} className="hover:bg-gray-50 dark:hover:bg-gray-800/40 transition-colors">
                                            <td className="p-4 text-sm font-medium text-gray-600 dark:text-gray-400">
                                                {new Date(row.date).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}
                                            </td>
                                            
                                            {/* 🔥 Dynamic Badges (Same as SuperAdmin) */}
                                            <td className="p-4">
                                                {isCancelRefund ? (
                                                    <span className="px-2.5 py-1 rounded-md text-[10px] font-black bg-blue-50 text-red-600 border border-red-100 uppercase">
                                                        {row.remarks || "Refund"}
                                                    </span>
                                                ) : isOrder ? (
                                                    <span className="px-2.5 py-1 rounded-md text-[10px] font-black bg-orange-50 text-orange-600 border border-orange-100 uppercase">
                                                        {row.remarks || "Order Approved"}
                                                    </span>
                                                ) : isNegative ? (
                                                    <span className="px-2.5 py-1 rounded-md text-[10px] font-black bg-red-50 text-red-600 border border-red-100 uppercase">
                                                        {row.remarks || "Deducted"}
                                                    </span>
                                                ) : (
                                                    <span className="px-2.5 py-1 rounded-md text-[10px] font-black bg-emerald-50 text-emerald-600 border border-emerald-100 uppercase">
                                                        {row.remarks || "Credit"}
                                                    </span>
                                                )}
                                            </td>

                                            <td className={`p-4 text-sm font-black text-center ${isNegative ? 'text-red-600' : 'text-green-600'}`}>
                                                {points > 0 ? `+${points}` : points}
                                            </td>

                                            <td className="p-4 text-sm text-gray-400 font-medium">{row.oldBalance}</td>
                                            <td className="p-4 text-sm font-black text-blue-600">{row.newBalance}</td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                ) : (
                    <div className="text-center py-20">
                        <p className="text-gray-400 font-bold italic">No Transaction Records Found</p>
                    </div>
                )}
            </div>
        </div>
    </div>
)}
        </div>
    );
}