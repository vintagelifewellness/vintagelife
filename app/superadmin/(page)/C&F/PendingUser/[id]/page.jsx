"use client";
import React, { useState, useEffect } from "react";
import axios from "axios";
import { useParams, useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import toast, { Toaster } from "react-hot-toast";

export default function CandFProfile() {
  const { id } = useParams();
  const decodedId = decodeURIComponent(id);
  const router = useRouter();
  
  const [userData, setUserData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setError(null);
      try {
        const response = await axios.get(`/api/candf/find-by-email/${decodedId}`);
        setUserData(response.data);
      } catch (error) {
        setError("C&F user data load nahi ho paya.");
      } finally {
        setLoading(false);
      }
    };
    if (decodedId) fetchData();
  }, [decodedId]);

  if (loading) return <div className="flex justify-center items-center h-screen"><div className="animate-pulse text-lg font-semibold text-gray-600">Loading C&F Profile...</div></div>;
  if (error) return <p className="text-center text-red-500 mt-10 font-bold">{error}</p>;

  return (
    <div className="max-w-full mx-auto p-1 lg:p-2 bg-white dark:bg-gray-800 dark:shadow-none dark:border shadow-lg rounded-lg mt-6 overflow-hidden">
      <Toaster />

      <div className="flex flex-col md:flex-row items-center gap-6 border-b pb-6 mb-6">
        <div className="flex justify-center items-center w-full md:w-auto p-4">
          <Image
            src={userData.image || "/images/user/icon-5359553_640.webp"}
            alt="Profile" width={200} height={200}
            className="w-24 h-24 md:w-28 md:h-28 rounded-full border-2 border-gray-200 dark:border-gray-700 object-cover shadow-lg"
          />
        </div>

        <div className="flex-1 w-full bg-white dark:bg-gray-800 rounded-2xl p-4 md:p-6 shadow-sm border dark:border-gray-700">
          <div className="mb-6 text-center md:text-left">
            <h4 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white mb-4 uppercase">
              {userData?.cfName || userData?.name}
            </h4>
            <div className="flex flex-wrap justify-center md:justify-start gap-3">
               <div className="bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200 px-4 py-2 rounded-xl font-medium shadow text-sm">
                  DsId: {userData?.dscode}
               </div>
            </div>
          </div>

          <div className="flex justify-end w-full mt-4">
           
            <Link 
              href={`/superadmin/C&F/managestatus/${userData.email}`}
              className="flex justify-center items-center px-5 py-4 bg-blue-600 hover:bg-blue-700 text-white text-sm font-black rounded-lg shadow-md transition-all active:scale-95"
            >
             MANAGE STATUS / APPROVE
            </Link>
          </div>
        </div>
      </div>

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
        <div className="grid grid-cols-1 gap-2 p-2">
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
          <ImageCard label="Bank Document" image={userData.bankimage} />
        </div>
      </Section>

      <Section title="Uploaded Documents">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          <ImageCard label="PAN Card" image={userData.panimage} value={userData.panno} showValue={true} />
          <ImageCard label="GST Certificate" image={userData.gstimage} value={userData.gstNumber} showValue={true} />
          <ImageCard label="Aadhar Card" image={userData.aadharimage} value={userData.aadharno} showValue={true} />
          <ImageCard label="Address Proof" image={userData.addressproofimage} value={userData.addressproofno} showValue={true} />
        </div>
      </Section>

      <div className="h-10"></div>
    </div>
  );
}

const Section = ({ title, children }) => (
  <div className="mt-6 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg shadow-sm border dark:border-gray-700">
    <h3 className="text-xl font-bold text-gray-800 dark:text-gray-200 border-b dark:border-gray-700 pb-2 mb-4 uppercase tracking-tighter">{title}</h3>
    {children}
  </div>
);

const InfoGrid = ({ children }) => <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">{children}</div>;

const InfoCard = ({ label, value }) => (
  <div className="mb-2 p-1">
    <h3 className="font-semibold text-gray-400 dark:text-gray-300 text-[10px] uppercase">{label}</h3>
    <p className="text-gray-800 dark:text-gray-400 text-sm font-bold break-words">{value || "N/A"}</p>
  </div>
);

const ImageCard = ({ label, image, value, showValue = false }) => (
  <div className="flex flex-col gap-2">
    <h3 className="text-md font-medium text-gray-800 dark:text-gray-300">{label}</h3>
    {image ? (
      <a href={image} target="_blank" rel="noopener noreferrer">
        <Image src={image} alt={label} width={300} height={200} className="w-full h-auto max-h-48 rounded-md object-cover shadow-md hover:opacity-90 transition" />
      </a>
    ) : <p className="text-gray-500 dark:text-gray-400 text-sm italic">No document uploaded</p>}
    {showValue && value && <div className="mt-1 px-3 py-1.5 bg-white dark:bg-gray-700 border dark:border-gray-600 rounded-md text-xs truncate"><strong>{label}:</strong> {value}</div>}
  </div>
);

const formatDate = (date) => date ? new Date(date).toLocaleDateString("en-GB") : "N/A";