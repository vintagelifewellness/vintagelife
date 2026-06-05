"use client";
import React, { useState, useEffect } from "react";
import { Package, Clock, CheckCircle, Wallet, Award } from "lucide-react"; // Naye icons add kiye hain
import { useSession } from "next-auth/react";
import axios from "axios";

export default function CnfDashboard() {
  const { data: session, status } = useSession(); // Logged-in user ka data
  const [loading, setLoading] = useState(true);

  const [orderStats, setOrderStats] = useState({
    total: 0,
    pending: 0,
    completed: 0,
  });

  const [points, setPoints] = useState({
    available: 0,
    used: 0,
  });

  const [recentOrders, setRecentOrders] = useState([]);

  useEffect(() => {
    if (status === "authenticated" && session?.user?.dscode) {
      fetchDashboardData(session.user.dscode);
    }
  }, [session, status]);

  const fetchDashboardData = async (dscode) => {
    try {
      console.log(`Fetching data for DSCODE: ${dscode}`); // <--- YAHAN ADD KIYA
      const response = await axios.get(`/api/c&f/cnf/${dscode}`);

      console.log("API Response Data:", response.data); // <--- YAHAN BHI ADD KIYA

      setOrderStats(response.data.stats);
      setRecentOrders(response.data.recentOrders);

      if (response.data.points) {
        setPoints({
          available: response.data.points.available || 0,
          used: response.data.points.used || 0,
        });
      }
    } catch (error) {
      console.error("Dashboard data fetch error:", error);
    } finally {
      setLoading(false);
    }
  };

  if (status === "loading" || loading) {
    return <div className="min-h-screen flex items-center justify-center text-xl font-bold">Loading Dashboard...</div>;
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">

        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-800">C&F Dashboard</h1>

        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">

          <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100 flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500">Total Orders</p>
              <h3 className="text-2xl font-bold text-gray-800 mt-1">{orderStats.total || 0}</h3>
            </div>
            <div className="p-3 bg-blue-100 rounded-lg"><Package className="w-6 h-6 text-blue-600" /></div>
          </div>

          <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100 flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500">Pending Orders</p>
              <h3 className="text-2xl font-bold text-orange-600 mt-1">{orderStats.pending || 0}</h3>
            </div>
            <div className="p-3 bg-orange-100 rounded-lg"><Clock className="w-6 h-6 text-orange-600" /></div>
          </div>
          <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100 flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500">Completed Orders</p>
              <h3 className="text-2xl font-bold text-green-600 mt-1">{orderStats.completed || 0}</h3>
            </div>
            <div className="p-3 bg-green-100 rounded-lg"><CheckCircle className="w-6 h-6 text-green-600" /></div>
          </div>

          <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100 flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500">Available Points (Current)</p>
              <h3 className="text-2xl font-bold text-indigo-600 mt-1">{points.available}</h3>
            </div>
            <div className="p-3 bg-indigo-100 rounded-lg"><Wallet className="w-6 h-6 text-indigo-600" /></div>
          </div>

          <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100 flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500">Used Points</p>
              <h3 className="text-2xl font-bold text-purple-600 mt-1">{points.used}</h3>
            </div>
            <div className="p-3 bg-purple-100 rounded-lg"><Award className="w-6 h-6 text-purple-600" /></div>
          </div>

        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="p-6 border-b border-gray-100">
            <h2 className="text-lg font-bold text-gray-800">Recent Orders</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-50 text-gray-600 text-sm">
                  <th className="p-4 font-medium">Order ID</th>
                  <th className="p-4 font-medium">Customer Name</th>
                  <th className="p-4 font-medium">Date</th>
                  <th className="p-4 font-medium">Status</th>
                  <th className="p-4 font-medium">Amount</th>
                </tr>
              </thead>
              <tbody className="text-sm text-gray-700 divide-y divide-gray-100">
                {recentOrders && recentOrders.length > 0 ? (
                  recentOrders.map((order, index) => (
                    <tr key={order._id || index} className="hover:bg-gray-50 transition-colors">

                      {/* Order No */}
                      <td className="p-4 font-medium text-blue-600">
                        {order.orderNo || "N/A"}
                      </td>

                      {/* Customer Name (dsname) */}
                      <td className="p-4">
                        {order.dsname || "N/A"}
                      </td>

                      {/* Date */}
                      <td className="p-4">
                        {order.date ? new Date(order.date).toLocaleDateString("en-GB") : "N/A"}
                      </td>

                      {/* Status */}
                      <td className="p-4">
                        <span className={`px-3 py-1 rounded-full text-xs font-medium ${order.status === "Pending" || order.status === false ? "bg-orange-100 text-orange-700" :
                            order.status === "Completed" || order.status === true ? "bg-green-100 text-green-700" :
                              "bg-red-100 text-red-700"
                          }`}>
                          {order.status === false ? "Pending" : order.status === true ? "Completed" : (order.status || "Pending")}
                        </span>
                      </td>

                      {/* Amount (netamount) */}
                      <td className="p-4 font-medium">
                        ₹{order.netamount || 0}
                      </td>

                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="5" className="p-6 text-center text-gray-500">
                      No recent orders found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

      </div>
    </div>
  );
}