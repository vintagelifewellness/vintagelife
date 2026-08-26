"use client";
import React, { useEffect, useState } from "react";
import { saveAs } from "file-saver";
import * as XLSX from "xlsx";
import OrderDetails from "@/components/OrderDetails/OrderDetails";

export default function PendingOrders() {
    const [dateFrom, setDateFrom] = useState("");
    const [dateTo, setDateTo] = useState("");
    const [orderNoFilter, setOrderNoFilter] = useState("");
    const [dscodeFilter, setDscodeFilter] = useState("");
    const [allOrders, setAllOrders] = useState([]);
    const [filteredOrders, setFilteredOrders] = useState([]);
    const [loadingOrders, setLoadingOrders] = useState(true);
    const [selectedOrder, setSelectedOrder] = useState(null);
    const [showTransactionModal, setShowTransactionModal] = useState(false);
    const [selectedTransactionId, setSelectedTransactionId] = useState(null);
    const [selectedOrderNo, setSelectedOrderNo] = useState(null);
    useEffect(() => {
        const fetchOrders = async () => {
            setLoadingOrders(true);
            try {
                const response = await fetch(`/api/order/fetchbytype/false`);
                const result = await response.json();
                if (result.success) {
                    setAllOrders(result.data);
                    setFilteredOrders(result.data);
                }
            } catch (error) {
                console.error("Error fetching orders:", error);
            } finally {
                setLoadingOrders(false);
            }
        };
        fetchOrders();
    }, []);

    const applyFilter = () => {
        const filtered = allOrders.filter((order) => {
            const orderDate = order.date.split("T")[0];
            const matchesDate = (!dateFrom || orderDate >= dateFrom) && (!dateTo || orderDate <= dateTo);
            const matchesOrderNo = !orderNoFilter || order.orderNo.toLowerCase().includes(orderNoFilter.toLowerCase());
            const matchesDscode = !dscodeFilter || order.dscode.toLowerCase().includes(dscodeFilter.toLowerCase());
            return matchesDate && matchesOrderNo && matchesDscode;
        });
        setFilteredOrders(filtered);
    };

    const exportToExcel = () => {
        const worksheet = XLSX.utils.json_to_sheet(filteredOrders);
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, "Pending Orders");
        const excelBuffer = XLSX.write(workbook, { bookType: "xlsx", type: "array" });
        const data = new Blob([excelBuffer], { type: "application/octet-stream" });
        saveAs(data, "PendingOrders.xlsx");
    };

    const openModal = (order) => {
        setSelectedOrder(order);
    };

    const closeModal = () => {
        setSelectedOrder(null);
    };

    return (
        <div className="max-w-7xl mx-auto lg:p-6 p-3 bg-white dark:bg-gray-700 shadow-lg rounded-lg text-gray-700 dark:text-white">
            <h2 className="text-2xl font-semibold mb-4 text-center">Pending Order List</h2>

            {/* Filters */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mb-6">
                <div>
                    <label className="block text-sm font-medium">Date From</label>
                    <input
                        type="date"
                        value={dateFrom}
                        onChange={(e) => setDateFrom(e.target.value)}
                        className="border rounded-lg p-2 w-full bg-white dark:bg-gray-700 text-gray-700 dark:text-white"
                    />
                </div>
                <div>
                    <label className="block text-sm font-medium">Date To</label>
                    <input
                        type="date"
                        value={dateTo}
                        onChange={(e) => setDateTo(e.target.value)}
                        className="border rounded-lg p-2 w-full bg-white dark:bg-gray-700 text-gray-700 dark:text-white"
                    />
                </div>
                <div>
                    <label className="block text-sm font-medium">Order No</label>
                    <input
                        type="text"
                        value={orderNoFilter}
                        onChange={(e) => setOrderNoFilter(e.target.value)}
                        className="border rounded-lg p-2 w-full bg-white dark:bg-gray-700 text-gray-700 dark:text-white"
                        placeholder="Filter by order number"
                    />
                </div>
                <div>
                    <label className="block text-sm font-medium">DsCode</label>
                    <input
                        type="text"
                        value={dscodeFilter}
                        onChange={(e) => setDscodeFilter(e.target.value)}
                        className="border rounded-lg p-2 w-full bg-white dark:bg-gray-700 text-gray-700 dark:text-white"
                        placeholder="Filter by dscode"
                    />
                </div>
                <button
                    onClick={applyFilter}
                    className="bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 w-full"
                >
                    Show
                </button>
            </div>

            {/* Orders Table */}
            {loadingOrders ? (
                <div className="animate-pulse">
                    {Array(5).fill(0).map((_, index) => (
                        <div key={index} className="h-10 bg-gray-300 dark:bg-gray-600 my-2 rounded"></div>
                    ))}
                </div>
            ) : (
                <div className="overflow-x-auto">
                    <table className="w-full border-collapse border border-gray-300 rounded-lg overflow-hidden">
                        <thead>
                            <tr className="bg-gray-100 dark:bg-gray-600 text-sm md:text-base">
                                <th className="border border-gray-300 px-2 md:px-4 py-2">Order No</th>
                                <th className="border border-gray-300 px-2 md:px-4 py-2">DsId</th>
                                <th className="border border-gray-300 px-2 md:px-4 py-2">Name</th>
                                <th className="border border-gray-300 px-2 md:px-4 py-2">Mobile Number</th>
                                <th className="border border-gray-300 px-2 md:px-4 py-2">Amount</th>
                                <th className="border border-gray-300 px-2 md:px-4 py-2">Payment Mode</th>
                                <th className="border border-gray-300 px-2 md:px-4 py-2">RP</th>
                                <th className="border border-gray-300 px-2 md:px-4 py-2">Date</th>
                                <th className="border border-gray-300 px-2 md:px-4 py-2">Order At</th>

                                <th className="border border-gray-300 px-2 md:px-4 py-2">Action</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredOrders.length > 0 ? (
                                filteredOrders.map((order) => (
                                    <tr key={order._id} className="text-center bg-white dark:bg-gray-800 text-sm md:text-base">
                                        <td className="border border-gray-300 px-2 md:px-4 py-2">{order.orderNo}</td>
                                        <td className="border border-gray-300 px-2 md:px-4 py-2">{order.dscode}</td>
                                        <td className="border border-gray-300 px-2 text-left md:px-4 py-2">{order.dsname}</td>
                                        <td className="border border-gray-300 px-2 md:px-4 py-2">{order.mobileno}</td>
                                        <td className="border border-gray-300 px-2 md:px-4 py-2">{order.netamount}</td>
                                        <td className="border border-gray-300 px-2 md:px-4 py-2">
                                            <div className="flex items-center gap-2">
                                                <span>{order.paymentmod}</span>

                                                {order.transactionId && (
                                                    <button
                                                        type="button"
                                                        onClick={() => {
                                                            setSelectedTransactionId(order.transactionId);
                                                            setSelectedOrderNo(order.orderNo);
                                                            setShowTransactionModal(true);
                                                        }}
                                                        className="inline-flex items-center gap-1.5 rounded-lg border border-blue-200 bg-blue-50 px-2.5 py-1.5 text-xs font-semibold text-blue-700 transition-all hover:border-blue-300 hover:bg-blue-100"
                                                    >
                                                        <svg
                                                            className="h-3.5 w-3.5"
                                                            fill="none"
                                                            stroke="currentColor"
                                                            strokeWidth="1.8"
                                                            viewBox="0 0 24 24"
                                                        >
                                                            <path
                                                                strokeLinecap="round"
                                                                strokeLinejoin="round"
                                                                d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                                                            />
                                                            <path
                                                                strokeLinecap="round"
                                                                strokeLinejoin="round"
                                                                d="M2.5 12s3.5-6 9.5-6 9.5 6 9.5 6-3.5 6-9.5 6-9.5-6-9.5-6z"
                                                            />
                                                        </svg>

                                                    </button>
                                                )}
                                            </div>
                                        </td>
                                        <td className="border border-gray-300 px-2 md:px-4 py-2">{order.totalsp}</td>
                                        <td className="border border-gray-300 px-2 md:px-4 py-2">
                                            {new Date(order.date).toLocaleDateString("en-GB")}
                                        </td>
                                        {showTransactionModal && (
                                            <div
                                                className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/30 px-4 backdrop-blur-sm"
                                                onClick={() => setShowTransactionModal(false)}
                                            >
                                                <div
                                                    className="w-full max-w-sm overflow-hidden rounded-xl bg-white shadow-2xl"
                                                    onClick={(e) => e.stopPropagation()}
                                                >
                                                    {/* Header */}
                                                    <div className="bg-[#0b1329] px-4 py-3.5 text-white">
                                                        <div className="flex items-center justify-between">
                                                            <div className="flex items-center gap-2.5">
                                                                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#E6B964]/15">
                                                                    <svg
                                                                        className="h-4 w-4 text-[#E6B964]"
                                                                        fill="none"
                                                                        stroke="currentColor"
                                                                        strokeWidth="1.8"
                                                                        viewBox="0 0 24 24"
                                                                    >
                                                                        <path
                                                                            strokeLinecap="round"
                                                                            strokeLinejoin="round"
                                                                            d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h7l5 5v11a2 2 0 01-2 2z"
                                                                        />
                                                                        <path
                                                                            strokeLinecap="round"
                                                                            strokeLinejoin="round"
                                                                            d="M14 3v5h5"
                                                                        />
                                                                    </svg>
                                                                </div>

                                                                <div>
                                                                    <h3 className="text-sm font-semibold">
                                                                        Transaction Details
                                                                    </h3>
                                                                    <p className="text-[10px] text-white/50">
                                                                        Payment information
                                                                    </p>
                                                                </div>
                                                            </div>

                                                            <button
                                                                type="button"
                                                                onClick={() => setShowTransactionModal(false)}
                                                                className="flex h-8 w-8 items-center justify-center rounded-full text-white/50 transition hover:bg-white/10 hover:text-white"
                                                            >
                                                                <svg
                                                                    className="h-4 w-4"
                                                                    fill="none"
                                                                    stroke="currentColor"
                                                                    strokeWidth="2"
                                                                    viewBox="0 0 24 24"
                                                                >
                                                                    <path
                                                                        strokeLinecap="round"
                                                                        strokeLinejoin="round"
                                                                        d="M6 6l12 12M18 6L6 18"
                                                                    />
                                                                </svg>
                                                            </button>
                                                        </div>
                                                    </div>

                                                    {/* Content */}
                                                    <div className="space-y-3.5 p-4">

                                                        {/* Order Status */}
                                                        <div className="flex items-center justify-between rounded-lg border border-green-100 bg-green-50 px-3 py-2.5">
                                                            <div className="flex items-center gap-2">
                                                                <div className="flex h-7 w-7 items-center justify-center rounded-full bg-green-100">
                                                                    <svg
                                                                        className="h-3.5 w-3.5 text-green-600"
                                                                        fill="none"
                                                                        stroke="currentColor"
                                                                        strokeWidth="2.5"
                                                                        viewBox="0 0 24 24"
                                                                    >
                                                                        <path
                                                                            strokeLinecap="round"
                                                                            strokeLinejoin="round"
                                                                            d="M5 13l4 4L19 7"
                                                                        />
                                                                    </svg>
                                                                </div>

                                                                <div>
                                                                    <p className="text-[9px] uppercase tracking-wide text-green-600">
                                                                        Order No
                                                                    </p>
                                                                    <p className="text-xs font-semibold text-green-800">
                                                                        {selectedOrderNo}
                                                                    </p>
                                                                </div>
                                                            </div>

                                                            <span className="rounded-full bg-green-100 px-2 py-1 text-[9px] font-bold uppercase text-green-700">
                                                                Paid
                                                            </span>
                                                        </div>

                                                        {/* Transaction ID */}
                                                        <div className="rounded-lg border border-gray-200 bg-gray-50 p-3">
                                                            <div className="flex items-center justify-between gap-3">
                                                                <div className="min-w-0">
                                                                    <p className="text-[9px] font-semibold uppercase tracking-wider text-gray-400">
                                                                        Transaction ID
                                                                    </p>

                                                                    <p className="mt-1.5 truncate text-xs font-bold text-gray-900">
                                                                        {selectedTransactionId}
                                                                    </p>
                                                                </div>

                                                                <button
                                                                    type="button"
                                                                    title="Copy Transaction ID"
                                                                    onClick={() => {
                                                                        navigator.clipboard.writeText(
                                                                            selectedTransactionId || ""
                                                                        );
                                                                    }}
                                                                    className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md border border-gray-200 bg-white text-gray-500 transition hover:border-[#E6B964] hover:bg-[#E6B964]/10 hover:text-gray-900"
                                                                >
                                                                    <svg
                                                                        className="h-3.5 w-3.5"
                                                                        fill="none"
                                                                        stroke="currentColor"
                                                                        strokeWidth="1.8"
                                                                        viewBox="0 0 24 24"
                                                                    >
                                                                        <rect
                                                                            width="13"
                                                                            height="13"
                                                                            x="9"
                                                                            y="9"
                                                                            rx="2"
                                                                        />
                                                                        <path
                                                                            strokeLinecap="round"
                                                                            strokeLinejoin="round"
                                                                            d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1"
                                                                        />
                                                                    </svg>
                                                                </button>
                                                            </div>
                                                        </div>

                                                        <p className="text-center text-[10px] text-gray-400">
                                                            Keep this ID for future payment reference.
                                                        </p>
                                                    </div>

                                                    {/* Footer */}
                                                    <div className="border-t border-gray-100 bg-gray-50/70 p-3">
                                                        <button
                                                            type="button"
                                                            onClick={() => setShowTransactionModal(false)}
                                                            className="w-full rounded-lg bg-[#0b1329] px-4 py-2 text-xs font-semibold text-white transition hover:bg-[#111c3d] active:scale-[0.99]"
                                                        >
                                                            Done
                                                        </button>
                                                    </div>
                                                </div>
                                            </div>
                                        )}
                                        {/* Remark Column */}
                                        <td className="border border-gray-300 px-2 md:px-4 py-2">
                                            {order.orderat === "C&F"
                                                ? `C&F (${order.cfName || "N/A"})`
                                                : "Main"}
                                        </td>

                                        <td className="border border-gray-300 px-2 md:px-4 py-2">
                                            <button
                                                onClick={() => openModal(order)}
                                                className="text-blue-500 hover:text-blue-700"
                                            >
                                                View
                                            </button>
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan="10" className="text-center p-4 text-gray-500">
                                        No orders found
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            )}

            <button onClick={exportToExcel} className="mt-4 bg-green-500 text-white px-4 py-2 rounded-lg hover:bg-green-600 w-full md:w-40">Export to Excel</button>
            {selectedOrder && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <div className="bg-white dark:bg-gray-800 w-full h-full p-6 overflow-auto relative">
                        <button
                            onClick={closeModal}
                            className="absolute top-4 right-4 text-gray-600 dark:text-gray-300 hover:text-gray-800 dark:hover:text-white text-2xl"
                        >
                            ×
                        </button>
                        <h2 className="text-2xl font-semibold mb-4">Order Details - {selectedOrder.orderNo}</h2>
                        <OrderDetails data={selectedOrder} />
                    </div>
                </div>
            )}
        </div>
    );
}
