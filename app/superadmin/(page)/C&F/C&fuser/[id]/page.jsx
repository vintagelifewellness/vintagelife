"use client";
import React, { useState, useEffect, useCallback } from "react";
import axios from "axios";
import { useParams, useRouter } from "next/navigation";
import Image from "next/image";
import Cnforder from "@/components/Cnforder/Order";
import Link from "next/link";
import CnfStock from '@/components/CnfStock'

export default function CandFProfile() {
  const { id } = useParams();
  const decodedId = decodeURIComponent(id);
  const router = useRouter();
  const [showStockModal, setShowStockModal] = useState(false);
  const [userData, setUserData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  const [orders, setOrders] = useState([]);
  const [ordersLoading, setOrdersLoading] = useState(false);


  const handleOrders = useCallback(async (candfId) => {
    if (!candfId) return;
    setOrdersLoading(true);
    try {

      const res = await axios.get(`/api/candf/getOrdersByUser?dscode=${candfId}`);
      if (res.data.success === false) {
        setOrders([]);
      } else {
        setOrders(res.data.data || []);
      }
    } catch (err) {
      console.error("Order Fetch Error:", err);
      setOrders([]);
    } finally {
      setOrdersLoading(false);
    }
  }, []);


  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setError(null);
      try {
        const response = await axios.get(`/api/candf/find-by-email/${decodedId}`);
        const user = response.data;
        setUserData(user);


        if (user && user._id) {
          handleOrders(user._id);
        }
      } catch (error) {
        setError("C&F user data load nahi ho paya.");
      } finally {
        setLoading(false);
      }
    };

    if (decodedId) {
      fetchData();
    }
  }, [decodedId, handleOrders]);

  const handleFreeze = async () => {
    if (!decodedId || !userData) return;
    const isFrozen = userData.defaultdata === "freeze";
    const confirmAction = confirm(isFrozen ? "Unfreeze this C&F account?" : "Freeze this C&F account?");
    if (!confirmAction) return;

    try {
      await axios.patch("/api/candf/update-candf", { id: userData._id, defaultdata: isFrozen ? "user" : "freeze" });
      setSuccess(`Account ${isFrozen ? "unfrozen" : "frozen"} successfully.`);
      setUserData(prev => ({ ...prev, defaultdata: isFrozen ? "user" : "freeze" }));
      setTimeout(() => setSuccess(null), 3000);
    } catch (error) {
      setError("Failed to update freeze status.");
    }
  };

  const handleBlock = async () => {
    if (!decodedId || !userData) return;
    const isBlocked = userData.defaultdata === "block";
    const confirmAction = confirm(isBlocked ? "Unblock this C&F account?" : "Block this C&F account?");
    if (!confirmAction) return;

    try {
      await axios.patch("/api/candf/update-candf", { id: userData._id, defaultdata: isBlocked ? "user" : "block" });
      setSuccess(`Account ${isBlocked ? "unblocked" : "blocked"} successfully.`);
      setUserData(prev => ({ ...prev, defaultdata: isBlocked ? "user" : "block" }));
      setTimeout(() => setSuccess(null), 3000);
    } catch (error) {
      setError("Failed to update block status.");
    }
  };

  if (loading) return <div className="flex justify-center items-center h-screen"><div className="animate-pulse text-lg font-semibold text-gray-600">Loading C&F Profile...</div></div>;
  if (error) return <p className="text-center text-red-500 mt-10 font-bold">{error}</p>;
  if (!userData) return <p className="text-center text-gray-500 mt-10">Data nahi mila.</p>;

  return (
    <div className="max-w-full mx-auto p-1 lg:p-2 bg-white dark:bg-gray-800 dark:shadow-none dark:border shadow-lg rounded-lg mt-6 overflow-hidden">
      {success && <p className="text-center text-green-500 font-semibold bg-green-50 py-2 rounded mb-4">{success}</p>}

      {/* Header Section */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-sm p-5 md:p-6 mb-6">

        <div className="flex flex-col lg:flex-row items-center lg:items-start gap-6">

          {/* Profile Image */}
          <div className="shrink-0">
            <div className="relative">
              <Image
                src={userData.image || "/images/user/icon-5359553_640.webp"}
                alt="Profile"
                width={200}
                height={200}
                className="w-24 h-24 md:w-28 md:h-28 rounded-full border-4 border-white dark:border-gray-800 ring-2 ring-blue-100 dark:ring-blue-900 object-cover shadow-md"
              />

              {/* Active Dot */}
              <span className="absolute bottom-1 right-1 w-4 h-4 bg-green-500 border-2 border-white dark:border-gray-800 rounded-full"></span>
            </div>
          </div>


          {/* Main Information */}
          <div className="flex-1 w-full text-center lg:text-left">

            <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-5">

              {/* Name + Points */}
              <div>

                <p className="text-xs font-semibold uppercase tracking-wider text-gray-400 dark:text-gray-500 mb-1">
                  C&F Profile
                </p>

                <h4 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white">
                  {userData?.cfName ||
                    userData?.companyName ||
                    "Unknown C&F"}
                </h4>

                {/* Ds ID */}
                <div className="mt-2 flex items-center justify-center lg:justify-start gap-2 text-sm text-gray-500 dark:text-gray-400">
                  <span className="font-medium">DS ID:</span>
                  <span className="font-semibold text-gray-700 dark:text-gray-200">
                    {userData?.dscode || "-"}
                  </span>
                </div>

                {/* Points */}
                <div className="flex flex-wrap justify-center lg:justify-start gap-3 mt-5">

                  <div className="px-4 py-2.5 rounded-xl bg-purple-50 dark:bg-purple-900/30 border border-purple-100 dark:border-purple-800">
                    <p className="text-xs text-purple-500 dark:text-purple-300 font-medium">
                      Available Point
                    </p>

                    <p className="text-lg font-bold text-purple-700 dark:text-purple-200">
                      {userData?.Availablepoint || 0}
                    </p>
                  </div>

                  <div className="px-4 py-2.5 rounded-xl bg-yellow-50 dark:bg-yellow-900/30 border border-yellow-100 dark:border-yellow-800">
                    <p className="text-xs text-yellow-600 dark:text-yellow-300 font-medium">
                      Used Point
                    </p>

                    <p className="text-lg font-bold text-yellow-700 dark:text-yellow-200">
                      {userData?.Usepoint || 0}
                    </p>
                  </div>

                </div>
              </div>


              {/* Actions */}
              <div className="flex flex-col sm:flex-row lg:flex-col gap-2 w-full sm:w-auto lg:min-w-[190px]">

                <Link
                  href={`../C&fEdit/${userData.email}`}
                  className="flex items-center justify-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold rounded-xl shadow-sm transition-all duration-200"
                >
                  <span>⚙️</span>
                  Manage Points
                </Link>

                <Link
                  href={`../C&fEditdetails/${userData.email}`}
                  className="flex items-center justify-center gap-2 px-4 py-2.5 bg-blue-50 hover:bg-blue-100 dark:bg-blue-900/30 dark:hover:bg-blue-900/50 text-blue-700 dark:text-blue-300 text-sm font-semibold rounded-xl border border-blue-200 dark:border-blue-800 transition-all duration-200"
                >
                  <span>✏️</span>
                  Edit C&F Details
                </Link>
                <button
                  onClick={() => setShowStockModal(true)}
                  className="flex items-center justify-center gap-2 px-4 py-2.5 bg-green-600 hover:bg-green-700 text-white text-sm font-semibold rounded-xl shadow-sm transition-all duration-200"
                >
                  <span>📦</span>
                  Check Stock
                </button>
              </div>
              {showStockModal && (
                <div
                  className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/60 backdrop-blur-sm p-3 sm:p-4"
                  onClick={() => setShowStockModal(false)}
                >
                  <div
                    className="relative w-full max-w-5xl h-[90vh] bg-white dark:bg-gray-800 rounded-2xl shadow-2xl flex flex-col overflow-hidden"
                    onClick={(e) => e.stopPropagation()}
                  >

                    {/* Modal Header - Fixed */}
                    <div className="shrink-0 flex items-center justify-between px-5 py-4 border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">

                      <div>
                        <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                          C&F Stock
                        </h2>

                        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                          DS ID: {userData?.dscode}
                        </p>
                      </div>

                      <button
                        onClick={() => setShowStockModal(false)}
                        className="w-9 h-9 shrink-0 flex items-center justify-center rounded-full bg-gray-100 hover:bg-red-100 text-gray-600 hover:text-red-600 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-red-900/40 transition"
                      >
                        ✕
                      </button>

                    </div>

                    {/* Scrollable Content */}
                    <div className="flex-1 min-h-0 overflow-y-auto overscroll-contain p-4 md:p-6">

                      <CnfStock dscode={userData?.dscode} />

                    </div>

                  </div>
                </div>
              )}
            </div>

          </div>

        </div>

      </div>
      <Section title={`Orders Received by C&F (${orders.length})`}>
        <div className="flex justify-end mb-3">
          <button
            onClick={() => handleOrders(userData?._id)}
            disabled={ordersLoading}
            className="text-xs bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200 px-3 py-1.5 rounded hover:bg-gray-200 dark:hover:bg-gray-600 transition border dark:border-gray-600 disabled:opacity-50"
          >
            {ordersLoading ? "Refreshing..." : "Refresh Orders"}
          </button>
        </div>

        <div className="overflow-x-auto border rounded-lg p-2 bg-white dark:bg-gray-900 min-h-[100px]">
          {ordersLoading ? (
            <div className="flex justify-center items-center py-6">
              <span className="animate-pulse text-blue-500 font-medium">Orders load ho rahe hain...</span>
            </div>
          ) : (
            <>

              <Cnforder id={userData?._id} orders={orders} />


              {orders.length === 0 && (
                <p className="text-center py-6 text-gray-500 italic">
                  No orders found for this C&F yet
                </p>
              )}
            </>
          )}
        </div>
      </Section>

      <Section title="Business Details">
        <InfoGrid>
          <InfoCard label="Company Name" value={userData.cfName} />
          <InfoCard label="Owner Name" value={userData.name} />
          <InfoCard label="Establishment Date" value={formatDate(userData.establishmentDate || userData.createdAt)} />
          <InfoCard label="Mobile Number" value={userData.mobileNo} />
          <InfoCard label="WhatsApp Number" value={userData.whatsappNo} />
          <InfoCard label="Email ID" value={userData.email} />
          <InfoCard label="C&F Code" value={userData.dscode} />
          <InfoCard label="GST Number" value={userData.gstNumber} />
        </InfoGrid>
      </Section>

      <Section title="Address">
        <div className="grid grid-cols-1 gap-2">
          <p className="text-gray-600 dark:text-gray-200">{userData.address?.addressLine1 || "N/A"}</p>
          <p className="text-gray-600 dark:text-gray-200">{userData.address?.addressLine2 || "N/A"}</p>
          <p className="text-gray-600 dark:text-gray-200 font-bold">{userData.address?.city}, {userData.address?.state} - {userData.address?.pinCode}</p>
        </div>
      </Section>

      <Section title="Bank Details">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="grid grid-cols-1 gap-4">
            <InfoCard label="Bank Name" value={userData.bankName} />
            <InfoCard label="Account Number" value={userData.acnumber || userData.accountNumber} />
            <InfoCard label="IFSC Code" value={userData.ifscCode} />
          </div>
          {/* <ImageCard label="Bank Document" image={userData.bankimage} /> */}
        </div>
      </Section>

      <Section title="Uploaded Documents">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          <InfoCard
            label="PAN Card Number"
            value={userData?.panno || userData?.panNumber || "Not Available"}
          />
          <InfoCard
            label="Aadhar Card Number"
            value={userData?.aadharno || userData?.aadharNumber || "Not Available"}
          />
        </div>
      </Section>

      <div className="mt-8 flex flex-col sm:flex-row justify-end gap-3 pb-8">
        <button onClick={handleFreeze} className={`w-full sm:w-auto ${userData?.defaultdata === "freeze" ? "bg-green-600 hover:bg-green-700" : "bg-yellow-500 hover:bg-yellow-600"} transition-colors text-sm px-6 py-2.5 rounded text-white font-bold shadow`}>
          {userData?.defaultdata === "freeze" ? "Unfreeze Account" : "Freeze Account"}
        </button>
        <button onClick={handleBlock} className={`w-full sm:w-auto ${userData?.defaultdata === "block" ? "bg-green-600 hover:bg-green-700" : "bg-red-600 hover:bg-red-700"} transition-colors text-sm px-6 py-2.5 rounded text-white font-bold shadow`}>
          {userData?.defaultdata === "block" ? "Unblock Account" : "Block Account"}
        </button>
      </div>
    </div>
  );
}

