"use client";
import React, { useState, useEffect } from "react";
import axios from "axios";
import Link from "next/link";

export default function SuperadminDashboard() {
    const [demands, setDemands] = useState([]);
    const [loading, setLoading] = useState(true);
    
    // 🚀 Pagination ke liye naye states
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const limit = 10; // Ek page par kitne items dikhane hain

    useEffect(() => {
        const fetchDemands = async () => {
            try {
                setLoading(true); // Page change hone par loading dikhane ke liye
                
                // 🚀 API URL mein page aur limit bhej rahe hain
                const response = await axios.get(`/api/c&f/get-demands?page=${currentPage}&limit=${limit}`);
                
                if (response.data.success) {
                    setDemands(response.data.data);
                    // Agar backend totalPages bhej raha hai toh set karo, warna 1 rakho
                    setTotalPages(response.data.totalPages || 1); 
                }
            } catch (error) {
                console.error("Error fetching demands:", error);
            } finally {
                setLoading(false);
            }
        };
        fetchDemands();
    }, [currentPage]); // 🚨 currentPage change hone par API dubara call hogi

    if (loading && demands.length === 0) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="text-xl font-bold text-blue-600 animate-pulse">Loading Demands...</div>
            </div>
        );
    }

    return (
        <div className="p-6 md:p-8 bg-gray-50 min-h-screen font-sans">
            <div className="max-w-7xl mx-auto">
                {/* Header */}
                <div className="mb-8">
                    <h1 className="text-3xl font-extrabold text-gray-800 tracking-tight">C&F Stock Demands</h1>
                    <p className="text-gray-500 font-medium mt-1">Review and manage all pending demands</p>
                </div>

                {/* Table Box */}
                <div className="bg-white border border-gray-200 shadow-lg rounded-2xl overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full min-w-[1000px] text-left border-collapse tabular-nums">
                            <thead>
                                <tr className="bg-slate-800 text-white text-sm uppercase tracking-wider">
                                    <th className="p-4 font-bold rounded-tl-xl">Date</th>
                                    <th className="p-4 font-bold">C&F Details</th>
                                    <th className="p-4 font-bold text-center">Items</th>
                                    <th className="p-4 font-bold text-center text-blue-300">Total Price</th>
                                    <th className="p-4 font-bold text-center text-green-300">Total RP</th>
                                    <th className="p-4 font-bold text-center">Status</th>
                                    <th className="p-4 font-bold text-center rounded-tr-xl">Action</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {demands.length > 0 ? (
                                    demands.map((item) => (
                                        <tr key={item._id} className="hover:bg-blue-50/50 transition-colors">
                                            {/* Date */}
                                            <td className="p-4 align-middle text-sm text-gray-500 font-bold">
                                                {new Date(item.createdAt).toLocaleDateString('en-IN', {
                                                    day: 'numeric', month: 'short', year: 'numeric'
                                                })}
                                            </td>

                                            {/* C&F Name and Code */}
                                            <td className="p-4 align-middle">
                                                {/* 🚨 FIX: Yahan cfName agar na ho toh 'name' check karega, nahi toh 'Unknown' dikhayega */}
                                                <div className="font-bold text-gray-800 text-base">
                                                    {item.cfName || item.name || "Unknown C&F"}
                                                </div>
                                                <div className="text-xs font-black text-indigo-600 bg-indigo-50 inline-block px-2 py-0.5 rounded mt-1">
                                                    {item.dscode}
                                                </div>
                                            </td>

                                            {/* Items count */}
                                            <td className="p-4 align-middle text-center">
                                                <span className="bg-gray-100 text-gray-600 px-3 py-1 rounded-full text-xs font-bold border border-gray-200">
                                                    {item.requestedItems?.length || 0} Products
                                                </span>
                                            </td>

                                            {/* Total Price & RP */}
                                            <td className="p-4 align-middle text-center font-black text-blue-600 text-lg">
                                                ₹{item.totalPrice?.toLocaleString('en-IN') || 0}
                                            </td>
                                            <td className="p-4 align-middle text-center font-black text-emerald-600 text-lg">
                                                {item.totalRp?.toLocaleString('en-IN') || 0}
                                            </td>

                                            {/* Status Badge */}
                                            <td className="p-4 align-middle text-center">
                                                <span className={`px-3 py-1 rounded-md text-xs font-black uppercase tracking-wider ${item.status === 'Pending'
                                                    ? 'bg-yellow-100 text-yellow-700 border border-yellow-300'
                                                    : 'bg-green-100 text-green-700 border border-green-300'
                                                    }`}>
                                                    {item.status}
                                                </span>
                                            </td>

                                            {/* Action Button */}
                                            <td className="p-4 text-center">
                                                <Link href={`/superadmin/C&F/demands/${item._id}`}>
                                                    <button className="bg-slate-800 hover:bg-slate-700 text-white text-xs px-4 py-2 rounded-lg font-bold transition-all shadow-sm active:scale-95">
                                                        View Details
                                                    </button>
                                                </Link>
                                            </td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr>
                                        <td colSpan="7" className="p-10 text-center text-gray-500 font-bold italic text-lg">
                                            Not Demand Yet! <br /> No demands have been made by any C&F yet.
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>

                    {/* 🚀 PAGINATION CONTROLS YAHAN HAIN */}
                    {demands.length > 0 && (
                        <div className="flex justify-center items-center p-6 gap-4 bg-gray-50 border-t border-gray-200">
                            <button
                                onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                                disabled={currentPage === 1 || loading}
                                className="px-5 py-2 bg-slate-800 text-white rounded shadow disabled:opacity-50 hover:bg-slate-700 transition"
                            >
                                Previous
                            </button>
                            <span className="text-sm font-bold text-gray-700 bg-white px-4 py-2 rounded shadow-sm border">
                                Page {currentPage} of {totalPages}
                            </span>
                            <button
                                onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                                disabled={currentPage === totalPages || loading}
                                className="px-5 py-2 bg-slate-800 text-white rounded shadow disabled:opacity-50 hover:bg-slate-700 transition"
                            >
                                Next
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}