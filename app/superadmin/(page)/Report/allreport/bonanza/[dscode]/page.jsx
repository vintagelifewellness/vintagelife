"use client";
import React, { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import axios from "axios";
export default function Page() {
  const { dscode } = useParams();

  const [data, setData] = useState(null);
  const [initialLoading, setInitialLoading] = useState(true);
  const [userdata, setUserdata] = useState(null);

  useEffect(() => {
    if (!dscode) return;
    const fetchUserData = async () => {
      try {
        const res = await axios.get(`/api/user/finduserbyid/${dscode}`);
        setUserdata(res.data);
      } catch (error) {
        console.error("Failed to fetch user data:", error);
      }
    };
    fetchUserData();
  }, [dscode]);

  useEffect(() => {
    if (!dscode) return;
    const fetchData = async () => {
      try {
        const res = await fetch(`/api/3months/findds/${dscode}`);
        const json = await res.json();
        if (json.success) {
          setData(json.data[0] || null);
        }
      } catch (err) {
        console.error('Fetch error:', err);
      } finally {
        setInitialLoading(false);
      }
    };
    fetchData();
  }, [dscode]);

  const formatDateRange = (from, to) => {
    const fromDate = new Date(from);
    const toDate = new Date(to);
    const options = { day: '2-digit', month: 'short' };
    const fromStr = fromDate.toLocaleDateString('en-GB', options);
    const toStr = toDate.toLocaleDateString('en-GB', options);

    return fromDate.getMonth() === toDate.getMonth() && fromDate.getFullYear() === toDate.getFullYear()
      ? `${fromDate.getDate()} to ${toStr} ${toDate.getFullYear()}`
      : `${fromStr} to ${toStr} ${toDate.getFullYear()}`;
  };

  if (initialLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#FEECE2] to-[#F7DED0] flex items-center justify-center p-4">
        <div className="text-xl sm:text-2xl text-[#FFBE98] font-semibold animate-pulse">Loading...</div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 text-lg sm:text-xl text-gray-500">
        No Bonanza data found.
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white flex items-center justify-center p-4 sm:p-6">
      <div className="w-full max-w-6xl bg-white shadow-lg p-6 sm:p-10 border border-gray-100 rounded-lg space-y-8">
        <h1 className="text-3xl sm:text-5xl font-bold text-center text-gray-800">Bonanza Pendency</h1>

        <div className="text-center bg-gradient-to-r from-[#FFEFE6] to-[#FFF7F0] text-gray-700 p-4 sm:p-5 font-medium shadow-sm rounded-md">
          {formatDateRange(data.datefrom, data.dateto)}
          <div className="text-lg sm:text-2xl text-blue-800 mt-2 bg-white inline-block rounded px-3 py-1">{data.title}</div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm sm:text-base text-left rounded-xl overflow-hidden">
            <thead className="bg-[#FFEFE6] text-gray-800">
              <tr>
                <th className="p-3 sm:p-4 font-semibold">Type</th>
                <th className="p-3 sm:p-4 font-semibold">Current Achieve</th>
                <th className="p-3 sm:p-4 font-semibold">Target</th>
                <th className="p-3 sm:p-4 font-semibold">Remain</th>
              </tr>
            </thead>
            <tbody className="text-gray-600">
              {['SAO', 'SGO'].map(type => {
                const userSP = userdata?.[`${type.toLowerCase()}sp`] || 0;
                const baseSP = data?.UserDetails?.[0]?.[`${type.toLowerCase()}sp`] || 0;
                const target = data?.[type.toLowerCase()] || 0;
                const current = userSP - baseSP;
                const remain = Math.max(0, target - current);
                return (
                  <tr key={type} className="border-t border-gray-100 hover:bg-[#FFF7F0] transition">
                    <td className="p-3 sm:p-4 font-medium">{type} SP</td>
                    <td className="p-3 sm:p-4">{current} SP</td>
                    <td className="p-3 sm:p-4">{target} SP</td>
                    <td className="p-3 sm:p-4 text-rose-500 font-semibold">{remain} SP</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