// --- Reusable Components ---

const Section = ({ title, children }) => (
  <div className="mt-6 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg shadow-sm border dark:border-gray-700">
    <h3 className="text-xl font-bold text-gray-800 dark:text-gray-200 border-b dark:border-gray-700 pb-2 mb-4">{title}</h3>
    {children}
  </div>
);

const InfoGrid = ({ children }) => (
  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">{children}</div>
);

const InfoCard = ({ label, value }) => (
  <div className="mb-2">
    <h3 className="font-semibold text-gray-700 dark:text-gray-300 text-sm">{label}</h3>
    <p className="text-gray-600 dark:text-gray-400 text-sm break-words">{value || "N/A"}</p>
  </div>
);

const ImageCard = ({ label, image, value, showValue = false }) => (
  <div className="flex flex-col gap-2">
    <h3 className="text-md font-medium text-gray-800 dark:text-gray-300">{label}</h3>
    {image ? (
      <a href={image} target="_blank" rel="noopener noreferrer" className="w-full">
        <Image src={image} alt={label} width={300} height={200} className="w-full h-auto max-h-48 rounded-md object-cover shadow-md hover:opacity-90 transition" />
      </a>
    ) : <p className="text-gray-500 dark:text-gray-400 text-sm italic">No document uploaded</p>}
    {showValue && value && <div className="mt-1 px-3 py-1.5 bg-white dark:bg-gray-700 border dark:border-gray-600 rounded-md text-xs truncate text-gray-700 dark:text-gray-200"><strong>{label}:</strong> {value}</div>}
  </div>
);

const formatDate = (date) => date ? new Date(date).toLocaleDateString("en-GB") : "N/A";