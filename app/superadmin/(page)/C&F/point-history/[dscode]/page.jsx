"use client";
import React, { useState, useEffect } from "react";
import axios from "axios";
import { ChevronLeft } from "lucide-react"; 

export default function PointHistoryPage({ params }) {
  const dscode = params?.dscode; 

  const [history, setHistory] = useState([]);
  const [searchTerm, setSearchTerm] = useState(""); 
  const [filterDate, setFilterDate] = useState(""); 
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchHistory();
  }, [dscode]);

  const fetchHistory = async () => {
    setLoading(true);
    try {
      const url = dscode 
        ? `/api/candf/point-history-fetch?dscode=${dscode}` 
        : "/api/candf/point-history-fetch";
        
      const res = await axios.get(url);
      setHistory(res.data.data || []);
    } catch (err) {
      console.error("Error fetching history", err);
    }
    setLoading(false);
  };

  const filteredData = history.filter((item) => {
    const matchesSearch = 
      (item.cfName?.toLowerCase().includes(searchTerm.toLowerCase()) || 
      item.cfCode?.toLowerCase().includes(searchTerm.toLowerCase()));
    
    const itemDate = new Date(item.date).toISOString().split('T')[0];
    const matchesDate = filterDate ? itemDate === filterDate : true;

    return matchesSearch && matchesDate;
  });

  return (
    <div className="p-4 sm:p-6 bg-gray-50 min-h-screen">
      
      {/* HEADER SECTION */}
      <div className="flex items-center gap-4 mb-6 bg-white p-4 rounded-xl shadow-sm border border-gray-100">
        {dscode && (
          <button onClick={() => window.history.back()} className="p-2 bg-gray-50 rounded-full border hover:bg-gray-100 transition">
            <ChevronLeft size={20} className="text-gray-600"/>
          </button>
        )}
        <h1 className="text-xl sm:text-2xl font-bold text-gray-800 tracking-tight">
          Point Transaction History {dscode && <span className="text-blue-600">({dscode})</span>}
        </h1>
      </div>

      {/* FILTER SECTION */}
      <div className="flex flex-wrap gap-4 mb-6 bg-white p-5 rounded-xl shadow-sm border border-gray-100">
        <div className="flex-1 min-w-[250px]">
          <label className="block text-sm font-semibold text-gray-600 uppercase tracking-wide mb-2">Search Name / DS Code</label>
          <input
            type="text"
            placeholder="Search here..."
            className="w-full border border-gray-300 rounded-lg px-4 py-2.5 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all bg-gray-50"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="w-[200px]">
          <label className="block text-sm font-semibold text-gray-600 uppercase tracking-wide mb-2">Filter by Date</label>
          <input
            type="date"
            className="w-full border border-gray-300 rounded-lg px-4 py-2.5 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all bg-gray-50"
            value={filterDate}
            onChange={(e) => setFilterDate(e.target.value)}
          />
        </div>
        <div className="flex items-end">
          <button 
            onClick={() => {setSearchTerm(""); setFilterDate("");}}
            className="bg-gray-800 text-white px-6 py-2.5 rounded-lg hover:bg-gray-700 font-medium transition-colors shadow-md"
          >
            Clear Filters
          </button>
        </div>
      </div>

      {/* TABLE SECTION */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto w-full">
          <table className="w-full text-left border-collapse whitespace-nowrap">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="p-4 font-semibold text-sm text-gray-600 uppercase tracking-wider">Date</th>
                <th className="p-4 font-semibold text-sm text-gray-600 uppercase tracking-wider">C&F Name</th>
                <th className="p-4 font-semibold text-sm text-gray-600 uppercase tracking-wider">DS Code</th>
                <th className="p-4 font-semibold text-sm text-gray-600 uppercase tracking-wider">Transaction Details</th>
                <th className="p-4 font-semibold text-sm text-gray-800 uppercase tracking-wider">Points</th>
                <th className="p-4 font-semibold text-sm text-gray-600 uppercase tracking-wider">Old Balance</th>
                <th className="p-4 font-semibold text-sm text-blue-600 uppercase tracking-wider">New Balance</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {loading ? (
                <tr>
                  <td colSpan="7" className="p-10 text-center">
                    <div className="flex justify-center items-center gap-2 text-blue-600 font-medium">
                      <div className="w-5 h-5 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                      Loading History...
                    </div>
                  </td>
                </tr>
              ) : filteredData.length > 0 ? (
                filteredData.map((row, index) => {
                  
                  const points = Number(row.addedPoints || 0);
                  const isNegative = points < 0; 
                  
                  // Remarks check logic
                  const remarksLower = (row.remarks || "").toLowerCase();
                  const isCancelRefund = remarksLower.includes('cancel') || remarksLower.includes('refund');
                  const isOrder = remarksLower.includes('order') || remarksLower.includes('approv'); // Order pehchanne ke liye

                  return (
                    <tr key={index} className="hover:bg-gray-50 transition-colors">
                      <td className="p-4 text-sm text-gray-600">
                        {new Date(row.date).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}
                      </td>
                      <td className="p-4 text-sm font-bold text-gray-800">{row.cfName}</td>
                      <td className="p-4 text-sm text-gray-500 font-medium">{row.cfCode}</td>
                      
                      {/* 🔥 Dynamic Badges with Order Check */}
                      <td className="p-4 text-sm">
                        {isCancelRefund ? (
                          <span className="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-bold bg-blue-50 text-red-600 border border-red-200 shadow-sm">
                            {row.remarks || "Order Cancelled Refund"}
                          </span>
                        ) : isOrder ? (
                          <span className="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-bold bg-orange-50 text-orange-600 border border-orange-200 shadow-sm">
                            {row.remarks || "Order Approved"} 
                          </span>
                        ) : isNegative ? (
                          <span className="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-bold bg-red-50 text-red-600 border border-red-200 shadow-sm">
                            {row.remarks || "Points Deducted"}
                          </span>
                        ) : (
                          <span className="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-bold bg-emerald-50 text-emerald-600 border border-emerald-200 shadow-sm">
                            {row.remarks || "Manual Point Credit"}
                          </span>
                        )}
                      </td>

                      <td className={`p-4 text-sm font-extrabold ${isNegative ? 'text-red-600' : 'text-green-600'}`}>
                        {points > 0 ? `+${points}` : points} 
                      </td>

                      <td className="p-4 text-sm text-gray-400 font-medium">{row.oldBalance}</td>
                      <td className="p-4 text-sm font-extrabold text-blue-600">{row.newBalance}</td>
                    </tr>
                  )
                })
              ) : (
                <tr>
                  <td colSpan="7" className="p-16 text-center">
                    <p className="text-lg font-medium text-gray-800">No Transaction History Found</p>
                    <p className="text-sm text-gray-500 mt-1">Is C&F ke liye abhi tak koi transaction record nahi hai.</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}