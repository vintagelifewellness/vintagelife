"use client";
import React, { useState, useEffect } from "react";
import axios from "axios";

// Prop mein dscode receive karo
export default function Order({ orders }) {
    const [showTable, setShowTable] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);


    return (
        <div className="bg-gray-50 p-4 rounded-lg">
            {!showTable ? (
                <button
                    className="w-full sm:w-auto bg-gradient-to-r from-blue-500 to-indigo-600 text-white py-2 px-6 rounded-lg shadow-md hover:from-blue-600 hover:to-indigo-700 transition-all duration-300"
                    onClick={() => setShowTable(true)}
                >
                    Show Orders
                </button>
            ) : (
                <div className="space-y-4">
                    <button
                        className="w-full sm:w-auto bg-gradient-to-r from-gray-500 to-gray-600 text-white py-2 px-6 rounded-lg shadow-md hover:from-gray-600 hover:to-gray-700 transition-all duration-300"
                        onClick={() => setShowTable(false)}
                    >
                        Hide Orders
                    </button>

                    {loading && (
                        <p className="text-center text-blue-600 animate-pulse font-semibold">Loading orders...</p>
                    )}
                    
                    {error && (
                        <p className="text-center text-red-500 bg-red-100 p-3 rounded-lg font-medium">{error}</p>
                    )}

                    {!loading && !error && orders.length > 0 && (
                        <div className="overflow-x-auto bg-white shadow-lg rounded-lg border">
                            <table className="w-full min-w-[800px]">
                                {/* ... (Tumhara existing table head aur body yahan rahega, usme koi change nahi hai) ... */}
                                <thead className="bg-blue-600 text-white text-sm sm:text-base">
                                    <tr>
                                        <th className="px-3 py-2 text-left">Order No</th>
                                        <th className="px-3 py-2 text-left">Date</th>
                                        <th className="px-3 py-2 text-left">Product Details</th>
                                        <th className="px-3 py-2 text-left">Group</th>
                                        <th className="px-3 py-2 text-left">RP</th>
                                        <th className="px-3 py-2 text-left">Amount</th>
                                        <th className="px-3 py-2 text-left">Status</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {orders.map((order, index) => (
                                        <tr key={order._id} className={`hover:bg-gray-100 transition-colors duration-200 ${index % 2 === 0 ? "bg-gray-50" : "bg-white"}`}>
                                            <td className="p-3 border-b text-sm sm:text-base">{order.orderNo}</td>
                                            <td className="p-3 border-b text-sm sm:text-base">
                                                {new Date(order.date).toLocaleDateString("en-GB")}
                                            </td>
                                            <td className="p-3 border-b text-sm sm:text-base">
                                                {order.productDetails.map((detail) => (
                                                    <div key={detail._id} className="mb-1">
                                                        <span className="font-medium text-indigo-600">{detail.product}</span> - Qty: <span className="text-green-600">{detail.quantity}</span>
                                                    </div>
                                                ))}
                                            </td>
                                            <td className="p-3 border-b text-sm sm:text-base">{order.salegroup}</td>
                                            <td className="p-3 border-b text-sm sm:text-base">{order.totalsp}</td>
                                            <td className="p-3 border-b text-sm sm:text-base font-semibold text-gray-800">{order.netamount}</td>
                                            <td className="p-3 border-b text-sm sm:text-base">
                                                {order.status ? <span className="text-green-500">Verified</span> : <span className="text-red-500">Not Verified</span>}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}

                    {!loading && !error && orders.length === 0 && (
                        <p className="text-center text-gray-500 bg-gray-100 p-4 rounded-lg">
                            No orders found.
                        </p>
                    )}
                </div>
            )}
        </div>
    );
}