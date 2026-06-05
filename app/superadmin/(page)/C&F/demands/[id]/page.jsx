"use client";
import React, { useState, useEffect } from "react";
import axios from "axios";
import { useParams, useRouter } from "next/navigation";

export default function DemandDetailsPage() {
    const params = useParams(); 
    const router = useRouter(); 
    const [demand, setDemand] = useState(null);
    const [loading, setLoading] = useState(true);
    const [approving, setApproving] = useState(false);

    useEffect(() => {
        const fetchSingleDemand = async () => {
            try {
                const response = await axios.get(`/api/c&f/get-demands/${params.id}`);
                if (response.data.success) {
                    setDemand(response.data.data);
                }
            } catch (error) {
                console.error("Details lane me error:", error);
            } finally {
                setLoading(false);
            }
        };
        fetchSingleDemand();
    }, [params.id]);

    // Approve Karne ka function
    const handleApprove = async () => {
        const confirmApprove = window.confirm("Are you sure you want to approve this demand?");
        if (!confirmApprove) return;

        setApproving(true);
        try {
            const response = await axios.patch(`/api/c&f/get-demands/${params.id}`, {
                status: "Approved"
            });
            if (response.data.success) {
                alert("Demand successfully approved.");
                setDemand(response.data.data); // Status turant update dikhane ke liye
            }
        } catch (error) {
            alert("Error occurred while approving the demand.");
        } finally {
            setApproving(false);
        }
    };

    if (loading) return <div className="p-10 text-center font-bold text-blue-600">Loading Details...</div>;
    if (!demand) return <div className="p-10 text-center font-bold text-red-600">Demand nahi mili!</div>;

    return (
        <div className="p-6 md:p-8 bg-gray-50 min-h-screen">
            <div className="max-w-5xl mx-auto">
                {/* Back Button */}
                <button onClick={() => router.back()} className="mb-6 text-blue-600 font-bold hover:underline flex items-center gap-1">
                    ← Back to Demands
                </button>

                <div className="bg-white shadow-xl rounded-2xl overflow-hidden border border-gray-200">
                    {/* Header */}
                    <div className="bg-slate-800 p-6 text-white flex justify-between items-center flex-wrap gap-4">
                        <div>
                            <h2 className="text-2xl font-black">Demand Details</h2>
                            <p className="text-slate-400 mt-1">ID: {demand._id}</p>
                        </div>
                        <span className={`px-4 py-1.5 rounded-lg text-sm font-black uppercase tracking-widest ${
                            demand.status === 'Pending' ? 'bg-yellow-500 text-yellow-900' : 'bg-green-500 text-white'
                        }`}>
                            {demand.status}
                        </span>
                    </div>

                    {/* C&F Info */}
                    <div className="p-6 grid grid-cols-1 md:grid-cols-3 gap-6 border-b border-gray-100 bg-gray-50/50">
                        <div>
                            <p className="text-xs text-gray-500 font-bold uppercase tracking-wider">C&F Name</p>
                            <p className="text-lg font-black text-gray-800">{demand.cfName}</p>
                        </div>
                        <div>
                            <p className="text-xs text-gray-500 font-bold uppercase tracking-wider">DsCode</p>
                            <p className="text-lg font-black text-indigo-600">{demand.dscode}</p>
                        </div>
                        <div>
                            <p className="text-xs text-gray-500 font-bold uppercase tracking-wider">Requested Date</p>
                            <p className="text-lg font-bold text-gray-800">
                                {new Date(demand.createdAt).toLocaleString('en-IN')}
                            </p>
                        </div>
                    </div>

                    {/* Products Table */}
                    <div className="p-6">
                        <h3 className="text-xl font-bold text-gray-800 mb-4 border-b pb-2">Requested Products</h3>
                        <div className="overflow-x-auto rounded-xl border border-gray-200">
                            <table className="w-full text-left border-collapse tabular-nums">
                                <thead>
                                    <tr className="bg-gray-100 text-gray-600 text-sm uppercase">
                                        <th className="p-4 font-bold">Product Name</th>
                                        <th className="p-4 font-bold text-center">Unit Price</th>
                                        <th className="p-4 font-bold text-center">Unit RP</th>
                                        <th className="p-4 font-bold text-center">Quantity</th>
                                        <th className="p-4 font-bold text-center text-blue-600">Total Price</th>
                                        <th className="p-4 font-bold text-center text-green-600">Total RP</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100">
                                    {demand.requestedItems.map((item, index) => (
                                        <tr key={index} className="hover:bg-gray-50">
                                            <td className="p-4 font-bold text-gray-800">{item.productName}</td>
                                            <td className="p-4 text-center font-medium">₹{item.price}</td>
                                            <td className="p-4 text-center font-medium">{item.rp}</td>
                                            <td className="p-4 text-center font-black text-lg">{item.quantity}</td>
                                            <td className="p-4 text-center font-bold text-blue-600">₹{(item.price * item.quantity).toLocaleString('en-IN')}</td>
                                            <td className="p-4 text-center font-bold text-green-600">{item.rp * item.quantity}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>

                    {/* Grand Total & Action Buttons */}
                    <div className="p-6 bg-slate-50 flex flex-col md:flex-row justify-between items-center gap-6 border-t border-gray-200">
                        <div className="flex gap-8">
                            <div>
                                <p className="text-xs text-slate-500 font-bold uppercase">Grand Total Price</p>
                                <p className="text-2xl font-black text-blue-600">₹{demand.totalPrice?.toLocaleString('en-IN')}</p>
                            </div>
                            <div>
                                <p className="text-xs text-slate-500 font-bold uppercase">Grand Total RP</p>
                                <p className="text-2xl font-black text-green-600">{demand.totalRp?.toLocaleString('en-IN')}</p>
                            </div>
                        </div>

                        {/* APPROVE BUTTON */}
                        {demand.status === "Pending" ? (
                            <button 
                                onClick={handleApprove}
                                disabled={approving}
                                className={`px-8 py-3 rounded-xl font-black text-white text-lg shadow-lg transition-all ${
                                    approving ? 'bg-gray-400 cursor-not-allowed' : 'bg-green-500 hover:bg-green-400 hover:-translate-y-1'
                                }`}
                            >
                                {approving ? "Approving..." : "✅ Approve Demand"}
                            </button>
                        ) : (
                            <div className="px-8 py-3 bg-green-100 border border-green-300 text-green-800 rounded-xl font-black text-lg flex items-center gap-2">
                                ✅ Already Approved
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}